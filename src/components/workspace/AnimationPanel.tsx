"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Progress } from "@/components/ui/Progress";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { ExportModal } from "@/components/modals/ExportModal";
import type { UpgradeReason } from "@/components/modals/UpgradeModal";
import { APP_CONFIG } from "@/config/app";
import { api, audioUrl } from "@/lib/api";
import { extensionForMimeType, exportVideo, getSupportedMimeType, isVideoExportSupported } from "@/lib/engine/export";
import { SceneRenderer } from "@/lib/engine/renderer";
import { createSfxPlayer } from "@/lib/engine/sfx";
import type { SfxPlayer } from "@/lib/engine/sfx";
import { buildTimeline, sceneAtOrBefore } from "@/lib/engine/timeline";
import type { SceneCompileError, SfxEvent } from "@/lib/engine/types";
import { messageFromError } from "@/lib/errors";
import { id } from "@/lib/i18n/id";
import { buildRepairPrompt } from "@/lib/prompt/buildPrompt";
import { copyText, downloadBlob, formatClock, getAspectSize, isTrialExpired, makeId, sanitizeFilename } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useProjectStore } from "@/store/project";

export interface AnimationPanelProps {
  onUpgrade?: () => void;
  exportSignal: number;
  onOpenPaste: () => void;
  onSendAllScenes: () => void;
  onSendScene: (sceneIndex: number) => void;
  onCopyCodePrompt: (sceneIndex: number) => void;
  onPreviewCodePrompt: (sceneIndex: number) => void;
}

