export interface SafeJsonResult {
  ok: boolean;
  data?: unknown;
  error?: string;
}

export function normalizeJsonText(input: string): string {
  let text = input.replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\uFEFF]/g, "");
  text = text
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'");
  text = stripComments(text);
  text = text.replace(/,\s*([}\]])/g, "$1");
  return text.trim();
}

function stripComments(input: string): string {
  let output = "";
  let inString = false;
  let stringQuote = "";
  let escaped = false;
  let index = 0;
  while (index < input.length) {
    const character = input[index];
    const nextCharacter = input[index + 1];
    if (inString) {
      output += character;
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === stringQuote) {
        inString = false;
      }
      index += 1;
      continue;
    }
    if (character === '"' || character === "'") {
      inString = true;
      stringQuote = character;
      output += character;
      index += 1;
      continue;
    }
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
    output += character;
    index += 1;
  }
  return output;
}

export function safeJsonParse(input: string): SafeJsonResult {
  const normalized = normalizeJsonText(input);
  if (!normalized) {
    return { ok: false, error: "Jawaban kosong. Tempel JSON dari AI terlebih dahulu." };
  }
  try {
    return { ok: true, data: JSON.parse(normalized) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "JSON tidak valid";
    return {
      ok: false,
      error: `JSON belum bisa dibaca (${message}). Pastikan AI mengirim satu blok JSON yang utuh, tanpa teks tambahan.`
    };
  }
}
