import type { SfxEvent } from "@/lib/engine/types";
import { playSfxEvent } from "@/lib/engine/sfx";
import { buildTimeline, sceneAtOrBefore } from "@/lib/engine/timeline";

export interface ExportScene {
  durationSec: number;
  audioPath: string | null;
}

export interface ExportOptions {
  canvas: HTMLCanvasElement;
  scenes: ExportScene[];
  scenePause: number;
  sfxByScene: Record<number, SfxEvent[]>;
  renderAt: (sceneIndex: number, localTime: number) => Promise<void>;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export interface ExportResult {
  blob: Blob;
  mimeType: string;
  extension: string;
}

export function isVideoExportSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined" &&
    "captureStream" in HTMLCanvasElement.prototype
  );
}

export function getSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm"
  ];
  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "video/webm";
}

export function extensionForMimeType(mimeType: string): string {
  return mimeType.includes("mp4") ? "mp4" : "webm";
}

export async function exportVideo(options: ExportOptions): Promise<ExportResult> {
  if (!isVideoExportSupported()) {
    throw new Error("Browser ini tidak mendukung export video. Coba Chrome terbaru.");
  }
  const mimeType = getSupportedMimeType();
  if (!mimeType) {
    throw new Error("Format video tidak didukung browser ini.");
  }
  const audioContext = new AudioContext();
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }
  const audioDestination = audioContext.createMediaStreamDestination();
  const canvasStream = options.canvas.captureStream(30);
  audioDestination.stream.getAudioTracks().forEach((track) => canvasStream.addTrack(track));

  const recorder = new MediaRecorder(canvasStream, {
    mimeType,
    videoBitsPerSecond: 5_000_000,
    audioBitsPerSecond: 128_000
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  const timeline = buildTimeline(options.scenes, options.scenePause);
  const totalDuration = timeline.total;
  const audioBuffers = await Promise.all(
    options.scenes.map(async (scene) => {
      if (!scene.audioPath) return null;
      try {
        const response = await fetch(scene.audioPath);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        return await audioContext.decodeAudioData(arrayBuffer);
      } catch {
        return null;
      }
    })
  );

  const scheduledStart = audioContext.currentTime + 0.2;
  timeline.scenes.forEach((timelineScene) => {
    const buffer = audioBuffers[timelineScene.index];
    if (buffer) {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioDestination);
      source.start(scheduledStart + timelineScene.start);
    }
    const events = options.sfxByScene[timelineScene.index] ?? [];
    events.forEach((event) => playSfxEvent(audioContext, audioDestination, event, scheduledStart + timelineScene.start));
  });

  const waitMilliseconds = Math.max(0, (scheduledStart - audioContext.currentTime) * 1000);
  await new Promise((resolve) => window.setTimeout(resolve, waitMilliseconds));

  let cancelled = false;
  const handleAbort = () => {
    cancelled = true;
  };
  options.signal?.addEventListener("abort", handleAbort);

  let loopError: unknown = null;
  recorder.start(250);
  const videoStart = performance.now();
  try {
    await new Promise<void>((resolve, reject) => {
      const tick = async (now: number) => {
        if (cancelled) {
          resolve();
          return;
        }
        const elapsed = (now - videoStart) / 1000;
        if (elapsed >= totalDuration) {
          options.onProgress?.(100);
          resolve();
          return;
        }
        const frame = sceneAtOrBefore(timeline, elapsed);
        if (frame) {
          try {
            await options.renderAt(frame.sceneIndex, frame.localTime);
          } catch (error) {
            reject(error);
            return;
          }
        }
        options.onProgress?.(Math.min(99, (elapsed / Math.max(totalDuration, 0.1)) * 100));
        window.requestAnimationFrame((next) => void tick(next));
      };
      window.requestAnimationFrame((now) => void tick(now));
    });
  } catch (error) {
    loopError = error;
  } finally {
    options.signal?.removeEventListener("abort", handleAbort);
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
    await stopped;
    canvasStream.getTracks().forEach((track) => track.stop());
    await audioContext.close();
  }

  if (loopError) {
    throw loopError;
  }
  if (cancelled) {
    throw new Error("Export dibatalkan.");
  }
  const blob = new Blob(chunks, { type: mimeType });
  return { blob, mimeType, extension: extensionForMimeType(mimeType) };
}
