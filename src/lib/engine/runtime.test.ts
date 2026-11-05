import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { compileSceneBody, prescanCode } from "@/lib/engine/sandbox";
import { createSceneRuntime, drawSceneBackground, drawSubtitle } from "@/lib/engine/runtime";
import type { SceneTheme } from "@/types";
import type { StylePack } from "@/types";

function createMockContext() {
  const gradient = { addColorStop: vi.fn() };
  const context = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    lineCap: "round",
    lineJoin: "round",
    font: "",
    textAlign: "center",
    textBaseline: "middle",
    shadowColor: "",
    shadowBlur: 0,
    shadowOffsetY: 0,
    createLinearGradient: vi.fn(() => gradient),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn((text: string) => ({ width: text.length * 20 })),
    setLineDash: vi.fn()
  };
  return { context, gradient, typed: context as unknown as OffscreenCanvasRenderingContext2D };
}

function readStylePacks(): StylePack[] {
  const primary = path.resolve(process.cwd(), "backend/data/styles.json");
  const fallback = path.resolve(process.cwd(), "../backend/data/styles.json");
  const filePath = fs.existsSync(primary) ? primary : fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as StylePack[];
}

describe("engine runtime", () => {
  it("menjalankan semua sample code style pack", () => {
    const styles = readStylePacks();
    expect(styles.length).toBeGreaterThanOrEqual(8);
    styles.forEach((style) => {
      const scan = prescanCode(style.sampleCode);
      expect(scan.ok, `${style.slug}: ${scan.reason}`).toBe(true);
      const compiled = compileSceneBody(style.sampleCode);
      const { typed } = createMockContext();
      const runtime = createSceneRuntime({
        ctx: typed,
        width: 720,
        height: 1280,
        aspect: "9:16",
        theme: style.theme as SceneTheme,
        t: 1.5,
        duration: 7.5,
        seed: 1
      });
      expect(() => compiled(runtime, typed)).not.toThrow();
    });
  });

  it("menggambar latar dan subtitle tanpa error", () => {
    const { typed } = createMockContext();
    expect(() => drawSceneBackground(typed, 720, 1280, "night", 1.2)).not.toThrow();
    expect(() => drawSubtitle(typed, 720, 1280, "9:16", "Disiplin dibangun dari langkah kecil.", 1.2, 7.5, "paper")).not.toThrow();
  });

  it("menggambar semua gaya subtitle dan tekstur", () => {
    const { typed } = createMockContext();
    expect(() =>
      drawSubtitle(typed, 720, 1280, "9:16", "Gaya subtitle box.", 1.2, 7.5, "paper", "Playfair Display", 700, "box")
    ).not.toThrow();
    expect(() =>
      drawSubtitle(typed, 720, 1280, "9:16", "Gaya subtitle minimal.", 1.2, 7.5, "night", "Bebas Neue", 400, "minimal")
    ).not.toThrow();
    expect(() =>
      drawSubtitle(typed, 720, 1280, "9:16", "Gaya subtitle sorot.", 1.2, 7.5, "dusk", "Space Grotesk", 700, "highlight")
    ).not.toThrow();
    expect(() => drawSceneBackground(typed, 720, 1280, "paper", 1.2, "grain", 0.8)).not.toThrow();
    expect(() => drawSceneBackground(typed, 720, 1280, "dusk", 1.2, "grid", 0.5)).not.toThrow();
    expect(() => drawSceneBackground(typed, 720, 1280, "night", 1.2, "dots", 0.5)).not.toThrow();
  });

  it("menggambar aset SVG dengan fallback mock canvas", () => {
    const { typed } = createMockContext();
    const runtime = createSceneRuntime({
      ctx: typed,
      width: 720,
      height: 1280,
      aspect: "9:16",
      theme: "paper",
      t: 1,
      duration: 7,
      seed: 9,
      fontFamily: "Playfair Display",
      fontWeight: 700
    });
    expect(() => runtime.asset("spark", 100, 100, { size: 60, color: "#FFFFFF", draw: 0.5 })).not.toThrow();
    expect(() => runtime.asset("tidak-ada", 100, 100)).not.toThrow();
    expect(runtime.font).toBe("Playfair Display");
  });

  it("menghasilkan posisi deterministik dari s.rand", () => {
    const { typed } = createMockContext();
    const runtime = createSceneRuntime({
      ctx: typed,
      width: 720,
      height: 1280,
      aspect: "9:16",
      theme: "paper",
      t: 1,
      duration: 7,
      seed: 42
    });
    expect(runtime.rand(7)).toBe(runtime.rand(7));
    expect(runtime.rand(7)).not.toBe(runtime.rand(8));
  });
});
