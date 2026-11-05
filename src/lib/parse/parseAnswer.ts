import type { ZodIssue } from "zod";
import { extractCodeBlock } from "@/lib/parse/extractCodeBlock";
import { ideaSetSchema, sceneListSchema } from "@/lib/parse/schemas";
import { safeJsonParse } from "@/lib/parse/safeJson";
import { id } from "@/lib/i18n/id";
import { makeId } from "@/lib/utils";
import type { IdeaSet, ParseResult, Scene, SceneCodeResult, SceneIssue } from "@/types";

const maximumAnswerLength = 200000;

type ParseKind = "idea" | "scene";

const ideaFieldLabels: Record<string, string> = {
  title: "judul",
  hook: "hook",
  angle: "pesan inti",
  visualStyle: "visualStyle"
};

const sceneFieldLabels: Record<string, string> = {
  n: "nomor scene",
  narration: "narasi",
  visual: "visual",
  theme: "tema",
  durationSec: "durasi"
};

function friendlyIssues(issues: ZodIssue[], kind: ParseKind): SceneIssue[] {
  return issues.slice(0, 8).map((issue) => {
    const path = issue.path;
    const index = path[1];
    const field = String(path[2] ?? "");
    if (kind === "idea" && path[0] === "ideas" && typeof index === "number") {
      return {
        path: path.join("."),
        message: `Ide ke-${index + 1} bermasalah pada '${ideaFieldLabels[field] ?? field}': ${issue.message}.`
      };
    }
    if (kind === "scene" && path[0] === "scenes" && typeof index === "number") {
      return {
        path: path.join("."),
        message: `Scene ${index + 1} bermasalah pada '${sceneFieldLabels[field] ?? field}': ${issue.message}.`
      };
    }
    return {
      path: path.join(".") || "jawaban",
      message: issue.message
    };
  });
}

function parseFailure(error: string): ParseResult<never> {
  return {
    ok: false,
    issues: [
      {
        path: "jawaban",
        message: `${error} Coba salin ulang seluruh jawaban AI, lalu tempel lagi.`
      }
    ]
  };
}

export function parseIdeaAnswer(rawText: string): ParseResult<IdeaSet> {
  if (rawText.length > maximumAnswerLength) {
    return { ok: false, issues: [{ path: "jawaban", message: id.paste.tooLarge }] };
  }
  const block = extractCodeBlock(rawText, "json");
  const parsed = safeJsonParse(block);
  if (!parsed.ok) {
    return parseFailure(parsed.error ?? "Jawaban belum bisa dibaca.");
  }
  const candidate = Array.isArray(parsed.data) ? { ideas: parsed.data } : parsed.data;
  const result = ideaSetSchema.safeParse(candidate);
  if (!result.success) {
    return { ok: false, issues: friendlyIssues(result.error.issues, "idea") };
  }
  const ideas = result.data.ideas.map((idea) => ({
    id: makeId(),
    title: idea.title.trim(),
    hook: idea.hook.trim(),
    angle: idea.angle.trim(),
    visualStyle: idea.visualStyle.trim()
  }));
  return { ok: true, data: { ideas }, issues: [] };
}

export function parseNarrationAnswer(rawText: string, targetDurationSec?: number): ParseResult<{ title: string; scenes: Scene[] }> {
  if (rawText.length > maximumAnswerLength) {
    return { ok: false, issues: [{ path: "jawaban", message: id.paste.tooLarge }] };
  }
  const block = extractCodeBlock(rawText, "json");
  const parsed = safeJsonParse(block);
  if (!parsed.ok) {
    return parseFailure(parsed.error ?? "Jawaban belum bisa dibaca.");
  }
  const candidate = Array.isArray(parsed.data) ? { scenes: parsed.data } : parsed.data;
  const result = sceneListSchema.safeParse(candidate);
  if (!result.success) {
    return { ok: false, issues: friendlyIssues(result.error.issues, "scene") };
  }
  const orderedScenes = [...result.data.scenes].sort((first, second) => first.n - second.n);
  const scenes: Scene[] = orderedScenes.map((scene, index) => ({
    id: makeId(),
    idx: index,
    narration: scene.narration.trim(),
    visual: scene.visual.trim(),
    theme: scene.theme,
    durationSec: scene.durationSec,
    audioPath: null,
    audioMs: null,
    wordTimings: null,
    code: "",
    codeStatus: "empty",
    codeError: null
  }));
  const issues: SceneIssue[] = [];
  if (targetDurationSec && targetDurationSec > 0) {
    const total = scenes.reduce((sum, scene) => sum + scene.durationSec, 0);
    if (Math.abs(total - targetDurationSec) / targetDurationSec > 0.1) {
      issues.push({
        path: "scenes",
        message: `Total durasi ${Math.round(total * 10) / 10} detik, di luar target ±10% (${targetDurationSec} detik). Kamu masih bisa lanjut dan mengubah durasi manual.`
      });
    }
  }
  return {
    ok: true,
    data: {
      title: result.data.title?.trim() || "Naskah video",
      scenes
    },
    issues
  };
}

function normalizeSceneBody(code: string): string {
  let body = code.trim().replace(/^```[a-zA-Z0-9_-]*\s*/, "").replace(/```$/, "").trim();
  const wrapper = body.match(/^function\s*[A-Za-z0-9_]*\s*\([^)]*\)\s*\{([\s\S]*)\}\s*$/);
  if (wrapper) {
    body = wrapper[1].trim();
  }
  return body;
}

export function parseSceneCodeAnswer(rawText: string): SceneCodeResult {
  if (rawText.length > maximumAnswerLength) {
    return { ok: false, scenes: {}, issues: [id.paste.tooLarge] };
  }
  const block = extractCodeBlock(rawText, "js");
  const markerPattern = /^[ \t]*\/\/[ \t]*=====[ \t]*SCENE[ \t]+(\d+)[ \t]*=====[ \t]*\r?$/gm;
  const matches = Array.from(block.matchAll(markerPattern));
  const issues: string[] = [];

  if (matches.length === 0) {
    const body = normalizeSceneBody(block);
    if (!body) {
      return { ok: false, scenes: {}, issues: ["Kode scene kosong. Tempel satu blok kode dari AI."] };
    }
    return {
      ok: true,
      scenes: { 1: body },
      issues: ["Penanda // ===== SCENE N ===== tidak ditemukan. Kode dianggap sebagai scene 1."]
    };
  }

  const scenes: Record<number, string> = {};
  matches.forEach((match, index) => {
    const sceneNumber = Number(match[1]);
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index ?? block.length : block.length;
    const body = normalizeSceneBody(block.slice(start, end));
    if (!body) {
      issues.push(`Scene ${sceneNumber} tidak punya kode.`);
      return;
    }
    scenes[sceneNumber] = body;
  });

  return {
    ok: Object.keys(scenes).length > 0,
    scenes,
    issues
  };
}

export function formatIssues(issues: SceneIssue[]): string {
  return issues.map((issue) => issue.message).join("\n");
}
