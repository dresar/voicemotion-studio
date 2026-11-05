"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

export type AdminSection = "overview" | "ai-router" | "assets" | "users" | "projects" | "ledger" | "settings";

interface NavItem {
  id: AdminSection;
  label: string;
  icon: IconName;
  badge?: number;
}

interface AdminSidebarProps {
  currentSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  counts?: {
    users?: number;
    projects?: number;
    assets?: number;
  };
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AdminSidebar({
  currentSection,
  onSelectSection,
  counts,
  mobileOpen,
  onCloseMobile
}: AdminSidebarProps) {
  const navItems: NavItem[] = [
    {
      id: "overview",
      label: "Ringkasan",
      icon: "chart"
    },
    {
      id: "ai-router",
      label: "Router AI & Model",
      icon: "sparkles"
    },
    {
      id: "assets",
      label: "Manajemen Aset",
      icon: "folder",
      badge: counts?.assets
    },
    {
      id: "users",
      label: "Pengguna & Lisensi",
      icon: "users",
      badge: counts?.users
    },
    {
      id: "projects",
      label: "Daftar Proyek",
      icon: "film",
      badge: counts?.projects
    },
    {
      id: "ledger",
      label: "Log Kredit",
      icon: "creditCard"
    },
    {
      id: "settings",
      label: "Pengaturan Platform",
      icon: "settings"
    }
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
            <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-strong">
              Admin
            </span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-bg-sunken hover:text-ink lg:hidden"
            aria-label="Tutup Menu"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <Link
          href="/app/workspace/"
          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-line/70 bg-bg px-3 text-xs font-bold text-muted transition hover:border-primary/40 hover:text-primary-strong shadow-neu-sm"
        >
          <Icon name="arrowLeft" size={14} />
          <span>Kembali ke Studio</span>
        </Link>

        <div>
          <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-wider text-muted">
            Navigasi Admin
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectSection(item.id);
                    onCloseMobile();
                  }}
                  className={cn(
                    "flex h-10 w-full items-center justify-between rounded-lg px-3 text-xs transition",
                    active
                      ? "bg-primary-soft text-primary-strong font-bold shadow-neu-in"
                      : "text-ink/80 hover:bg-bg-sunken hover:text-ink font-semibold"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon name={item.icon} size={16} />
                    <span>{item.label}</span>
                  </div>
                  {typeof item.badge === "number" && item.badge > 0 ? (
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10px] font-extrabold",
                        active ? "bg-primary text-white" : "bg-bg-sunken text-muted"
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="rounded-xl border border-line/70 bg-bg p-3 shadow-neu-sm">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
          </span>
          <p className="text-xs font-bold text-ink">VoiceMotion Studio</p>
        </div>
        <p className="mt-1 text-[11px] text-muted">Echo Go + Next.js App Router</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden h-screen w-64 shrink-0 border-r border-line/70 bg-surface lg:sticky lg:top-0 lg:block">
        {sidebarContent}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-line bg-surface shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      ) : null}
    </>
  );
}

