"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { StyleSwatch } from "@/components/style/StyleSwatch";
import { useToast } from "@/components/ui/Toast";
import { copyText, cn } from "@/lib/utils";
import { useProjectStore } from "@/store/project";
import { useStyleStore } from "@/store/styles";
import type { StylePack } from "@/types";

export interface StylePickerProps {
  open: boolean;
  onClose: () => void;
}

export function StylePicker({ open, onClose }: StylePickerProps) {
  const { showToast } = useToast();
  const config = useProjectStore((state) => state.config);
  const updateConfig = useProjectStore((state) => state.updateConfig);
  const styles = useStyleStore((state) => state.styles);
  const isLoading = useStyleStore((state) => state.isLoading);
  const error = useStyleStore((state) => state.error);
  const loadStyles = useStyleStore((state) => state.loadStyles);

  const [previewSlug, setPreviewSlug] = useState(config.styleSlug);
  const [category, setCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [previewRatio, setPreviewRatio] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [isPlaying, setIsPlaying] = useState(true);
  const [uploadedVideos, setUploadedVideos] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setPreviewSlug(config.styleSlug);
      setCategory("Semua");
      setSearch("");
      void loadStyles();
    }
  }, [open, config.styleSlug, loadStyles]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(styles.map((style) => style.category)));
    return ["Semua", ...uniqueCategories];
  }, [styles]);

  const filteredStyles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return styles.filter((style) => {
      const matchesCategory = category === "Semua" || style.category === category;
      const matchesSearch =
        !query ||
        style.name.toLowerCase().includes(query) ||
        style.category.toLowerCase().includes(query) ||
        style.descriptionForPrompt.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [styles, category, search]);

  const previewStyle = styles.find((style) => style.slug === previewSlug) ?? styles[0] ?? null;

  function applyStyle() {
    if (previewStyle) {
      updateConfig({ styleSlug: previewStyle.slug });
      showToast(`Gaya ${previewStyle.name} berhasil diterapkan`, "success");
    }
    onClose();
  }

  async function handleCopyPrompt() {
    if (!previewStyle) return;
    const promptSnippet = `[STYLE INSTRUCTION: ${previewStyle.name.toUpperCase()}]
Visual Aesthetics: ${previewStyle.descriptionForPrompt}
Theme Palette: ${previewStyle.palette.join(", ")}
Transitions: ${previewStyle.transitions.join(", ")}
Finishing: ${previewStyle.finishing}`;
    const ok = await copyText(promptSnippet);
    showToast(ok ? "Prompting gaya berhasil disalin!" : "Gagal menyalin", ok ? "success" : "warning");
  }

  function handleVideoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !previewStyle) return;
    const url = URL.createObjectURL(file);
    setUploadedVideos((prev) => ({ ...prev, [previewStyle.slug]: url }));
    showToast(`Contoh video untuk ${previewStyle.name} berhasil dimuat!`, "success");
  }

  const customVideoUrl = previewStyle ? uploadedVideos[previewStyle.slug] : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="full"
      title="Katalog Gaya Video Kinetik (Open Source)"
      description="Pilih gaya visual, lihat pratinjau animasi, panduan prompting Claude & Gemini, dan unggah referensi video."
      className="max-w-6xl p-0"
      footer={
        <div className="flex flex-col-reverse gap-2.5 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/20 text-success">
              <Icon name="check" size={12} />
            </span>
            <span>
              Gaya Terpilih: <strong className="text-ink">{previewStyle?.name ?? "-"}</strong> ({previewStyle?.category})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={applyStyle} leftIcon={<Icon name="check" size={15} />}>
              Terapkan Gaya Ini
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] divide-y lg:divide-y-0 lg:divide-x divide-line min-h-[540px]">
        {/* Kolom Kiri: Galeri Katalog Gaya */}
        <div className="p-4 sm:p-5 space-y-3.5 flex flex-col">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <Input
              type="search"
              placeholder="Cari gaya (nama, kata kunci, warna)..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Cari gaya"
              containerClassName="sm:max-w-xs"
            />
            <div className="text-[11px] font-bold text-muted self-end sm:self-center">
              Total {filteredStyles.length} Gaya Tersedia
            </div>
          </div>

          {/* Kategori Filter Chips */}
          <div className="neu-scroll-x flex items-center gap-1.5 pb-1">
            {categories.map((item) => {
              const count = item === "Semua" ? styles.length : styles.filter((s) => s.category === item).length;
              return (
                <Chip key={item} pressed={category === item} onClick={() => setCategory(item)}>
                  <span>{item}</span>
                  <span className="text-[9px] opacity-75 font-mono">({count})</span>
                </Chip>
              );
            })}
          </div>

          {/* Grid Gaya */}
          <div className="neu-scrollbar flex-1 overflow-y-auto pr-1 max-h-[460px]">
            {isLoading && styles.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-xs font-semibold text-danger">
                <p>{error}</p>
                <Button variant="secondary" size="sm" className="mt-2" onClick={() => void loadStyles()}>
                  Coba Lagi
                </Button>
              </div>
            ) : filteredStyles.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line p-8 text-center text-xs text-muted">
                Tidak ada gaya yang cocok dengan pencarian "{search}".
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredStyles.map((style) => {
                  const isSelected = previewStyle?.slug === style.slug;
                  return (
                    <button
                      key={style.slug}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setPreviewSlug(style.slug)}
                      className={cn(
                        "group relative flex flex-col gap-2 rounded-xl border p-2 text-left transition-all",
                        isSelected
                          ? "border-primary bg-primary-soft/40 shadow-neu-xs ring-2 ring-primary/40"
                          : "border-line bg-bg hover:border-primary/40 hover:bg-bg-raised shadow-neu-xs"
                      )}
                    >
                      <StyleSwatch style={style} className="aspect-[16/10] w-full rounded-lg overflow-hidden shadow-neu-in" />
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-xs font-extrabold text-ink">{style.name}</p>
                          <span className="rounded bg-sunken px-1.5 py-0.5 text-[9px] font-bold text-muted border border-line">
                            {style.category}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[10px] leading-tight text-muted">
                          {style.descriptionForPrompt}
                        </p>
                      </div>

                      {isSelected ? (
                        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-xs">
                          <Icon name="check" size={11} />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Pratinjau Video, Prompting & Slot Upload Video */}
        <div className="p-4 sm:p-5 bg-sunken/40 flex flex-col gap-4 overflow-y-auto max-h-[580px] neu-scrollbar">
          {previewStyle ? (
            <>
              {/* Header Info Gaya Terpilih */}
              <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-ink">{previewStyle.name}</h3>
                    <span className="rounded-md bg-primary-soft text-primary-strong px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                      {previewStyle.category}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    {previewStyle.descriptionForPrompt}
                  </p>
                </div>
              </div>

              {/* Area Pratinjau Video / Simulasi Canvas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <Icon name="video" size={13} />
                    <span>Pratinjau Animasi & Video:</span>
                  </label>
                  <div className="flex items-center gap-1">
                    {(["9:16", "16:9", "1:1"] as const).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setPreviewRatio(ratio)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border transition-all",
                          previewRatio === ratio
                            ? "bg-primary text-white border-primary"
                            : "bg-bg text-muted border-line hover:text-ink"
                        )}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className={cn(
                    "relative mx-auto overflow-hidden rounded-xl border border-line shadow-neu-in flex items-center justify-center transition-all bg-bg",
                    previewRatio === "9:16" ? "w-[170px] h-[300px]" : previewRatio === "16:9" ? "w-full max-w-[340px] h-[190px]" : "w-[220px] h-[220px]"
                  )}
                  style={{
                    background: customVideoUrl
                      ? "#000"
                      : `linear-gradient(150deg, ${previewStyle.palette[0]} 0%, ${previewStyle.palette[3] ?? previewStyle.palette[1]} 100%)`
                  }}
                >
                  {customVideoUrl ? (
                    <video
                      src={customVideoUrl}
                      controls
                      autoPlay
                      loop
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full flex flex-col items-center justify-between p-4">
                      {/* Floating Decorative Shapes */}
                      <div
                        className={cn(
                          "h-12 w-12 rounded-full opacity-80",
                          isPlaying && "animate-[neu-float_3.5s_ease-in-out_infinite]"
                        )}
                        style={{ backgroundColor: previewStyle.palette[1] }}
                      />
                      <div
                        className={cn(
                          "h-8 w-8 rounded-lg rotate-12 opacity-85",
                          isPlaying && "animate-[neu-orbit_4.5s_ease-in-out_infinite]"
                        )}
                        style={{ backgroundColor: previewStyle.palette[2] ?? previewStyle.palette[1] }}
                      />

                      {/* Mock Text Subtitle */}
                      <div className="w-full rounded-lg bg-bg/90 p-2.5 backdrop-blur text-center border border-line/60 shadow-neu-xs">
                        <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted">
                          {previewStyle.name} Video Preview
                        </p>
                        <p className="mt-0.5 text-xs font-black text-ink">
                          Ide Kinetik Menjadi Nyata
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Play/Pause Simulator Toggle */}
                  {!customVideoUrl && (
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-bg/85 text-ink shadow-sm backdrop-blur hover:bg-bg"
                      title={isPlaying ? "Jeda Simulasi" : "Jalankan Simulasi"}
                    >
                      <Icon name={isPlaying ? "pause" : "play"} size={12} />
                    </button>
                  )}
                </div>

                {/* Slot Unggah Contoh Video */}
                <div className="rounded-lg border border-line bg-bg p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-ink">Unggah Sampel Video (.mp4 / .webm)</p>
                    <p className="text-[10px] text-muted">Tambahkan video referensi gaya kamu sendiri.</p>
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sunken border border-line text-xs font-bold text-ink hover:border-primary/50 shrink-0">
                    <Icon name="upload" size={13} />
                    <span>Upload Video</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Detail Palet Warna & Finishing */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-line bg-bg p-2.5 space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted block">
                    Palet Warna
                  </span>
                  <div className="flex items-center gap-1.5">
                    {previewStyle.palette.map((color, i) => (
                      <span
                        key={i}
                        className="h-5 w-5 rounded-md border border-line/70 shadow-xs"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-line bg-bg p-2.5 space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted block">
                    Tema & Finishing
                  </span>
                  <p className="text-[11px] font-bold text-ink capitalize">
                    {previewStyle.theme} · {previewStyle.finishing}
                  </p>
                </div>
              </div>

              {/* Panduan Prompting AI */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted flex items-center gap-1">
                    <Icon name="sparkles" size={12} />
                    <span>Prompting Guide (Claude & Gemini):</span>
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleCopyPrompt()}
                    leftIcon={<Icon name="copy" size={12} />}
                    className="h-6 text-[10px] px-2"
                  >
                    Salin Prompt Gaya
                  </Button>
                </div>
                <div className="rounded-lg border border-line bg-bg p-2.5 text-[11px] font-mono leading-relaxed text-ink/90 select-all max-h-24 overflow-y-auto neu-scrollbar">
                  Gaya visual: {previewStyle.descriptionForPrompt}. Warna utama: {previewStyle.palette.join(", ")}. Transisi: {previewStyle.transitions.join(", ")}.
                </div>
              </div>

              {/* Contoh Kode Animasi Canvas */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted block">
                  Contoh Snippet Kode Canvas:
                </label>
                <pre className="rounded-lg border border-line bg-sunken p-2.5 text-[10px] font-mono text-ink/80 overflow-x-auto whitespace-pre-wrap leading-tight">
                  {previewStyle.sampleCode}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted">
              Pilih gaya untuk melihat detail dan pratinjau.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}