"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { StyleSwatch } from "@/components/style/StyleSwatch";
import { LivelyIconViewer } from "@/components/ui/LivelyIconViewer";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/store/project";
import { useStyleStore } from "@/store/styles";
import {
  getCustomTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
  customTemplateToStylePack,
  type CustomTemplate
} from "@/lib/customTemplates";
import type { StylePack } from "@/types";

export interface StylePickerProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORY_LIST = [
  "Semua",
  "Ceria & Energik",
  "Rapi & Modern",
  "Tenang & Lembut",
  "Teknologi & Data",
  "Gambar Tangan",
  "Spesial",
  "Buatan Sendiri"
] as const;

export function StylePicker({ open, onClose }: StylePickerProps) {
  const { showToast } = useToast();
  const config = useProjectStore((state) => state.config);
  const updateConfig = useProjectStore((state) => state.updateConfig);
  const rawStyles = useStyleStore((state) => state.styles);
  const isLoading = useStyleStore((state) => state.isLoading);
  const error = useStyleStore((state) => state.error);
  const loadStyles = useStyleStore((state) => state.loadStyles);

  const [previewSlug, setPreviewSlug] = useState(config.styleSlug || "otomatis");
  const [category, setCategory] = useState<string>("Semua");
  const [search, setSearch] = useState("");
  const [isPlaying, setIsPlaying] = useState(true);
  const [uploadedVideos, setUploadedVideos] = useState<Record<string, string>>({});
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null);

  const [formName, setFormName] = useState("");
  const [formVibe, setFormVibe] = useState("Ceria & Modern");
  const [formDesc, setFormDesc] = useState("");
  const [formDirectives, setFormDirectives] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formTheme, setFormTheme] = useState<"paper" | "night" | "dusk">("paper");
  const [formPalette, setFormPalette] = useState<string[]>([
    "#FF6B00",
    "#7C3AED",
    "#2563EB",
    "#0F172A"
  ]);

  useEffect(() => {
    if (open) {
      setPreviewSlug(config.styleSlug || "otomatis");
      setCategory("Semua");
      setSearch("");
      setCustomTemplates(getCustomTemplates());
      void loadStyles();
    }
  }, [open, config.styleSlug, loadStyles]);

  const customStylePacks = useMemo(() => {
    return customTemplates.map(customTemplateToStylePack);
  }, [customTemplates]);

  const allAvailableStyles = useMemo(() => {
    return [...rawStyles, ...customStylePacks];
  }, [rawStyles, customStylePacks]);

  const filteredStyles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (category === "Buatan Sendiri") {
      return customStylePacks.filter((style) => {
        return (
          !query ||
          style.name.toLowerCase().includes(query) ||
          style.descriptionForPrompt.toLowerCase().includes(query)
        );
      });
    }

    return allAvailableStyles.filter((style) => {
      const matchesCategory =
        category === "Semua"
          ? style.category !== "Buatan Sendiri"
          : style.category === category;
      const matchesSearch =
        !query ||
        style.name.toLowerCase().includes(query) ||
        style.category.toLowerCase().includes(query) ||
        style.descriptionForPrompt.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [allAvailableStyles, customStylePacks, category, search]);

  const previewStyle = useMemo(() => {
    const found = allAvailableStyles.find((style) => style.slug === previewSlug);
    if (found) return found;
    return allAvailableStyles[0] || null;
  }, [allAvailableStyles, previewSlug]);

  const activeVideoUrl = useMemo(() => {
    if (!previewStyle) return null;
    if (uploadedVideos[previewStyle.slug]) {
      return uploadedVideos[previewStyle.slug];
    }
    const customMatch = customTemplates.find(
      (item) => `custom-${item.id}` === previewStyle.slug
    );
    if (customMatch && customMatch.videoUrl) {
      return customMatch.videoUrl;
    }
    return null;
  }, [previewStyle, uploadedVideos, customTemplates]);

  function applyStyle() {
    if (previewStyle) {
      updateConfig({ styleSlug: previewStyle.slug });
      showToast(`Gaya ${previewStyle.name} berhasil diterapkan`, "success");
    }
    onClose();
  }

  function handleVideoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !previewStyle) return;
    const url = URL.createObjectURL(file);
    setUploadedVideos((prev) => ({ ...prev, [previewStyle.slug]: url }));
    showToast(`Video referensi untuk ${previewStyle.name} berhasil dimuat`, "success");
  }

  function openCreateCustomTemplate() {
    setEditingTemplate(null);
    setFormName("");
    setFormVibe("Ceria & Modern");
    setFormDesc("");
    setFormDirectives("");
    setFormVideoUrl("");
    setFormTheme("paper");
    setFormPalette(["#FF6B00", "#7C3AED", "#2563EB", "#0F172A"]);
    setCustomModalOpen(true);
  }

  function openEditCustomTemplate(item: CustomTemplate) {
    setEditingTemplate(item);
    setFormName(item.name);
    setFormVibe(item.vibe);
    setFormDesc(item.descriptionForPrompt);
    setFormDirectives(item.promptDirectives);
    setFormVideoUrl(item.videoUrl || "");
    setFormTheme(item.theme);
    setFormPalette(item.palette);
    setCustomModalOpen(true);
  }

  function handleSaveCustomTemplate() {
    if (!formName.trim()) {
      showToast("Nama template wajib diisi", "warning");
      return;
    }

    const template: CustomTemplate = {
      id: editingTemplate ? editingTemplate.id : Date.now().toString(),
      name: formName.trim(),
      category: "Buatan Sendiri",
      vibe: formVibe.trim() || "Ceria & Modern",
      descriptionForPrompt:
        formDesc.trim() || `Gaya kustom ${formName.trim()} dengan nuansa ${formVibe.trim()}`,
      promptDirectives: formDirectives.trim(),
      videoUrl: formVideoUrl.trim() || undefined,
      palette: formPalette,
      theme: formTheme,
      createdAt: editingTemplate ? editingTemplate.createdAt : Date.now()
    };

    saveCustomTemplate(template);
    const updated = getCustomTemplates();
    setCustomTemplates(updated);
    setPreviewSlug(`custom-${template.id}`);
    setCustomModalOpen(false);
    showToast(`Template "${template.name}" berhasil disimpan`, "success");
  }

  function handleDeleteCustomTemplate(id: string, name: string) {
    deleteCustomTemplate(id);
    const updated = getCustomTemplates();
    setCustomTemplates(updated);
    if (previewSlug === `custom-${id}`) {
      setPreviewSlug("otomatis");
    }
    showToast(`Template "${name}" dihapus`, "success");
  }

  const isOtomatis = previewStyle?.slug === "otomatis";

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        size="full"
        title="Pilih gaya video"
        description={`${rawStyles.length} gaya · Klik untuk melihat demonya`}
        className="max-w-6xl p-0 overflow-hidden rounded-2xl border border-line bg-raised shadow-neu-lg"
        footer={
          <div className="flex flex-col-reverse gap-3 pb-1 sm:flex-row sm:items-center sm:justify-between w-full">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Icon name="check" size={12} />
              </span>
              <p className="truncate text-xs font-semibold text-muted">
                Dilihat: <strong className="text-ink font-bold">{previewStyle?.name ?? "-"}</strong>
                {previewStyle?.category ? (
                  <span className="ml-1.5 rounded bg-sunken px-1.5 py-0.5 text-[10px] font-bold border border-line">
                    {previewStyle.category}
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="secondary" size="sm" onClick={onClose} className="h-8 px-3 text-xs">
                Batal
              </Button>
              <button
                type="button"
                onClick={applyStyle}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-[#FF6B00] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#E56000] active:scale-95"
              >
                <Icon name="check" size={14} />
                <span>Pakai gaya ini</span>
              </button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] divide-y lg:divide-y-0 lg:divide-x divide-line min-h-[560px]">
          <div className="p-4 sm:p-5 flex flex-col items-center justify-between bg-sunken/40">
            <div className="relative w-full max-w-[270px] aspect-[9/16] rounded-[2.2rem] p-2 bg-[#101319] shadow-2xl border-4 border-[#272B36] flex flex-col justify-between overflow-hidden">
              <div className="mx-auto w-24 h-4 bg-[#1E2330] rounded-full mb-1 flex items-center justify-center shrink-0 z-20">
                <div className="w-2.5 h-2.5 rounded-full bg-[#101319] mr-2" />
                <div className="w-8 h-1 rounded-full bg-[#2A3040]" />
              </div>

              <div
                className={cn(
                  "relative flex-1 rounded-[1.6rem] overflow-hidden flex flex-col justify-between p-3.5 transition-all duration-300",
                  isOtomatis
                    ? "bg-gradient-to-br from-[#FF6B00] via-[#7C3AED] to-[#2563EB]"
                    : previewStyle?.theme === "night"
                    ? "bg-gradient-to-b from-[#0F172A] to-[#1E293B]"
                    : previewStyle?.theme === "dusk"
                    ? "bg-gradient-to-b from-[#2A4365] to-[#7B341E]"
                    : "bg-gradient-to-b from-[#F8FAFC] to-[#E2E8F0]"
                )}
                style={
                  !isOtomatis && previewStyle?.palette && previewStyle.palette.length >= 2
                    ? {
                        background: `linear-gradient(135deg, ${previewStyle.palette[0]} 0%, ${
                          previewStyle.palette[1] || previewStyle.palette[0]
                        } 100%)`
                      }
                    : undefined
                }
              >
                <div className="flex items-center justify-between z-10">
                  <span className="rounded-md bg-black/40 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white tracking-wider border border-white/10">
                    9:16 HD
                  </span>
                  <span className="rounded-md bg-black/40 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold text-white/90 border border-white/10 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    <span>60 FPS</span>
                  </span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none overflow-hidden">
                  {activeVideoUrl && isPlaying ? (
                    <video
                      src={activeVideoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 text-center px-4">
                      <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-lg text-white">
                        <LivelyIconViewer
                          name={
                            isOtomatis
                              ? "Sparkles"
                              : previewStyle?.category === "Teknologi & Data"
                              ? "Cpu"
                              : previewStyle?.category === "Ceria & Energik"
                              ? "Flame"
                              : previewStyle?.category === "Tenang & Lembut"
                              ? "Sun"
                              : previewStyle?.category === "Gambar Tangan"
                              ? "Star"
                              : "Play"
                          }
                          lively={
                            isOtomatis
                              ? "pulse"
                              : previewStyle?.category === "Ceria & Energik"
                              ? "bounce"
                              : "float"
                          }
                          size={48}
                          color="#FFFFFF"
                        />
                      </div>
                      <span className="rounded-full bg-black/30 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-white/95 border border-white/15">
                        {previewStyle?.category || "Visual Motion"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="z-10 bg-black/60 backdrop-blur-md rounded-xl p-2.5 border border-white/15 text-white shadow-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold text-xs tracking-tight truncate">
                      {previewStyle?.name || "Otomatis"}
                    </p>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/70">
                      {previewStyle?.theme || "auto"}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/80 line-clamp-2 leading-tight">
                    {previewStyle?.descriptionForPrompt ||
                      "Claude memilih gaya yang paling cocok dengan ide videomu saat menulis narasi."}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between px-1 z-20 text-[10px] text-muted">
                <button
                  type="button"
                  onClick={() => setIsPlaying((prev) => !prev)}
                  className="flex items-center gap-1 hover:text-ink transition"
                  title={isPlaying ? "Jeda" : "Putar"}
                >
                  <Icon name={isPlaying ? "pause" : "play"} size={13} />
                  <span>{isPlaying ? "Live" : "Pause"}</span>
                </button>
                <label className="flex items-center gap-1 cursor-pointer hover:text-primary transition">
                  <Icon name="upload" size={12} />
                  <span>Slot Video</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 flex flex-col gap-3.5 flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1 sm:max-w-xs">
                <Icon
                  name="search"
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="search"
                  placeholder="Cari gaya..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="neu-field pl-8.5 h-8.5 text-xs w-full"
                />
              </div>
              <div className="text-[11px] font-bold text-muted self-end sm:self-center">
                Total {filteredStyles.length} gaya
              </div>
            </div>

            <div className="neu-scroll-x flex items-center gap-1.5 pb-1 overflow-x-auto">
              {CATEGORY_LIST.map((item) => {
                const count =
                  item === "Semua"
                    ? allAvailableStyles.filter((s) => s.category !== "Buatan Sendiri").length
                    : item === "Buatan Sendiri"
                    ? customTemplates.length
                    : allAvailableStyles.filter((s) => s.category === item).length;

                const active = category === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={cn(
                      "shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition border",
                      active
                        ? "bg-primary-soft text-primary-strong border-primary/40 shadow-neu-xs"
                        : "bg-bg text-muted border-line/70 hover:border-line hover:text-ink"
                    )}
                  >
                    <span>{item}</span>
                    <span className="text-[10px] opacity-75 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>

            <div className="neu-scrollbar flex-1 overflow-y-auto pr-1 max-h-[460px]">
              {isLoading && allAvailableStyles.length === 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-xl" />
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-xs font-semibold text-danger">
                  <p>{error}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() => void loadStyles()}
                  >
                    Coba Lagi
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
                  {category === "Buatan Sendiri" && (
                    <button
                      type="button"
                      onClick={openCreateCustomTemplate}
                      className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 bg-primary-soft/10 p-3 text-center transition hover:border-primary hover:bg-primary-soft/20 min-h-[110px]"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-xs group-hover:scale-105 transition">
                        <Icon name="plus" size={16} />
                      </div>
                      <span className="text-xs font-extrabold text-primary-strong">
                        + Buat Template Baru
                      </span>
                      <span className="text-[10px] text-muted leading-tight">
                        Visual & prompt kustom
                      </span>
                    </button>
                  )}

                  {filteredStyles.map((style) => {
                    const isSelected = previewStyle?.slug === style.slug;
                    const isCustom = style.category === "Buatan Sendiri";
                    const customItem = isCustom
                      ? customTemplates.find((t) => `custom-${t.id}` === style.slug)
                      : null;

                    return (
                      <div
                        key={style.slug}
                        className={cn(
                          "group relative flex flex-col justify-between rounded-xl border p-2 text-center transition-all cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary-soft/30 shadow-neu-xs ring-2 ring-primary/40"
                            : "border-line bg-bg hover:border-primary/40 hover:bg-bg-raised shadow-neu-xs"
                        )}
                        onClick={() => setPreviewSlug(style.slug)}
                      >
                        <div className="w-full">
                          <StyleSwatch
                            style={style}
                            className="aspect-[16/10] w-full rounded-lg overflow-hidden shadow-neu-in mb-1.5"
                          />
                          <p className="truncate text-[11px] font-extrabold text-ink w-full">
                            {style.name}
                          </p>
                          <span className="rounded bg-sunken px-1.5 py-0.2 text-[9px] font-bold text-muted border border-line">
                            {style.category}
                          </span>
                        </div>

                        {isCustom && customItem ? (
                          <div
                            className="flex items-center justify-center gap-1.5 mt-2 pt-1 border-t border-line/60"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => openEditCustomTemplate(customItem)}
                              className="flex h-5 w-5 items-center justify-center rounded text-muted hover:text-ink"
                              title="Edit Template"
                            >
                              <Icon name="edit" size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteCustomTemplate(customItem.id, customItem.name)
                              }
                              className="flex h-5 w-5 items-center justify-center rounded text-muted hover:text-danger"
                              title="Hapus Template"
                            >
                              <Icon name="trash" size={11} />
                            </button>
                          </div>
                        ) : null}

                        {isSelected ? (
                          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white shadow-xs">
                            <Icon name="check" size={10} />
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Sub-modal: Buat / Edit Custom Template */}
      <Modal
        open={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        title={editingTemplate ? "Edit Template Kustom" : "Buat Template Video Baru"}
        description="Atur visual, warna, deskripsi prompt Claude, dan referensi video kustom."
        className="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-2 pb-2 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCustomModalOpen(false)}
              className="h-8 px-3 text-xs"
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveCustomTemplate}
              className="h-8 px-3.5 text-xs"
            >
              Simpan Template
            </Button>
          </div>
        }
      >
        <div className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-ink mb-1">Nama Template</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Contoh: Podcast Edukatif Keren"
              className="neu-field h-8.5 w-full text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-ink mb-1">Nuansa / Vibe</label>
              <input
                type="text"
                value={formVibe}
                onChange={(e) => setFormVibe(e.target.value)}
                placeholder="Ceria, Elegan, Tech..."
                className="neu-field h-8.5 w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-ink mb-1">Tema Latar</label>
              <select
                value={formTheme}
                onChange={(e) => setFormTheme(e.target.value as "paper" | "night" | "dusk")}
                className="neu-field h-8.5 w-full text-xs"
              >
                <option value="paper">Terang (Paper)</option>
                <option value="night">Gelap (Night)</option>
                <option value="dusk">Senja (Dusk)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink mb-1">
              Slot Video URL / Referensi
            </label>
            <input
              type="url"
              value={formVideoUrl}
              onChange={(e) => setFormVideoUrl(e.target.value)}
              placeholder="https://... atau biarkan kosong"
              className="neu-field h-8.5 w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink mb-1">
              Deskripsi Visual Kustom
            </label>
            <textarea
              rows={2}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Deskripsi singkat estetika gaya yang akan dibaca pengguna..."
              className="neu-field w-full p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink mb-1">
              Instruksi Prompting Claude AI
            </label>
            <textarea
              rows={3}
              value={formDirectives}
              onChange={(e) => setFormDirectives(e.target.value)}
              placeholder="Instruksi spesifik untuk Claude saat membuat visual/scene (contoh: gunakan bentuk organik, warna pastel hangat, tanpa garis kaku)..."
              className="neu-field w-full p-2 text-xs font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink mb-1.5">
              Palet 4 Warna Kustom
            </label>
            <div className="grid grid-cols-4 gap-2">
              {formPalette.map((color, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                      const updated = [...formPalette];
                      updated[index] = e.target.value;
                      setFormPalette(updated);
                    }}
                    className="h-7 w-7 rounded cursor-pointer border border-line"
                  />
                  <span className="text-[10px] font-mono text-muted uppercase">
                    {color.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
