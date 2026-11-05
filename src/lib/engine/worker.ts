import type { AspectRatio, SceneTheme } from "@/types";
import {
  createSceneRuntime,
  drawFallbackScene,
  drawSceneBackground,
  drawSubtitle
} from "@/lib/engine/runtime";
import { compileSceneBody, prescanCode } from "@/lib/engine/sandbox";
import type { CompiledScene } from "@/lib/engine/sandbox";
import type {
  RenderScene,
  SceneCompileError,
  SceneStyleOptions,
  SfxEvent,
  WorkerRequest,
  WorkerResponse
} from "@/lib/engine/types";

const workerGlobal = globalThis as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: WorkerResponse, transfer?: Transferable[]) => void;
};

let canvas: OffscreenCanvas | null = null;
let context: OffscreenCanvasRenderingContext2D | null = null;
let width = 720;
let height = 1280;
let aspect: AspectRatio = "9:16";
let scenes: RenderScene[] = [];
let compiledScenes: Array<CompiledScene | null> = [];
let sfxByScene: Record<number, SfxEvent[]> = {};
let style: SceneStyleOptions = {
  fontFamily: "Plus Jakarta Sans",
  fontWeight: 700,
  fontUrl: "",
  texture: "paper",
  decorationIntensity: 0.45,
  subtitleStyle: "box"
};

async function loadFont(): Promise<void> {
  if (!style.fontUrl || !style.fontFamily) return;
  const fontSet = (globalThis as unknown as { fonts?: FontFaceSet }).fonts;
  if (!fontSet || typeof FontFace === "undefined") return;
  try {
    const face = new FontFace(style.fontFamily, `url(${style.fontUrl})`, {
      weight: String(style.fontWeight)
    });
    await face.load();
    fontSet.add(face);
  } catch {
    return;
  }
}

function prepareScenes(): void {
  const errors: SceneCompileError[] = [];
  sfxByScene = {};
  compiledScenes = scenes.map((scene) => {
    const code = scene.code.trim();
    if (!code) {
      return null;
    }
    const scan = prescanCode(code);
    if (!scan.ok) {
      errors.push({ sceneIndex: scene.index, message: scan.reason, forbidden: true });
      return null;
    }
    let compiled: CompiledScene;
    try {
      compiled = compileSceneBody(code);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kode tidak bisa dikompilasi.";
      errors.push({ sceneIndex: scene.index, message, forbidden: false });
      return null;
    }

    if (!context) {
      return compiled;
    }

    const collected: SfxEvent[] = [];
    try {
      const sampleTimes = [0, scene.durationSec / 2, scene.durationSec];
      for (const sampleTime of sampleTimes) {
        drawSceneBackground(context, width, height, scene.theme, sampleTime, style.texture, style.decorationIntensity);
        const runtime = createSceneRuntime({
          ctx: context,
          width,
          height,
          aspect,
          theme: scene.theme,
          t: sampleTime,
          duration: scene.durationSec,
          seed: scene.index + 1,
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          collectSfx: true,
          onSfx: (event) => collected.push(event)
        });
        compiled(runtime, context);
        context.clearRect(0, 0, width, height);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kode gagal saat uji coba.";
      errors.push({ sceneIndex: scene.index, message, forbidden: false });
      return null;
    }

    const uniqueEvents = new Map<string, SfxEvent>();
    collected.forEach((event) => {
      const key = `${event.name}-${event.time.toFixed(2)}`;
      if (!uniqueEvents.has(key)) uniqueEvents.set(key, event);
    });
    sfxByScene[scene.index] = Array.from(uniqueEvents.values())
      .sort((first, second) => first.time - second.time)
      .slice(0, 4);

    return compiled;
  });

  workerGlobal.postMessage({ type: "loaded", errors, sfx: sfxByScene });
}

function renderFrame(sceneIndex: number, localTime: number, frameId: number): void {
  if (!canvas || !context) {
    workerGlobal.postMessage({
      type: "error",
      sceneIndex,
      frameId,
      message: "Kanvas engine belum siap."
    });
    return;
  }
  const scene = scenes[sceneIndex];
  if (!scene) {
    workerGlobal.postMessage({ type: "error", sceneIndex, frameId, message: "Scene tidak ditemukan." });
    return;
  }
  context.save();
  context.clearRect(0, 0, width, height);
  drawSceneBackground(context, width, height, scene.theme as SceneTheme, localTime, style.texture, style.decorationIntensity);
  const runtime = createSceneRuntime({
    ctx: context,
    width,
    height,
    aspect,
    theme: scene.theme,
    t: localTime,
    duration: scene.durationSec,
    seed: scene.index + 1,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight
  });
  const compiledScene = compiledScenes[sceneIndex];
  try {
    if (compiledScene) {
      compiledScene(runtime, context);
    } else {
      drawFallbackScene(context, runtime, scene.narration, scene.number);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kode scene error saat menggambar.";
    compiledScenes[sceneIndex] = null;
    context.restore();
    workerGlobal.postMessage({ type: "error", sceneIndex, frameId, message });
    return;
  }
  drawSubtitle(
    context,
    width,
    height,
    aspect,
    scene.narration,
    localTime,
    scene.durationSec,
    scene.theme,
    style.fontFamily,
    style.fontWeight,
    style.subtitleStyle
  );
  context.restore();

  const bitmap = canvas.transferToImageBitmap();
  workerGlobal.postMessage({ type: "frame", frameId, bitmap }, [bitmap]);
}

workerGlobal.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  if (message.type === "init") {
    width = message.width;
    height = message.height;
    aspect = message.aspect;
    scenes = message.scenes;
    style = message.style;
    canvas = new OffscreenCanvas(width, height);
    context = canvas.getContext("2d");
    if (!context) {
      workerGlobal.postMessage({ type: "error", sceneIndex: 0, message: "Canvas 2D tidak tersedia di worker." });
      return;
    }
    await loadFont();
    prepareScenes();
    return;
  }
  if (message.type === "load") {
    scenes = message.scenes;
    prepareScenes();
    return;
  }
  if (message.type === "render") {
    renderFrame(message.sceneIndex, message.t, message.frameId);
  }
};
