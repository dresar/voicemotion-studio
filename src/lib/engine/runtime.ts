import type { AspectRatio, SceneTheme, SubtitleStyle, TextureStyle } from "@/types";
import { findSceneAsset } from "@/lib/engine/assets";
import type { SfxEvent } from "@/lib/engine/types";

export interface SceneSafeArea {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface DrawOptions {
  fill?: string;
  stroke?: string;
  width?: number;
  alpha?: number;
  draw?: number;
  wobble?: number;
  hatch?: boolean;
  r?: number;
  size?: number;
  color?: string;
  align?: "left" | "center" | "right";
  weight?: number;
  mode?: "rise" | "pop" | "slide" | "fade";
  start?: number;
  gap?: number;
  lineHeight?: number;
  accent?: string;
  accentColor?: string;
  font?: string;
  rotate?: number;
  render?: "fill" | "stroke" | "both";
}

export interface ScenePalette {
  ink: string;
  paper: string;
  red: string;
  pink: string;
  orange: string;
  yellow: string;
  green: string;
  teal: string;
  blue: string;
  navy: string;
  purple: string;
  brown: string;
  sky: string;
  white: string;
  gray: string;
  primary: string;
  accent: string;
}

export interface SceneApi {
  t: number;
  dur: number;
  p: number;
  W: number;
  H: number;
  cx: number;
  cy: number;
  groundY: number;
  safe: SceneSafeArea;
  theme: SceneTheme;
  font: string;
  fontWeight: number;
  c: ScenePalette;
  spring: (start?: number, preset?: string | { damping?: number; stiffness?: number; mass?: number }) => number;
  stagger: (index: number, start?: number, gap?: number, preset?: string) => number;
  keys: (points: Array<[number, number]>, easing?: keyof SceneApi["ease"]) => number;
  at: (start: number, length?: number) => number;
  pop: (start: number, length?: number) => number;
  ease: {
    out: (value: number) => number;
    in: (value: number) => number;
    inOut: (value: number) => number;
    back: (value: number) => number;
    elastic: (value: number) => number;
    outExpo: (value: number) => number;
    inOutExpo: (value: number) => number;
  };
  lerp: (from: number, to: number, amount: number) => number;
  clamp: (value: number, minimum: number, maximum: number) => number;
  wave: (frequency?: number, amplitude?: number, phase?: number) => number;
  rand: (index: number) => number;
  line: (x1: number, y1: number, x2: number, y2: number, options?: DrawOptions) => void;
  polyline: (points: Array<[number, number]>, options?: DrawOptions) => void;
  shape: (points: Array<[number, number]>, options?: DrawOptions) => void;
  curve: (points: Array<[number, number]>, closed?: boolean, options?: DrawOptions) => void;
  rect: (x: number, y: number, width: number, height: number, options?: DrawOptions) => void;
  circle: (x: number, y: number, radius: number, options?: DrawOptions) => void;
  ellipse: (x: number, y: number, radiusX: number, radiusY: number, options?: DrawOptions) => void;
  arc: (x: number, y: number, radius: number, startAngle: number, endAngle: number, options?: DrawOptions) => void;
  text: (value: string, x: number, y: number, options?: DrawOptions) => void;
  check: (x: number, y: number, size: number, options?: DrawOptions) => void;
  cross: (x: number, y: number, size: number, options?: DrawOptions) => void;
  dash: (x1: number, y1: number, x2: number, y2: number, options?: DrawOptions) => void;
  sparkle: (x: number, y: number, size: number, options?: DrawOptions) => void;
  rays: (x: number, y: number, options?: DrawOptions) => void;
  burst: (x: number, y: number, options?: DrawOptions) => void;
  ground: (y?: number, options?: DrawOptions) => void;
  group: (
    transform: { x?: number; y?: number; rotate?: number; scale?: number; alpha?: number },
    draw: () => void
  ) => void;
  card: (x: number, y: number, width: number, height: number, options?: DrawOptions) => void;
  words: (value: string, x: number, y: number, options?: DrawOptions) => void;
  asset: (id: string, x: number, y: number, options?: DrawOptions) => void;
  sfx: (name: string, time?: number, gain?: number, pitch?: number) => void;
}

export interface RuntimeOptions {
  ctx: OffscreenCanvasRenderingContext2D;
  width: number;
  height: number;
  aspect: AspectRatio;
  theme: SceneTheme;
  t: number;
  duration: number;
  seed: number;
  fontFamily?: string;
  fontWeight?: number;
  collectSfx?: boolean;
  onSfx?: (event: SfxEvent) => void;
}

export interface AspectLayout {
  safe: SceneSafeArea;
  subtitleY: number;
  subtitleHeight: number;
  groundY: number;
}

export const palette: ScenePalette = {
  ink: "#1F2D4A",
  paper: "#F7F1DE",
  red: "#EF476F",
  pink: "#F78FB3",
  orange: "#FF8C42",
  yellow: "#FFD166",
  green: "#2A9D8F",
  teal: "#14B8A6",
  blue: "#3F7BFF",
  navy: "#0F172A",
  purple: "#7C5CFC",
  brown: "#8D6E63",
  sky: "#D6E4FF",
  white: "#FFFFFF",
  gray: "#C9D5E7",
  primary: "#3F7BFF",
  accent: "#FF7A1A"
};

const themeBackgrounds: Record<SceneTheme, [string, string]> = {
  paper: ["#FFFDF7", "#E9E2D0"],
  dusk: ["#F6BD60", "#6D597A"],
  night: ["#0F172A", "#1E293B"]
};

function clampValue(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function noiseValue(index: number): number {
  const value = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function fontStack(family: string): string {
  return `"${family}", "Plus Jakarta Sans", Inter, system-ui, sans-serif`;
}

function easeOut(value: number): number {
  const x = clampValue(value, 0, 1);
  return 1 - Math.pow(1 - x, 3);
}

function easeIn(value: number): number {
  const x = clampValue(value, 0, 1);
  return x * x * x;
}

function easeInOut(value: number): number {
  const x = clampValue(value, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutBack(value: number): number {
  const x = clampValue(value, 0, 1);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function easeOutElastic(value: number): number {
  const x = clampValue(value, 0, 1);
  if (x === 0 || x === 1) return x;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

function easeOutExpo(value: number): number {
  const x = clampValue(value, 0, 1);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

function easeInOutExpo(value: number): number {
  const x = clampValue(value, 0, 1);
  if (x === 0 || x === 1) return x;
  return x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
}

export function getAspectLayout(aspect: AspectRatio, width: number, height: number): AspectLayout {
  switch (aspect) {
    case "16:9":
      return {
        safe: { x0: width * (80 / 1280), x1: width * (1200 / 1280), y0: height * (30 / 720), y1: height * (560 / 720) },
        subtitleY: height * (580 / 720),
        subtitleHeight: height * (90 / 720),
        groundY: height * (540 / 720)
      };
    case "1:1":
      return {
        safe: { x0: width * 0.09, x1: width * 0.91, y0: height * 0.03, y1: height * 0.72 },
        subtitleY: height * 0.74,
        subtitleHeight: height * 0.14,
        groundY: height * 0.7
      };
    case "3:4":
      return {
        safe: { x0: width * (80 / 900), x1: width * (820 / 900), y0: height * 0.025, y1: height * (860 / 1200) },
        subtitleY: height * (880 / 1200),
        subtitleHeight: height * (140 / 1200),
        groundY: height * (840 / 1200)
      };
    default:
      return {
        safe: { x0: width * (70 / 720), x1: width * (650 / 720), y0: height * (40 / 1280), y1: height * (800 / 1280) },
        subtitleY: height * (815 / 1280),
        subtitleHeight: height * (85 / 1280),
        groundY: height * (780 / 1280)
      };
  }
}

export function drawSceneBackground(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  theme: SceneTheme,
  t: number,
  texture: TextureStyle = "paper",
  decorationIntensity = 0.45
): void {
  const [start, end] = themeBackgrounds[theme];
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, start);
  gradient.addColorStop(1, end);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  const strength = clampValue(decorationIntensity, 0, 1);

  if (theme === "night") {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    for (let index = 0; index < 32; index += 1) {
      const x = ((index * 137.5) % width) + Math.sin(t * 0.4 + index) * 4;
      const y = ((index * 71.3) % (height * 0.62)) + 20;
      const radius = index % 3 === 0 ? 2.2 : 1.2;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    drawTexture(ctx, width, height, texture, strength, theme);
    return;
  }

  const themeStrength = 0.35 + strength * 0.65;
  if (themeStrength > 0.05) {
    ctx.save();
    ctx.globalAlpha = (theme === "dusk" ? 0.18 : 0.22) * themeStrength;
    ctx.fillStyle = theme === "dusk" ? palette.purple : palette.sky;
    ctx.beginPath();
    ctx.arc(width * 0.82, height * 0.18, width * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = (theme === "dusk" ? 0.14 : 0.16) * themeStrength;
    ctx.fillStyle = theme === "dusk" ? palette.yellow : palette.white;
    ctx.beginPath();
    ctx.arc(width * 0.14, height * 0.34, width * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  drawTexture(ctx, width, height, texture, strength, theme);
}

function drawTexture(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  texture: TextureStyle,
  strength: number,
  theme: SceneTheme
): void {
  if (texture === "none" || strength <= 0) return;
  const ink = theme === "night" ? "#FFFFFF" : "#1F2D4A";
  ctx.save();
  if (texture === "paper") {
    ctx.globalAlpha = 0.02 + strength * 0.035;
    ctx.fillStyle = "#FFF7E4";
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 0.05 + strength * 0.05;
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(0.6, width * 0.0012);
    for (let index = 0; index < 80; index += 1) {
      const x = noiseValue(index * 3 + 1) * width;
      const y = noiseValue(index * 3 + 2) * height;
      const length = 8 + noiseValue(index * 3 + 3) * 32;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + length, y + 1);
      ctx.stroke();
    }
  } else if (texture === "grain") {
    ctx.fillStyle = ink;
    for (let index = 0; index < 160; index += 1) {
      ctx.globalAlpha = 0.04 + noiseValue(index * 2 + 10) * 0.08 * strength;
      const x = noiseValue(index * 2 + 1) * width;
      const y = noiseValue(index * 2 + 2) * height;
      const radius = 0.6 + noiseValue(index * 3 + 4) * 1.8;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (texture === "grid") {
    const spacing = Math.max(32, width / 14);
    ctx.globalAlpha = 0.05 + strength * 0.08;
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(0.6, width * 0.001);
    for (let x = spacing; x < width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height * 0.8);
      ctx.stroke();
    }
    for (let y = spacing; y < height * 0.8; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else if (texture === "dots") {
    const spacing = Math.max(24, width / 20);
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.08 + strength * 0.08;
    for (let y = spacing; y < height * 0.8; y += spacing) {
      for (let x = spacing; x < width; x += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, width * 0.0017), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function roundedRectPath(
  ctx: OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawSubtitle(
  ctx: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  aspect: AspectRatio,
  narration: string,
  t: number,
  duration: number,
  theme: SceneTheme,
  selectedFont = "Plus Jakarta Sans",
  fontWeight = 700,
  style: SubtitleStyle = "box"
): void {
  const words = narration.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return;
  const layout = getAspectLayout(aspect, width, height);
  const revealProgress = clampValue(t / Math.max(duration, 0.1), 0, 1);
  const revealCount = Math.max(1, Math.ceil(revealProgress * words.length));
  const visibleWords = words.slice(0, revealCount);
  const fontSize = Math.max(18, Math.round(height * 0.026));
  const resolvedFont = fontStack(selectedFont);
  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px ${resolvedFont}`;
  const maxWidth = layout.safe.x1 - layout.safe.x0;
  const lines: string[] = [];
  let currentLine = "";
  for (const word of visibleWords) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }
  if (currentLine) lines.push(currentLine);
  const limitedLines = lines.slice(-2);
  const lineHeight = fontSize * 1.3;
  const centerX = layout.safe.x0 + maxWidth / 2;

  if (style === "minimal") {
    const textColor = theme === "paper" ? palette.ink : palette.white;
    const startY = layout.subtitleY - ((limitedLines.length - 1) * lineHeight) / 2;
    const barWidth = Math.max(3, width * 0.005);
    const barHeight = (limitedLines.length - 1) * lineHeight + fontSize * 1.5;
    ctx.fillStyle = palette.primary;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(layout.safe.x0, startY - fontSize * 0.75, barWidth, barHeight);
    ctx.globalAlpha = 1;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = theme === "night" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.8)";
    ctx.shadowBlur = fontSize * 0.45;
    limitedLines.forEach((line, index) => {
      ctx.fillText(line, centerX, startY + index * lineHeight);
    });
    ctx.restore();
    return;
  }

  if (style === "highlight") {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    limitedLines.forEach((line, index) => {
      const y = layout.subtitleY + (index - (limitedLines.length - 1) / 2) * lineHeight;
      const lineWidth = ctx.measureText(line).width;
      const paddingX = fontSize * 0.35;
      const paddingY = fontSize * 0.2;
      ctx.fillStyle = palette.yellow;
      ctx.globalAlpha = 0.94;
      roundedRectPath(
        ctx,
        centerX - lineWidth / 2 - paddingX,
        y - lineHeight / 2 + paddingY,
        lineWidth + paddingX * 2,
        lineHeight - paddingY * 2,
        fontSize * 0.35
      );
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = palette.ink;
      ctx.fillText(line, centerX, y);
    });
    ctx.restore();
    return;
  }

  const boxHeight = Math.max(layout.subtitleHeight, limitedLines.length * lineHeight + fontSize * 0.8);
  const boxX = layout.safe.x0;
  const boxWidth = maxWidth;
  const boxY = layout.subtitleY - boxHeight / 2;
  ctx.fillStyle = theme === "night" ? "rgba(2,6,23,0.78)" : "rgba(15,23,42,0.82)";
  roundedRectPath(ctx, boxX, boxY, boxWidth, boxHeight, fontSize * 0.6);
  ctx.fill();
  ctx.fillStyle = palette.white;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const startY = boxY + boxHeight / 2 - ((limitedLines.length - 1) * lineHeight) / 2;
  limitedLines.forEach((line, index) => {
    ctx.fillText(line, boxX + boxWidth / 2, startY + index * lineHeight);
  });
  ctx.restore();
}

export function createSceneRuntime(options: RuntimeOptions): SceneApi {
  const { ctx, width, height, aspect, theme, t, duration, seed } = options;
  const fontFamily = options.fontFamily ?? "Plus Jakarta Sans";
  const fontWeight = options.fontWeight ?? 700;
  const selectedFont = fontStack(fontFamily);
  const layout = getAspectLayout(aspect, width, height);
  const safe = layout.safe;

  const ease = {
    out: easeOut,
    in: easeIn,
    inOut: easeInOut,
    back: easeOutBack,
    elastic: easeOutElastic,
    outExpo: easeOutExpo,
    inOutExpo: easeInOutExpo
  };

  const random = (index: number): number => {
    const value = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
    return value - Math.floor(value);
  };

  const spring = (start = 0, preset: string | { damping?: number; stiffness?: number; mass?: number } = "snappy"): number => {
    const elapsed = t - start;
    if (elapsed <= 0) return 0;
    let damping = 0.65;
    let frequency = 7;
    if (preset === "smooth") {
      damping = 1;
      frequency = 5;
    } else if (preset === "bouncy") {
      damping = 0.35;
      frequency = 8;
    } else if (preset === "heavy") {
      damping = 1.25;
      frequency = 4;
    } else if (typeof preset === "object") {
      damping = preset.damping ?? 0.65;
      frequency = Math.sqrt(preset.stiffness ?? 50) * 0.6;
    }
    const value = 1 - Math.exp(-damping * frequency * elapsed) * Math.cos(frequency * elapsed);
    return clampValue(value, 0, 1.15);
  };

  const keys = (points: Array<[number, number]>, easing: keyof typeof ease = "inOut"): number => {
    if (points.length === 0) return 0;
    const sorted = [...points].sort((first, second) => first[0] - second[0]);
    if (t <= sorted[0][0]) return sorted[0][1];
    if (t >= sorted[sorted.length - 1][0]) return sorted[sorted.length - 1][1];
    for (let index = 1; index < sorted.length; index += 1) {
      const [startTime, startValue] = sorted[index - 1];
      const [endTime, endValue] = sorted[index];
      if (t >= startTime && t <= endTime) {
        const span = Math.max(endTime - startTime, 0.0001);
        const progress = ease[easing]((t - startTime) / span);
        return startValue + (endValue - startValue) * progress;
      }
    }
    return sorted[sorted.length - 1][1];
  };

  const applyStyles = (style: DrawOptions, defaultAlpha = 1): void => {
    ctx.globalAlpha = clampValue((style.alpha ?? 1) * defaultAlpha, 0, 1);
    ctx.fillStyle = style.fill ?? palette.ink;
    ctx.strokeStyle = style.stroke ?? style.fill ?? palette.ink;
    ctx.lineWidth = style.width ?? 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const drawPoints = (points: Array<[number, number]>, style: DrawOptions, closed: boolean): void => {
    if (points.length < 2) return;
    const progressive = clampValue(style.draw ?? 1, 0, 1);
    applyStyles(style, progressive);
    const wobbleAmount = typeof style.wobble === "number" ? style.wobble : style.wobble ? 1 : 0;
    ctx.beginPath();
    points.forEach(([pointX, pointY], index) => {
      const wobbleX = wobbleAmount ? Math.sin(t * 5.5 + index * 1.7) * 1.6 * wobbleAmount : 0;
      const wobbleY = wobbleAmount ? Math.cos(t * 4.7 + index * 2.1) * 1.6 * wobbleAmount : 0;
      if (index === 0) ctx.moveTo(pointX + wobbleX, pointY + wobbleY);
      else ctx.lineTo(pointX + wobbleX, pointY + wobbleY);
    });
    if (closed) ctx.closePath();
    if (closed && style.fill) {
      ctx.fill();
    }
    if (style.stroke || !style.fill) {
      ctx.stroke();
    }
    if (style.hatch) {
      ctx.globalAlpha *= 0.35;
      ctx.strokeStyle = style.stroke ?? palette.ink;
      ctx.lineWidth = Math.max(1, (style.width ?? 3) * 0.4);
      for (let offset = -width; offset < width * 2; offset += 18) {
        ctx.beginPath();
        ctx.moveTo(offset, 0);
        ctx.lineTo(offset + height, height);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };

  const line = (x1: number, y1: number, x2: number, y2: number, style: DrawOptions = {}): void => {
    const progress = clampValue(style.draw ?? 1, 0, 1);
    applyStyles(style);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + (x2 - x1) * progress, y1 + (y2 - y1) * progress);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const rect = (x: number, y: number, rectWidth: number, rectHeight: number, style: DrawOptions = {}): void => {
    const progress = clampValue(style.draw ?? 1, 0, 1);
    applyStyles(style, progress);
    roundedRectPath(ctx, x, y, rectWidth, rectHeight, style.r ?? 0);
    if (style.fill) ctx.fill();
    if (style.stroke) ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const circle = (x: number, y: number, radius: number, style: DrawOptions = {}): void => {
    const progress = clampValue(style.draw ?? 1, 0, 1);
    applyStyles(style, progress);
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0, radius * (style.draw !== undefined ? Math.max(0.001, progress) : 1)), 0, Math.PI * 2);
    if (style.fill) ctx.fill();
    if (style.stroke) ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const ellipse = (x: number, y: number, radiusX: number, radiusY: number, style: DrawOptions = {}): void => {
    const progress = clampValue(style.draw ?? 1, 0, 1);
    applyStyles(style, progress);
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.001, radiusX), Math.max(0.001, radiusY), 0, 0, Math.PI * 2);
    if (style.fill) ctx.fill();
    if (style.stroke) ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const arc = (x: number, y: number, radius: number, startAngle: number, endAngle: number, style: DrawOptions = {}): void => {
    const progress = clampValue(style.draw ?? 1, 0, 1);
    applyStyles(style);
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, startAngle + (endAngle - startAngle) * progress);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const text = (value: string, x: number, y: number, style: DrawOptions = {}): void => {
    const progress = clampValue(style.draw ?? 1, 0, 1);
    const size = style.size ?? 36;
    ctx.save();
    applyStyles(style, progress);
    ctx.font = `${style.weight ?? fontWeight} ${size}px ${style.font ? fontStack(style.font) : selectedFont}`;
    ctx.textAlign = style.align ?? "center";
    ctx.textBaseline = "middle";
    ctx.fillText(value, x, y);
    ctx.restore();
  };

  const check = (x: number, y: number, size: number, style: DrawOptions = {}): void => {
    const progress = clampValue(style.draw ?? 1, 0, 1);
    applyStyles(style);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.5, y);
    ctx.lineTo(x - size * 0.12, y + size * 0.38);
    if (progress > 0.45) {
      const secondProgress = (progress - 0.45) / 0.55;
      ctx.lineTo(x - size * 0.12 + size * 0.72 * secondProgress, y + size * 0.38 - size * 0.9 * secondProgress);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const cross = (x: number, y: number, size: number, style: DrawOptions = {}): void => {
    const progress = clampValue(style.draw ?? 1, 0, 1);
    applyStyles(style);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y - size * 0.4);
    ctx.lineTo(x - size * 0.4 + size * 0.8 * progress, y - size * 0.4 + size * 0.8 * progress);
    ctx.moveTo(x + size * 0.4, y - size * 0.4);
    ctx.lineTo(x + size * 0.4 - size * 0.8 * progress, y - size * 0.4 + size * 0.8 * progress);
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const dash = (x1: number, y1: number, x2: number, y2: number, style: DrawOptions = {}): void => {
    applyStyles(style);
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  };

  const sparkle = (x: number, y: number, size: number, style: DrawOptions = {}): void => {
    const progress = clampValue(style.draw ?? 1, 0, 1);
    applyStyles(style);
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.5);
    ctx.quadraticCurveTo(x, y, x + size * 0.5, y);
    ctx.quadraticCurveTo(x, y, x, y + size * 0.5);
    ctx.quadraticCurveTo(x, y, x - size * 0.5, y);
    ctx.quadraticCurveTo(x, y, x, y - size * 0.5);
    ctx.closePath();
    ctx.globalAlpha *= progress;
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  const rays = (x: number, y: number, style: DrawOptions = {}): void => {
    const count = style.size ?? 12;
    const radius = style.r ?? 120;
    applyStyles(style);
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2 + t * 0.15;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(angle) * radius * 0.36, y + Math.sin(angle) * radius * 0.36);
      ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const burst = (x: number, y: number, style: DrawOptions = {}): void => {
    const count = style.size ?? 8;
    const radius = style.r ?? 100;
    applyStyles(style);
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      const distance = radius * (0.6 + random(index) * 0.5);
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, (style.width ?? 8) * (0.6 + random(index + 10) * 0.7), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const ground = (y = layout.groundY, style: DrawOptions = {}): void => {
    line(safe.x0, y, safe.x1, y, { stroke: style.stroke ?? palette.ink, width: style.width ?? 3, alpha: style.alpha, draw: style.draw });
  };

  const group = (
    transform: { x?: number; y?: number; rotate?: number; scale?: number; alpha?: number },
    draw: () => void
  ): void => {
    ctx.save();
    ctx.translate(transform.x ?? 0, transform.y ?? 0);
    if (transform.rotate) ctx.rotate(transform.rotate);
    const scale = transform.scale ?? 1;
    ctx.scale(scale, scale);
    ctx.globalAlpha *= transform.alpha ?? 1;
    draw();
    ctx.restore();
  };

  const card = (x: number, y: number, cardWidth: number, cardHeight: number, style: DrawOptions = {}): void => {
    ctx.save();
    ctx.shadowColor = "rgba(31,45,74,0.18)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
    applyStyles({ ...style, fill: style.fill ?? palette.paper, stroke: style.stroke });
    roundedRectPath(ctx, x, y, cardWidth, cardHeight, style.r ?? 24);
    ctx.fill();
    ctx.shadowColor = "transparent";
    if (style.stroke) ctx.stroke();
    ctx.restore();
  };

  const words = (value: string, x: number, y: number, style: DrawOptions = {}): void => {
    const wordList = value.trim().split(/\s+/).filter(Boolean);
    if (wordList.length === 0) return;
    const size = style.size ?? 36;
    ctx.save();
    ctx.font = `${style.weight ?? fontWeight} ${size}px ${style.font ? fontStack(style.font) : selectedFont}`;
    const spaceWidth = ctx.measureText(" ").width;
    const maxWidth = style.width ?? safe.x1 - safe.x0;
    const lines: string[][] = [];
    let currentLine: string[] = [];
    let currentWidth = 0;
    wordList.forEach((word) => {
      const wordWidth = ctx.measureText(word).width;
      const nextWidth = currentLine.length === 0 ? wordWidth : currentWidth + spaceWidth + wordWidth;
      if (nextWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = [word];
        currentWidth = wordWidth;
      } else {
        currentLine.push(word);
        currentWidth = nextWidth;
      }
    });
    if (currentLine.length > 0) lines.push(currentLine);
    const lineHeight = size * (style.lineHeight ?? 1.2);
    const totalHeight = (lines.length - 1) * lineHeight;
    const startY = y - totalHeight / 2;
    let wordIndex = 0;
    lines.forEach((line, lineIndex) => {
      const lineWidth =
        line.reduce((total, word) => total + ctx.measureText(word).width, 0) + spaceWidth * Math.max(0, line.length - 1);
      let cursorX = x;
      if ((style.align ?? "center") === "center") cursorX = x - lineWidth / 2;
      if (style.align === "right") cursorX = x - lineWidth;
      const lineY = startY + lineIndex * lineHeight;
      line.forEach((word) => {
        const wordWidth = ctx.measureText(word).width;
        const start = style.start ?? 0;
        const gap = style.gap ?? 0.05;
        const progress = clampValue((t - (start + wordIndex * gap)) / 0.45, 0, 1);
        const eased = easeOut(progress);
        let offsetX = 0;
        let offsetY = 0;
        let scale = 1;
        let alpha = 1;
        if (style.mode === "rise") {
          offsetY = (1 - eased) * size * 0.5;
          alpha = eased;
        } else if (style.mode === "pop") {
          scale = 0.7 + eased * 0.3;
          alpha = eased;
        } else if (style.mode === "slide") {
          offsetX = (1 - eased) * size * 0.6;
          alpha = eased;
        } else if (style.mode === "fade") {
          alpha = eased;
        }
        const normalizedWord = word.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
        const normalizedAccent = (style.accent ?? "").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
        const isAccent = normalizedAccent.length > 0 && normalizedWord === normalizedAccent;
        ctx.save();
        ctx.globalAlpha = clampValue((style.alpha ?? 1) * alpha, 0, 1);
        ctx.fillStyle = isAccent ? style.accentColor ?? palette.red : style.color ?? palette.ink;
        ctx.translate(cursorX + offsetX, lineY + offsetY);
        ctx.scale(scale, scale);
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        ctx.fillText(word, 0, 0);
        ctx.restore();
        cursorX += wordWidth + spaceWidth;
        wordIndex += 1;
      });
    });
    ctx.restore();
  };

  const asset = (id: string, x: number, y: number, style: DrawOptions = {}): void => {
    const definition = findSceneAsset(id);
    if (!definition) return;
    const size = style.size ?? 80;
    const scale = Math.max(0.01, size / 100);
    const progress = clampValue(style.draw ?? 1, 0, 1);
    const color = style.color ?? palette.ink;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(style.rotate ?? 0);
    ctx.scale(scale, scale);
    ctx.translate(-50, -50);
    ctx.globalAlpha = clampValue((style.alpha ?? 1) * progress, 0, 1);
    const renderMode = style.render ?? definition.mode;
    if (typeof Path2D !== "undefined") {
      const path = new Path2D(definition.path);
      if (renderMode !== "stroke") {
        ctx.fillStyle = color;
        ctx.fill(path);
      }
      if (renderMode !== "fill") {
        ctx.strokeStyle = style.stroke ?? color;
        ctx.lineWidth = Math.max(0.5, (style.width ?? 4) / scale);
        ctx.stroke(path);
      }
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(50, 50, 36, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  return {
    t,
    dur: duration,
    p: clampValue(t / Math.max(duration, 0.001), 0, 1),
    W: width,
    H: height,
    cx: width / 2,
    cy: height * 0.42,
    groundY: layout.groundY,
    safe,
    theme,
    font: fontFamily,
    fontWeight,
    c: palette,
    spring,
    stagger: (index, start = 0, gap = 0.06, preset = "snappy") => spring(start + index * gap, preset),
    keys,
    at: (start, length = 0.6) => easeOut(clampValue((t - start) / Math.max(length, 0.001), 0, 1)),
    pop: (start, length = 0.5) => easeOutBack(clampValue((t - start) / Math.max(length, 0.001), 0, 1)),
    ease,
    lerp: (from, to, amount) => from + (to - from) * clampValue(amount, 0, 1),
    clamp: clampValue,
    wave: (frequency = 1, amplitude = 1, phase = 0) => amplitude * Math.sin((t * frequency + phase) * Math.PI * 2),
    rand: random,
    line,
    polyline: (points, style = {}) => drawPoints(points, style, false),
    shape: (points, style = {}) => drawPoints(points, style, true),
    curve: (points, closed = false, style = {}) => {
      if (points.length < 2) return;
      const progress = clampValue(style.draw ?? 1, 0, 1);
      applyStyles(style, progress);
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let index = 1; index < points.length; index += 1) {
        const previous = points[index - 1];
        const current = points[index];
        const middleX = (previous[0] + current[0]) / 2;
        const middleY = (previous[1] + current[1]) / 2;
        ctx.quadraticCurveTo(previous[0], previous[1], middleX, middleY);
        if (index === points.length - 1) ctx.quadraticCurveTo(current[0], current[1], current[0], current[1]);
      }
      if (closed) ctx.closePath();
      if (style.fill) ctx.fill();
      if (style.stroke || !style.fill) ctx.stroke();
      ctx.globalAlpha = 1;
    },
    rect,
    circle,
    ellipse,
    arc,
    text,
    check,
    cross,
    dash,
    sparkle,
    rays,
    burst,
    ground,
    group,
    card,
    words,
    asset,
    sfx: (name, time = t, gain = 1, pitch = 1) => {
      if (options.collectSfx && options.onSfx) {
        options.onSfx({ name, time, gain, pitch });
      }
    }
  };
}

export function drawFallbackScene(
  ctx: OffscreenCanvasRenderingContext2D,
  runtime: SceneApi,
  narration: string,
  sceneNumber: number
): void {
  const wordsText = narration.trim() || `Scene ${sceneNumber}`;
  const entrance = runtime.spring(0, "snappy");
  const accent = runtime.theme === "night" ? palette.white : palette.ink;
  const scale = runtime.lerp(0.82, 1, entrance);
  runtime.group({ x: runtime.cx, y: runtime.cy, scale, rotate: runtime.wave(0.25, 0.02) }, () => {
    runtime.circle(0, 0, 150, { fill: runtime.theme === "night" ? palette.blue : palette.sky, alpha: 0.22 });
    runtime.circle(0, 0, 92, { fill: runtime.theme === "night" ? palette.teal : palette.primary, alpha: 0.18 });
    runtime.words(wordsText.slice(0, 120), 0, 0, {
      size: 42,
      color: accent,
      align: "center",
      width: 520,
      mode: "rise",
      start: 0.08,
      gap: 0.04,
      lineHeight: 1.18
    });
  });
  runtime.sparkle(runtime.safe.x0 + 24, runtime.safe.y0 + 30, 18, { fill: palette.yellow, draw: runtime.at(0.2, 0.4) });
  runtime.sparkle(runtime.safe.x1 - 24, runtime.safe.y0 + 60, 12, { fill: palette.orange, draw: runtime.at(0.35, 0.4) });
  ctx.globalAlpha = 1;
}
