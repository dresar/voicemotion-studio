"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { messageFromError } from "@/lib/errors";
import { copyText } from "@/lib/utils";
import type { AIRouterSettings, AITestResponse, SystemSettingsPayload } from "@/types";

interface AdminAiRouterViewProps {
  settings: SystemSettingsPayload | null;
  loading: boolean;
  onSaved: (updated: SystemSettingsPayload) => void;
}

const bynaraModelOptions = [
  { value: "deepseek-v4-pro", label: "DeepSeek v4 Pro (Reasoning + Chat ID)" },
  { value: "deepseek-v4-flash", label: "DeepSeek v4 Flash (Fast Response)" },
  { value: "claude-haiku-5.5", label: "Claude Haiku 5.5 (Smart & Accurate)" },
  { value: "claude-opus-5.5", label: "Claude Opus 5.5 (Complex Logic)" },
  { value: "gpt-6-astra", label: "GPT-6 Astra (Advanced Reasoning)" },
  { value: "gpt-5.6-luna", label: "GPT-5.6 Luna (General Intelligence)" },
  { value: "kimi-k2.7-code", label: "Kimi K2.7 Code (Code Specialist)" },
  { value: "qwen3.8-max-alibaba", label: "Qwen 3.8 Max (Alibaba Cloud)" },
  { value: "mimo-v2.5-pro", label: "Mimo v2.5 Pro (Structured Reasoning)" }
];

const sumopodModelOptions = [
  { value: "deepseek-v4.1-flash:netra", label: "DeepSeek v4.1 Flash: Netra (~1.5s)" }
];

const geminiModelOptions = [
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Next-Gen Fast)" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro (Deep Context)" },
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Lightweight)" }
];

