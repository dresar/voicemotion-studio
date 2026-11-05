"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { api, audioUrl } from "@/lib/api";
import { bgmEngine } from "@/lib/audio/bgmEngine";
import { useProjectStore } from "@/store/project";
import type { BgmTrack } from "@/types";

const FALLBACK_BGM_TRACKS: BgmTrack[] = [
  {
    id: "none",
    name: "Tanpa BGM (Voiceover Saja)",
    category: "Hening",
    bpm: 0,
    mood: "Murni narasi tanpa backsound",
    recommendedVolume: 0,
    duckingRatio: 1,
    synthPreset: "none",
    description: "Fokus 100% pada suara voiceover."
  },
  {
    id: "lofi-chill",
    name: "Lo-Fi Study Beat",
    category: "Lo-Fi & Santai",
    bpm: 80,
    mood: "Fokus, Santai, Storytelling",
    recommendedVolume: 0.2,
    duckingRatio: 0.3,
    synthPreset: "lofi",
    description: "Irama lo-fi lembut dengan chord piano hangat."
  },
  {
    id: "cinematic-ambient",
    name: "Cinematic Ambient Horizon",
    category: "Sinematik & Inspiratif",
    bpm: 90,
    mood: "Epik, Inspiratif, Dokumenter",
    recommendedVolume: 0.18,
    duckingRatio: 0.25,
    synthPreset: "ambient",
    description: "Pad atmosferik luas dengan progresi mendalam."
  },
  {
    id: "acoustic-warmth",
    name: "Acoustic Morning Sunshine",
    category: "Akustik & Hangat",
    bpm: 105,
    mood: "Hangat, Ramah, Keseharian",
    recommendedVolume: 0.22,
    duckingRatio: 0.35,
    synthPreset: "acoustic",
    description: "Petikan dawai hangat dan ritme organik."
  },
  {
    id: "tech-minimal",
    name: "Tech Modern Pulse",
    category: "Teknologi & Bisnis",
    bpm: 115,
    mood: "Futuristik, Inovasi, AI/Tech",
    recommendedVolume: 0.15,
    duckingRatio: 0.3,
    synthPreset: "techno",
    description: "Arpeggio elektronik presisi dan bass digital."
  },
  {
    id: "playful-bounce",
    name: "Playful Bounce Pop",
    category: "Ceria & Cepat",
    bpm: 125,
    mood: "Ceria, Hiburan, Promosi Cepat",
    recommendedVolume: 0.18,
    duckingRatio: 0.4,
    synthPreset: "bounce",
    description: "Ketukan ceria berenergi tinggi yang memikat."
  },
  {
    id: "calm-piano",
    name: "Calm Reflections",
    category: "Menenangkan",
    bpm: 70,
    mood: "Reflektif, Tenang, Narasi Emosional",
    recommendedVolume: 0.2,
    duckingRatio: 0.25,
    synthPreset: "piano",
    description: "Harmoni piano solo yang lembut dan menyentuh."
  }
];

