"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { messageFromError } from "@/lib/errors";
import { formatNumber, formatRelativeTime } from "@/lib/utils";
import type { AdminProjectItem, Stage } from "@/types";

interface AdminProjectsViewProps {
  onRefreshStats?: () => void;
}

const stageLabels: Record<Stage, string> = {
  idea: "Ide & Konsep",
  narration: "Naskah Narasi",
  voice: "Voiceover TTS",
  animation: "Canvas Animasi"
};

const stageColors: Record<Stage, string> = {
  idea: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  narration: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  voice: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  animation: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
};

export function AdminProjectsView({ onRefreshStats }: AdminProjectsViewProps) {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<AdminProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"all" | Stage>("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminProjectItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminListProjects();
      setProjects(data);
    } catch (err) {
      showToast(messageFromError(err), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.adminDeleteProject(deleteTarget.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      showToast(`Proyek "${deleteTarget.title}" berhasil dihapus`, "success");
      setDeleteTarget(null);
      onRefreshStats?.();
    } catch (err) {
      showToast(messageFromError(err), "error");
    } finally {
      setDeleting(false);
    }
  };

  const filteredProjects = projects.filter((item) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.userEmail.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query);
    const matchesStage = stageFilter === "all" || item.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter & Search */}
      <Card variant="raised" padding="md" className="flex flex-wrap items-center justify-between gap-3 shadow-neu-sm">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "idea", "narration", "voice", "animation"] as const).map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => setStageFilter(stage)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition capitalize ${
                stageFilter === stage
                  ? "bg-primary-soft text-primary-strong shadow-neu-in"
                  : "border border-line/70 bg-bg text-muted hover:text-ink shadow-neu-sm"
              }`}
            >
              {stage === "all" ? `Semua (${projects.length})` : stageLabels[stage]}
            </button>
          ))}
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative w-full max-w-xs">
            <Icon
              name="search"
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari proyek atau email..."
              aria-label="Cari proyek"
              className="neu-field pl-9 text-xs"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void loadProjects()}
            leftIcon={<Icon name="refresh" size={14} className={loading ? "animate-spin" : ""} />}
            className="h-9 px-3"
          >
            <span className="hidden sm:inline">Segarkan</span>
          </Button>
        </div>
      </Card>

      {/* Projects Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon="film"
          title={search.trim() ? "Proyek tidak ditemukan" : "Belum ada proyek yang dibuat"}
          action={
            <Button variant="secondary" onClick={() => void loadProjects()}>
              Segarkan
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line/70 bg-surface shadow-neu-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line/70 bg-bg-sunken text-[11px] font-extrabold uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-4 py-3">Judul Proyek</th>
                  <th className="px-4 py-3">Pemilik (Email)</th>
                  <th className="px-4 py-3">Tahap</th>
                  <th className="px-4 py-3">Jumlah Adegan</th>
                  <th className="px-4 py-3">Diperbarui</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-bg-sunken/40 transition">
                    <td className="px-4 py-3 font-semibold text-ink">
                      <div>
                        <p className="font-extrabold text-sm">{project.title}</p>
                        <p className="font-mono text-[10px] text-muted">{project.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <div className="flex items-center gap-1.5">
                        <Icon name="mail" size={12} className="text-muted" />
                        <span className="font-medium text-ink/80">{project.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                          stageColors[project.stage] || "bg-bg-sunken text-muted"
                        }`}
                      >
                        {stageLabels[project.stage] || project.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-bg-sunken px-2 py-0.5 font-bold text-ink text-[11px]">
                        {formatNumber(project.sceneCount, 0)} adegan
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatRelativeTime(project.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/app/workspace/?project=${project.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line/70 bg-bg text-muted hover:text-primary-strong shadow-neu-sm"
                          title="Buka di Studio"
                        >
                          <Icon name="external" size={14} />
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(project)}
                          className="h-8 w-8 p-0 text-danger hover:bg-danger/10"
                          title="Hapus Proyek"
                        >
                          <Icon name="trash" size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirm Delete Project Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Proyek Pengguna"
        description={`Anda yakin ingin menghapus proyek "${deleteTarget?.title}" (${deleteTarget?.id}) milik ${deleteTarget?.userEmail}? Semua adegan, audio terkait, dan rekaman ekspor akan terhapus secara permanen.`}
        confirmLabel="Hapus Proyek"
        cancelLabel="Batal"
        danger
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