export function AnimationPanel({
  onUpgrade,
  exportSignal,
  onOpenPaste,
  onSendAllScenes,
  onSendScene,
  onCopyCodePrompt,
  onPreviewCodePrompt
}: AnimationPanelProps) {
  const { showToast } = useToast();
  const scenes = useProjectStore((state) => state.scenes);
  const config = useProjectStore((state) => state.config);
  const updateScene = useProjectStore((state) => state.updateScene);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const title = useProjectStore((state) => state.title);
  const user = useAuthStore((state) => state.user);

  const [activeSceneIndex, setActiveSceneIndexState] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayheadState] = useState(0);
  const [muted, setMuted] = useState(false);
  const [compileErrors, setCompileErrors] = useState<SceneCompileError[]>([]);
  const [sfxByScene, setSfxByScene] = useState<Record<number, SfxEvent[]>>({});
  const [runtimeError, setRuntimeError] = useState<{ sceneIndex: number; message: string } | null>(null);
  const [fatalMessage, setFatalMessage] = useState("");
  const [rendererKey, setRendererKey] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [codeDraft, setCodeDraft] = useState("");
  const [showGuides, setShowGuides] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioElementRef = useRef<HTMLAudioElement>(null);
  const rendererRef = useRef<SceneRenderer | null>(null);
  const sfxPlayerRef = useRef<SfxPlayer | null>(null);
  const sfxBySceneRef = useRef<Record<number, SfxEvent[]>>({});
  const playingRef = useRef(false);
  const mutedRef = useRef(false);
  const playheadRef = useRef(0);
  const activeSceneIndexRef = useRef(0);
  const timelineRef = useRef(buildTimeline(scenes, config.scenePause));
  const rafRef = useRef<number | null>(null);
  const audioSourceRef = useRef("");
  const lastExportSignal = useRef(0);
  const exportAbortRef = useRef<AbortController | null>(null);
  const requestExportRef = useRef<() => void>(() => undefined);

  const sceneSignature = useMemo(
    () =>
      scenes
        .map((scene) => [scene.id, scene.idx, scene.code, scene.theme, scene.durationSec, scene.narration].join("~"))
        .join("|"),
    [scenes]
  );

  const timeline = useMemo(() => buildTimeline(scenes, config.scenePause), [scenes, config.scenePause]);
  const totalDuration = timeline.total;
  const activeScene = scenes[activeSceneIndex] ?? null;
  const activeCode = activeScene?.code ?? "";
  const activeCompileError = compileErrors.find((error) => error.sceneIndex === activeSceneIndex);
  const activeRuntimeError = runtimeError?.sceneIndex === activeSceneIndex ? runtimeError.message : "";
  const activeError = activeRuntimeError || activeCompileError?.message || "";
  const activeStatus = activeError ? "error" : activeCode.trim() ? "ok" : "empty";
  const activeStatusLabel =
    activeStatus === "error" ? id.animation.statusError : activeStatus === "ok" ? id.animation.statusOk : id.animation.statusEmpty;
  const activeStatusClass =
    activeStatus === "error"
      ? "bg-danger/10 text-danger"
      : activeStatus === "ok"
        ? "bg-success/10 text-success"
        : "bg-bg-sunken text-muted";
  const mimeType = getSupportedMimeType();
  const formatLabel = extensionForMimeType(mimeType || "video/webm").toUpperCase();
  const remainingCredits = user?.credits ?? 0;
  const cost = APP_CONFIG.creditCostExport;

  useEffect(() => {
    timelineRef.current = timeline;
  }, [timeline]);

  useEffect(() => {
    sfxBySceneRef.current = sfxByScene;
  }, [sfxByScene]);

  useEffect(() => {
    mutedRef.current = muted;
    if (audioElementRef.current) audioElementRef.current.muted = muted;
    sfxPlayerRef.current?.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    setCodeDraft(activeScene?.code ?? "");
  }, [activeSceneIndex, activeScene?.id, activeScene?.code]);

  useEffect(() => {
    sfxPlayerRef.current = createSfxPlayer();
    return () => {
      sfxPlayerRef.current?.dispose();
      sfxPlayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const currentScenes = useProjectStore.getState().scenes;
    const canvas = canvasRef.current;
    if (!canvas || currentScenes.length === 0) return;
    const { width, height } = getAspectSize(config.aspect);
    setFatalMessage("");
    setRuntimeError(null);
    setCompileErrors([]);
    const rendererScenes = currentScenes.map((scene, index) => ({
      index,
      number: index + 1,
      code: scene.code,
      durationSec: scene.durationSec,
      theme: scene.theme,
      narration: scene.narration
    }));
    const font = APP_CONFIG.sceneFonts.find((item) => item.id === config.sceneFont) ?? APP_CONFIG.sceneFonts[0];
    const rendererStyle = {
      fontFamily: font.family,
      fontWeight: font.weight,
      fontUrl: font.url,
      texture: config.texture,
      decorationIntensity: config.decorationIntensity / 100,
      subtitleStyle: config.subtitleStyle
    };
    const renderer = new SceneRenderer(canvas, width, height, config.aspect, rendererScenes, rendererStyle, {
      onLoaded: (errors, sfx) => {
        setCompileErrors(errors);
        setSfxByScene(sfx);
        const store = useProjectStore.getState();
        const errorMap = new Map(errors.map((error) => [error.sceneIndex, error.message]));
        store.scenes.forEach((scene, index) => {
          const message = errorMap.get(index) ?? null;
          const nextStatus = !scene.code.trim() ? "empty" : message ? "error" : "ok";
          if (scene.codeStatus !== nextStatus || (scene.codeError ?? null) !== message) {
            store.updateScene(index, { codeStatus: nextStatus, codeError: message });
          }
        });
        const initialIndex = Math.min(activeSceneIndexRef.current, rendererScenes.length - 1);
        activeSceneIndexRef.current = initialIndex;
        setActiveSceneIndexState(initialIndex);
        void rendererRef.current?.render(initialIndex, 0).catch(() => undefined);
      },
      onError: (message, sceneIndex) => {
        setRuntimeError({ sceneIndex, message });
      },
      onFatal: (message) => {
        setFatalMessage(message);
        playingRef.current = false;
        setPlaying(false);
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        audioElementRef.current?.pause();
      }
    });
    rendererRef.current = renderer;
    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [
    sceneSignature,
    config.aspect,
    config.sceneFont,
    config.texture,
    config.decorationIntensity,
    config.subtitleStyle,
    rendererKey
  ]);

  useEffect(() => {
    if (scenes.length === 0) return;
    if (activeSceneIndexRef.current >= scenes.length) {
      const next = scenes.length - 1;
      activeSceneIndexRef.current = next;
      setActiveSceneIndexState(next);
      void rendererRef.current?.render(next, 0).catch(() => undefined);
    }
  }, [scenes.length]);

  useEffect(() => {
    if (playheadRef.current > totalDuration) {
      playheadRef.current = totalDuration;
      setPlayheadState(totalDuration);
    }
  }, [totalDuration]);

  useEffect(() => {
    requestExportRef.current = requestExport;
  });

  useEffect(() => {
    if (exportSignal > 0 && exportSignal !== lastExportSignal.current) {
      lastExportSignal.current = exportSignal;
      requestExportRef.current();
    }
  }, [exportSignal]);

  useEffect(() => {
    return () => {
      playingRef.current = false;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      exportAbortRef.current?.abort();
    };
  }, []);

  function setActiveScene(index: number) {
    activeSceneIndexRef.current = index;
    setActiveSceneIndexState(index);
  }

  function setPlayheadValue(value: number) {
    playheadRef.current = value;
    setPlayheadState(value);
  }

  function loadSceneAudio(index: number, localTime: number, shouldPlay: boolean) {
    const audio = audioElementRef.current;
    if (!audio) return;
    const scene = useProjectStore.getState().scenes[index];
    if (!scene?.audioPath) {
      audio.pause();
      audio.removeAttribute("src");
      audioSourceRef.current = "";
      audio.load();
      return;
    }
    const source = audioUrl(scene.audioPath);
    const target = Math.max(0, localTime);
    const apply = () => {
      try {
        audio.currentTime = target;
      } catch {
        window.setTimeout(() => {
          try {
            audio.currentTime = target;
          } catch {
            audio.currentTime = 0;
          }
        }, 60);
      }
      if (shouldPlay) {
        void audio.play().catch(() => undefined);
      } else {
        audio.pause();
      }
    };
    audio.muted = mutedRef.current;
    if (audioSourceRef.current !== source) {
      audioSourceRef.current = source;
      audio.src = source;
      audio.onloadedmetadata = apply;
      audio.load();
    } else {
      apply();
    }
  }

  async function startPlayback() {
    if (scenes.length === 0) {
      showToast(id.animation.noScenes, "warning");
      return;
    }
    if (fatalMessage) {
      showToast(fatalMessage, "error");
      return;
    }
    const renderer = rendererRef.current;
    if (!renderer) {
      showToast(id.animation.canvasUnsupported, "warning");
      return;
    }
    await sfxPlayerRef.current?.resume();
    const currentTimeline = timelineRef.current;
    let startAt = playheadRef.current;
    if (startAt >= currentTimeline.total - 0.05) startAt = 0;
    setRuntimeError(null);
    playingRef.current = true;
    setPlaying(true);
    const startedAt = performance.now() - startAt * 1000;
    const initialFrame = sceneAtOrBefore(currentTimeline, startAt);
    if (initialFrame) {
      setActiveScene(initialFrame.sceneIndex);
      loadSceneAudio(initialFrame.sceneIndex, initialFrame.localTime, true);
      sfxPlayerRef.current?.playScene(sfxBySceneRef.current[initialFrame.sceneIndex] ?? []);
    }
    const loop = async (now: number) => {
      if (!playingRef.current) return;
      const elapsed = (now - startedAt) / 1000;
      if (elapsed >= currentTimeline.total) {
        playingRef.current = false;
        setPlaying(false);
        setPlayheadValue(currentTimeline.total);
        audioElementRef.current?.pause();
        return;
      }
      setPlayheadValue(elapsed);
      const frame = sceneAtOrBefore(currentTimeline, elapsed);
      if (frame) {
        if (frame.sceneIndex !== activeSceneIndexRef.current) {
          setActiveScene(frame.sceneIndex);
          loadSceneAudio(frame.sceneIndex, frame.localTime, true);
          sfxPlayerRef.current?.playScene(sfxBySceneRef.current[frame.sceneIndex] ?? []);
        }
        try {
          await renderer.render(frame.sceneIndex, frame.localTime);
        } catch {
          playingRef.current = false;
          setPlaying(false);
          audioElementRef.current?.pause();
          return;
        }
      }
      if (playingRef.current) {
        rafRef.current = requestAnimationFrame((next) => void loop(next));
      }
    };
    rafRef.current = requestAnimationFrame((now) => void loop(now));
  }

  function pausePlayback() {
    playingRef.current = false;
    setPlaying(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    audioElementRef.current?.pause();
  }

  function seekTo(value: number) {
    pausePlayback();
    const clamped = Math.max(0, Math.min(value, timelineRef.current.total));
    setPlayheadValue(clamped);
    const frame = sceneAtOrBefore(timelineRef.current, clamped);
    if (!frame) return;
    setActiveScene(frame.sceneIndex);
    loadSceneAudio(frame.sceneIndex, frame.localTime, false);
    void rendererRef.current?.render(frame.sceneIndex, frame.localTime).catch(() => undefined);
  }

  function selectScene(index: number) {
    const start = timelineRef.current.scenes[index]?.start ?? 0;
    pausePlayback();
    setRuntimeError(null);
    setActiveScene(index);
    setPlayheadValue(start);
    loadSceneAudio(index, 0, false);
    void rendererRef.current?.render(index, 0).catch(() => undefined);
  }

  function skipScene(direction: number) {
    const next = Math.max(0, Math.min(scenes.length - 1, activeSceneIndexRef.current + direction));
    selectScene(next);
  }

  function requestExport() {
    if (scenes.length === 0) {
      showToast(id.animation.noScenes, "warning");
      return;
    }
    if (!scenes.every((scene) => scene.audioPath)) {
      showToast(id.animation.exportNoAudio, "warning");
      return;
    }
    if (!isVideoExportSupported()) {
      showToast(id.animation.exportFailed, "error");
      return;
    }
    setExportOpen(true);
  }

  async function handleExport() {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) {
      showToast(id.animation.exportFailed, "error");
      return;
    }
    pausePlayback();
    setExporting(true);
    setExportProgress(0);
    const controller = new AbortController();
    exportAbortRef.current = controller;
    try {
      const result = await exportVideo({
        canvas,
        scenes: scenes.map((scene) => ({
          durationSec: scene.durationSec,
          audioPath: scene.audioPath ? audioUrl(scene.audioPath) : null
        })),
        scenePause: config.scenePause,
        sfxByScene: sfxBySceneRef.current,
        renderAt: (sceneIndex, localTime) => renderer.render(sceneIndex, localTime),
        onProgress: (percent) => setExportProgress(percent),
        signal: controller.signal
      });
      if (controller.signal.aborted) {
        throw new Error("cancelled");
      }
      try {
        const spend = await api.spendCredit({ amount: cost, reason: "export", ref: makeId() });
        useAuthStore.getState().setCredits(spend.credits);
      } catch {
        // Open source - bypass credit failure
      }
      downloadBlob(result.blob, `${sanitizeFilename(title || "voicemotion")}.${result.extension}`);
      if (activeProjectId) {
        try {
          await api.createExport({
            projectId: activeProjectId,
            status: "done",
            format: result.extension,
            sizeBytes: result.blob.size
          });
        } catch {
          showToast(id.animation.exportLogFailed, "warning");
        }
      }
      showToast(id.animation.exportSuccess, "success");
    } catch (error) {
      const message = controller.signal.aborted ? id.animation.exportCancelled : messageFromError(error);
      showToast(message, "error");
    } finally {
      setExporting(false);
      setExportProgress(0);
      setExportOpen(false);
      exportAbortRef.current = null;
    }
  }

  function cancelExport() {
    exportAbortRef.current?.abort();
  }

  function retryEngine() {
    setFatalMessage("");
    setRuntimeError(null);
    setCompileErrors([]);
    setRendererKey((current) => current + 1);
  }

  function applyFallback() {
    if (!activeScene) return;
    updateScene(activeSceneIndex, { code: "", codeStatus: "empty", codeError: null });
    setCodeDraft("");
    setRuntimeError(null);
  }

  async function copyRepairPrompt() {
    if (!activeScene || !activeError) return;
    const prompt = buildRepairPrompt({
      kind: "kode scene",
      errors: [activeError],
      previousAnswer: activeScene.code,
      formatReminder: "Jawab dengan satu blok js berisi penanda // ===== SCENE N ====="
    });
    const copied = await copyText(prompt);
    showToast(copied ? id.paste.repairCopied : id.paste.clipboardDenied, copied ? "success" : "warning");
  }

  function applyCodeDraft() {
    if (!activeScene) return;
    updateScene(activeSceneIndex, {
      code: codeDraft,
      codeStatus: codeDraft.trim() ? "ok" : "empty",
      codeError: null
    });
    setRuntimeError(null);
    showToast(id.animation.codeSaved, "success");
  }

  function sceneStatus(index: number): "ok" | "error" | "empty" {
    if (compileErrors.some((error) => error.sceneIndex === index) || runtimeError?.sceneIndex === index) {
      return "error";
    }
    return scenes[index]?.code.trim() ? "ok" : "empty";
  }

  return (
    <section className="space-y-4">
      <Card variant="raised" padding="sm" className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-strong shadow-neu-sm">
          <Icon name="film" size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-extrabold tracking-tight text-ink">{id.animation.title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{id.animation.subtitle}</p>
        </div>
      </Card>

      {scenes.length === 0 ? (
        <EmptyState title={id.animation.noScenes} description={id.narration.emptyScenes} icon="film" />
      ) : (
        <>
          <Card variant="raised" padding="sm" className="space-y-3">
            <div className="relative mx-auto flex w-full justify-center overflow-hidden rounded-lg bg-ink p-1">
              <canvas ref={canvasRef} className="block max-h-[62dvh] w-auto max-w-full rounded-md" aria-label={id.animation.preview} />
              {showGuides ? (
                <div className="pointer-events-none absolute inset-1 rounded-md border border-white/40" aria-hidden="true">
                  <div className="absolute inset-[8%] border border-dashed border-white/35" />
                  <div className="absolute inset-x-[8%] top-[63%] border-t border-dashed border-white/35" />
                  <div className="absolute inset-x-[8%] top-[72%] border-t-2 border-dashed border-primary/80" />
                </div>
              ) : null}
              {fatalMessage ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/85 p-4 text-center text-white">
                  <Icon name="alertTriangle" size={26} />
                  <p className="max-w-xs text-sm font-bold">{fatalMessage}</p>
                  <Button variant="secondary" size="sm" onClick={retryEngine} leftIcon={<Icon name="refresh" size={16} />}>
                    {id.animation.retryEngine}
                  </Button>
                </div>
              ) : null}
            </div>

            <audio ref={audioElementRef} className="hidden" preload="auto" />

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => skipScene(-1)}
                disabled={activeSceneIndex === 0}
                aria-label={id.animation.previousScene}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-bg text-muted shadow-neu-sm disabled:opacity-40"
              >
                <Icon name="skipBack" size={18} />
              </button>
              <button
                type="button"
                onClick={() => void (playing ? pausePlayback() : startPlayback())}
                aria-label={playing ? id.animation.pause : id.animation.play}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-strong text-white shadow-neu-sm"
              >
                <Icon name={playing ? "pause" : "play"} size={24} />
              </button>
              <button
                type="button"
                onClick={() => skipScene(1)}
                disabled={activeSceneIndex === scenes.length - 1}
                aria-label={id.animation.nextScene}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-bg text-muted shadow-neu-sm disabled:opacity-40"
              >
                <Icon name="skipForward" size={18} />
              </button>
              <button
                type="button"
                onClick={() => setMuted((current) => !current)}
                aria-label={muted ? id.common.unmute : id.common.mute}
                aria-pressed={muted}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-bg text-muted shadow-neu-sm"
              >
                <Icon name={muted ? "volumeOff" : "volume"} size={18} />
              </button>
              <button
                type="button"
                onClick={() => setShowGuides((current) => !current)}
                aria-label={id.animation.guides}
                aria-pressed={showGuides}
                className={`flex h-11 w-11 items-center justify-center rounded-full shadow-neu-sm ${
                  showGuides ? "bg-primary-soft text-primary-strong shadow-neu-press" : "bg-bg text-muted"
                }`}
              >
                <Icon name="grid" size={17} />
              </button>
              <span className="ml-1 text-xs font-extrabold text-muted">
                {activeSceneIndex + 1}/{scenes.length}
              </span>
            </div>

            <div>
              <input
                type="range"
                min={0}
                max={Math.max(totalDuration, 0.1)}
                step={0.05}
                value={Math.min(playhead, totalDuration)}
                onChange={(event) => seekTo(Number(event.target.value))}
                aria-label={id.animation.scrub}
                className="neu-range"
              />
              <div className="flex justify-between text-[11px] font-bold tabular-nums text-muted">
                <span>{formatClock(playhead * 1000)}</span>
                <span>{formatClock(totalDuration * 1000)}</span>
              </div>
            </div>
          </Card>

          <div className="neu-scroll-x" aria-label={id.animation.sceneStrip}>
            {scenes.map((scene, index) => {
              const status = sceneStatus(index);
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => selectScene(index)}
                  aria-pressed={index === activeSceneIndex}
                  className={`flex h-10 min-w-[52px] items-center justify-center gap-1 rounded-md px-2 text-xs font-extrabold shadow-neu-sm transition ${
                    index === activeSceneIndex ? "bg-primary-soft text-primary-strong shadow-neu-press" : "bg-bg text-muted"
                  }`}
                >
                  {status === "ok" ? (
                    <Icon name="checkCircle" size={13} className="text-success" />
                  ) : status === "error" ? (
                    <Icon name="alertTriangle" size={13} className="text-danger" />
                  ) : (
                    <Icon name="circle" size={13} className="text-muted" />
                  )}
                  {index + 1}
                </button>
              );
            })}
          </div>

          <Card variant="raised" padding="md" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">{id.animation.sceneStatus}</p>
                <h3 className="text-base font-extrabold text-ink">
                  {id.narration.sceneLabel.replace("{number}", String(activeSceneIndex + 1))}
                </h3>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${activeStatusClass}`}>{activeStatusLabel}</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="secondary" onClick={onSendAllScenes} leftIcon={<Icon name="send" size={16} />}>
                {id.animation.sendAll}
              </Button>
              <Button variant="secondary" onClick={() => onSendScene(activeSceneIndex)} leftIcon={<Icon name="send" size={16} />}>
                {id.animation.sendScene}
              </Button>
              <Button variant="secondary" onClick={() => onCopyCodePrompt(activeSceneIndex)} leftIcon={<Icon name="copy" size={16} />}>
                {id.animation.copyCodePrompt}
              </Button>
              <Button variant="secondary" onClick={onOpenPaste} leftIcon={<Icon name="paste" size={16} />}>
                {id.animation.pasteCode}
              </Button>
            </div>
            <button
              type="button"
              onClick={() => onPreviewCodePrompt(activeSceneIndex)}
              className="flex min-h-[44px] w-full items-center justify-center gap-1 text-xs font-bold text-muted hover:text-primary-strong"
            >
              <Icon name="eye" size={14} />
              {id.preview.openLabel}
            </button>

            {activeError ? (
              <div className="rounded-md border border-danger/30 bg-danger/10 p-3">
                <p className="flex items-center gap-2 text-sm font-extrabold text-danger">
                  <Icon name="alertCircle" size={17} />
                  {id.animation.errorTitle}
                </p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-danger">{activeError}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => void copyRepairPrompt()} leftIcon={<Icon name="copy" size={14} />}>
                    {id.animation.repair}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={applyFallback} leftIcon={<Icon name="shield" size={14} />}>
                    {id.animation.fallback}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={retryEngine} leftIcon={<Icon name="refresh" size={14} />}>
                    {id.animation.retry}
                  </Button>
                </div>
              </div>
            ) : !activeCode.trim() ? (
              <p className="rounded-md border border-warning/30 bg-warning/10 p-2.5 text-xs font-semibold leading-relaxed text-warning">
                {id.animation.fallbackNote}
              </p>
            ) : (
              <p className="rounded-md border border-success/30 bg-success/10 p-2.5 text-xs font-semibold leading-relaxed text-success">
                {id.animation.statusOk}
              </p>
            )}

            <Textarea
              label={id.animation.codeLabel}
              value={codeDraft}
              onChange={(event) => setCodeDraft(event.target.value)}
              placeholder={id.animation.codePlaceholder}
              className="min-h-[220px] font-mono text-xs"
              spellCheck={false}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="max-w-xs text-[11px] leading-relaxed text-muted">{id.animation.codeNote}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={applyCodeDraft}
                disabled={!activeScene || codeDraft === activeScene.code}
                leftIcon={<Icon name="check" size={14} />}
              >
                {id.animation.applyCode}
              </Button>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={requestExport}
              disabled={exporting}
              leftIcon={<Icon name="download" size={18} />}
            >
              {id.animation.export} (Open Source Gratis)
            </Button>
            {exporting ? <Progress value={exportProgress} label={id.animation.exportProgress.replace("{percent}", String(Math.round(exportProgress)))} showValue /> : null}
          </Card>
        </>
      )}

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onConfirm={() => void handleExport()}
        exporting={exporting}
        progress={exportProgress}
        onCancel={cancelExport}
        cost={cost}
        remaining={remainingCredits}
        formatLabel={formatLabel}
      />
    </section>
  );
}
