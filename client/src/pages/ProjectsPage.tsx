import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LogoutButton from "@/components/LogoutButton";

type Project = {
  id: string;
  name: string;
  description: string;
  taskCount: number;
  completedTasks: number;
  updatedLabel: string;
};

const sampleProjects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Refresh the company website with a clearer, more modern experience.",
    taskCount: 18,
    completedTasks: 11,
    updatedLabel: "Updated 2 hours ago",
  },
  {
    id: "2",
    name: "Mobile App Launch",
    description: "Plan the release of the new mobile app across iOS and Android.",
    taskCount: 24,
    completedTasks: 8,
    updatedLabel: "Updated yesterday",
  },
  {
    id: "3",
    name: "Customer Portal",
    description: "Build a self-service space for customer accounts and support.",
    taskCount: 12,
    completedTasks: 12,
    updatedLabel: "Updated 3 days ago",
  },
  {
    id: "4",
    name: "Q4 Planning",
    description: "Collect ideas and prepare priorities for the next quarter.",
    taskCount: 0,
    completedTasks: 0,
    updatedLabel: "Created today",
  },
];

function ProjectsPage() {
  const totalTasks = sampleProjects.reduce(
    (total, project) => total + project.taskCount,
    0,
  );
  const completedTasks = sampleProjects.reduce(
    (total, project) => total + project.completedTasks,
    0,
  );
  const remainingTasks = totalTasks - completedTasks;

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
              Jordan Lee
            </span>
            <span
              className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
              aria-label="Jordan Lee"
            >
              JL
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
              Good morning, Jordan
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Keep your projects moving. Here&apos;s what your team is working on.
            </p>
          </div>

          <Button type="button" className="h-10 w-full sm:w-auto">
            <Plus className="size-4" aria-hidden="true" />
            Create project
          </Button>
        </section>

        <section
          className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4"
          aria-label="Task overview"
        >
          <SummaryCard
            label="Projects"
            value={sampleProjects.length}
            icon={<FolderKanban className="size-4" aria-hidden="true" />}
          />
          <SummaryCard
            label="Tasks completed"
            value={completedTasks}
            icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
          />
          <SummaryCard
            label="Tasks remaining"
            value={remainingTasks}
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
                {sampleProjects.length} projects in your workspace
              </p>
            </div>
          </div>

          {sampleProjects.length === 0 ? (
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
              {sampleProjects.map((project) => {
                const remaining = project.taskCount - project.completedTasks;
                const progress =
                  project.taskCount === 0
                    ? 0
                    : Math.round(
                        (project.completedTasks / project.taskCount) * 100,
                      );
                const isComplete =
                  project.taskCount > 0 &&
                  project.completedTasks === project.taskCount;

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

                      <Badge variant={isComplete ? "default" : "secondary"}>
                        {isComplete ? "Complete" : "In progress"}
                      </Badge>
                    </div>

                    <p className="mt-4 min-h-10 text-sm leading-5 text-muted-foreground">
                      {project.description}
                    </p>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-medium text-muted-foreground">
                          Progress
                        </span>
                        <span className="font-semibold">{progress}%</span>
                      </div>
                      <div
                        className="h-2 overflow-hidden rounded-full bg-muted"
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
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Completed
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {project.completedTasks}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Remaining
                        </p>
                        <p className="mt-1 text-sm font-semibold">{remaining}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-xs text-muted-foreground">
                        {project.updatedLabel}
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${project.name}`}
                          title="Project editing will be added later"
                          disabled
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${project.name}`}
                          title="Project deletion will be added later"
                          disabled
                        >
                          <Trash2 aria-hidden="true" />
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
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
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