export function AdminAiRouterView({ settings, loading, onSaved }: AdminAiRouterViewProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<AIRouterSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"bynara" | "sumopod" | "gemini" | "custom">("bynara");

  // Show/Hide Keys
  const [showKeyBynara1, setShowKeyBynara1] = useState(false);
  const [showKeyBynara2, setShowKeyBynara2] = useState(false);
  const [showKeySumopod, setShowKeySumopod] = useState(false);

  // Live Test Playground State
  const [testProvider, setTestProvider] = useState<string>("bynara");
  const [testModel, setTestModel] = useState<string>("deepseek-v4-pro");
  const [testPrompt, setTestPrompt] = useState<string>(
    "Tes koneksi Voicemotion AI Router. Berikan ide 1 hook video viral tentang produktivitas."
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<AITestResponse | null>(null);

  useEffect(() => {
    if (settings?.aiRouter) {
      setFormData(settings.aiRouter);
      setTestProvider(settings.aiRouter.activeProvider || "bynara");
      setTestModel(
        settings.aiRouter.activeProvider === "sumopod"
          ? settings.aiRouter.sumopod.defaultModel
          : settings.aiRouter.bynara.defaultModel
      );
    }
  }, [settings]);

  if (loading || !formData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
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
        aiRouter: formData
      };
      const res = await api.adminSaveSettings(payload);
      onSaved(res);
      showToast("Konfigurasi Router AI berhasil disimpan!", "success");
    } catch (err) {
      showToast(messageFromError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRunTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.adminTestAI({
        provider: testProvider,
        model: testModel,
        prompt: testPrompt
      });
      setTestResult(res);
      if (res.ok) {
        showToast(`Tes berhasil dalam ${res.latencyMs} ms!`, "success");
      } else {
        showToast(`Gagal: ${res.error || "Terjadi kesalahan"}`, "error");
      }
    } catch (err) {
      showToast(messageFromError(err), "error");
    } finally {
      setTesting(false);
    }
  };

  const allModelOptions = [
    ...bynaraModelOptions,
    ...sumopodModelOptions,
    ...geminiModelOptions,
    { value: "custom", label: "Custom Model (BYO)" }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner & Active Gateway Selector */}
      <Card variant="raised" padding="md" className="space-y-4 shadow-neu-sm border-primary/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
              <h2 className="text-base font-extrabold text-ink">AI Router Gateway Aktif</h2>
            </div>
            <p className="mt-1 text-xs text-muted">
              Pilih provider inferensi utama yang memproses ideasi, naskah, dan animasi di studio.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted">Auto Fallback:</span>
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  fallbackAuto: !formData.fallbackAuto
                })
              }
              className={`flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition ${
                formData.fallbackAuto
                  ? "bg-success/15 text-success"
                  : "bg-bg-sunken text-muted"
              }`}
            >
              <Icon name={formData.fallbackAuto ? "checkCircle" : "circle"} size={14} />
              <span>{formData.fallbackAuto ? "Aktif" : "Mati"}</span>
            </button>
          </div>
        </div>

        {/* 4 Provider Buttons */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { id: "bynara" as const, name: "ByNara Router", desc: "9 Frontier Models", icon: "sparkles" },
            { id: "sumopod" as const, name: "Sumopod AI", desc: "DeepSeek Netra Fast", icon: "wand" },
            { id: "gemini" as const, name: "Google Gemini", desc: "Key Rotation Pool", icon: "google" },
            { id: "custom" as const, name: "Custom Endpoint", desc: "OpenAI Compatible", icon: "code" }
          ].map((prov) => {
            const isSelected = formData.activeProvider === prov.id;
            return (
              <button
                key={prov.id}
                type="button"
                onClick={() => setFormData({ ...formData, activeProvider: prov.id })}
                className={`flex flex-col items-start rounded-xl p-3 text-left transition ${
                  isSelected
                    ? "border-2 border-primary bg-primary-soft/50 shadow-neu-in"
                    : "border border-line/70 bg-bg hover:border-primary/40 shadow-neu-sm"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className={`text-xs font-bold ${isSelected ? "text-primary-strong" : "text-ink"}`}>
                    {prov.name}
                  </span>
                  {isSelected && (
                    <span className="rounded-full bg-primary p-0.5 text-white">
                      <Icon name="check" size={10} />
                    </span>
                  )}
                </div>
                <span className="mt-1 text-[11px] text-muted">{prov.desc}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Provider Details & Credentials Tabs */}
      <Card variant="raised" padding="md" className="space-y-4 shadow-neu-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-line/60 pb-3">
          {(["bynara", "sumopod", "gemini", "custom"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition capitalize ${
                activeTab === tab
                  ? "bg-primary-soft text-primary-strong shadow-neu-in"
                  : "text-muted hover:text-ink hover:bg-bg-sunken"
              }`}
            >
              {tab === "bynara" && "ByNara Router"}
              {tab === "sumopod" && "Sumopod AI"}
              {tab === "gemini" && "Google Gemini"}
              {tab === "custom" && "Custom OpenAI Spec"}
            </button>
          ))}
        </div>

        {/* TAB 1: ByNara Router */}
        {activeTab === "bynara" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-bg-sunken p-3 text-xs leading-relaxed text-muted">
              <span className="font-bold text-ink">ByNara Multi-Model Router: </span>
              Endpoint terintegrasi resmi dengan latensi rendah dan 9 model frontier terverifikasi online 100% aktif.
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Base URL"
                value={formData.bynara.baseUrl}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bynara: { ...formData.bynara, baseUrl: e.target.value }
                  })
                }
              />
              <Select
                label="Model Bawaan (Default Model)"
                value={formData.bynara.defaultModel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bynara: { ...formData.bynara, defaultModel: e.target.value }
                  })
                }
                options={bynaraModelOptions}
              />
            </div>

            {/* API Key 1 */}
            <div>
              <label className="mb-1 block text-xs font-bold text-ink">API Key Utama</label>
              <div className="flex items-center gap-2">
                <input
                  type={showKeyBynara1 ? "text" : "password"}
                  value={formData.bynara.apiKey}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bynara: { ...formData.bynara, apiKey: e.target.value }
                    })
                  }
                  className="neu-field font-mono text-xs flex-1"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowKeyBynara1(!showKeyBynara1)}
                  leftIcon={<Icon name={showKeyBynara1 ? "eyeOff" : "eye"} size={14} />}
                  className="h-9 px-3"
                >
                  {showKeyBynara1 ? "Sembunyikan" : "Lihat"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void copyText(formData.bynara.apiKey);
                    showToast("API Key 1 disalin", "success");
                  }}
                  leftIcon={<Icon name="copy" size={14} />}
                  className="h-9 px-3"
                >
                  Salin
                </Button>
              </div>
            </div>

            {/* API Key 2 */}
            <div>
              <label className="mb-1 block text-xs font-bold text-ink">API Key Sekunder (Cadangan)</label>
              <div className="flex items-center gap-2">
                <input
                  type={showKeyBynara2 ? "text" : "password"}
                  value={formData.bynara.secondaryKey}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bynara: { ...formData.bynara, secondaryKey: e.target.value }
                    })
                  }
                  className="neu-field font-mono text-xs flex-1"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowKeyBynara2(!showKeyBynara2)}
                  leftIcon={<Icon name={showKeyBynara2 ? "eyeOff" : "eye"} size={14} />}
                  className="h-9 px-3"
                >
                  {showKeyBynara2 ? "Sembunyikan" : "Lihat"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void copyText(formData.bynara.secondaryKey);
                    showToast("API Key 2 disalin", "success");
                  }}
                  leftIcon={<Icon name="copy" size={14} />}
                  className="h-9 px-3"
                >
                  Salin
                </Button>
              </div>
            </div>

            {/* 9 Models Chips */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                9 Model Terverifikasi Aktif di ByNara
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {bynaraModelOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className="flex items-center justify-between rounded-lg border border-line/70 bg-bg p-2 text-xs"
                  >
                    <div>
                      <p className="font-mono font-bold text-ink">{opt.value}</p>
                      <p className="text-[10px] text-muted">{opt.label.split("(")[1]?.replace(")", "")}</p>
                    </div>
                    <span className="flex h-2 w-2 rounded-full bg-success" title="Online" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Sumopod AI */}
        {activeTab === "sumopod" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-bg-sunken p-3 text-xs leading-relaxed text-muted">
              <span className="font-bold text-ink">Sumopod AI Engine: </span>
              Inference provider ultra cepat (~1.5 detik per respon), hemat token, dan sangat stabil untuk autocompletion dan ekstraksi naskah.
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Base URL"
                value={formData.sumopod.baseUrl}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sumopod: { ...formData.sumopod, baseUrl: e.target.value }
                  })
                }
              />
              <Select
                label="Model Utama"
                value={formData.sumopod.defaultModel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sumopod: { ...formData.sumopod, defaultModel: e.target.value }
                  })
                }
                options={sumopodModelOptions}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-ink">API Key Sumopod</label>
              <div className="flex items-center gap-2">
                <input
                  type={showKeySumopod ? "text" : "password"}
                  value={formData.sumopod.apiKey}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sumopod: { ...formData.sumopod, apiKey: e.target.value }
                    })
                  }
                  className="neu-field font-mono text-xs flex-1"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowKeySumopod(!showKeySumopod)}
                  leftIcon={<Icon name={showKeySumopod ? "eyeOff" : "eye"} size={14} />}
                  className="h-9 px-3"
                >
                  {showKeySumopod ? "Sembunyikan" : "Lihat"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void copyText(formData.sumopod.apiKey);
                    showToast("API Key Sumopod disalin", "success");
                  }}
                  leftIcon={<Icon name="copy" size={14} />}
                  className="h-9 px-3"
                >
                  Salin
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Google Gemini */}
        {activeTab === "gemini" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-bg-sunken p-3 text-xs leading-relaxed text-muted">
              <span className="font-bold text-ink">Google Gemini API: </span>
              Dukungan rotasi multi-kunci (*key pool*). Masukkan kunci API dipisahkan dengan tanda koma untuk round-robin otomatis bila kena batas kuota.
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Select
                label="Model Bawaan Gemini"
                value={formData.gemini.defaultModel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gemini: { ...formData.gemini, defaultModel: e.target.value }
                  })
                }
                options={geminiModelOptions}
              />
            </div>

            <div>
              <Textarea
                label="Gemini API Keys (Pisahkan dengan Koma)"
                rows={3}
                value={formData.gemini.apiKeys.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gemini: {
                      ...formData.gemini,
                      apiKeys: e.target.value
                        .split(",")
                        .map((k) => k.trim())
                        .filter(Boolean)
                    }
                  })
                }
                placeholder="AIzaSy..., AIzaSy..."
              />
              <p className="mt-1 text-[11px] text-muted">
                Jumlah kunci aktif: {formData.gemini.apiKeys.length} kunci
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: Custom Endpoint */}
        {activeTab === "custom" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-bg-sunken p-3 text-xs leading-relaxed text-muted">
              <span className="font-bold text-ink">Custom OpenAI-Compatible Provider: </span>
              Gunakan endpoint mandiri (Ollama, vLLM, OpenRouter, Groq, Together AI, atau proxy pribadi).
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Custom Base URL"
                value={formData.custom.baseUrl}
                placeholder="https://api.groq.com/openai/v1"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    custom: { ...formData.custom, baseUrl: e.target.value }
                  })
                }
              />
              <Input
                label="Custom Model Name"
                value={formData.custom.defaultModel}
                placeholder="llama-3.3-70b-versatile"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    custom: { ...formData.custom, defaultModel: e.target.value }
                  })
                }
              />
            </div>

            <Input
              label="API Key (Opsional untuk lokal Ollama)"
              type="password"
              value={formData.custom.apiKey}
              placeholder="gsk_..."
              onChange={(e) =>
                setFormData({
                  ...formData,
                  custom: { ...formData.custom, apiKey: e.target.value }
                })
              }
            />
          </div>
        )}
      </Card>

      {/* Task-Based Routing Rules */}
      <Card variant="raised" padding="md" className="space-y-4 shadow-neu-sm">
        <div>
          <h3 className="text-sm font-extrabold text-ink">Aturan Rute Berbasis Tugas (Task-Specific Routing)</h3>
          <p className="text-xs text-muted">
            Tentukan model spesifik yang paling optimal untuk setiap tahap alur pembuatan video.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="1. Ideasi Topik & Angle (Perlu Cepat & Ringan)"
            value={formData.taskRouting.topicsModel}
            onChange={(e) =>
              setFormData({
                ...formData,
                taskRouting: { ...formData.taskRouting, topicsModel: e.target.value }
              })
            }
            options={allModelOptions}
          />

          <Select
            label="2. Penulisan Naskah Narasi (Perlu Luwes & Emosional)"
            value={formData.taskRouting.scriptModel}
            onChange={(e) =>
              setFormData({
                ...formData,
                taskRouting: { ...formData.taskRouting, scriptModel: e.target.value }
              })
            }
            options={allModelOptions}
          />

          <Select
            label="3. Generator Kode Adegan/Animasi (Perlu Presisi Sintaks)"
            value={formData.taskRouting.animationModel}
            onChange={(e) =>
              setFormData({
                ...formData,
                taskRouting: { ...formData.taskRouting, animationModel: e.target.value }
              })
            }
            options={allModelOptions}
          />

          <Select
            label="4. Analisis Karakter Suara & Tone (Perlu Penalaran Kuat)"
            value={formData.taskRouting.voiceModel}
            onChange={(e) =>
              setFormData({
                ...formData,
                taskRouting: { ...formData.taskRouting, voiceModel: e.target.value }
              })
            }
            options={allModelOptions}
          />
        </div>
      </Card>

      {/* Global Inference Parameters */}
      <Card variant="raised" padding="md" className="space-y-4 shadow-neu-sm">
        <div>
          <h3 className="text-sm font-extrabold text-ink">Parameter Inferensi Global</h3>
          <p className="text-xs text-muted">Karakteristik komputasi temperatur dan batas output token</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-bold text-ink">
              Temperature: {formData.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.05"
              value={formData.temperature}
              onChange={(e) =>
                setFormData({ ...formData, temperature: parseFloat(e.target.value) })
              }
              className="mt-2 w-full accent-[var(--primary)]"
            />
            <p className="text-[10px] text-muted">0 = Presisi kaku, 1+ = Kreatif & bervariasi</p>
          </div>

          <div>
            <label className="text-xs font-bold text-ink">
              Top-P: {formData.topP}
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={formData.topP}
              onChange={(e) =>
                setFormData({ ...formData, topP: parseFloat(e.target.value) })
              }
              className="mt-2 w-full accent-[var(--primary)]"
            />
            <p className="text-[10px] text-muted">Ambang batas probabilitas nukleus token</p>
          </div>

          <Input
            label="Maksimal Token Output"
            type="number"
            min={256}
            max={8192}
            value={formData.maxTokens}
            onChange={(e) =>
              setFormData({ ...formData, maxTokens: parseInt(e.target.value, 10) || 4096 })
            }
          />
        </div>

        <Textarea
          label="Sistem Prompt Tambahan (Injected System Prompt)"
          rows={3}
          value={formData.systemPrompt}
          onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
        />
      </Card>

      {/* Live AI Test Playground */}
      <Card variant="raised" padding="md" className="space-y-4 shadow-neu-sm border-accent/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary-strong">
              <Icon name="wand" size={16} />
            </span>
            <h3 className="text-sm font-extrabold text-ink">Alat Uji Langsung (Live AI Test Playground)</h3>
          </div>
          <p className="mt-1 text-xs text-muted">
            Uji responsivitas koneksi dan waktu latensi (ms) dari router AI secara langsung.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Pilih Provider untuk Dites"
            value={testProvider}
            onChange={(e) => {
              const prov = e.target.value;
              setTestProvider(prov);
              if (prov === "sumopod") setTestModel("deepseek-v4.1-flash:netra");
              else if (prov === "gemini") setTestModel("gemini-2.0-flash");
              else if (prov === "bynara") setTestModel("deepseek-v4-pro");
            }}
            options={[
              { value: "bynara", label: "ByNara Router" },
              { value: "sumopod", label: "Sumopod AI" },
              { value: "gemini", label: "Google Gemini" },
              { value: "custom", label: "Custom Provider" }
            ]}
          />

          <Input
            label="Model ID yang Diuji"
            value={testModel}
            onChange={(e) => setTestModel(e.target.value)}
          />
        </div>

        <Textarea
          label="Prompt Tes"
          rows={2}
          value={testPrompt}
          onChange={(e) => setTestPrompt(e.target.value)}
        />

        <div className="flex items-center justify-between">
          <Button
            variant="primary"
            onClick={() => void handleRunTest()}
            loading={testing}
            leftIcon={<Icon name="play" size={14} />}
            className="h-9 px-4"
          >
            Jalankan Tes Koneksi AI
          </Button>

          {testResult && (
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-muted">Latensi:</span>
              <span
                className={`rounded-md px-2 py-0.5 font-mono font-extrabold ${
                  testResult.latencyMs < 2000
                    ? "bg-success/15 text-success"
                    : testResult.latencyMs < 5000
                    ? "bg-amber-500/15 text-amber-600"
                    : "bg-danger/15 text-danger"
                }`}
              >
                {testResult.latencyMs} ms
              </span>
              <span
                className={`rounded-md px-2 py-0.5 font-bold ${
                  testResult.ok ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                }`}
              >
                {testResult.ok ? "HTTP 200 OK" : "Gagal"}
              </span>
            </div>
          )}
        </div>

        {testResult && (
          <div
            className={`rounded-xl border p-3.5 text-xs font-mono leading-relaxed transition ${
              testResult.ok
                ? "border-success/30 bg-success/5 text-ink"
                : "border-danger/30 bg-danger/5 text-danger"
            }`}
          >
            <p className="font-bold uppercase tracking-wider text-[10px] text-muted mb-1">
              Respon dari {testResult.provider} ({testResult.model}):
            </p>
            <p className="whitespace-pre-wrap">{testResult.reply || testResult.error}</p>
          </div>
        )}
      </Card>

      {/* Save Button Floating / Bottom Bar */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-line/60">
        <Button
          variant="primary"
          onClick={() => void handleSave()}
          loading={saving}
          leftIcon={<Icon name="check" size={15} />}
          className="h-10 px-5 text-xs font-bold"
        >
          Simpan Seluruh Pengaturan Router AI
        </Button>
      </div>
    </div>
  );
}

