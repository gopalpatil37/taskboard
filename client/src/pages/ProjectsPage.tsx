import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LogoutButton from "@/components/LogoutButton";
import { api } from "@/lib/api";
import type { AuthOutletContext } from "@/services/authService";

type Project = {
  id: number;
  name: string;
  description: string | null;
  taskCount: number;
};

type ProjectsResponse = {
  projects: Project[];
};

type CreateProjectRequest = {
  name: string;
  description?: string;
};

type CreateProjectResponse = {
  project: Pick<Project, "id" | "name" | "description">;
};

type RenameProjectRequest = {
  name: string;
};

type RenameProjectResponse = {
  project: Pick<Project, "id" | "name">;
};

type DeleteProjectResponse = {
  message: string;
};

let projectsRequest: Promise<ProjectsResponse> | null = null;

// Reuse a pending request so React StrictMode does not load projects twice.
function getProjects(): Promise<ProjectsResponse> {
  if (!projectsRequest) {
    projectsRequest = api
      .get<ProjectsResponse>("/api/projects")
      .finally(() => {
        projectsRequest = null;
      });
  }

  return projectsRequest;
}

function ProjectsPage() {
  const { user } = useOutletContext<AuthOutletContext>();
  const userName = user?.name ?? "";
  const userNameParts = userName.trim().split(/\s+/).filter(Boolean);
  const firstName = userNameParts[0] ?? "there";
  const userInitials =
    userNameParts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?";
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [renamingProjectId, setRenamingProjectId] = useState<number | null>(
    null,
  );
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState("");
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<{
    projectId: number;
    message: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    getProjects()
      .then(({ projects: userProjects }) => {
        if (active) {
          setProjects(userProjects);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load your projects. Please try again.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const totalTasks = projects.reduce(
    (total, project) => total + project.taskCount,
    0,
  );
  const projectsWithTasks = projects.filter(
    (project) => project.taskCount > 0,
  ).length;
  const projectsWithoutTasks = projects.length - projectsWithTasks;

  // Create the project on the server, then add it to the page without reloading.
  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreating) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!name) {
      setCreateError("Project name is required.");
      return;
    }

    const body: CreateProjectRequest = description
      ? { name, description }
      : { name };

    setIsCreating(true);
    setCreateError("");

    try {
      const { project } = await api.post<
        CreateProjectResponse,
        CreateProjectRequest
      >("/api/projects", body);

      setProjects((currentProjects) => [
        ...currentProjects,
        // The create endpoint does not include a task count.
        { ...project, taskCount: 0 },
      ]);
      form.reset();
      setIsCreateFormOpen(false);
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Unable to create the project. Please try again.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  // Save the new name, then update just that project's card.
  async function renameProject(
    projectId: number,
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (isRenaming) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
      setRenameError("Project name is required.");
      return;
    }

    setIsRenaming(true);
    setRenameError("");

    try {
      const { project: updatedProject } = await api.patch<
        RenameProjectResponse,
        RenameProjectRequest
      >(`/api/projects/${projectId}`, { name });

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === updatedProject.id
            ? { ...project, name: updatedProject.name }
            : project,
        ),
      );
      setRenamingProjectId(null);
    } catch (error) {
      setRenameError(
        error instanceof Error
          ? error.message
          : "Unable to rename the project. Please try again.",
      );
    } finally {
      setIsRenaming(false);
    }
  }

  async function deleteProject(project: Project) {
    if (deletingProjectId !== null) {
      return;
    }

    // Confirm first because deleting a project also deletes its tasks.
    const confirmed = window.confirm(
      `Delete "${project.name}" and its tasks? This action cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingProjectId(project.id);
    setDeleteError(null);

    try {
      await api.delete<DeleteProjectResponse>(`/api/projects/${project.id}`);
      // Remove the project from the page after the server confirms deletion.
      setProjects((currentProjects) =>
        currentProjects.filter((currentProject) => currentProject.id !== project.id),
      );
    } catch (error) {
      setDeleteError({
        projectId: project.id,
        message:
          error instanceof Error
            ? error.message
            : "Unable to delete the project. Please try again.",
      });
    } finally {
      setDeletingProjectId(null);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/projects" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <FolderKanban className="size-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              TaskBoard
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
            <Link
              to="/projects"
              className="rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground"
              aria-current="page"
            >
              Projects
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium sm:inline">
              {userName}
            </span>
            <span
              className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
              aria-label={`${userName} avatar`}
            >
              {userInitials}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              YOUR WORKSPACE
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome, {firstName} 👋
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Keep your projects moving. Here&apos;s what you&apos;re working on.
            </p>
          </div>

          <Button
            type="button"
            className="h-10 w-full sm:w-auto"
            onClick={() => {
              setCreateError("");
              setIsCreateFormOpen((isOpen) => !isOpen);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Create project
          </Button>
        </section>

        {isCreateFormOpen && (
          <section className="mt-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="font-semibold">Create a project</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a name and optional description for your project.
            </p>
            <form
              onSubmit={createProject}
              className="mt-4 grid gap-4 sm:grid-cols-2"
            >
              <div className="space-y-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input
                  id="project-name"
                  name="name"
                  placeholder="e.g. Website redesign"
                  maxLength={150}
                  required
                  autoFocus
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Input
                  id="project-description"
                  name="description"
                  placeholder="What is this project about?"
                  disabled={isCreating}
                />
              </div>
              {createError && (
                <p
                  className="text-sm text-destructive sm:col-span-2"
                  role="alert"
                >
                  {createError}
                </p>
              )}
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isCreating}
                  onClick={() => {
                    setCreateError("");
                    setIsCreateFormOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create project"}
                </Button>
              </div>
            </form>
          </section>
        )}

        {isLoading ? (
          <div
            className="mt-10 rounded-2xl border bg-background px-5 py-14 text-center text-sm text-muted-foreground"
            role="status"
          >
            Loading your projects...
          </div>
        ) : errorMessage ? (
          <div
            className="mt-10 rounded-2xl border bg-background px-5 py-8 text-center text-sm text-destructive"
            role="alert"
          >
            We couldn&apos;t load your projects: {errorMessage}
          </div>
        ) : (
          <>
            <section
              className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4"
              aria-label="Project overview"
            >
              <SummaryCard
                label="Projects"
                value={projects.length}
                icon={<FolderKanban className="size-4" aria-hidden="true" />}
              />
              <SummaryCard
                label="Total tasks"
                value={totalTasks}
                icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
              />
              <SummaryCard
                label="Projects without tasks"
                value={projectsWithoutTasks}
                icon={<Clock3 className="size-4" aria-hidden="true" />}
              />
            </section>

            <section className="mt-10">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Your projects
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {projects.length}{" "}
                    {projects.length === 1 ? "project" : "projects"} in your
                    workspace
                  </p>
                </div>
              </div>

              {projects.length === 0 ? (
                <div className="rounded-2xl border border-dashed bg-background px-5 py-14 text-center">
                  <FolderKanban
                    className="mx-auto size-9 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <h3 className="mt-4 font-semibold">No projects yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create a project to start organizing your tasks.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {projects.map((project) => {
                    const hasTasks = project.taskCount > 0;

                    return (
                      <article
                        key={project.id}
                        className="flex min-w-0 flex-col rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <FolderKanban
                                className="size-5"
                                aria-hidden="true"
                              />
                            </span>
                            <div className="min-w-0">
                              <h3 className="break-words font-semibold">
                                {project.name}
                              </h3>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {project.taskCount}{" "}
                                {project.taskCount === 1 ? "task" : "tasks"}
                              </p>
                            </div>
                          </div>

                          <Badge variant={hasTasks ? "default" : "secondary"}>
                            {hasTasks ? "Has tasks" : "No tasks"}
                          </Badge>
                        </div>

                        <p className="mt-4 min-h-10 text-sm leading-5 text-muted-foreground">
                          {project.description ?? "No description provided."}
                        </p>

                        {renamingProjectId === project.id && (
                          <form
                            onSubmit={(event) =>
                              renameProject(project.id, event)
                            }
                            className="mt-4 space-y-3"
                          >
                            <div className="space-y-2">
                              <Label htmlFor={`project-name-${project.id}`}>
                                Project name
                              </Label>
                              <Input
                                id={`project-name-${project.id}`}
                                name="name"
                                defaultValue={project.name}
                                maxLength={150}
                                required
                                autoFocus
                                disabled={isRenaming}
                              />
                            </div>
                            {renameError && (
                              <p
                                className="text-sm text-destructive"
                                role="alert"
                              >
                                {renameError}
                              </p>
                            )}
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isRenaming}
                                onClick={() => {
                                  setRenamingProjectId(null);
                                  setRenameError("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                size="sm"
                                disabled={isRenaming}
                              >
                                {isRenaming ? "Saving..." : "Save name"}
                              </Button>
                            </div>
                          </form>
                        )}

                        {deleteError?.projectId === project.id && (
                          <p className="mt-3 text-sm text-destructive" role="alert">
                            {deleteError.message}
                          </p>
                        )}

                        <div className="mt-auto flex justify-end gap-1 pt-5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Rename ${project.name}`}
                            title="Rename project"
                            disabled={isRenaming || deletingProjectId !== null}
                            onClick={() => {
                              setRenameError("");
                              setRenamingProjectId((currentId) =>
                                currentId === project.id ? null : project.id,
                              );
                            }}
                          >
                            <Pencil aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={
                              deletingProjectId === project.id
                                ? `Deleting ${project.name}`
                                : `Delete ${project.name}`
                            }
                            title={
                              deletingProjectId === project.id
                                ? "Deleting project..."
                                : "Delete project"
                            }
                            disabled={deletingProjectId !== null}
                            onClick={() => deleteProject(project)}
                          >
                            {deletingProjectId === project.id ? (
                              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <Trash2 aria-hidden="true" />
                            )}
                          </Button>
                          <Link
                            to={`/projects/${project.id}`}
                            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-medium text-primary hover:bg-primary/10"
                          >
                            View
                            <ArrowUpRight
                              className="size-4"
                              aria-hidden="true"
                            />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  icon: ReactNode;
};

function SummaryCard({ label, value, icon }: SummaryCardProps) {
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

export default ProjectsPage;
