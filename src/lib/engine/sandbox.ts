import type { SceneApi } from "@/lib/engine/runtime";

export interface PrescanResult {
  ok: boolean;
  reason: string;
}

const forbiddenIdentifiers = [
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "importScripts",
  "indexedDB",
  "caches",
  "localStorage",
  "sessionStorage",
  "document",
  "window",
  "globalThis",
  "self",
  "navigator",
  "location",
  "history",
  "postMessage",
  "Worker",
  "SharedWorker",
  "Function",
  "setTimeout",
  "setInterval",
  "requestAnimationFrame",
  "while",
  "constructor",
  "__proto__",
  "prototype",
  "Reflect",
  "Proxy",
  "debugger",
  "alert",
  "confirm",
  "prompt"
];

const forbiddenPattern = new RegExp(`\\b(${forbiddenIdentifiers.join("|")})\\b`);
const importPattern = /\bimport\s*\(/;
const randomPattern = /\bMath\s*\.\s*random\b/;
const infiniteForPattern = /\bfor\s*\(\s*;\s*;\s*\)/;

function stripStringsAndComments(input: string): string {
  let output = "";
  let index = 0;
  while (index < input.length) {
    const character = input[index];
    const nextCharacter = input[index + 1];
    if (character === "/" && nextCharacter === "/") {
      while (index < input.length && input[index] !== "\n") index += 1;
      continue;
    }
    if (character === "/" && nextCharacter === "*") {
      index += 2;
      while (index < input.length && !(input[index] === "*" && input[index + 1] === "/")) index += 1;
      index += 2;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      const quote = character;
      index += 1;
      while (index < input.length) {
        if (input[index] === "\\") {
          index += 2;
          continue;
        }
        if (input[index] === quote) {
          index += 1;
          break;
        }
        if (quote === "`" && input[index] === "$" && input[index + 1] === "{") {
          index += 2;
          let depth = 1;
          while (index < input.length && depth > 0) {
            if (input[index] === "{") depth += 1;
            if (input[index] === "}") depth -= 1;
            index += 1;
          }
          continue;
        }
        index += 1;
      }
      output += " ";
      continue;
    }
    output += character;
    index += 1;
  }
  return output;
}

export function prescanCode(code: string): PrescanResult {
  if (code.length > 100000) {
    return { ok: false, reason: "Kode scene terlalu panjang. Maksimal 100.000 karakter." };
  }
  const cleaned = stripStringsAndComments(code);
  if (randomPattern.test(cleaned)) {
    return { ok: false, reason: "Kode memakai Math.random. Gunakan s.rand(i) agar hasil deterministik." };
  }
  if (importPattern.test(cleaned)) {
    return { ok: false, reason: "Kode memakai import dinamis yang tidak diizinkan sandbox." };
  }
  if (infiniteForPattern.test(cleaned)) {
    return { ok: false, reason: "Kode memakai loop for tanpa batas yang tidak diizinkan." };
  }
  const match = cleaned.match(forbiddenPattern);
  if (match) {
    return { ok: false, reason: `Kode memakai perintah yang tidak diizinkan sandbox: ${match[1]}.` };
  }
  return { ok: true, reason: "" };
}

const shadowedGlobals = [
  "window",
  "document",
  "globalThis",
  "self",
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "importScripts",
  "indexedDB",
  "localStorage",
  "sessionStorage",
  "navigator",
  "location",
  "Function",
  "setTimeout",
  "setInterval",
  "requestAnimationFrame",
  "postMessage",
  "Worker"
];

export type CompiledScene = (s: SceneApi, ctx: OffscreenCanvasRenderingContext2D) => void;

export function compileSceneBody(code: string): CompiledScene {
  const parameters = ["s", "ctx", ...shadowedGlobals];
  const body = `"use strict";\n${code}`;
  const factory = new Function(...parameters, body) as (...args: unknown[]) => void;
  const emptyArguments = shadowedGlobals.map(() => undefined);
  return (s, ctx) => {
    factory.call(undefined, s, ctx, ...emptyArguments);
  };
}
