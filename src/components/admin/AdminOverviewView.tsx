"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { fileSize, formatNumber } from "@/lib/utils";
import type { AdminOverviewStats } from "@/types";
import type { AdminSection } from "./AdminSidebar";

interface AdminOverviewViewProps {
  stats: AdminOverviewStats | null;
  loading: boolean;
  onNavigate: (section: AdminSection) => void;
  onRefresh: () => void;
}

export function AdminOverviewView({
  stats,
  loading,
  onNavigate,
  onRefresh
}: AdminOverviewViewProps) {
  if (loading && !stats) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-44 rounded-xl" />
      </div>
    );
  }

  const statItems = [
    {
      label: "Total Pengguna",
      value: formatNumber(stats?.usersCount ?? 0, 0),
      subtext: "Akun terdaftar di database",
      icon: "users" as const,
      color: "text-primary-strong bg-primary-soft",
      action: () => onNavigate("users"),
      actionLabel: "Kelola Pengguna"
    },
    {
      label: "Total Proyek",
      value: formatNumber(stats?.projectsCount ?? 0, 0),
      subtext: "Proyek video dibuat pengguna",
      icon: "film" as const,
      color: "text-ink bg-bg-sunken",
      action: () => onNavigate("projects"),
      actionLabel: "Daftar Proyek"
    },
    {
      label: "Total Adegan (Scenes)",
      value: formatNumber(stats?.scenesCount ?? 0, 0),
      subtext: "Adegan tergenerasi di studio",
      icon: "wand" as const,
      color: "text-ink bg-bg-sunken",
      action: () => onNavigate("projects"),
      actionLabel: "Eksplorasi"
    },
    {
      label: "Cache Audio TTS",
      value: formatNumber(stats?.audioFilesCount ?? 0, 0),
      subtext: "File audio hash tersimpan",
      icon: "volume" as const,
      color: "text-primary-strong bg-primary-soft",
      action: () => onNavigate("assets"),
      actionLabel: "Lihat Audio"
    },
    {
      label: "Penggunaan Storage",
      value: fileSize(stats?.storageBytes ?? 0),
      subtext: "Total ukuran uploads/tts",
      icon: "database" as const,
      color: "text-ink bg-bg-sunken",
      action: () => onNavigate("assets"),
      actionLabel: "Kelola Storage"
    },
    {
      label: "Total Ekspor Video",
      value: formatNumber(stats?.exportsCount ?? 0, 0),
      subtext: "Permintaan render MP4",
      icon: "video" as const,
      color: "text-ink bg-bg-sunken",
      action: () => onNavigate("ledger"),
      actionLabel: "Log Ekspor"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {statItems.map((item) => (
          <Card
            key={item.label}
            variant="raised"
            padding="md"
            className="group flex flex-col justify-between transition hover:border-primary/40 shadow-neu-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  {item.label}
                </p>
                <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink">
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-muted">{item.subtext}</p>
              </div>
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                <Icon name={item.icon} size={20} />
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
              <button
                type="button"
                onClick={item.action}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-strong hover:underline"
              >
                <span>{item.actionLabel}</span>
                <Icon name="arrowRight" size={12} />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* System Health & Fast Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card variant="raised" padding="md" className="space-y-4 shadow-neu-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-ink">Status Infrastruktur & Server</h2>
              <p className="text-xs text-muted">Kondisi layanan backend Echo Go & database</p>
            </div>
            <span className="flex h-7 items-center gap-1.5 rounded-full bg-success/10 px-2.5 text-[11px] font-bold text-success">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              Optimal
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between rounded-lg border border-line/70 bg-bg p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Icon name="globe" size={15} className="text-primary-strong" />
                <span className="font-semibold text-ink">API Echo Framework</span>
              </div>
              <span className="font-mono text-muted">Online (HTTP 200)</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-line/70 bg-bg p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Icon name="database" size={15} className="text-primary-strong" />
                <span className="font-semibold text-ink">SQLite Engine (WAL)</span>
              </div>
              <span className="font-mono text-muted">Connected & Foreign Keys ON</span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-line/70 bg-bg p-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Icon name="folder" size={15} className="text-primary-strong" />
                <span className="font-semibold text-ink">TTS Storage Vault</span>
              </div>
              <span className="font-mono text-muted">uploads/tts (Local Disk)</span>
            </div>
          </div>
        </Card>

        <Card variant="raised" padding="md" className="space-y-4 shadow-neu-sm">
          <div>
            <h2 className="text-sm font-extrabold text-ink">Aksi Cepat Admin</h2>
            <p className="text-xs text-muted">Tindakan pemeliharaan dan inspeksi utama</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => onNavigate("ai-router")}
              leftIcon={<Icon name="sparkles" size={15} />}
              className="h-10 justify-start text-xs font-bold"
            >
              Router AI & Model
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate("assets")}
              leftIcon={<Icon name="folder" size={15} />}
              className="h-10 justify-start text-xs font-bold"
            >
              Manajemen Aset
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate("users")}
              leftIcon={<Icon name="users" size={15} />}
              className="h-10 justify-start text-xs font-bold"
            >
              Kelola Pengguna
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate("projects")}
              leftIcon={<Icon name="film" size={15} />}
              className="h-10 justify-start text-xs font-bold"
            >
              Daftar Proyek
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate("ledger")}
              leftIcon={<Icon name="creditCard" size={15} />}
              className="h-10 justify-start text-xs font-bold"
            >
              Log Kredit
            </Button>
            <Button
              variant="secondary"
              onClick={() => onNavigate("settings")}
              leftIcon={<Icon name="settings" size={15} />}
              className="h-10 justify-start text-xs font-bold"
            >
              Pengaturan Platform
            </Button>
          </div>

          <div className="rounded-lg bg-bg-sunken p-2.5 text-[11px] text-muted">
            <p className="font-semibold text-ink">Tips Pemeliharaan:</p>
            <p className="mt-0.5">
              Gunakan tab Manajemen Aset untuk membersihkan file audio yatim (audio yang tidak lagi digunakan oleh adegan manapun) secara berkala.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

