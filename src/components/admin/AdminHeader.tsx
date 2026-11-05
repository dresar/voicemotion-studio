"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { User } from "@/types";
import type { AdminSection } from "./AdminSidebar";

interface AdminHeaderProps {
  currentSection: AdminSection;
  user: User;
  onRefresh: () => void;
  refreshing: boolean;
  onOpenMobile: () => void;
}

const sectionTitles: Record<AdminSection, { title: string; subtitle: string }> = {
  overview: {
    title: "Ringkasan Platform",
    subtitle: "Metrik keseluruhan, status storage, dan performa sistem"
  },
  "ai-router": {
    title: "Router AI Multi-Provider",
    subtitle: "ByNara (9 Model Frontier), Sumopod AI, Gemini API, dan strategi rute inferensi"
  },
  assets: {
    title: "Manajemen Aset & Media",
    subtitle: "File audio TTS, pembersihan file yatim, SVG vektor, dan style pack"
  },
  users: {
    title: "Pengguna & Lisensi",
    subtitle: "Daftar pengguna terdaftar, paket langganan, dan saldo kredit"
  },
  projects: {
    title: "Daftar Proyek",
    subtitle: "Eksplorasi seluruh proyek studio dan status pembuatan video"
  },
  ledger: {
    title: "Log Audit Kredit",
    subtitle: "Catatan riwayat mutasi kredit dan transaksi pengguna"
  },
  settings: {
    title: "Pengaturan Platform & Sistem",
    subtitle: "Konfigurasi engine TTS, kuota kredit, keamanan JWT, dan batas sistem"
  }
};

export function AdminHeader({
  currentSection,
  user,
  onRefresh,
  refreshing,
  onOpenMobile
}: AdminHeaderProps) {
  const meta = sectionTitles[currentSection] || {
    title: "Admin Panel",
    subtitle: "VoiceMotion Studio Backoffice"
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-line/70 bg-raised/95 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobile}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-line/70 bg-bg text-muted hover:text-ink lg:hidden shadow-neu-sm"
          aria-label="Buka Menu Admin"
        >
          <Icon name="menu" size={18} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold tracking-tight text-ink sm:text-lg">
              {meta.title}
            </h1>
          </div>
          <p className="hidden text-xs text-muted sm:block">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          loading={refreshing}
          leftIcon={<Icon name="refresh" size={14} className={refreshing ? "animate-spin" : ""} />}
          className="h-8 px-2.5 text-xs"
        >
          <span className="hidden sm:inline">Segarkan</span>
        </Button>

        <div className="flex items-center gap-2 rounded-lg border border-line/70 bg-bg px-2.5 py-1 shadow-neu-sm">
          <Avatar name={user.name || user.email} src={user.avatar} size="sm" />
          <div className="hidden min-w-0 max-w-[140px] text-left sm:block">
            <p className="truncate text-xs font-bold text-ink">{user.name || user.email}</p>
            <p className="truncate text-[10px] text-muted">{user.email}</p>
          </div>
          <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-primary-strong">
            Admin
          </span>
        </div>
      </div>
    </header>
  );
}
