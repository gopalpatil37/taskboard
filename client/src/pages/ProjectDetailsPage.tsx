import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  ListTodo,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LogoutButton from "@/components/LogoutButton";

type TaskStatus = "todo" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high";

type Task = {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
};

const projects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    description:
      "Refresh the company website with a clearer, more modern experience.",
  },
  {
    id: "2",
    name: "Mobile App Launch",
    description:
      "Plan the release of the new mobile app across iOS and Android.",
  },
  {
    id: "3",
    name: "Customer Portal",
    description:
      "Build a self-service space for customer accounts and support.",
  },
  {
    id: "4",
    name: "Q4 Planning",
    description: "Collect ideas and prepare priorities for the next quarter.",
  },
];

const sampleTasks: Task[] = [
  {
    id: 1,
    title: "Review project requirements",
    description: "Confirm the scope and success criteria with the team.",
    status: "done",
    priority: "high",
    dueDate: "",
  },
  {
    id: 2,
    title: "Create initial wireframes",
    description: "Sketch the key screens and get feedback from stakeholders.",
    status: "in_progress",
    priority: "medium",
    dueDate: "",
  },
  {
    id: 3,
    title: "Prepare launch checklist",
    description: "",
    status: "todo",
    priority: "low",
    dueDate: "",
  },
  {
    id: 4,
    title: "Share updated project timeline",
    description: "Send the agreed milestones to the project group.",
    status: "todo",
    priority: "medium",
    dueDate: "",
  },
];

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
  const project = projects.find((item) => item.id === projectId);
  const [tasks, setTasks] = useState<Task[]>(() =>
    project?.id === "1" ? sampleTasks : [],
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (!project) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <section className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold">Project not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This project doesn&apos;t exist or may have been removed.
          </p>
          <Button render={<Link to="/projects" />} className="mt-6">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to projects
          </Button>
        </section>
      </main>
    );
  }

  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "in_progress",
  ).length;
  const progress =
    tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);
  const visibleTasks = tasks.filter((task) => {
    const matchesSearch = `${task.title} ${task.description}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();

    if (!title) {
      return;
    }

    setTasks((currentTasks) => [
      {
        id: Date.now(),
        title,
        description: String(formData.get("description") ?? "").trim(),
        priority: formData.get("priority") as TaskPriority,
        dueDate: String(formData.get("dueDate") ?? ""),
        status: "todo",
      },
      ...currentTasks,
    ]);
    event.currentTarget.reset();
    setShowCreateForm(false);
  }

  function updateTaskStatus(taskId: number, status: TaskStatus) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, status } : task,
      ),
    );
  }

  function deleteTask(taskId: number) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    );
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
              {project.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {project.description}
            </p>
          </div>
          <Button
            type="button"
            className="h-10 w-full sm:w-auto"
            onClick={() => setShowCreateForm((isOpen) => !isOpen)}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add task
          </Button>
        </section>

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
            aria-label={`${project.name} completion`}
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

        {showCreateForm && (
          <section className="mt-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="font-semibold">Create a task</h2>
            <form onSubmit={createTask} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="task-title">Title</Label>
                <Input
                  id="task-title"
                  name="title"
                  placeholder="What needs to be done?"
                  maxLength={200}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="task-description">Description</Label>
                <Input
                  id="task-description"
                  name="description"
                  placeholder="Add a few details (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <select
                  id="task-priority"
                  name="priority"
                  defaultValue="medium"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due-date">Due date</Label>
                <Input id="task-due-date" name="dueDate" type="date" />
              </div>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create task</Button>
              </div>
            </form>
          </section>
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
            </div>
          </div>

          {visibleTasks.length === 0 ? (
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
                  ? "Add a task to start moving this project forward."
                  : "Try changing the search or status filter."}
              </p>
              {tasks.length === 0 && (
                <Button
                  type="button"
                  className="mt-5"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add first task
                </Button>
              )}
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
                    <label>
                      <span className="sr-only">
                        Status for {task.title}
                      </span>
                      <select
                        value={task.status}
                        onChange={(event) =>
                          updateTaskStatus(
                            task.id,
                            event.target.value as TaskStatus,
                          )
                        }
                        className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${task.title}`}
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          Demo data is stored in this page only and resets when you reload.
        </p>
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
