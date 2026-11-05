"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatClock } from "@/lib/utils";

export interface SceneAudioPlayerProps {
  src: string;
  label: string;
}

export function SceneAudioPlayer({ src, label }: SceneAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setFailed(false);
  }, [src]);

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    const playPromise = audio.play();
    if (playPromise) {
      playPromise
        .then(() => setPlaying(true))
        .catch(() => setFailed(true));
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-line bg-bg px-2 py-1.5">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => setFailed(true)}
        className="hidden"
      />
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={label}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-strong shadow-neu-sm active:shadow-neu-press"
      >
        <Icon name={playing ? "pause" : "play"} size={17} />
      </button>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={currentTime}
        onChange={(event) => {
          const nextTime = Number(event.target.value);
          setCurrentTime(nextTime);
          if (audioRef.current) audioRef.current.currentTime = nextTime;
        }}
        aria-label={label}
        className="h-1.5 min-w-0 flex-1 accent-[var(--primary)]"
      />
      <span className="shrink-0 text-[11px] font-bold tabular-nums text-muted">
        {failed ? "!" : `${formatClock(currentTime * 1000)} / ${formatClock(duration * 1000)}`}
      </span>
    </div>
  );
}
