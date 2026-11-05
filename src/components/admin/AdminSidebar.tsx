"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

export type AdminSection =
  | "overview"
  | "ai-router"
  | "assets"
  | "users"
  | "projects"
  | "ledger"
  | "settings";

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
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

const STORAGE_COLLAPSED_KEY = "voicemotion.adminSidebarCollapsed";

export function AdminSidebar({
  currentSection,
  onSelectSection,
  counts,
  mobileOpen,
  onCloseMobile,
  collapsed: externalCollapsed,
  onToggleCollapsed
}: AdminSidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_COLLAPSED_KEY);
      if (stored !== null) {
        setInternalCollapsed(stored === "true");
      }
    }
  }, []);

  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  function handleToggleCollapse() {
    if (onToggleCollapsed) {
      onToggleCollapsed();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_COLLAPSED_KEY, String(next));
      }
    }
  }

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

  return (
    <>
      <aside
        className={cn(
          "h-screen shrink-0 border-r border-line/70 bg-raised transition-all duration-200 sticky top-0 flex flex-col justify-between overflow-y-auto neu-scrollbar z-30",
          isCollapsed ? "w-16 p-2" : "w-60 xl:w-64 p-4"
        )}
      >
        <div className="space-y-4">
          <div
            className={cn(
              "flex items-center",
              isCollapsed ? "justify-center" : "justify-between"
            )}
          >
            {!isCollapsed ? (
              <div className="flex items-center gap-2">
                <Logo size="sm" />
                <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-primary-strong">
                  Admin
                </span>
              </div>
            ) : (
              <Logo size="sm" />
            )}

            <button
              type="button"
              onClick={handleToggleCollapse}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-line/60 bg-bg text-muted hover:border-primary/40 hover:text-ink shadow-neu-xs"
              title={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
              aria-label={isCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
            >
              <Icon name={isCollapsed ? "chevronRight" : "chevronLeft"} size={14} />
            </button>
          </div>

          <Link
            href="/app/workspace/"
            className={cn(
              "flex items-center justify-center rounded-lg border border-line/70 bg-bg text-xs font-bold text-muted transition hover:border-primary/40 hover:text-primary-strong shadow-neu-xs",
              isCollapsed ? "h-9 w-full" : "h-9 w-full gap-2 px-3"
            )}
            title="Kembali ke Studio"
          >
            <Icon name="arrowLeft" size={14} />
            {!isCollapsed ? <span className="truncate">Kembali ke Studio</span> : null}
          </Link>

          <div>
            {!isCollapsed ? (
              <p className="px-2 pb-1.5 text-[9px] font-extrabold uppercase tracking-wider text-muted">
                Navigasi
              </p>
            ) : null}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = currentSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectSection(item.id)}
                    title={item.label}
                    className={cn(
                      "flex items-center rounded-lg text-xs transition duration-150",
                      isCollapsed
                        ? "h-10 w-full justify-center px-0 relative"
                        : "h-9 w-full justify-between px-2.5",
                      active
                        ? "bg-primary-soft text-primary-strong font-bold shadow-neu-in"
                        : "text-ink/80 hover:bg-sunken hover:text-ink font-semibold"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon name={item.icon} size={16} className="shrink-0" />
                      {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
                    </div>
                    {typeof item.badge === "number" && item.badge > 0 ? (
                      !isCollapsed ? (
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-0.2 text-[9px] font-extrabold",
                            active ? "bg-primary text-white" : "bg-sunken text-muted"
                          )}
                        >
                          {item.badge}
                        </span>
                      ) : (
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                      )
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div
          className={cn(
            "rounded-xl border border-line/70 bg-bg p-2.5 shadow-neu-xs",
            isCollapsed && "flex justify-center p-2"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {!isCollapsed ? (
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-ink">VoiceMotion Studio</p>
                <p className="truncate text-[10px] text-muted">Echo Go + Next.js App</p>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col justify-between border-r border-line bg-raised p-4 shadow-2xl overflow-y-auto">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Logo size="sm" />
                  <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-primary-strong">
                    Admin
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-sunken hover:text-ink"
                  aria-label="Tutup Menu"
                >
                  <Icon name="x" size={18} />
                </button>
              </div>

              <Link
                href="/app/workspace/"
                onClick={onCloseMobile}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-line/70 bg-bg px-3 text-xs font-bold text-muted transition hover:border-primary/40 hover:text-primary-strong shadow-neu-xs"
              >
                <Icon name="arrowLeft" size={14} />
                <span>Kembali ke Studio</span>
              </Link>

              <div>
                <p className="px-2 pb-1.5 text-[9px] font-extrabold uppercase tracking-wider text-muted">
                  Navigasi
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
                            : "text-ink/80 hover:bg-sunken hover:text-ink font-semibold"
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
                              active ? "bg-primary text-white" : "bg-sunken text-muted"
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

            <div className="rounded-xl border border-line/70 bg-bg p-3 shadow-neu-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                <p className="text-xs font-bold text-ink">VoiceMotion Studio</p>
              </div>
              <p className="mt-1 text-[10px] text-muted">Echo Go + Next.js App Router</p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
