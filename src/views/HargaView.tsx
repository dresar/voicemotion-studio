"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { useAuthStore } from "@/store/auth";

export default function HargaView() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  return (
    <main className="min-h-dvh bg-bg pb-12">
      <header className="page-pad safe-top border-b border-line/70 bg-bg-raised/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3 py-3">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/app/workspace"
                  className="hidden h-9 items-center rounded-lg px-3 text-xs font-bold text-muted hover:text-primary-strong sm:flex"
                >
                  Kembali ke Workspace
                </Link>
                <span className="rounded-md bg-sunken px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-primary-strong shadow-neu-in">
                  Open Source
                </span>
                <Avatar name={user.name || user.email} src={user.avatar} size="sm" />
              </>
            ) : (
              <Link
                href="/masuk"
                className="inline-flex h-9 items-center rounded-lg bg-bg px-4 text-xs font-bold text-primary-strong shadow-neu-sm border border-line"
              >
                Masuk ke Studio
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="page-pad mx-auto w-full max-w-[900px] pt-10">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft text-primary-strong text-xs font-extrabold border border-primary/20 mb-3 shadow-neu-xs">
            <Icon name="sparkles" size={14} />
            Edisi Open Source · 100% Bebas & Gratis
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink md:text-4xl">
            VoiceMotion Studio Open Source
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Platform AI Video Kinetik mandiri tanpa biaya langganan, tanpa sistem kuota, dan tanpa PPN. Sepenuhnya dirancang untuk kreator perorangan dan komunitas pengembang open source.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push("/app/workspace")}
              leftIcon={<Icon name="sparkles" size={18} />}
            >
              Buka Studio Sekarang
            </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card variant="raised" padding="md" className="space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary-strong">
              <Icon name="folder" size={18} />
            </div>
            <h3 className="text-sm font-extrabold text-ink">Proyek Tanpa Batas</h3>
            <p className="text-xs leading-relaxed text-muted">
              Buat dan simpan ribuan draf video tanpa terhambat batas kuota paket. Database lokal SQLite dan Neon Serverless siap menampung seluruh ide kamu.
            </p>
          </Card>

          <Card variant="raised" padding="md" className="space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary-strong">
              <Icon name="volume" size={18} />
            </div>
            <h3 className="text-sm font-extrabold text-ink">Gemini AI Voice TTS</h3>
            <p className="text-xs leading-relaxed text-muted">
              Sintesis audio narasi natural bahasa Indonesia (Ibu Sari & Bapak Ardi) langsung melalui endpoint AI berkecepatan tinggi.
            </p>
          </Card>

          <Card variant="raised" padding="md" className="space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary-strong">
              <Icon name="wand" size={18} />
            </div>
            <h3 className="text-sm font-extrabold text-ink">Claude AI Generator</h3>
            <p className="text-xs leading-relaxed text-muted">
              Generator skrip dan animasi video kinetik presisi dengan kuesioner preferensi pra-pembuatan video.
            </p>
          </Card>
        </div>

        <div className="mt-8 rounded-xl border border-line bg-sunken p-5 text-center space-y-2">
          <p className="text-xs font-bold text-ink">
            Dikelola & Dihosting Mandiri (Self-Hosted Golang)
          </p>
          <p className="text-[11px] text-muted max-w-lg mx-auto">
            Semua proses data, penyimpanan audio, dan render skema ditangani penuh oleh server binary Golang berkecepatan tinggi tanpa dependensi komersial.
          </p>
        </div>
      </div>
    </main>
  );
}

