"use client";

import { useState } from "react";
import Link from "next/link";
import { Accordion } from "@/components/ui/Accordion";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Divider } from "@/components/ui/Divider";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { Modal } from "@/components/ui/Modal";
import { Progress } from "@/components/ui/Progress";
import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { id } from "@/lib/i18n/id";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted">{title}</h2>
      <Card variant="flat" padding="lg" className="space-y-4">
        {children}
      </Card>
    </section>
  );
}

export default function UiGalleryPage() {
  const { showToast } = useToast();
  const [segmentedValue, setSegmentedValue] = useState("energetic");
  const [activeTab, setActiveTab] = useState("idea");
  const [selectedChips, setSelectedChips] = useState<string[]>(["30 dtk"]);
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [contentType, setContentType] = useState("motivation");

  const durationOptions = ["30 dtk", "50 dtk", "1 mnt", "Custom"];

  return (
    <main className="page-pad mx-auto min-h-dvh w-full max-w-5xl pb-16 pt-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <Logo size="md" />
        <div className="flex items-center gap-2">
          <Link href="/masuk/" className="text-sm font-bold text-muted hover:text-ink">
            Kembali ke masuk
          </Link>
          <Avatar name="Eka Saputra" size="sm" />
        </div>
      </header>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">{id.uiGallery.title}</h1>
        <p className="mt-1 text-sm text-muted">{id.uiGallery.subtitle}</p>
      </div>

      <div className="space-y-8">
        <Section title={id.uiGallery.buttons}>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary">Kirim ke AI</Button>
            <Button variant="secondary">Salin prompt</Button>
            <Button variant="ghost">Nanti saja</Button>
            <Button variant="danger">Hapus</Button>
            <Button variant="primary" loading>
              Memproses
            </Button>
            <Button variant="secondary" disabled>
              Terkunci
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary">
              Kecil
            </Button>
            <Button size="md" variant="secondary">
              Sedang
            </Button>
            <Button size="lg" variant="secondary">
              Besar
            </Button>
            <Button variant="primary" leftIcon={<Icon name="sparkles" size={18} />}>
              Dengan ikon
            </Button>
            <Button variant="secondary" rightIcon={<Icon name="arrowRight" size={18} />}>
              Lanjut
            </Button>
          </div>
          <Button variant="primary" fullWidth rightIcon={<Icon name="send" size={18} />}>
            Tombol penuh
          </Button>
        </Section>

        <Section title={id.uiGallery.cards}>
          <div className="grid gap-3 md:grid-cols-3">
            <Card variant="raised">
              <p className="text-sm font-extrabold text-ink">Raised</p>
              <p className="mt-1 text-xs text-muted">Permukaan utama dengan bayangan lembut.</p>
            </Card>
            <Card variant="inset">
              <p className="text-sm font-extrabold text-ink">Inset</p>
              <p className="mt-1 text-xs text-muted">Area tenggelam untuk field dan track.</p>
            </Card>
            <Card variant="flat">
              <p className="text-sm font-extrabold text-ink">Flat</p>
              <p className="mt-1 text-xs text-muted">Garis tipis untuk daftar panjang.</p>
            </Card>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Card interactive>
              <p className="text-sm font-extrabold text-ink">Kartu interaktif</p>
              <p className="mt-1 text-xs text-muted">Klik untuk melihat pressed state.</p>
            </Card>
            <Card interactive selected>
              <p className="text-sm font-extrabold text-ink">Kartu terpilih</p>
              <p className="mt-1 text-xs text-muted">Garis kiri biru menandakan pilihan.</p>
            </Card>
          </div>
        </Section>

        <Section title={id.uiGallery.inputs}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Email" placeholder="nama@email.com" value={email} onChange={(event) => setEmail(event.target.value)} helper="Helper text muncul di bawah field." />
            <Input label="Password" type="password" placeholder="Masukkan password" value={password} onChange={(event) => setPassword(event.target.value)} />
            <Input label="Dengan error" placeholder="Isi field" error="Field ini wajib diisi." />
            <Select
              label="Jenis konten"
              value={contentType}
              onChange={(event) => setContentType(event.target.value)}
              options={[
                { value: "motivation", label: "Motivasi" },
                { value: "education", label: "Edukasi" },
                { value: "humor", label: "Humor" }
              ]}
            />
          </div>
          <Textarea
            label="Catatan"
            placeholder="Tulis catatan..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={200}
            showCount
            autoResize
            helper="Textarea ini tumbuh mengikuti isi."
          />
        </Section>

        <Section title={id.uiGallery.chips}>
          <div className="flex flex-wrap gap-2">
            {durationOptions.map((option) => (
              <Chip
                key={option}
                pressed={selectedChips.includes(option)}
                onClick={() =>
                  setSelectedChips((current) =>
                    current.includes(option) ? current.filter((item) => item !== option) : [...current, option]
                  )
                }
              >
                {option}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip pressed onClick={() => undefined}>
              9:16
            </Chip>
            <Chip dismissible onDismiss={() => undefined}>
              Dismissable
            </Chip>
          </div>
        </Section>

        <Section title={id.uiGallery.segmented}>
          <Segmented
            ariaLabel="Tempo"
            value={segmentedValue}
            onChange={setSegmentedValue}
            options={[
              { value: "energetic", label: "Energik" },
              { value: "calm", label: "Santai" }
            ]}
          />
          <Segmented
            ariaLabel="Ukuran video"
            value="9:16"
            onChange={() => undefined}
            options={[
              { value: "9:16", label: "9:16" },
              { value: "16:9", label: "16:9" },
              { value: "1:1", label: "1:1" },
              { value: "3:4", label: "3:4" }
            ]}
          />
        </Section>

        <Section title={id.uiGallery.tabs}>
          <Tabs
            ariaLabel="Tahap"
            value={activeTab}
            onChange={setActiveTab}
            items={[
              { id: "idea", label: "1. Ide", done: true },
              { id: "narration", label: "2. Narasi", done: true },
              { id: "voice", label: "3. Suara", badge: 8 },
              { id: "animation", label: "4. Animasi", disabled: true }
            ]}
          />
        </Section>

        <Section title={id.uiGallery.feedback}>
          <Progress value={68} label="Membuat suara" showValue />
          <Progress value={32} label="Menyiapkan scene" showValue height="sm" />
          <div className="grid gap-3 md:grid-cols-3">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => showToast("Pengaturan tersimpan.", "success")}>
              Toast sukses
            </Button>
            <Button variant="secondary" onClick={() => showToast("Koneksi gagal. Coba lagi.", "error")}>
              Toast error
            </Button>
            <Button variant="secondary" onClick={() => showToast("Trial tinggal 2 hari.", "warning")}>
              Toast warning
            </Button>
            <Button variant="secondary" onClick={() => showToast("Prompt sudah disalin.", "info")}>
              Toast info
            </Button>
          </div>
        </Section>

        <Section title={id.uiGallery.overlays}>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              {id.uiGallery.openModal}
            </Button>
            <Button variant="secondary" onClick={() => setSheetOpen(true)}>
              {id.uiGallery.openSheet}
            </Button>
          </div>
          <EmptyState
            title="Belum ada ide"
            description="Tulis topik di panel kiri, lalu klik Kirim ke AI. Ide-idenya muncul di sini."
            action={
              <Button variant="secondary" leftIcon={<Icon name="sparkles" size={18} />}>
                Minta ide
              </Button>
            }
          />
        </Section>

        <Section title={id.uiGallery.tooltip}>
          <div className="flex items-center gap-4">
            <Tooltip label="Prompt akan disalin ke clipboard.">
              <Button variant="secondary" leftIcon={<Icon name="copy" size={18} />}>
                Salin prompt
              </Button>
            </Tooltip>
            <Tooltip label="Hapus proyek ini secara permanen." side="bottom">
              <Button variant="danger" leftIcon={<Icon name="trash" size={18} />}>
                Hapus
              </Button>
            </Tooltip>
          </div>
        </Section>

        <Section title="Accordion, Divider, Avatar, Logo">
          <Accordion title="Pengaturan tambahan" description="Opsional. Bantu AI menulis lebih pas.">
            <Input label="Nada bahasa" placeholder="tegas tapi hangat" />
          </Accordion>
          <Divider label="atau" />
          <div className="flex items-center gap-3">
            <Avatar name="Eka Saputra" />
            <Avatar name="Sari" size="sm" />
            <Logo size="sm" />
            <Logo size="lg" showWordmark={false} />
          </div>
        </Section>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Contoh Modal"
        description="Modal memakai focus trap, Escape, dan overlay."
        footer={
          <div className="flex justify-end gap-2 pb-3">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Lanjut
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          Semua teks di modal ini memakai token warna dan tipografi yang sama dengan halaman lain.
        </p>
      </Modal>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Contoh Sheet"
        description="Bottom sheet di mobile, dialog di desktop."
        footer={
          <div className="flex justify-end gap-2 pb-3">
            <Button variant="secondary" onClick={() => setSheetOpen(false)}>
              Tutup
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input label="Nama proyek" placeholder="Proyek Baru" />
          <Textarea label="Catatan" placeholder="Tulis sesuatu..." />
        </div>
      </Sheet>
    </main>
  );
}
