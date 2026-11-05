"use client";

import { useEffect, useState } from "react";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { AssetPicker } from "@/components/workspace/AssetPicker";
import { StyleSwatch } from "@/components/style/StyleSwatch";
import { APP_CONFIG } from "@/config/app";
import { api } from "@/lib/api";
import { validateConfig } from "@/lib/configValidation";
import { id } from "@/lib/i18n/id";
import { clamp, cn } from "@/lib/utils";
import { useProjectStore } from "@/store/project";
import { useStyleStore } from "@/store/styles";
import { getCustomTemplates, customTemplateToStylePack } from "@/lib/customTemplates";
import type {
  ContentType,
  DecorationStyle,
  LanguageCode,
  StartFrom,
  SubtitleStyle,
  TextureStyle
} from "@/types";

export interface ConfigPanelProps {
  onOpenStyle: () => void;
  onCopyPrompt: () => void;
  onSendPrompt: () => void;
  onOpenPaste: () => void;
  onPreviewPrompt: () => void;
}

const presetDurations: readonly number[] = APP_CONFIG.durations;

export function ConfigPanel({
  onOpenStyle,
  onCopyPrompt,
  onSendPrompt,
  onOpenPaste,
  onPreviewPrompt
}: ConfigPanelProps) {
  const config = useProjectStore((state) => state.config);
  const updateConfig = useProjectStore((state) => state.updateConfig);
  const styles = useStyleStore((state) => state.styles);
  const stylesLoading = useStyleStore((state) => state.isLoading);
  const loadStyles = useStyleStore((state) => state.loadStyles);

  const [customMode, setCustomMode] = useState(!presetDurations.includes(config.durationSec));
  const [aiTopics, setAiTopics] = useState<string[]>([]);
  const [loadingAiTopics, setLoadingAiTopics] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);

  useEffect(() => {
    void loadStyles();
  }, [loadStyles]);

  useEffect(() => {
    if (!presetDurations.includes(config.durationSec)) {
      setCustomMode(true);
    }
  }, [config.durationSec]);

  const selectedStyle =
    styles.find((style) => style.slug === config.styleSlug) ??
    (typeof window !== "undefined"
      ? getCustomTemplates()
          .map(customTemplateToStylePack)
          .find((style) => style.slug === config.styleSlug)
      : null) ??
    null;
  const selectedFont = APP_CONFIG.sceneFonts.find((font) => font.id === config.sceneFont) ?? APP_CONFIG.sceneFonts[0];
  const validation = validateConfig(config);
  const brandMode = config.brandColor === "follow_style" ? "follow_style" : "custom";
  const brandHex = config.brandColor.startsWith("#") ? config.brandColor : "#3F7BFF";
  const durationInvalid = config.durationSec < APP_CONFIG.minVideoDuration || config.durationSec > APP_CONFIG.maxVideoDuration;

  function selectDuration(value: number) {
    setCustomMode(false);
    updateConfig({ durationSec: value });
  }

  function enableCustomDuration() {
    setCustomMode(true);
    if (presetDurations.includes(config.durationSec)) {
      updateConfig({ durationSec: 45 });
    }
  }

  function adjustDuration(delta: number) {
    updateConfig({
      durationSec: clamp(
        Math.round(config.durationSec) + delta,
        APP_CONFIG.minVideoDuration,
        APP_CONFIG.maxVideoDuration
      )
    });
  }

  async function handleGenerateAiTopics() {
    setLoadingAiTopics(true);
    setTopicError(null);
    try {
      const res = await api.suggestTopics({
        category: config.contentType,
        language: config.language,
        hint: config.topic || undefined
      });
      if (res && res.topics && res.topics.length > 0) {
        setAiTopics(res.topics);
      } else {
        setTopicError("Tidak ada topik baru yang ditemukan.");
      }
    } catch {
      setTopicError("Gagal memuat rekomendasi AI. Silakan coba lagi.");
    } finally {
      setLoadingAiTopics(false);
    }
  }

  return (
    <Card variant="raised" padding="sm" className="space-y-3">
      {/* Top Main Config Inputs */}
      <div className="space-y-2.5">
        <Select
          label={id.config.startFrom}
          value={config.startFrom}
          onChange={(event) => updateConfig({ startFrom: event.target.value as StartFrom })}
          options={[
            { value: "topic", label: id.config.startFromOptions.topic },
            { value: "own_narration", label: id.config.startFromOptions.own_narration },
            { value: "promo", label: id.config.startFromOptions.promo }
          ]}
        />

        <div className="grid grid-cols-2 gap-2">
          <Select
            label={id.config.language}
            value={config.language}
            onChange={(event) => updateConfig({ language: event.target.value as LanguageCode })}
            options={[
              { value: "id", label: id.config.languageOptions.id },
              { value: "en", label: id.config.languageOptions.en }
            ]}
          />
          <Select
            label={id.config.contentType}
            value={config.contentType}
            onChange={(event) => updateConfig({ contentType: event.target.value as ContentType })}
            options={APP_CONFIG.contentTypes.map((item) => ({ value: item.value, label: item.label }))}
          />
        </div>

        {/* Topic Input with Gemini AI Suggestions */}
        <div data-coach="topic" className="space-y-1.5">
          {config.startFrom === "topic" ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-ink flex items-center gap-1.5">
                  <span>{id.config.topic}</span>
                  <span className="text-[10px] text-muted font-normal">(opsional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => void handleGenerateAiTopics()}
                  disabled={loadingAiTopics}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-primary-strong bg-primary-soft hover:bg-primary/20 border border-primary/30 rounded-[5px] transition-all active:scale-95 disabled:opacity-60"
                  title="Generate ide topik viral dengan Gemini AI"
                >
                  <Icon
                    name={loadingAiTopics ? "loader" : "sparkles"}
                    size={11}
                    className={loadingAiTopics ? "animate-spin" : ""}
                  />
                  <span>{loadingAiTopics ? "Mencari ide..." : "✨ Ide Gemini"}</span>
                </button>
              </div>

              <Input
                placeholder={id.config.topicPlaceholder}
                helper={id.config.topicHelper}
                value={config.topic}
                onChange={(event) => updateConfig({ topic: event.target.value })}
                maxLength={80}
              />

              {topicError ? (
                <p className="mt-1 text-[10px] text-danger">{topicError}</p>
              ) : null}

              {aiTopics.length > 0 ? (
                <div className="mt-2 p-2 rounded-lg bg-sunken/70 border border-line/60 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-ink">Rekomendasi Topik Gemini:</span>
                    <button
                      type="button"
                      onClick={() => void handleGenerateAiTopics()}
                      disabled={loadingAiTopics}
                      className="text-[10px] text-primary hover:underline font-bold"
                    >
                      Acak lagi
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    {aiTopics.map((topic, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => updateConfig({ topic })}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 rounded-md text-[11px] border transition-all",
                          config.topic === topic
                            ? "bg-primary text-white border-primary shadow-sm font-semibold"
                            : "bg-bg text-ink border-line/70 hover:border-primary/40 hover:bg-bg-raised font-normal"
                        )}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {config.startFrom === "own_narration" ? (
            <Textarea
              label={id.config.ownNarration}
              placeholder={id.config.ownNarrationPlaceholder}
              value={config.ownNarration ?? ""}
              onChange={(event) => updateConfig({ ownNarration: event.target.value })}
              autoResize
              maxLength={5000}
              showCount
            />
          ) : null}

          {config.startFrom === "promo" ? (
            <div className="space-y-2">
              <Input
                label={id.config.productName}
                placeholder={id.config.productNamePlaceholder}
                value={config.productName ?? ""}
                onChange={(event) => updateConfig({ productName: event.target.value })}
                maxLength={100}
              />
              <Textarea
                label={id.config.productBenefits}
                placeholder={id.config.productBenefitsPlaceholder}
                value={config.productBenefits ?? ""}
                onChange={(event) => updateConfig({ productBenefits: event.target.value })}
                rows={3}
                maxLength={1000}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Durasi Video */}
      <div data-coach="duration" className="space-y-1.5">
        <p className="neu-label">{id.config.duration}</p>
        <div className="flex flex-wrap gap-1.5">
          {APP_CONFIG.durations.map((duration) => (
            <Chip
              key={duration}
              pressed={!customMode && config.durationSec === duration}
              onClick={() => selectDuration(duration)}
            >
              {duration === 60 ? "1 mnt" : `${duration} dtk`}
            </Chip>
          ))}
          <Chip pressed={customMode} onClick={enableCustomDuration}>
            {id.config.custom}
          </Chip>
        </div>
        {customMode ? (
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => adjustDuration(-5)}
                aria-label="Kurangi durasi"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg text-muted shadow-neu-sm hover:text-ink active:shadow-neu-press"
              >
                <Icon name="minus" size={15} />
              </button>
              <input
                type="number"
                min={APP_CONFIG.minVideoDuration}
                max={APP_CONFIG.maxVideoDuration}
                step={5}
                value={config.durationSec}
                onChange={(event) => updateConfig({ durationSec: Number(event.target.value) })}
                aria-label={id.config.customDuration}
                className="neu-field text-center"
              />
              <button
                type="button"
                onClick={() => adjustDuration(5)}
                aria-label="Tambah durasi"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-bg text-muted shadow-neu-sm hover:text-ink active:shadow-neu-press"
              >
                <Icon name="plus" size={15} />
              </button>
            </div>
            <p className="neu-help">{id.config.customDurationHelper}</p>
          </div>
        ) : null}
        {durationInvalid ? <p className="neu-error">{id.config.invalidDuration}</p> : null}
      </div>

      {/* Gaya Video & Nuansa */}
      <div className="space-y-2 pt-2 border-t border-line/60">
        <p className="text-[11px] font-bold text-muted uppercase tracking-wider">{id.config.settingsTitle}</p>
        
        <button
          type="button"
          data-coach="style"
          onClick={onOpenStyle}
          className="flex min-h-[58px] w-full items-center gap-2.5 rounded-lg border border-line bg-bg p-2 text-left transition hover:border-primary/50 hover:shadow-neu-sm"
        >
          <StyleSwatch style={selectedStyle} className="h-12 w-12 shrink-0 rounded-md" />
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-bold text-muted uppercase">{id.config.style}</span>
            <span className="block truncate text-xs font-extrabold text-ink">
              {selectedStyle?.name ?? (stylesLoading ? id.common.loading : "Neu-Soft")}
            </span>
            <span className="block truncate text-[10px] text-muted">{selectedStyle?.category ?? id.config.stylePicker}</span>
          </span>
          <Icon name="chevronRight" size={16} className="shrink-0 text-muted" />
        </button>

        <div className="grid grid-cols-2 gap-2">
          <Select
            label={id.config.character}
            value={config.character}
            onChange={(event) => updateConfig({ character: event.target.value })}
            options={APP_CONFIG.characters.map((item) => ({ value: item.value, label: item.label }))}
          />
          <Select
            label={id.config.transition}
            value={config.transition}
            onChange={(event) => updateConfig({ transition: event.target.value })}
            options={APP_CONFIG.transitions.map((item) => ({ value: item.value, label: item.label }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="neu-label">{id.config.tempo}</p>
            <Segmented
              ariaLabel={id.config.tempo}
              value={config.tempo}
              onChange={(value) => updateConfig({ tempo: value })}
              options={[
                { value: "energetic", label: id.config.tempoOptions.energetic },
                { value: "calm", label: id.config.tempoOptions.calm }
              ]}
            />
          </div>
          <div>
            <p className="neu-label">{id.config.aspect}</p>
            <Segmented
              ariaLabel={id.config.aspect}
              value={config.aspect}
              onChange={(value) => updateConfig({ aspect: value })}
              className="neu-segmented--compact w-full"
              options={APP_CONFIG.aspects.map((item) => ({
                value: item.value,
                label: item.label
              }))}
            />
          </div>
        </div>

        <div>
          <p className="neu-label">{id.config.brandColor}</p>
          <div className="flex items-center gap-2">
            <Segmented
              ariaLabel={id.config.brandColor}
              value={brandMode}
              onChange={(value) => updateConfig({ brandColor: value === "follow_style" ? "follow_style" : brandHex })}
              options={[
                { value: "follow_style", label: id.config.brandColorFollow },
                { value: "custom", label: id.config.brandColorCustom }
              ]}
            />
            {brandMode === "custom" ? (
              <input
                type="color"
                value={brandHex}
                onChange={(event) => updateConfig({ brandColor: event.target.value })}
                aria-label={id.config.brandColorCustom}
                className="h-8 w-8 cursor-pointer rounded border border-line bg-transparent p-0.5"
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Accordion: Studio Tipografi & Asset */}
      <Accordion title={id.config.studioTitle} description={id.config.studioDescription}>
        <div className="space-y-3 pt-1">
          <Select
            label={id.config.font}
            value={config.sceneFont}
            onChange={(event) => updateConfig({ sceneFont: event.target.value })}
            options={APP_CONFIG.sceneFonts.map((font) => ({ value: font.id, label: font.label }))}
            helper={id.config.fontHelper}
          />

          <div className="rounded-md border border-line bg-bg-sunken px-2.5 py-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-muted">{selectedFont.category}</p>
            <p
              className="mt-0.5 truncate text-lg text-ink"
              style={{ fontFamily: selectedFont.family, fontWeight: selectedFont.weight }}
            >
              {id.config.fontPreview}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              label={id.config.decoration}
              value={config.decorationStyle}
              onChange={(event) => updateConfig({ decorationStyle: event.target.value as DecorationStyle })}
              options={APP_CONFIG.decorationStyles.map((item) => ({ value: item.value, label: item.label }))}
            />
            <Select
              label={id.config.texture}
              value={config.texture}
              onChange={(event) => updateConfig({ texture: event.target.value as TextureStyle })}
              options={APP_CONFIG.textures.map((item) => ({ value: item.value, label: item.label }))}
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="neu-label mb-0">{id.config.decorationIntensity}</p>
              <span className="text-xs font-extrabold text-primary-strong">{config.decorationIntensity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={config.decorationIntensity}
              onChange={(event) => updateConfig({ decorationIntensity: Number(event.target.value) })}
              aria-label={id.config.decorationIntensity}
              className="neu-range mt-1.5"
            />
          </div>

          <div>
            <p className="neu-label">{id.config.subtitleStyle}</p>
            <Segmented
              ariaLabel={id.config.subtitleStyle}
              value={config.subtitleStyle}
              onChange={(value) => updateConfig({ subtitleStyle: value as SubtitleStyle })}
              className="neu-segmented--compact w-full"
              options={APP_CONFIG.subtitleStyles.map((item) => ({ value: item.value, label: item.label }))}
            />
          </div>

          <div>
            <p className="neu-label">{id.config.assets}</p>
            <AssetPicker
              value={config.preferredAssets}
              onChange={(preferredAssets) => updateConfig({ preferredAssets })}
            />
          </div>
        </div>
      </Accordion>

      {/* Accordion: Pengaturan Tambahan */}
      <Accordion title={id.config.extras} description={id.config.extrasHelper}>
        <div className="space-y-2.5 pt-1">
          <Input
            label={id.config.tone}
            placeholder={id.config.tonePlaceholder}
            value={config.extras.tone}
            onChange={(event) => updateConfig({ extras: { tone: event.target.value } })}
            maxLength={120}
          />
          <Textarea
            label={id.config.avoid}
            placeholder={id.config.avoidPlaceholder}
            value={config.extras.avoid}
            onChange={(event) => updateConfig({ extras: { avoid: event.target.value } })}
            rows={2}
            maxLength={300}
          />
          <Input
            label={id.config.cta}
            placeholder={id.config.ctaPlaceholder}
            value={config.extras.cta}
            onChange={(event) => updateConfig({ extras: { cta: event.target.value } })}
            maxLength={160}
          />
          <Input
            label={id.config.contact}
            placeholder={id.config.contactPlaceholder}
            value={config.extras.contact}
            onChange={(event) => updateConfig({ extras: { contact: event.target.value } })}
            maxLength={120}
          />
        </div>
      </Accordion>

      {/* Bottom Action Buttons */}
      <div data-coach="send" className="space-y-2 pt-2 border-t border-line/60">
        {!validation.valid ? (
          <p className="text-[11px] font-semibold text-warning">{validation.message}</p>
        ) : null}

        <Button
          variant="primary"
          fullWidth
          onClick={onSendPrompt}
          disabled={!validation.valid}
          leftIcon={<Icon name="send" size={16} />}
        >
          {id.config.sendButton}
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={onCopyPrompt}
            leftIcon={<Icon name="copy" size={15} />}
          >
            {id.config.copyButton}
          </Button>

          <button
            type="button"
            onClick={onPreviewPrompt}
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-bg text-muted hover:text-ink hover:border-primary/40 transition"
            title="Lihat Prompt Lengkap"
          >
            <Icon name="eye" size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}