export function BgmAudioMixer() {
  const config = useProjectStore((state) => state.config);
  const scenes = useProjectStore((state) => state.scenes);
  const updateConfig = useProjectStore((state) => state.updateConfig);

  const [tracks, setTracks] = useState<BgmTrack[]>(FALLBACK_BGM_TRACKS);
  const [isPlayingBgm, setIsPlayingBgm] = useState(false);
  const [isTestMixing, setIsTestMixing] = useState(false);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  const activeBgmId = config.bgmTrack || "lofi-chill";
  const bgmVolume = typeof config.bgmVolume === "number" ? config.bgmVolume : 0.2;
  const narrationVolume = typeof config.narrationVolume === "number" ? config.narrationVolume : 1.0;
  const autoDucking = config.autoDucking ?? true;

  const currentTrack = tracks.find((t) => t.id === activeBgmId) || tracks[1] || FALLBACK_BGM_TRACKS[1];

  useEffect(() => {
    let mounted = true;
    api
      .listBgm()
      .then((items) => {
        if (mounted && Array.isArray(items) && items.length > 0) {
          setTracks([FALLBACK_BGM_TRACKS[0], ...items]);
        }
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
      bgmEngine.stop();
      if (testAudioRef.current) {
        testAudioRef.current.pause();
        testAudioRef.current = null;
      }
    };
  }, []);

  function handleToggleBgm() {
    if (isPlayingBgm) {
      bgmEngine.stop();
      setIsPlayingBgm(false);
    } else {
      if (currentTrack.id === "none") return;
      bgmEngine.start(currentTrack.synthPreset, bgmVolume, currentTrack.duckingRatio);
      setIsPlayingBgm(true);
    }
  }

  function handleSelectTrack(trackId: string) {
    const selected = tracks.find((t) => t.id === trackId);
    updateConfig({
      bgmTrack: trackId,
      bgmVolume: selected?.recommendedVolume ?? bgmVolume
    });
    if (isPlayingBgm) {
      if (trackId === "none") {
        bgmEngine.stop();
        setIsPlayingBgm(false);
      } else {
        bgmEngine.start(selected?.synthPreset || "lofi", selected?.recommendedVolume ?? bgmVolume, selected?.duckingRatio ?? 0.3);
      }
    }
  }

  function handleVolumeChange(nextVolume: number) {
    updateConfig({ bgmVolume: nextVolume });
    if (isPlayingBgm) {
      bgmEngine.setVolume(nextVolume);
    }
  }

  function handleTestMix() {
    if (isTestMixing) {
      if (testAudioRef.current) {
        testAudioRef.current.pause();
        testAudioRef.current = null;
      }
      bgmEngine.setDucking(false);
      setIsTestMixing(false);
      return;
    }

    const sceneWithAudio = scenes.find((s) => s.audioPath);
    if (!sceneWithAudio || !sceneWithAudio.audioPath) {
      alert("Belum ada audio narasi yang siap. Silakan klik 'Generate Voice' pada salah satu adegan di atas terlebih dahulu.");
      return;
    }

    if (!isPlayingBgm && currentTrack.id !== "none") {
      bgmEngine.start(currentTrack.synthPreset, bgmVolume, currentTrack.duckingRatio);
      setIsPlayingBgm(true);
    }

    const audio = new Audio(audioUrl(sceneWithAudio.audioPath));
    audio.volume = narrationVolume;
    testAudioRef.current = audio;

    audio.onplay = () => {
      if (autoDucking) {
        bgmEngine.setDucking(true);
      }
    };

    audio.onended = () => {
      bgmEngine.setDucking(false);
      setIsTestMixing(false);
      testAudioRef.current = null;
    };

    audio.onerror = () => {
      bgmEngine.setDucking(false);
      setIsTestMixing(false);
      testAudioRef.current = null;
    };

    setIsTestMixing(true);
    audio.play().catch(() => {
      setIsTestMixing(false);
    });
  }

  return (
    <Card variant="inset" padding="md" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft text-primary-strong">
            <Icon name="music" size={17} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-ink">Musik Latar (BGM) & Audio Layering</h3>
            <p className="text-[11px] font-semibold text-muted">Padukan narasi suara dengan instrumen latar adaptif</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isPlayingBgm ? "secondary" : "ghost"}
            onClick={handleToggleBgm}
            disabled={currentTrack.id === "none"}
            leftIcon={<Icon name={isPlayingBgm ? "pause" : "play"} size={14} />}
          >
            {isPlayingBgm ? "Jeda BGM" : "Putar BGM"}
          </Button>

          <Button
            size="sm"
            variant={isTestMixing ? "danger" : "primary"}
            onClick={handleTestMix}
            leftIcon={<Icon name={isTestMixing ? "stop" : "sliders"} size={14} />}
          >
            {isTestMixing ? "Hentikan Tes Mix" : "Tes Mix Narasi + BGM"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="bgm-select" className="text-xs font-bold text-ink">
            Pilih Trek Musik Latar
          </label>
          <select
            id="bgm-select"
            value={activeBgmId}
            onChange={(e) => handleSelectTrack(e.target.value)}
            className="neu-select w-full text-xs"
          >
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.bpm > 0 ? `(${t.bpm} BPM)` : ""}
              </option>
            ))}
          </select>

          {currentTrack.id !== "none" && (
            <div className="mt-2 space-y-1 rounded-md border border-line bg-bg p-2.5">
              <div className="flex items-center justify-between">
                <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-extrabold text-primary-strong">
                  {currentTrack.category}
                </span>
                <span className="text-[10px] font-bold text-muted">{currentTrack.bpm} BPM</span>
              </div>
              <p className="text-xs font-medium text-ink">{currentTrack.description}</p>
              <p className="text-[10px] italic text-muted">Karakter: {currentTrack.mood}</p>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-md border border-line bg-bg p-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-ink">Volume BGM</span>
              <span className="font-extrabold text-muted tabular-nums">{Math.round(bgmVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={bgmVolume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              disabled={currentTrack.id === "none"}
              className="h-1.5 w-full accent-[var(--primary)]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-ink">Volume Suara Narasi</span>
              <span className="font-extrabold text-muted tabular-nums">{Math.round(narrationVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.05}
              value={narrationVolume}
              onChange={(e) => updateConfig({ narrationVolume: Number(e.target.value) })}
              className="h-1.5 w-full accent-[var(--primary)]"
            />
          </div>

          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={autoDucking}
              onChange={(e) => updateConfig({ autoDucking: e.target.checked })}
              className="h-4 w-4 rounded border-line accent-[var(--primary)]"
            />
            <span className="text-xs font-semibold text-ink">
              Auto-Ducking Cerdas (Turunkan volume BGM saat narasi berbicara)
            </span>
          </label>
        </div>
      </div>
    </Card>
  );
}
