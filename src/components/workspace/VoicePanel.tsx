"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Progress } from "@/components/ui/Progress";
import { useToast } from "@/components/ui/Toast";
import { SceneAudioPlayer } from "@/components/workspace/SceneAudioPlayer";
import { BgmAudioMixer } from "@/components/workspace/BgmAudioMixer";
import { APP_CONFIG } from "@/config/app";
import { api, audioUrl } from "@/lib/api";
import { messageFromError } from "@/lib/errors";
import { id } from "@/lib/i18n/id";
import { previewWithWebSpeech } from "@/lib/tts/webSpeech";
import { clamp, formatDuration } from "@/lib/utils";
import { useProjectStore } from "@/store/project";
import type { Voice } from "@/types";

export interface VoicePanelProps {
  generateSignal: number;
}

function measureAudio(source: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    let settled = false;
    const finish = (duration: number) => {
      if (settled) return;
      settled = true;
      audio.src = "";
      resolve(duration);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      finish(Number.isFinite(audio.duration) ? audio.duration : 0);
    };
    audio.onerror = () => finish(0);
    window.setTimeout(() => finish(0), 8000);
    audio.src = source;
  });
}

export function VoicePanel({ generateSignal }: VoicePanelProps) {
  const { showToast } = useToast();
  const config = useProjectStore((state) => state.config);
  const scenes = useProjectStore((state) => state.scenes);
  const updateConfig = useProjectStore((state) => state.updateConfig);
  const updateScene = useProjectStore((state) => state.updateScene);
  const [voices, setVoices] = useState<Voice[]>(APP_CONFIG.ttsVoices.map((voice) => ({ ...voice })));
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [failedIndexes, setFailedIndexes] = useState<number[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const lastSignal = useRef(0);
  const generateAllRef = useRef<() => Promise<void>>(async () => undefined);

  useEffect(() => {
    let active = true;
    api
      .listVoices()
      .then((result) => {
        if (active && result.length > 0) setVoices(result);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function generateScene(index: number, announce = true): Promise<boolean> {
    const scene = useProjectStore.getState().scenes[index];
    const currentConfig = useProjectStore.getState().config;
    if (!scene || !scene.narration.trim()) {
      showToast(id.voice.empty, "warning");
      return false;
    }
    setGeneratingIndex(index);
    setFailedIndexes((current) => current.filter((item) => item !== index));
    try {
      const result = await api.synthesize({
        text: scene.narration,
        voiceId: currentConfig.voiceId,
        speed: currentConfig.voiceSpeed
      });
      const audioSeconds = await measureAudio(audioUrl(result.url));
      const latestScene = useProjectStore.getState().scenes[index];
      if (latestScene) {
        const measured = audioSeconds > 0 ? audioSeconds : latestScene.durationSec;
        updateScene(index, {
          audioPath: result.url,
          audioMs: Math.round(measured * 1000),
          durationSec: Math.max(latestScene.durationSec, measured + 0.4)
        });
      }
      if (announce) {
        showToast(id.voice.sceneDone.replace("{number}", String(index + 1)), "success");
      }
      return true;
    } catch (error) {
      setFailedIndexes((current) => (current.includes(index) ? current : [...current, index]));
      showToast(messageFromError(error) || id.voice.ttsFailed, "error");
      return false;
    } finally {
      setGeneratingIndex(null);
    }
  }

  async function generateAll() {
    if (generatingAll) return;
    const currentScenes = useProjectStore.getState().scenes;
    if (currentScenes.length === 0) {
      showToast(id.voice.empty, "warning");
      return;
    }
    const targets = currentScenes
      .map((scene, index) => ({ scene, index }))
      .filter(({ scene }) => scene.narration.trim() && !scene.audioPath);
    if (targets.length === 0) {
      showToast(id.voice.allDone, "info");
      return;
    }
    setGeneratingAll(true);
    setProgress({ current: 0, total: targets.length });
    let succeeded = 0;
    for (let position = 0; position < targets.length; position += 1) {
      const success = await generateScene(targets[position].index, false);
      if (success) succeeded += 1;
      setProgress({ current: position + 1, total: targets.length });
      if (!success) break;
      await new Promise((resolve) => window.setTimeout(resolve, 120));
    }
    setGeneratingAll(false);
    if (succeeded > 0) {
      showToast(id.voice.allDone, "success");
    }
  }

  useEffect(() => {
    generateAllRef.current = generateAll;
  });

  useEffect(() => {
    if (generateSignal > 0 && generateSignal !== lastSignal.current) {
      lastSignal.current = generateSignal;
      void generateAllRef.current();
    }
  }, [generateSignal]);

  function playSample(voice: Voice) {
    const supported = previewWithWebSpeech(`${voice.name}. ${id.voice.sampleText}`, "id-ID", config.voiceSpeed);
    if (!supported) {
      showToast(id.voice.previewUnsupported, "warning");
    }
  }

  const narratedScenes = scenes.filter((scene) => scene.narration.trim().length > 0);
  const progressValue = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const busy = generatingAll || generatingIndex !== null;

  return (
    <section className="space-y-4">
      <Card variant="raised" padding="md" className="space-y-4">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-ink">{id.voice.title}</h2>
          <p className="mt-0.5 text-xs text-muted">{id.voice.subtitle}</p>
        </div>

        <div>
          <p className="neu-label">{id.voice.selectVoice}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {voices.map((voice) => {
              const selected = config.voiceId === voice.id;
              return (
                <Card
                  key={voice.id}
                  interactive
                  selected={selected}
                  padding="sm"
                  className="flex items-center gap-3"
                  onClick={() => updateConfig({ voiceId: voice.id })}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-strong shadow-neu-sm">
                    <Icon name="mic" size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-ink">{voice.name}</span>
                    <span className="block truncate text-[11px] text-muted">{voice.description}</span>
                  </span>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      playSample(voice);
                    }}
                    aria-label={`${id.voice.sample}: ${voice.name}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg text-primary-strong shadow-neu-sm active:shadow-neu-press"
                  >
                    <Icon name="volume" size={16} />
                  </button>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="neu-label mb-0">{id.voice.speed}</p>
            <span className="text-sm font-extrabold text-primary-strong">{config.voiceSpeed.toFixed(2)}×</span>
          </div>
          <input
            type="range"
            min={APP_CONFIG.ttsSpeed.min}
            max={APP_CONFIG.ttsSpeed.max}
            step={APP_CONFIG.ttsSpeed.step}
            value={config.voiceSpeed}
            onChange={(event) => updateConfig({ voiceSpeed: Number(event.target.value) })}
            aria-label={id.voice.speed}
            className="neu-range mt-2"
          />
        </div>

        <div>
          <label htmlFor="scene-pause" className="neu-label">
            {id.voice.pause}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="scene-pause"
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={config.scenePause}
              onChange={(event) => updateConfig({ scenePause: clamp(Number(event.target.value), 0, 2) })}
              className="neu-field max-w-[120px]"
            />
            <span className="text-sm font-semibold text-muted">dtk</span>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-bg p-3 shadow-neu-sm">
          <Button
            variant="primary"
            fullWidth
            onClick={() => void generateAll()}
            loading={generatingAll}
            disabled={busy || narratedScenes.length === 0}
            leftIcon={<Icon name="volume" size={18} />}
          >
            {generatingAll ? id.voice.generating : id.voice.generateAll}
          </Button>
          {progress.total > 0 ? (
            <div className="mt-3">
              <Progress
                value={progressValue}
                label={id.voice.progress.replace("{current}", String(progress.current)).replace("{total}", String(progress.total))}
                showValue
              />
            </div>
          ) : null}
        </div>
      </Card>

      <BgmAudioMixer />

      {scenes.length === 0 ? (
        <EmptyState title={id.voice.empty} description={id.narration.emptyScenes} icon="mic" />
      ) : (
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-ink">{id.narration.scenesHeading}</h3>
          {scenes.map((scene, index) => {
            const failed = failedIndexes.includes(index);
            const generating = generatingIndex === index;
            const statusLabel = failed ? id.voice.statusError : scene.audioPath ? id.voice.statusReady : id.voice.statusEmpty;
            const statusClass = failed
              ? "bg-danger/10 text-danger"
              : scene.audioPath
                ? "bg-success/10 text-success"
                : "bg-bg-sunken text-muted";
            return (
              <Card key={scene.id} variant="raised" padding="sm" className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-extrabold text-ink">
                    {id.narration.sceneLabel.replace("{number}", String(index + 1))}
                  </p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${statusClass}`}>{statusLabel}</span>
                  <span className="ml-auto text-xs font-bold text-muted">{formatDuration(scene.durationSec)}</span>
                </div>
                <p className="line-clamp-2 text-xs leading-relaxed text-muted">
                  {scene.narration || id.voice.statusEmpty}
                </p>

                {scene.audioPath ? (
                  <SceneAudioPlayer
                    src={audioUrl(scene.audioPath)}
                    label={id.voice.playScene.replace("{number}", String(index + 1))}
                  />
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  {scene.audioMs ? (
                    <p className="text-[11px] font-semibold text-muted">
                      {id.voice.durationActual.replace("{duration}", formatDuration(scene.audioMs / 1000))}
                    </p>
                  ) : (
                    <span />
                  )}
                  <Button
                    variant={scene.audioPath ? "secondary" : "primary"}
                    size="sm"
                    onClick={() => void generateScene(index)}
                    loading={generating}
                    disabled={busy || !scene.narration.trim()}
                    leftIcon={<Icon name="volume" size={16} />}
                  >
                    {scene.audioPath ? id.voice.regenerate : id.voice.generateScene}
                  </Button>
                </div>
                {failed ? <p className="text-xs font-semibold text-danger">{id.voice.ttsFailed}</p> : null}
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
