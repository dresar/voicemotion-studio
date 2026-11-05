import { describe, expect, it } from "vitest";
import { buildIdeaPrompt, buildNarrationPrompt, buildScenePrompt } from "@/lib/prompt/buildPrompt";
import { mergeConfig } from "@/store/project";
import type { Idea, Scene, StylePack } from "@/types";

const style: StylePack = {
  slug: "neu-soft",
  name: "Neu-Soft",
  category: "Tenang",
  theme: "paper",
  palette: ["#E4EBF5", "#3F7BFF"],
  finishing: "flat",
  descriptionForPrompt: "permukaan biru es yang lembut",
  sampleCode: "s.circle(0,0,20,{fill:s.c.blue});",
  heavy: false,
  transitions: ["fade"]
};

const idea: Idea = {
  id: "idea-1",
  title: "Disiplin Bukan Bakat",
  hook: "Kamu pikir kamu malas?",
  angle: "Disiplin dibangun dari sistem kecil.",
  visualStyle: "kertas krem, tinta hitam, meja rapi"
};

const scenes: Scene[] = [
  {
    id: "scene-1",
    idx: 0,
    narration: "Kebanyakan orang menunda karena menunggu mood.",
    visual: "Jam dinding berputar cepat",
    theme: "paper",
    durationSec: 7.5,
    audioPath: null,
    audioMs: null,
    wordTimings: null,
    code: "",
    codeStatus: "empty",
    codeError: null
  },
  {
    id: "scene-2",
    idx: 1,
    narration: "Mulai dari satu langkah kecil hari ini.",
    visual: "Satu kotak dicentang",
    theme: "dusk",
    durationSec: 6,
    audioPath: null,
    audioMs: null,
    wordTimings: null,
    code: "",
    codeStatus: "empty",
    codeError: null
  }
];

describe("buildPrompt", () => {
  const config = mergeConfig({
    topic: "disiplin",
    durationSec: 60,
    styleSlug: "neu-soft",
    contentType: "motivation"
  });

  it("menghasilkan prompt ide yang deterministik", () => {
    const first = buildIdeaPrompt({ config, style });
    const second = buildIdeaPrompt({ config, style });
    expect(first).toBe(second);
    expect(first).toContain("tepat 5 ide");
    expect(first).toContain("disiplin");
    expect(first).toContain('"ideas"');
    expect(first).toContain("HANYA satu blok");
  });

  it("menghasilkan prompt narasi dengan jumlah scene dan target durasi", () => {
    const prompt = buildNarrationPrompt({ config, style, idea, writerNotes: "ajakan follow" });
    expect(prompt).toContain("Total durasi 60 detik");
    expect(prompt).toContain("sekitar 8 scene");
    expect(prompt).toContain("ajakan follow");
    expect(prompt).toContain('"scenes"');
  });

  it("menghasilkan prompt kode dengan penanda scene sesuai idx", () => {
    const prompt = buildScenePrompt({ config, style, scenes: [scenes[1]] });
    expect(prompt).toContain("SCENE 2\nNarasi: Mulai dari satu langkah kecil hari ini.");
    expect(prompt).toContain("// ===== SCENE 2 =====");
    expect(prompt).toContain("s.circle(0,0,20,{fill:s.c.blue});");
    expect(prompt).toContain("Tanpa wajah");
  });

  it("menghasilkan prompt Claude yang panjang dan lengkap", () => {
    const prompt = buildScenePrompt({ config, style, scenes });
    expect(prompt.length).toBeGreaterThan(4000);
    expect(prompt).toContain("Font video: Plus Jakarta Sans");
    expect(prompt).toContain("Katalog aset SVG yang valid");
    expect(prompt).toContain("s.asset");
    expect(prompt).toContain("Quality gate kode");
    expect(prompt).toContain("Prinsip desain scene");
    expect(prompt).toContain("Contoh kerangka kode");
    expect(prompt).toContain("- spark (Spark)");
  });

  it("mengikuti font dan aset yang dipilih proyek", () => {
    const customConfig = mergeConfig({
      ...config,
      sceneFont: "playfair-display",
      preferredAssets: ["star", "underline"],
      decorationStyle: "scrapbook",
      texture: "grain",
      subtitleStyle: "highlight"
    });
    const prompt = buildScenePrompt({ config: customConfig, style, scenes });
    expect(prompt).toContain("Playfair Display");
    expect(prompt).toContain("- star (Star)");
    expect(prompt).toContain("- underline (Underline)");
    expect(prompt).toContain("Scrapbook");
    expect(prompt).toContain("Grain");
    expect(prompt).toContain("Sorot");
  });
});
