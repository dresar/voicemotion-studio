"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Textarea } from "@/components/ui/Textarea";
import { APP_CONFIG } from "@/config/app";
import { id } from "@/lib/i18n/id";
import { clamp, estimateSceneCount, formatDuration, formatNumber, wordsPerSecond } from "@/lib/utils";
import { useProjectStore } from "@/store/project";
import { useStyleStore } from "@/store/styles";
import type { SceneTheme } from "@/types";

export interface NarrationEditorProps {
  onCopyPrompt: () => void;
  onSendPrompt: () => void;
  onOpenPaste: () => void;
  onPreviewPrompt: () => void;
}

export function NarrationEditor({ onCopyPrompt, onSendPrompt, onOpenPaste, onPreviewPrompt }: NarrationEditorProps) {
  const selectedIdea = useProjectStore((state) => state.selectedIdea);
  const config = useProjectStore((state) => state.config);
  const scenes = useProjectStore((state) => state.scenes);
  const updateConfig = useProjectStore((state) => state.updateConfig);
  const updateScene = useProjectStore((state) => state.updateScene);
  const addScene = useProjectStore((state) => state.addScene);
  const removeScene = useProjectStore((state) => state.removeScene);
  const moveScene = useProjectStore((state) => state.moveScene);
  const setActiveTab = useProjectStore((state) => state.setActiveTab);
  const styles = useStyleStore((state) => state.styles);
  const loadStyles = useStyleStore((state) => state.loadStyles);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    void loadStyles();
  }, [loadStyles]);

  if (!selectedIdea) {
    return (
      <EmptyState
        title={id.narration.selectedIdea}
        description={id.ideas.emptyDescription}
        icon="lightbulb"
        action={
          <Button variant="primary" onClick={() => setActiveTab("idea")} leftIcon={<Icon name="arrowLeft" size={18} />}>
            {id.ideas.title}
          </Button>
        }
      />
    );
  }

  const estimatedScenes = estimateSceneCount(config.durationSec);
  const secondsPerScene = Math.round((config.durationSec / estimatedScenes) * 10) / 10;
  const styleName = styles.find((style) => style.slug === config.styleSlug)?.name ?? "Neu-Soft";
  const tempoLabel = id.config.tempoOptions[config.tempo];
  const totalDuration = scenes.reduce((total, scene) => total + scene.durationSec, 0);
  const durationDifference = config.durationSec > 0 ? Math.abs(totalDuration - config.durationSec) / config.durationSec : 0;
  const durationMatches = scenes.length > 0 && durationDifference <= 0.1;

  return (
    <section className="space-y-3">
      <Card variant="raised" padding="sm" className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-muted">{id.narration.selectedIdea}</p>
            <h2 className="mt-0.5 text-sm font-extrabold leading-snug text-ink">{selectedIdea.title}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setActiveTab("idea")} leftIcon={<Icon name="arrowLeft" size={16} />}>
            {id.narration.changeIdea}
          </Button>
        </div>
        <div className="neu-quote">{selectedIdea.hook}</div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
          <span className="rounded-full bg-primary-soft px-3 py-1 text-primary-strong">
            {id.narration.durationSummary
              .replace("{duration}", formatDuration(config.durationSec))
              .replace("{scenes}", String(estimatedScenes))
              .replace("{seconds}", formatNumber(secondsPerScene, 1))}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setActiveTab("idea")}>
            {id.narration.changeDuration}
          </Button>
        </div>
        <p className="rounded-md bg-bg-sunken px-3 py-2 text-xs font-semibold text-muted">
          {styleName} · {tempoLabel} · {config.aspect}
        </p>
      </Card>

      <Textarea
        label={id.narration.writerNotes}
        placeholder={id.narration.writerNotesPlaceholder}
        value={config.writerNotes ?? ""}
        onChange={(event) => updateConfig({ writerNotes: event.target.value })}
        autoResize
        maxLength={1000}
        showCount
      />

      <Card variant="inset" padding="sm" className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-white">
            2
          </span>
          <p className="text-sm font-extrabold text-ink">{id.config.sendHeading}</p>
        </div>
        <p className="text-xs leading-relaxed text-muted">{id.config.sendDescription}</p>
        <Button variant="primary" fullWidth onClick={onSendPrompt} leftIcon={<Icon name="send" size={18} />}>
          {id.narration.sendButton}
        </Button>
        <Button variant="secondary" fullWidth onClick={onCopyPrompt} leftIcon={<Icon name="copy" size={18} />}>
          {id.narration.copyButton}
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onOpenPaste}
            className="flex min-h-[44px] items-center gap-1 text-xs font-bold text-primary-strong"
          >
            {id.narration.hasAnswer}
            <Icon name="arrowRight" size={14} />
          </button>
          <button
            type="button"
            onClick={onPreviewPrompt}
            className="flex min-h-[44px] items-center gap-1 text-xs font-bold text-muted hover:text-primary-strong"
          >
            <Icon name="eye" size={14} />
            {id.preview.openLabel}
          </button>
        </div>
      </Card>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-extrabold text-ink">{id.narration.scenesHeading}</h3>
          {scenes.length > 0 ? (
            <p className={`text-xs font-bold ${durationMatches ? "text-success" : "text-warning"}`}>
              {id.narration.totalDuration
                .replace("{total}", formatDuration(totalDuration))
                .replace("{target}", formatDuration(config.durationSec))}
              {" · "}
              {durationMatches ? id.narration.durationMatch : id.narration.durationWarning}
            </p>
          ) : null}
        </div>

        {scenes.length === 0 ? (
          <EmptyState
            title={id.narration.scenesHeading}
            description={id.narration.emptyScenes}
            icon="fileText"
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="primary" onClick={onSendPrompt} leftIcon={<Icon name="send" size={18} />}>
                  {id.narration.sendButton}
                </Button>
                <Button variant="secondary" onClick={onOpenPaste} leftIcon={<Icon name="paste" size={18} />}>
                  {id.paste.title}
                </Button>
              </div>
            }
          />
        ) : (
          <div className="space-y-3">
            {scenes.map((scene, index) => {
              const speed = wordsPerSecond(scene.narration, scene.durationSec);
              const hasNarration = scene.narration.trim().length > 0;
              const speedIsGood = speed >= 2.3 && speed <= 3.2;
              const speedLabel = !hasNarration
                ? ""
                : speed > 3.2
                  ? id.narration.wordsPerSecondFast
                  : speed < 2.3
                    ? id.narration.wordsPerSecondSlow
                    : id.narration.wordsPerSecondGood;
              return (
                <div
                  key={scene.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggedIndex !== null && draggedIndex !== index) {
                      moveScene(draggedIndex, index);
                    }
                    setDraggedIndex(null);
                  }}
                  className={draggedIndex === index ? "opacity-60" : undefined}
                >
                  <Card variant="raised" padding="sm" className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span
                        draggable
                        onDragStart={(event) => {
                          setDraggedIndex(index);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => setDraggedIndex(null)}
                        aria-label={id.narration.dragScene}
                        className="flex h-9 w-8 cursor-grab items-center justify-center rounded-md text-muted hover:bg-bg-sunken active:cursor-grabbing"
                      >
                        <Icon name="gripVertical" size={18} />
                      </span>
                      <p className="text-sm font-extrabold text-ink">
                        {id.narration.sceneLabel.replace("{number}", String(index + 1))}
                      </p>
                      <div className="ml-auto flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveScene(index, index - 1)}
                          disabled={index === 0}
                          aria-label={id.narration.moveUp}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-bg-sunken disabled:opacity-30"
                        >
                          <Icon name="arrowUp" size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveScene(index, index + 1)}
                          disabled={index === scenes.length - 1}
                          aria-label={id.narration.moveDown}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-bg-sunken disabled:opacity-30"
                        >
                          <Icon name="arrowDown" size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeScene(index)}
                          aria-label={id.narration.deleteScene}
                          className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </div>

                    <Textarea
                      label={id.narration.narrationLabel}
                      value={scene.narration}
                      onChange={(event) => updateScene(index, { narration: event.target.value })}
                      autoResize
                      maxLength={5000}
                      showCount
                    />
                    <Textarea
                      label={id.narration.visualLabel}
                      value={scene.visual}
                      onChange={(event) => updateScene(index, { visual: event.target.value })}
                      rows={2}
                      maxLength={2000}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="neu-label">{id.narration.durationLabel}</p>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateScene(index, { durationSec: clamp(scene.durationSec - 0.5, APP_CONFIG.minSceneDuration, APP_CONFIG.maxSceneDuration) })}
                            aria-label="Kurangi durasi scene"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-muted shadow-neu-sm"
                          >
                            <Icon name="minus" size={15} />
                          </button>
                          <span className="min-w-[58px] text-center text-sm font-extrabold text-ink">
                            {formatDuration(scene.durationSec)}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateScene(index, { durationSec: clamp(scene.durationSec + 0.5, APP_CONFIG.minSceneDuration, APP_CONFIG.maxSceneDuration) })}
                            aria-label="Tambah durasi scene"
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-muted shadow-neu-sm"
                          >
                            <Icon name="plus" size={15} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="neu-label">{id.narration.themeLabel}</p>
                        <Segmented
                          ariaLabel={id.narration.themeLabel}
                          value={scene.theme}
                          onChange={(value: SceneTheme) => updateScene(index, { theme: value })}
                          options={[
                            { value: "paper", label: id.narration.themeOptions.paper },
                            { value: "dusk", label: id.narration.themeOptions.dusk },
                            { value: "night", label: id.narration.themeOptions.night }
                          ]}
                        />
                      </div>

                      {hasNarration ? (
                        <p className={`text-xs font-bold ${speedIsGood ? "text-success" : "text-warning"}`}>
                          {speedLabel} · {id.narration.wordsPerSecond.replace("{value}", formatNumber(speed, 1))}
                        </p>
                      ) : null}
                    </div>

                    {scene.audioMs ? (
                      <p className="text-[11px] font-semibold text-muted">
                        {id.voice.durationActual.replace("{duration}", formatDuration(scene.audioMs / 1000))}
                      </p>
                    ) : null}
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        <Button
          variant="secondary"
          fullWidth
          className="mt-3"
          onClick={addScene}
          disabled={scenes.length >= APP_CONFIG.maxScenes}
          leftIcon={<Icon name="plus" size={18} />}
        >
          {id.narration.addScene}
        </Button>
      </div>
    </section>
  );
}
