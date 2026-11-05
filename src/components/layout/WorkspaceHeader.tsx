"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { id } from "@/lib/i18n/id";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

export interface WorkspaceHeaderProps {
  user: User;
  title: string;
  onTitleChange: (title: string) => void;
  onMenu: () => void;
  onLogout: () => void;
  pendingSaves: number;
  lastSavedAt: string | null;
  saveFailed?: boolean;
  showLeftSidebar?: boolean;
  onToggleLeftSidebar?: () => void;
  showRightSidebar?: boolean;
  onToggleRightSidebar?: () => void;
}

export function WorkspaceHeader({
  user,
  title,
  onTitleChange,
  onMenu,
  onLogout,
  pendingSaves,
  lastSavedAt,
  saveFailed = false,
  showLeftSidebar = true,
  onToggleLeftSidebar,
  showRightSidebar = true,
  onToggleRightSidebar
}: WorkspaceHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commitTitle() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed);
    } else {
      setDraft(title);
    }
    setEditing(false);
  }

  const saveState = saveFailed ? "failed" : pendingSaves > 0 ? "saving" : lastSavedAt ? "saved" : "idle";

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg-raised/95 backdrop-blur">
      <div className="mx-auto flex h-13 max-w-[1440px] items-center justify-between px-3 sm:px-4">
        {/* Left: Brand & Project Name */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenu}
            aria-label={id.workspace.mobileMenu}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-bg-sunken lg:hidden"
          >
            <Icon name="menu" size={20} />
          </button>

          <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
            <Logo size="sm" />
            <span className="h-4 w-px bg-line/80" />
          </div>

          <div className="min-w-0 flex items-center gap-2">
            {editing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={commitTitle}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitTitle();
                  }
                  if (event.key === "Escape") {
                    setDraft(title);
                    setEditing(false);
                  }
                }}
                aria-label={id.workspace.editTitle}
                maxLength={120}
                className="w-full max-w-[280px] border-b border-primary bg-transparent pb-0.5 text-xs sm:text-sm font-bold text-ink outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="group flex max-w-full items-center gap-1.5 text-left"
                aria-label={id.workspace.editTitle}
              >
                <span className="truncate text-xs sm:text-sm font-bold text-ink group-hover:text-primary transition-colors">
                  {title || id.workspace.projectFallback}
                </span>
                <Icon name="edit" size={12} className="shrink-0 text-muted group-hover:text-primary transition-colors" />
              </button>
            )}

            <div className="hidden sm:flex items-center text-[10px] text-muted font-medium">
              {saveState === "saving" ? (
                <span className="flex items-center gap-1 text-primary">
                  <Icon name="loader" size={10} className="animate-spin" />
                  <span>Menyimpan...</span>
                </span>
              ) : saveState === "saved" ? (
                <span className="flex items-center gap-1 text-success">
                  <Icon name="check" size={10} />
                  <span>Tersimpan</span>
                </span>
              ) : saveState === "failed" ? (
                <span className="flex items-center gap-1 text-danger">
                  <Icon name="alertCircle" size={10} />
                  <span>Gagal</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right: Controls & Profile */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {onToggleLeftSidebar ? (
            <button
              type="button"
              onClick={onToggleLeftSidebar}
              className={cn(
                "hidden lg:inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] border text-[11px] font-semibold transition-all active:scale-95",
                showLeftSidebar
                  ? "bg-primary-soft text-primary-strong border-primary/30 shadow-sm"
                  : "bg-bg text-muted border-line hover:text-ink hover:border-line-hover"
              )}
              title={showLeftSidebar ? "Sembunyikan Panel Alur" : "Tampilkan Panel Alur"}
            >
              <Icon name="sliders" size={12} />
              <span>{showLeftSidebar ? "Tutup Alur" : "Panel Alur"}</span>
            </button>
          ) : null}

          {onToggleRightSidebar ? (
            <button
              type="button"
              onClick={onToggleRightSidebar}
              className={cn(
                "hidden lg:inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] border text-[11px] font-semibold transition-all active:scale-95",
                showRightSidebar
                  ? "bg-primary-soft text-primary-strong border-primary/30 shadow-sm"
                  : "bg-bg text-muted border-line hover:text-ink hover:border-line-hover"
              )}
              title={showRightSidebar ? "Sembunyikan Daftar Proyek" : "Tampilkan Daftar Proyek"}
            >
              <Icon name="folder" size={12} />
              <span>{showRightSidebar ? "Tutup Proyek" : "Proyek"}</span>
            </button>
          ) : null}

          <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-primary-soft text-primary-strong border border-primary/20 text-[10px] font-bold">
            <Icon name="sparkles" size={11} />
            <span>Open Source</span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={id.common.account}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-line hover:border-primary/40 transition-colors"
            >
              <Avatar name={user.name || user.email} src={user.avatar} size="sm" />
            </button>
            {menuOpen ? (
              <>
                <button
                  type="button"
                  aria-label={id.common.close}
                  tabIndex={-1}
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  role="menu"
                  className="absolute right-0 top-10 z-50 w-56 rounded-lg border border-line bg-raised p-1.5 shadow-neu-lg"
                >
                  <div className="border-b border-line px-2.5 py-1.5">
                    <p className="truncate text-xs font-bold text-ink">{user.name}</p>
                    <p className="truncate text-[10px] text-muted">{user.email}</p>
                    <span className="mt-0.5 inline-block text-[9px] font-extrabold text-primary-strong uppercase tracking-wider">
                      Edisi Open Source · Bebas & Tanpa Batas
                    </span>
                  </div>
                  {user.role === "admin" ? (
                    <Link
                      href="/admin/"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex min-h-[36px] items-center gap-2 rounded-md px-2.5 text-xs font-semibold text-ink hover:bg-bg-sunken"
                    >
                      <Icon name="shield" size={14} className="text-muted" />
                      <span>{id.common.admin}</span>
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                    className="flex min-h-[36px] w-full items-center gap-2 rounded-md px-2.5 text-left text-xs font-semibold text-danger hover:bg-danger/10"
                  >
                    <Icon name="logout" size={14} />
                    <span>{id.common.logout}</span>
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
