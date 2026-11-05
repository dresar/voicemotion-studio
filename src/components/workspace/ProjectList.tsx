"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { id } from "@/lib/i18n/id";
import { cn, formatDuration, formatRelativeTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useProjectStore } from "@/store/project";
import type { Project } from "@/types";

export interface ProjectListProps {
  onUpgrade?: () => void;
  onClose?: () => void;
  className?: string;
}

export function ProjectList({ onUpgrade, onClose, className }: ProjectListProps) {
  const user = useAuthStore((state) => state.user);
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const isLoading = useProjectStore((state) => state.isLoading);
  const openProject = useProjectStore((state) => state.openProject);
  const createProject = useProjectStore((state) => state.createProject);
  const duplicateProject = useProjectStore((state) => state.duplicateProject);
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  async function handleCreate() {
    setCreating(true);
    const project = await createProject();
    setCreating(false);
    if (project) {
      onClose?.();
      return;
    }
    if (useProjectStore.getState().error.toLowerCase().includes("kuota")) {
      onUpgrade?.();
    }
  }

  async function handleDuplicate(projectId: string) {
    setDuplicatingId(projectId);
    await duplicateProject(projectId);
    setDuplicatingId(null);
    if (useProjectStore.getState().error.toLowerCase().includes("kuota")) {
      onUpgrade?.();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteProject(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  }

  return (
    <div className={cn("flex min-h-0 flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-extrabold tracking-tight text-ink">{id.workspace.projects}</h2>
          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-extrabold text-primary-strong">
            {projects.length} Proyek
          </span>
        </div>
      </div>

      <Button
        variant="secondary"
        fullWidth
        onClick={handleCreate}
        loading={creating}
        leftIcon={<Icon name="plus" size={18} />}
        className="justify-start"
      >
        {id.workspace.addProject}
      </Button>

      <div className="relative">
        <Icon name="search" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={id.workspace.searchProject}
          aria-label={id.workspace.searchProject}
          className="neu-field pl-10 text-sm"
        />
      </div>

      <div className="neu-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
        {isLoading && projects.length === 0 ? (
          <>
            <Skeleton className="h-[92px]" />
            <Skeleton className="h-[92px]" />
            <Skeleton className="h-[92px]" />
          </>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            compact
            icon="folder"
            title={projects.length === 0 ? id.workspace.noProjects : id.workspace.noProjectResults}
            action={
              projects.length === 0 ? (
                <Button variant="secondary" onClick={handleCreate} loading={creating} leftIcon={<Icon name="plus" size={16} />}>
                  {id.workspace.createFirst}
                </Button>
              ) : null
            }
          />
        ) : (
          filteredProjects.map((project) => {
            const isActive = project.id === activeProjectId;
            return (
              <Card
                key={project.id}
                interactive
                selected={isActive}
                padding="sm"
                className="flex items-start gap-3"
                onClick={() => {
                  void openProject(project.id);
                  onClose?.();
                }}
              >
                <span className="flex h-[74px] w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-primary-soft to-sunken text-primary-strong shadow-neu-in">
                  <Icon name="film" size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-extrabold leading-snug text-ink">{project.title}</span>
                  <span className="mt-1 block text-[11px] font-semibold text-muted">
                    {id.workspace.sceneCount.replace("{count}", String(project.sceneCount))} ·{" "}
                    {id.workspace.durationTotal.replace("{duration}", formatDuration(project.totalDuration))}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-muted">{formatRelativeTime(project.updatedAt)}</span>
                  <span className="mt-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`${id.common.duplicate} ${project.title}`}
                      disabled={duplicatingId === project.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDuplicate(project.id);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-bg-sunken hover:text-primary-strong disabled:opacity-50"
                    >
                      <Icon
                        name={duplicatingId === project.id ? "loader" : "duplicate"}
                        size={15}
                        className={duplicatingId === project.id ? "animate-spin" : undefined}
                      />
                    </button>
                    <button
                      type="button"
                      aria-label={`${id.common.delete} ${project.title}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteTarget(project);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </span>
                </span>
              </Card>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={id.workspace.deleteProject}
        description={id.workspace.deleteProjectDescription}
        confirmLabel={id.common.delete}
        danger
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
