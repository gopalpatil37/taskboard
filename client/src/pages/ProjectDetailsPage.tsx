import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  ListTodo,
  Plus,
  Search,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LogoutButton from "@/components/LogoutButton";
import { api } from "@/lib/api";

type TaskStatus = "todo" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high";

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
};

type TasksResponse = {
  tasks: Task[];
};

// Share in-flight reads so React StrictMode does not request the same project twice.
const projectTasksRequests = new Map<string, Promise<TasksResponse>>();

function getProjectTasks(projectId: string): Promise<TasksResponse> {
  const existingRequest = projectTasksRequests.get(projectId);
  if (existingRequest) {
    return existingRequest;
  }

  const request = api
    .get<TasksResponse>(
      `/api/projects/${encodeURIComponent(projectId)}/tasks`,
    )
    .finally(() => {
      projectTasksRequests.delete(projectId);
    });

  projectTasksRequests.set(projectId, request);
  return request;
}

type CreateTaskRequest = {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
};

type CreateTaskFormValues = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
};

const initialTaskForm: CreateTaskFormValues = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
};

const statusLabels: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

const priorityVariants: Record<TaskPriority, "secondary" | "default" | "destructive"> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
};

function ProjectDetailsPage() {
  const { projectId } = useParams();
  const [taskResult, setTaskResult] = useState<{
    projectId: string;
    tasks: Task[];
    errorMessage?: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [taskForm, setTaskForm] =
    useState<CreateTaskFormValues>(initialTaskForm);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!projectId) {
      return;
    }

    let active = true;

    getProjectTasks(projectId)
      .then(({ tasks: projectTasks }) => {
        if (active) {
          setTaskResult({ projectId, tasks: projectTasks });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setTaskResult({
            projectId,
            tasks: [],
            errorMessage:
              error instanceof Error
                ? error.message
                : "Unable to load tasks for this project. Please try again.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [projectId]);

  const currentTaskResult =
    taskResult?.projectId === projectId ? taskResult : null;
  const tasks = currentTaskResult?.tasks ?? [];
  const displayErrorMessage = projectId
    ? currentTaskResult?.errorMessage ?? ""
    : "Project ID is missing from the route.";
  const isLoading = Boolean(projectId) && !currentTaskResult;
  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "in_progress",
  ).length;
  const progress =
    tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);
  const projectTitle = projectId ? `Project ${projectId}` : "Project";
  const visibleTasks = tasks.filter((task) => {
    const matchesSearch = `${task.title} ${task.description}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function updateTaskForm<Field extends keyof CreateTaskFormValues>(
    field: Field,
    value: CreateTaskFormValues[Field],
  ) {
    setTaskForm((current) => ({ ...current, [field]: value }));
    setCreateError("");
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreating || !projectId) {
      return;
    }

    const title = taskForm.title.trim();
    if (!title) {
      setCreateError("Task title is required.");
      return;
    }
    if (title.length > 200) {
      setCreateError("Task title must be 200 characters or fewer.");
      return;
    }

    setCreateError("");
    setIsCreating(true);

    const requestBody: CreateTaskRequest = {
      title,
      description: taskForm.description || undefined,
      status: taskForm.status,
      priority: taskForm.priority,
      dueDate: taskForm.dueDate || undefined,
    };

    try {
      const { task } = await api.post<
        { task: Task },
        CreateTaskRequest
      >(
        `/api/projects/${encodeURIComponent(projectId)}/tasks`,
        requestBody,
      );

      setTaskResult((current) =>
        current?.projectId === projectId
          ? { ...current, tasks: [task, ...current.tasks] }
          : current,
      );
      setTaskForm(initialTaskForm);
      setShowCreateForm(false);
    } catch (error: unknown) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Unable to create the task. Please try again.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/projects" className="text-lg font-semibold tracking-tight">
            TaskBoard
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/projects"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              All projects
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to projects
        </Link>

        <section className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              PROJECT
            </p>
            <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight sm:text-4xl">
              {projectTitle}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Tasks and progress for this project.
            </p>
          </div>
        </section>

        {!isLoading && !displayErrorMessage && (
          <>
            <section
              className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4"
              aria-label="Project task summary"
            >
              <SummaryCard
                label="Total tasks"
                value={tasks.length}
                icon={<ListTodo className="size-4" aria-hidden="true" />}
              />
              <SummaryCard
                label="In progress"
                value={inProgressTasks}
                icon={<Clock3 className="size-4" aria-hidden="true" />}
              />
              <SummaryCard
                label="Completed"
                value={completedTasks}
                icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
              />
            </section>

            <section className="mt-8 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Project progress</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {completedTasks} of {tasks.length} tasks completed
                  </p>
                </div>
                <span className="text-lg font-semibold">{progress}%</span>
              </div>
              <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label={`${projectTitle} completion`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </section>
          </>
        )}

        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Tasks</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Organize and track work for this project.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block">
                <span className="sr-only">Search tasks</span>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tasks"
                  className="pl-9 sm:w-56"
                />
              </label>
              <label>
                <span className="sr-only">Filter tasks by status</span>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as TaskStatus | "all")
                  }
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-40"
                >
                  <option value="all">All statuses</option>
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </select>
              </label>
              <Button
                type="button"
                disabled={
                  !projectId ||
                  isLoading ||
                  Boolean(displayErrorMessage) ||
                  isCreating
                }
                onClick={() => {
                  if (showCreateForm) {
                    setTaskForm(initialTaskForm);
                  }
                  setCreateError("");
                  setShowCreateForm((isOpen) => !isOpen);
                }}
              >
                <Plus className="size-4" aria-hidden="true" />
                {showCreateForm ? "Cancel" : "Create task"}
              </Button>
            </div>
          </div>

          {showCreateForm && (
            <form
              onSubmit={createTask}
              className="mb-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
            >
              <h3 className="font-semibold">Create a task</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="task-title">Title</Label>
                  <Input
                    id="task-title"
                    name="title"
                    value={taskForm.title}
                    onChange={(event) =>
                      updateTaskForm("title", event.target.value)
                    }
                    placeholder="What needs to be done?"
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="task-description">
                    Description <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="task-description"
                    name="description"
                    value={taskForm.description}
                    onChange={(event) =>
                      updateTaskForm("description", event.target.value)
                    }
                    placeholder="Add a few details"
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-status">Status</Label>
                  <select
                    id="task-status"
                    name="status"
                    value={taskForm.status}
                    onChange={(event) =>
                      updateTaskForm(
                        "status",
                        event.target.value as TaskStatus,
                      )
                    }
                    disabled={isCreating}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="todo">To do</option>
                    <option value="in_progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-priority">Priority</Label>
                  <select
                    id="task-priority"
                    name="priority"
                    value={taskForm.priority}
                    onChange={(event) =>
                      updateTaskForm(
                        "priority",
                        event.target.value as TaskPriority,
                      )
                    }
                    disabled={isCreating}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="task-due-date">
                    Due date <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="task-due-date"
                    name="dueDate"
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(event) =>
                      updateTaskForm("dueDate", event.target.value)
                    }
                    disabled={isCreating}
                  />
                </div>
              </div>
              {createError && (
                <p
                  className="mt-4 text-sm text-destructive"
                  role="alert"
                >
                  {createError}
                </p>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isCreating}
                  onClick={() => {
                    setTaskForm(initialTaskForm);
                    setCreateError("");
                    setShowCreateForm(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create task"}
                </Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <p className="rounded-2xl border bg-background px-5 py-14 text-center text-sm text-muted-foreground" role="status">
              Loading tasks...
            </p>
          ) : displayErrorMessage ? (
            <p
              className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-6 text-sm text-destructive"
              role="alert"
            >
              {displayErrorMessage}
            </p>
          ) : visibleTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-background px-5 py-14 text-center">
              <Circle
                className="mx-auto size-9 text-muted-foreground"
                aria-hidden="true"
              />
              <h3 className="mt-4 font-semibold">
                {tasks.length === 0 ? "No tasks yet" : "No matching tasks"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {tasks.length === 0
                  ? "There are no tasks in this project yet."
                  : "Try changing the search or status filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTasks.map((task) => (
                <article
                  key={task.id}
                  className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 text-muted-foreground">
                      {task.status === "done" ? (
                        <CheckCircle2
                          className="size-5 text-primary"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle className="size-5" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <h3
                        className={`break-words font-medium ${
                          task.status === "done"
                            ? "text-muted-foreground line-through"
                            : ""
                        }`}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="mt-1 break-words text-sm text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge variant={priorityVariants[task.priority]}>
                          {task.priority} priority
                        </Badge>
                        {task.dueDate && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarDays
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            {formatDueDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 pl-8 sm:pl-0">
                    <Badge
                      variant={task.status === "done" ? "default" : "secondary"}
                    >
                      {statusLabels[task.status]}
                    </Badge>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

function formatDueDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default ProjectDetailsPage;
