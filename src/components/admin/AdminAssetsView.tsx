"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { sceneAssets, type AssetCategory, type SceneAsset } from "@/lib/engine/assets";
import { messageFromError } from "@/lib/errors";
import { copyText, fileSize, formatNumber, formatRelativeTime } from "@/lib/utils";
import type { AdminAssetItem, StylePack } from "@/types";

type AssetSubTab = "audio" | "svg" | "styles";

interface AdminAssetsViewProps {
  onRefreshStats?: () => void;
}

export function AdminAssetsView({ onRefreshStats }: AdminAssetsViewProps) {
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState<AssetSubTab>("audio");

  // Audio state
  const [audioAssets, setAudioAssets] = useState<AdminAssetItem[]>([]);
  const [audioLoading, setAudioLoading] = useState(true);
  const [audioSearch, setAudioSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "referenced" | "orphan">("all");
  const [deleteTarget, setDeleteTarget] = useState<AdminAssetItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);

  // SVG State
  const [svgCategory, setSvgCategory] = useState<"all" | AssetCategory>("all");
  const [svgSearch, setSvgSearch] = useState("");

  // Styles State
  const [styles, setStyles] = useState<StylePack[]>([]);
  const [stylesLoading, setStylesLoading] = useState(false);

  const loadAudio = useCallback(async () => {
    setAudioLoading(true);
    try {
      const data = await api.adminListAssets();
      setAudioAssets(data);
    } catch (err) {
      showToast(messageFromError(err), "error");
    } finally {
      setAudioLoading(false);
    }
  }, [showToast]);

  const loadStyles = useCallback(async () => {
    setStylesLoading(true);
    try {
      const data = await api.listStyles();
      setStyles(data);
    } catch (err) {
      showToast(messageFromError(err), "error");
    } finally {
      setStylesLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadAudio();
  }, [loadAudio]);

  useEffect(() => {
    if (subTab === "styles" && styles.length === 0) {
      void loadStyles();
    }
  }, [subTab, styles.length, loadStyles]);

  const handleDeleteAudio = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.adminDeleteAsset(deleteTarget.filename);
      setAudioAssets((prev) => prev.filter((a) => a.filename !== deleteTarget.filename));
      showToast(`File ${deleteTarget.filename.slice(0, 12)}... berhasil dihapus`, "success");
      setDeleteTarget(null);
      onRefreshStats?.();
    } catch (err) {
      showToast(messageFromError(err), "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleCleanupOrphans = async () => {
    setCleaningUp(true);
    try {
      const res = await api.adminCleanupAssets();
      showToast(
        `Berhasil membersihkan ${res.deletedCount} file yatim (${fileSize(res.freedBytes)} dibebaskan)`,
        "success"
      );
      setCleanupOpen(false);
      void loadAudio();
      onRefreshStats?.();
    } catch (err) {
      showToast(messageFromError(err), "error");
    } finally {
      setCleaningUp(false);
    }
  };

  const handleCopyAssetId = async (asset: SceneAsset) => {
    const code = `s.asset("${asset.id}", 0, 0, { size: 40 })`;
    await copyText(code);
    showToast(`Kode aset "${asset.id}" disalin ke clipboard!`, "success");
  };

  // Filtered Audio
  const filteredAudio = audioAssets.filter((item) => {
    const matchesSearch = !audioSearch.trim() || item.filename.toLowerCase().includes(audioSearch.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "referenced" && item.isReferenced) ||
      (statusFilter === "orphan" && !item.isReferenced);
    return matchesSearch && matchesStatus;
  });

  const totalAudioBytes = audioAssets.reduce((sum, item) => sum + item.sizeBytes, 0);
  const orphanCount = audioAssets.filter((item) => !item.isReferenced).length;
  const orphanBytes = audioAssets
    .filter((item) => !item.isReferenced)
    .reduce((sum, item) => sum + item.sizeBytes, 0);

  // Filtered SVGs
  const filteredSvgs = sceneAssets.filter((asset) => {
    const matchesCat = svgCategory === "all" || asset.category === svgCategory;
    const matchesQuery =
      !svgSearch.trim() ||
      asset.label.toLowerCase().includes(svgSearch.toLowerCase()) ||
      asset.id.toLowerCase().includes(svgSearch.toLowerCase()) ||
      asset.description.toLowerCase().includes(svgSearch.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-4">
      {/* Segmented Sub Tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line/70 bg-bg p-1.5 shadow-neu-sm">
        <button
          type="button"
          onClick={() => setSubTab("audio")}
          className={`flex h-9 items-center gap-2 rounded-lg px-3.5 text-xs font-bold transition ${
            subTab === "audio"
              ? "bg-primary-soft text-primary-strong shadow-neu-in"
              : "text-muted hover:text-ink"
          }`}
        >
          <Icon name="volume" size={15} />
          <span>Audio TTS Storage</span>
          <span className="rounded-md bg-bg-sunken px-1.5 py-0.5 text-[10px]">
            {audioAssets.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("svg")}
          className={`flex h-9 items-center gap-2 rounded-lg px-3.5 text-xs font-bold transition ${
            subTab === "svg"
              ? "bg-primary-soft text-primary-strong shadow-neu-in"
              : "text-muted hover:text-ink"
          }`}
        >
          <Icon name="image" size={15} />
          <span>Scene SVG Assets</span>
          <span className="rounded-md bg-bg-sunken px-1.5 py-0.5 text-[10px]">
            {sceneAssets.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("styles")}
          className={`flex h-9 items-center gap-2 rounded-lg px-3.5 text-xs font-bold transition ${
            subTab === "styles"
              ? "bg-primary-soft text-primary-strong shadow-neu-in"
              : "text-muted hover:text-ink"
          }`}
        >
          <Icon name="palette" size={15} />
          <span>Style Packs</span>
          {styles.length > 0 && (
            <span className="rounded-md bg-bg-sunken px-1.5 py-0.5 text-[10px]">
              {styles.length}
            </span>
          )}
        </button>
      </div>

      {/* SUB-TAB 1: AUDIO TTS STORAGE */}
      {subTab === "audio" && (
        <div className="space-y-4">
          {/* Summary & Cleanup Bar */}
          <Card variant="raised" padding="md" className="flex flex-wrap items-center justify-between gap-4 shadow-neu-sm">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
                Statistik TTS Audio Storage
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-3">
                <span className="text-2xl font-extrabold text-ink">{audioAssets.length} File</span>
                <span className="text-xs font-semibold text-muted">Total: {fileSize(totalAudioBytes)}</span>
                {orphanCount > 0 ? (
                  <span className="rounded-md bg-danger/10 px-2 py-0.5 text-xs font-bold text-danger">
                    {orphanCount} Yatim ({fileSize(orphanBytes)})
                  </span>
                ) : (
                  <span className="rounded-md bg-success/10 px-2 py-0.5 text-xs font-bold text-success">
                    Semua Terpakai
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void loadAudio()}
                leftIcon={<Icon name="refresh" size={14} className={audioLoading ? "animate-spin" : ""} />}
              >
                Segarkan
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setCleanupOpen(true)}
                disabled={orphanCount === 0 || audioLoading}
                leftIcon={<Icon name="trash" size={14} />}
              >
                Bersihkan Audio Yatim ({orphanCount})
              </Button>
            </div>
          </Card>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Icon
                name="search"
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={audioSearch}
                onChange={(e) => setAudioSearch(e.target.value)}
                placeholder="Cari hash filename..."
                aria-label="Cari file audio"
                className="neu-field pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-line/70 bg-bg p-1 shadow-neu-sm text-xs font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`rounded-md px-2.5 py-1 ${
                  statusFilter === "all" ? "bg-primary-soft text-primary-strong" : "text-muted hover:text-ink"
                }`}
              >
                Semua ({audioAssets.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("referenced")}
                className={`rounded-md px-2.5 py-1 ${
                  statusFilter === "referenced" ? "bg-primary-soft text-primary-strong" : "text-muted hover:text-ink"
                }`}
              >
                Terpakai ({audioAssets.filter((a) => a.isReferenced).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("orphan")}
                className={`rounded-md px-2.5 py-1 ${
                  statusFilter === "orphan" ? "bg-primary-soft text-primary-strong" : "text-muted hover:text-ink"
                }`}
              >
                Yatim ({orphanCount})
              </button>
            </div>
          </div>

          {/* Audio List Table */}
          {audioLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : filteredAudio.length === 0 ? (
            <EmptyState
              icon="volume"
              title={audioSearch.trim() ? "File audio tidak ditemukan" : "Belum ada file audio tersimpan"}
              action={
                <Button variant="secondary" onClick={() => void loadAudio()}>
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
                      <th className="px-4 py-3">Nama File (Hash)</th>
                      <th className="px-4 py-3">Ukuran</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Waktu Diperbarui</th>
                      <th className="px-4 py-3">Putar Audio</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {filteredAudio.map((item) => (
                      <tr key={item.filename} className="hover:bg-bg-sunken/40 transition">
                        <td className="px-4 py-3 font-mono font-medium text-ink">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[180px] sm:max-w-[260px]">
                              {item.filename}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                void copyText(item.filename);
                                showToast("Nama file disalin", "success");
                              }}
                              className="text-muted hover:text-primary-strong"
                              title="Salin Nama File"
                            >
                              <Icon name="copy" size={13} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">{fileSize(item.sizeBytes)}</td>
                        <td className="px-4 py-3">
                          {item.isReferenced ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                              <span className="h-1.5 w-1.5 rounded-full bg-success" />
                              Terpakai
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              Yatim
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted">{formatRelativeTime(item.updatedAt)}</td>
                        <td className="px-4 py-3">
                          <audio
                            controls
                            preload="none"
                            src={item.url}
                            className="h-7 w-44 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(item)}
                            className="h-8 w-8 p-0 text-danger hover:bg-danger/10"
                            title="Hapus File Audio"
                          >
                            <Icon name="trash" size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: SCENE SVG ASSETS */}
      {subTab === "svg" && (
        <div className="space-y-4">
          {/* Category Filter & Search */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {(["all", "aksen", "bentuk", "garis", "simbol"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSvgCategory(cat)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition capitalize ${
                    svgCategory === cat
                      ? "bg-primary-soft text-primary-strong shadow-neu-in"
                      : "border border-line/70 bg-bg text-muted hover:text-ink shadow-neu-sm"
                  }`}
                >
                  {cat === "all" ? "Semua Kategori" : cat}
                </button>
              ))}
            </div>

            <div className="relative w-full max-w-xs">
              <Icon
                name="search"
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={svgSearch}
                onChange={(e) => setSvgSearch(e.target.value)}
                placeholder="Cari aset..."
                aria-label="Cari SVG asset"
                className="neu-field pl-9 text-xs"
              />
            </div>
          </div>

          {/* SVG Grid */}
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredSvgs.map((asset) => (
              <Card
                key={asset.id}
                variant="raised"
                padding="md"
                className="group flex flex-col justify-between transition hover:border-primary/40 shadow-neu-sm"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-bg-sunken px-2 py-0.5 text-[10px] font-extrabold uppercase text-muted">
                      {asset.category}
                    </span>
                    <span className="text-[10px] font-mono text-muted">{asset.mode}</span>
                  </div>

                  <div className="my-4 flex h-24 items-center justify-center rounded-xl bg-bg-sunken/60 p-2 text-primary-strong group-hover:scale-105 transition">
                    <svg viewBox="0 0 100 100" className="h-16 w-16 drop-shadow">
                      <path
                        d={asset.path}
                        fill={asset.mode === "fill" ? "currentColor" : "none"}
                        stroke={asset.mode === "stroke" ? "currentColor" : "none"}
                        strokeWidth={asset.mode === "stroke" ? 6 : 0}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <p className="font-extrabold text-sm text-ink">{asset.label}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted leading-relaxed">
                    {asset.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary-strong">
                    s.asset(&quot;{asset.id}&quot;)
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleCopyAssetId(asset)}
                    leftIcon={<Icon name="copy" size={13} />}
                    className="h-7 px-2 text-[11px]"
                  >
                    Salin
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: STYLE PACKS */}
      {subTab === "styles" && (
        <div className="space-y-4">
          {stylesLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          ) : styles.length === 0 ? (
            <EmptyState
              icon="palette"
              title="Katalog gaya belum tersedia"
              action={
                <Button variant="secondary" onClick={() => void loadStyles()}>
                  Muat Ulang
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {styles.map((style) => (
                <Card
                  key={style.slug}
                  variant="raised"
                  padding="md"
                  className="space-y-3 shadow-neu-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-ink">{style.name}</h3>
                      <p className="font-mono text-[11px] text-muted">{style.slug}</p>
                    </div>
                    <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10px] font-extrabold text-primary-strong">
                      {style.category}
                    </span>
                  </div>

                  {/* Palette Swatches */}
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted mb-1.5">Palet Warna</p>
                    <div className="flex items-center gap-1.5">
                      {style.palette.map((color, idx) => (
                        <div
                          key={idx}
                          className="h-7 flex-1 rounded-md border border-line/60 shadow-inner"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-bg-sunken p-2.5 text-xs text-muted leading-relaxed">
                    <p className="font-semibold text-ink text-[11px]">Deskripsi Prompt AI:</p>
                    <p className="mt-1 line-clamp-3">{style.descriptionForPrompt}</p>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="rounded bg-bg-sunken px-1.5 py-0.5 text-[10px] font-mono text-muted">
                      Theme: {style.theme}
                    </span>
                    <span className="rounded bg-bg-sunken px-1.5 py-0.5 text-[10px] font-mono text-muted">
                      Finishing: {style.finishing}
                    </span>
                    {style.heavy && (
                      <span className="rounded bg-danger/10 px-1.5 py-0.5 text-[10px] font-bold text-danger">
                        Heavy Animation
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirm Delete Single Audio Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus File Audio"
        description={`Anda yakin ingin menghapus file audio "${deleteTarget?.filename}"? Tindakan ini permanen.`}
        confirmLabel="Hapus File"
        cancelLabel="Batal"
        danger
        loading={deleting}
        onConfirm={() => void handleDeleteAudio()}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Confirm Cleanup Orphan Audios Dialog */}
      <ConfirmDialog
        open={cleanupOpen}
        title="Bersihkan Semua Audio Yatim"
        description={`Ada ${orphanCount} file audio (${fileSize(orphanBytes)}) yang tidak digunakan oleh adegan manapun. Hapus semua file yatim ini sekarang?`}
        confirmLabel="Bersihkan Sekarang"
        cancelLabel="Batal"
        danger
        loading={cleaningUp}
        onConfirm={() => void handleCleanupOrphans()}
        onClose={() => setCleanupOpen(false)}
      />
    </div>
  );
}
