import type { StylePack } from "@/types";

export interface CustomTemplate {
  id: string;
  name: string;
  category: string;
  vibe: string;
  descriptionForPrompt: string;
  promptDirectives: string;
  videoUrl?: string;
  palette: string[];
  theme: "paper" | "night" | "dusk";
  createdAt: number;
}

const STORAGE_KEY = "voicemotion.customTemplates";

export function getCustomTemplates(): CustomTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomTemplate(template: CustomTemplate): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getCustomTemplates();
    const index = existing.findIndex((item) => item.id === template.id);
    let updated: CustomTemplate[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = template;
    } else {
      updated = [template, ...existing];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function deleteCustomTemplate(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getCustomTemplates();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function customTemplateToStylePack(template: CustomTemplate): StylePack {
  return {
    slug: `custom-${template.id}`,
    name: template.name,
    category: "Buatan Sendiri",
    theme: template.theme,
    palette:
      template.palette && template.palette.length >= 4
        ? template.palette
        : ["#FF6B00", "#7C3AED", "#2563EB", "#0F172A"],
    finishing: "flat",
    heavy: false,
    descriptionForPrompt: template.promptDirectives
      ? `${template.descriptionForPrompt}. Instruksi Claude: ${template.promptDirectives}`
      : template.descriptionForPrompt,
    transitions: ["zoom", "slide", "fade"],
    sampleCode: `const k = s.spring(0, "snappy"); s.group({ x: s.cx, y: s.cy }, () => { s.circle(0, 0, 120, { fill: s.c.primary, alpha: 0.25, draw: k }); s.words("${template.name}", 0, 0, { size: 40, color: s.c.ink, mode: "pop", start: 0.15 }); }); s.sfx("pop", 0.1, 0.6);`
  };
}

