import type { AspectRatio } from "@/types";
import type { RenderScene, RendererCallbacks, SceneStyleOptions, WorkerResponse } from "@/lib/engine/types";

const frameWatchdogMs = 45;

interface PendingFrame {
  resolve: () => void;
  reject: (error: Error) => void;
  timer: number;
}

export class SceneRenderer {
  private worker: Worker | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private callbacks: RendererCallbacks;
  private pending = new Map<number, PendingFrame>();
  private frameCounter = 0;
  private fatal = false;
  private ready = false;
  private readyResolve: (() => void) | null = null;
  private readyReject: ((error: Error) => void) | null = null;
  private readyPromise: Promise<void>;
  private width: number;
  private height: number;

  constructor(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    aspect: AspectRatio,
    scenes: RenderScene[],
    style: SceneStyleOptions,
    callbacks: RendererCallbacks
  ) {
    this.width = width;
    this.height = height;
    this.callbacks = callbacks;
    canvas.width = width;
    canvas.height = height;
    this.context = canvas.getContext("2d");
    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });
    this.worker = new Worker(new URL("./worker.ts", import.meta.url));
    this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => this.handleMessage(event.data);
    this.worker.onerror = (event) => {
      this.fail(event.message || "Worker engine berhenti.");
    };
    this.worker.postMessage({ type: "init", width, height, aspect, scenes, style });
  }

  private handleMessage(message: WorkerResponse): void {
    if (message.type === "loaded") {
      this.ready = true;
      this.readyResolve?.();
      this.callbacks.onLoaded?.(message.errors, message.sfx);
      return;
    }
    if (message.type === "frame") {
      const pending = this.pending.get(message.frameId);
      if (pending) {
        window.clearTimeout(pending.timer);
        this.pending.delete(message.frameId);
      }
      if (this.context) {
        this.context.clearRect(0, 0, this.width, this.height);
        this.context.drawImage(message.bitmap, 0, 0, this.width, this.height);
      }
      message.bitmap.close();
      pending?.resolve();
      return;
    }
    if (message.type === "error") {
      if (message.frameId !== undefined) {
        const pending = this.pending.get(message.frameId);
        if (pending) {
          window.clearTimeout(pending.timer);
          this.pending.delete(message.frameId);
          pending.reject(new Error(message.message));
        }
      }
      this.callbacks.onError?.(message.message, message.sceneIndex);
      if (message.forbidden) {
        this.callbacks.onFatal?.(message.message);
      }
    }
  }

  async render(sceneIndex: number, localTime: number): Promise<void> {
    if (this.fatal) {
      throw new Error("Engine scene berhenti.");
    }
    if (!this.ready) {
      await this.readyPromise;
    }
    if (!this.worker || this.fatal) {
      throw new Error("Engine scene tidak siap.");
    }
    const frameId = this.frameCounter + 1;
    this.frameCounter = frameId;
    return new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => {
        this.pending.delete(frameId);
        this.fail("Kode scene melewati batas waktu 45 ms per frame.");
        reject(new Error("timeout"));
      }, frameWatchdogMs);
      this.pending.set(frameId, { resolve, reject, timer });
      this.worker?.postMessage({ type: "render", sceneIndex, t: localTime, frameId });
    });
  }

  private fail(message: string): void {
    if (this.fatal) return;
    this.fatal = true;
    this.readyReject?.(new Error(message));
    this.pending.forEach((pending) => {
      window.clearTimeout(pending.timer);
      pending.reject(new Error(message));
    });
    this.pending.clear();
    this.callbacks.onFatal?.(message);
    this.worker?.terminate();
    this.worker = null;
  }

  dispose(): void {
    this.pending.forEach((pending) => {
      window.clearTimeout(pending.timer);
      pending.resolve();
    });
    this.pending.clear();
    this.worker?.terminate();
    this.worker = null;
    this.fatal = true;
  }
}
