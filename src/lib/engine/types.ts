import type { AspectRatio, SceneTheme, SubtitleStyle, TextureStyle } from "@/types";

export interface SceneStyleOptions {
  fontFamily: string;
  fontWeight: number;
  fontUrl: string;
  texture: TextureStyle;
  decorationIntensity: number;
  subtitleStyle: SubtitleStyle;
}

export interface RenderScene {
  index: number;
  number: number;
  code: string;
  durationSec: number;
  theme: SceneTheme;
  narration: string;
}

export interface SfxEvent {
  name: string;
  time: number;
  gain: number;
  pitch: number;
}

export interface SceneCompileError {
  sceneIndex: number;
  message: string;
  forbidden: boolean;
}

export interface WorkerInitMessage {
  type: "init";
  width: number;
  height: number;
  aspect: AspectRatio;
  scenes: RenderScene[];
  style: SceneStyleOptions;
}

export interface WorkerLoadMessage {
  type: "load";
  scenes: RenderScene[];
}

export interface WorkerRenderMessage {
  type: "render";
  sceneIndex: number;
  t: number;
  frameId: number;
}

export type WorkerRequest = WorkerInitMessage | WorkerLoadMessage | WorkerRenderMessage;

export interface WorkerLoadedMessage {
  type: "loaded";
  errors: SceneCompileError[];
  sfx: Record<number, SfxEvent[]>;
}

export interface WorkerFrameMessage {
  type: "frame";
  frameId: number;
  bitmap: ImageBitmap;
}

export interface WorkerErrorMessage {
  type: "error";
  sceneIndex: number;
  message: string;
  frameId?: number;
  forbidden?: boolean;
}

export type WorkerResponse = WorkerLoadedMessage | WorkerFrameMessage | WorkerErrorMessage;

export interface RendererCallbacks {
  onLoaded?: (errors: SceneCompileError[], sfx: Record<number, SfxEvent[]>) => void;
  onError?: (message: string, sceneIndex: number) => void;
  onFatal?: (message: string) => void;
}
