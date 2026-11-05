"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { messageFromError } from "@/lib/errors";
import type { PlatformSettings, SystemSettingsPayload } from "@/types";

interface AdminSettingsViewProps {
  settings: SystemSettingsPayload | null;
  loading: boolean;
  onSaved: (updated: SystemSettingsPayload) => void;
}

export function AdminSettingsView({ settings, loading, onSaved }: AdminSettingsViewProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings?.platform) {
      setFormData(settings.platform);
    }
  }, [settings]);

  if (loading || !formData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
      </div>
    );
  }

  const handleSave = async () => {
    if (!settings || !formData) return;
    setSaving(true);
    try {
      const payload: SystemSettingsPayload = {
        ...settings,
        platform: formData
      };
      const res = await api.adminSaveSettings(payload);
      onSaved(res);
      showToast("Pengaturan platform berhasil disimpan!", "success");
    } catch (err) {
      showToast(messageFromError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Voice & TTS Engine Settings */}
      <Card variant="raised" padding="md" className="space-y-4 shadow-neu-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary-strong">
              <Icon name="volume" size={16} />
            </span>
            <h3 className="text-sm font-extrabold text-ink">Engine Suara & Voiceover (TTS)</h3>
          </div>
          <p className="mt-1 text-xs text-muted">
            Konfigurasi penyedia sintesis suara Edge-TTS, Google Cloud TTS, dan timeout sintesis.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label="Engine TTS Utama"
            value={formData.ttsEngine}
            onChange={(e) => setFormData({ ...formData, ttsEngine: e.target.value })}
            options={[
              { value: "edge-tts", label: "Microsoft Edge TTS (Gratis, Berkualitas)" },
              { value: "google-tts", label: "Google Cloud Text-to-Speech API" }
            ]}
          />

          <Select
            label="Suara Default Bahasa Indonesia"
            value={formData.defaultVoice}
            onChange={(e) => setFormData({ ...formData, defaultVoice: e.target.value })}
            options={[
              { value: "id-ID-GadisNeural", label: "Gadis (Wanita - Tenang & Alami)" },
              { value: "id-ID-ArdiNeural", label: "Ardi (Pria - Lugas & Jelas)" }
            ]}
          />

          <Input
            label="Batas Waktu Timeout TTS (Detik)"
            type="number"
            min={10}
            max={120}
            value={formData.ttsTimeoutSeconds}
            onChange={(e) =>
              setFormData({ ...formData, ttsTimeoutSeconds: parseInt(e.target.value, 10) || 30 })
            }
          />
        </div>
      </Card>

      {/* Credit & Plan Monetization */}
      <Card variant="raised" padding="md" className="space-y-4 shadow-neu-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary-strong">
              <Icon name="coins" size={16} />
            </span>
            <h3 className="text-sm font-extrabold text-ink">Kredit & Monetisasi Paket</h3>
          </div>
          <p className="mt-1 text-xs text-muted">
            Atur saldo kredit registrasi baru, masa trial, dan kuota proyek video.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="Masa Uji Coba (Hari)"
            type="number"
            min={1}
            max={30}
            value={formData.trialDays}
            onChange={(e) =>
              setFormData({ ...formData, trialDays: parseInt(e.target.value, 10) || 4 })
            }
          />

          <Input
            label="Kredit Gratis Pengguna Baru"
            type="number"
            min={0}
            value={formData.trialCredits}
            onChange={(e) =>
              setFormData({ ...formData, trialCredits: parseInt(e.target.value, 10) || 2 })
            }
          />

          <Input
            label="Batas Proyek Trial"
            type="number"
            min={1}
            value={formData.trialQuota}
            onChange={(e) =>
              setFormData({ ...formData, trialQuota: parseInt(e.target.value, 10) || 1 })
            }
          />

          <Input
            label="Kredit Bulanan Paket Starter"
            type="number"
            min={10}
            value={formData.starterCredits}
            onChange={(e) =>
              setFormData({ ...formData, starterCredits: parseInt(e.target.value, 10) || 60 })
            }
          />

          <Input
            label="Kredit Bulanan Paket Pro"
            type="number"
            min={50}
            value={formData.proCredits}
            onChange={(e) =>
              setFormData({ ...formData, proCredits: parseInt(e.target.value, 10) || 200 })
            }
          />
        </div>
      </Card>

      {/* Security & Authentication */}
      <Card variant="raised" padding="md" className="space-y-4 shadow-neu-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary-strong">
              <Icon name="shield" size={16} />
            </span>
            <h3 className="text-sm font-extrabold text-ink">Keamanan, Sesi & Autentikasi</h3>
          </div>
          <p className="mt-1 text-xs text-muted">
            Konfigurasi masa kedaluwarsa token login JWT, OAuth Google, dan mode darurat pemeliharaan.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Kedaluwarsa Token JWT (Jam)"
            type="number"
            min={1}
            max={720}
            value={formData.jwtExpiryHours}
            onChange={(e) =>
              setFormData({ ...formData, jwtExpiryHours: parseInt(e.target.value, 10) || 168 })
            }
          />

          <div className="flex items-center justify-between rounded-xl border border-line/70 bg-bg p-3 shadow-neu-sm">
            <div>
              <p className="text-xs font-bold text-ink">Mode Pemeliharaan (Maintenance)</p>
              <p className="text-[11px] text-muted">Tampilkan halaman pemeliharaan untuk non-admin</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, maintenanceMode: !formData.maintenanceMode })}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${
                formData.maintenanceMode
                  ? "bg-danger text-white shadow-neu-in"
                  : "bg-bg-sunken text-muted"
              }`}
            >
              <span>{formData.maintenanceMode ? "Aktif (Tutup)" : "Nonaktif"}</span>
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Google OAuth Client ID"
            value={formData.googleClientId}
            placeholder="xxxxxx.apps.googleusercontent.com"
            onChange={(e) => setFormData({ ...formData, googleClientId: e.target.value })}
          />
          <Input
            label="Google OAuth Client Secret"
            type="password"
            value={formData.googleClientSecret}
            placeholder="GOCSPX-xxxxxx"
            onChange={(e) => setFormData({ ...formData, googleClientSecret: e.target.value })}
          />
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-line/60">
        <Button
          variant="primary"
          onClick={() => void handleSave()}
          loading={saving}
          leftIcon={<Icon name="check" size={15} />}
          className="h-10 px-5 text-xs font-bold"
        >
          Simpan Semua Pengaturan Platform
        </Button>
      </div>
    </div>
  );
}

