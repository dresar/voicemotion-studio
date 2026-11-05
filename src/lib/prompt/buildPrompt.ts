import { APP_CONFIG } from "@/config/app";
import { assetCatalog, findSceneAsset } from "@/lib/engine/assets";
import type { SceneAsset } from "@/lib/engine/assets";
import { hashString } from "@/lib/utils";
import type { Idea, ProjectConfig, Scene, StylePack } from "@/types";

export type PromptStage = "idea" | "narration" | "scene";

export interface PromptBuildInput {
  config: ProjectConfig;
  style?: StylePack | null;
  idea?: Idea | null;
  writerNotes?: string;
  scenes?: Scene[];
  variant?: number;
}

export interface RepairPromptInput {
  kind: string;
  errors: string[];
  previousAnswer: string;
  formatReminder: string;
}

const lensCatalog = [
  "perjalanan dan peta",
  "pasar dan tawar-menawar",
  "kamera dan fokus",
  "lalu lintas dan lampu merah",
  "laut dan ombak",
  "dapur dan resep",
  "listrik dan kabel",
  "taman dan perawatan",
  "bengkel dan perkakas",
  "perpustakaan dan buku usang"
];

const hookCatalog = [
  "kontradiksi tegas",
  "plot twist di akhir kalimat",
  "mitos populer yang dipatahkan",
  "tantangan langsung ke penonton",
  "percakapan dengan diri sendiri",
  "angka mengejutkan",
  "pertanyaan yang menusuk"
];

const toneCatalog = [
  "blak-blakan",
  "jenaka tapi ngena",
  "tegas seperti pelatih",
  "hangat seperti kakak",
  "tenang dan meyakinkan"
];

const languageLabels: Record<ProjectConfig["language"], string> = {
  id: "Bahasa Indonesia",
  en: "English"
};

function codeFence(): string {
  return String.fromCharCode(96).repeat(3);
}

const tempoNotes: Record<ProjectConfig["tempo"], string> = {
  energetic: "energik, kalimat pendek, ritme cepat, tanpa jeda bertele-tele",
  calm: "santai, tenang, jeda cukup, tidak terburu-buru"
};

const engineApiSummary = `Objek waktu dan kanvas:
s.t (detik sejak scene mulai), s.dur, s.p (0..1), s.W, s.H, s.cx, s.cy, s.groundY,
s.safe={x0,x1,y0,y1}, s.theme, s.font, s.fontWeight.
Animasi:
s.spring(start=0, preset="snappy") -> 0..1. Preset: smooth, snappy, bouncy, heavy.
s.stagger(i, start=0, gap=0.06, preset) -> 0..1.
s.keys([[detik, nilai], ...], easing="inOut") -> interpolasi keyframe.
s.at(start, len=0.6) -> ease-out 0..1.
s.pop(start, len=0.5) -> overshoot 0..1.1 lalu 1.
s.ease.{out,in,inOut,back,elastic,outExpo,inOutExpo}(x).
s.lerp(a,b,k), s.clamp(x,a,b), s.wave(freq=1,amp=1,phase=0), s.rand(i) deterministik.
Gambar:
s.line(x1,y1,x2,y2,o), s.polyline(points,o), s.shape(points,o), s.curve(points,closed,o),
s.rect(x,y,w,h,o), s.circle(x,y,r,o), s.ellipse(x,y,rx,ry,o), s.arc(x,y,r,a0,a1,o),
s.text(str,x,y,o), s.check(x,y,size,o), s.cross(x,y,size,o), s.dash(x1,y1,x2,y2,o),
s.sparkle(x,y,size,o), s.rays(x,y,o), s.burst(x,y,o), s.ground(y,o),
s.group({x,y,rotate,scale,alpha}, fn), s.card(x,y,w,h,o),
s.words(str,x,y,o), s.asset(id,x,y,o).
Opsi gambar o: { fill, stroke, width, alpha, draw, wobble, hatch, r, size, color, align, weight, mode, start, gap, width, lineHeight, accent, accentColor, font, rotate, render }.
Teks memakai font video yang sudah dipilih. Gunakan o.font hanya jika butuh pengecualian yang sangat kuat.
Palet: s.c.{ink, paper, red, pink, orange, yellow, green, teal, blue, navy, purple, brown, sky, white, gray, primary, accent}.
Suara: s.sfx(name, time, gain=1, pitch=1). Nama: pop, tick, click, tap, thud, boing, swish, whoosh, boom, rise, ding, coin, type, snap, heart, impact, riser, swipe, whip, stamp, correct, buzzer, tada, magic.`;
const contractRules = `Aturan wajib:
- Tulis hanya isi body fungsi function (s, ctx) { ... }. Tanpa pembungkus function.
- Jangan simpan state antar frame. Semua dihitung dari s.t.
- Jangan pakai Math.random, DOM, window, document, fetch, import, eval, while, atau setTimeout. Gunakan s.rand(i).
- Maksimal sekitar 180 baris per scene.
- Tanpa wajah pada manusia, hewan, atau objek (tanpa mata, hidung, mulut, emoji wajah).
- Objek utama masuk dalam 0.0-0.35 detik. Selalu ada gerak kecil. Klimaks di 55-80% durasi. Semua animasi masuk selesai sebelum s.dur - 0.25.
- Komposisi fokus di zona tengah. Teks utuh di margin aman dan di atas zona subtitle.
- Tiap scene berdiri sendiri. Kode hanya melihat s dan ctx.
- Jangan menggambar latar, subtitle, transisi, atau kamera. Itu sudah diurus engine.
- Jangan memuat gambar, font, atau URL eksternal. Semua dekorasi memakai s.asset dan palet s.c.
- Gunakan maksimal 3 aset dekorasi per scene. Aset harus mendukung pesan, bukan memenuhi layar.
- Kontras teks terhadap latar minimal 4.5:1. Jangan menaruh teks di atas detail ramai.
- Jika ragu, kurangi elemen. Ruang kosong adalah bagian dari desain.`;

function durationLabel(durationSec: number): string {
  if (durationSec === 60) return "1 menit";
  if (durationSec % 60 === 0) return `${durationSec / 60} menit`;
  return `${durationSec} detik`;
}

function contentTypeLabel(config: ProjectConfig): string {
  return APP_CONFIG.contentTypes.find((item) => item.value === config.contentType)?.label ?? "Motivasi";
}

function styleDescription(style?: StylePack | null): string {
  return (
    style?.descriptionForPrompt ??
    "permukaan biru es yang lembut, bentuk membulat, bayangan halus, satu aksen biru tegas, komposisi lapang dan tenang"
  );
}

function extrasBlock(config: ProjectConfig): string {
  const lines: string[] = [];
  if (config.extras.tone.trim()) lines.push(`- Nada bahasa: ${config.extras.tone.trim()}`);
  if (config.extras.avoid.trim()) lines.push(`- Kata yang dihindari: ${config.extras.avoid.trim()}`);
  if (config.extras.cta.trim()) lines.push(`- CTA atau ajakan: ${config.extras.cta.trim()}`);
  if (config.extras.contact.trim()) lines.push(`- Kontak atau handle: ${config.extras.contact.trim()}`);
  if (lines.length === 0) return "";
  return `\nCatatan tambahan:\n${lines.join("\n")}\n`;
}

function sourceBlock(config: ProjectConfig): string {
  if (config.startFrom === "own_narration" && (config.ownNarration ?? "").trim()) {
    return `\nNarasi dari pengguna (jadikan bahan utama, jangan mengarang fakta baru):\n${config.ownNarration?.trim()}\n`;
  }
  if (config.startFrom === "promo") {
    const lines = [
      `- Nama produk atau jasa: ${config.productName?.trim() || "(belum diisi)"}`,
      `- Kelebihan: ${config.productBenefits?.trim() || "(belum diisi)"}`,
      `- Kontak: ${config.extras.contact.trim() || "(belum diisi)"}`,
      `- CTA: ${config.extras.cta.trim() || "(bebas, tetap jujur)"}`
    ];
    return `\nData promosi:\n${lines.join("\n")}\n`;
  }
  return "";
}

function angleSlots(seed: number, count: number): string {
  let state = seed || 1;
  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
  const lines: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const lens = lensCatalog[next() % lensCatalog.length];
    const hook = hookCatalog[next() % hookCatalog.length];
    const tone = toneCatalog[next() % toneCatalog.length];
    lines.push(`${index + 1}. lensa metafora "${lens}" · hook berupa ${hook} · nada ${tone}`);
  }
  return `\nBahan wajib per ide (pakai baris ke-n untuk ide ke-n, boleh ditafsirkan kreatif):\n${lines.join("\n")}\n`;
}

function aspectSpec(config: ProjectConfig): string {
  switch (config.aspect) {
    case "16:9":
      return "Kanvas 1280x720. Area ilustrasi y 0-560. Zona subtitle y 580-680. Margin aman x 80-1200.";
    case "1:1":
      return "Kanvas 1000x1000. Area ilustrasi y 0-720. Zona subtitle y 740-900. Margin aman x 90-910.";
    case "3:4":
      return "Kanvas 900x1200. Area ilustrasi y 0-860. Zona subtitle y 880-1040. Margin aman x 80-820.";
    default:
      return "Kanvas 720x1280. Area ilustrasi y 0-800. Zona subtitle y 810-900. Margin aman x 70-650.";
  }
}

function scenesBlock(scenes: Scene[]): string {
  return scenes
    .map((scene) => {
      return [
        `SCENE ${scene.idx + 1}`,
        `Narasi: ${scene.narration}`,
        `Visual: ${scene.visual}`,
        `Tema: ${scene.theme}`,
        `Durasi: ${scene.durationSec} detik`
      ].join("\n");
    })
    .join("\n\n");
}

function sceneFontDefinition(config: ProjectConfig) {
  return APP_CONFIG.sceneFonts.find((font) => font.id === config.sceneFont) ?? APP_CONFIG.sceneFonts[0];
}

function decorationLabel(config: ProjectConfig): string {
  return APP_CONFIG.decorationStyles.find((item) => item.value === config.decorationStyle)?.label ?? "Editorial";
}

function textureLabel(config: ProjectConfig): string {
  return APP_CONFIG.textures.find((item) => item.value === config.texture)?.label ?? "Kertas";
}

function subtitleLabel(config: ProjectConfig): string {
  return APP_CONFIG.subtitleStyles.find((item) => item.value === config.subtitleStyle)?.label ?? "Kotak";
}

function selectedAssets(config: ProjectConfig): SceneAsset[] {
  return config.preferredAssets
    .map((id) => findSceneAsset(id))
    .filter((asset): asset is SceneAsset => Boolean(asset));
}

function preferredAssetsBlock(config: ProjectConfig): string {
  const assets = selectedAssets(config);
  if (assets.length === 0) {
    return "- Belum ada aset dipilih. Gunakan maksimal 3 aset dari katalog yang benar-benar relevan.";
  }
  return assets.map((asset) => `- ${asset.id} (${asset.label}): ${asset.description}`).join("\n");
}

function visualDirectionBlock(config: ProjectConfig, style?: StylePack | null): string {
  const font = sceneFontDefinition(config);
  return `Arah visual proyek:
- Gaya visual: ${styleDescription(style)}
- Font video: ${font.label} (family "${font.family}", weight ${font.weight}). Engine memakai font ini untuk semua s.text dan s.words. Jangan memuat font lain.
- Karakter: ${config.character === "none" ? "tanpa karakter" : config.character}
- Dekorasi: ${decorationLabel(config)} · intensitas ${config.decorationIntensity}%.
- Tekstur latar: ${textureLabel(config)}.
- Gaya subtitle: ${subtitleLabel(config)}.
- Warna brand: ${config.brandColor === "follow_style" ? "ikut palet gaya" : config.brandColor}.
- Aset dekorasi pilihan pengguna:
${preferredAssetsBlock(config)}`;
}

function audienceBrief(config: ProjectConfig): string {
  return `Konteks produksi:
- Platform: TikTok, Instagram Reels, YouTube Shorts.
- Rasio ${config.aspect}, durasi ${durationLabel(config.durationSec)}, bahasa ${languageLabels[config.language]}.
- Audiens: orang Indonesia 18-35 yang menonton di HP, sering tanpa suara, cepat bosan, dan langsung scroll kalau 1 detik pertama lemah.
- Tujuan: hasil terasa seperti dibuat studio kecil yang rapi, bukan template AI generik.`;
}

function creativeStandards(): string {
  return `Standar kreatif:
- Satu pesan besar per video; setiap scene hanya punya satu aksi utama.
- Hook di 1 detik pertama. Tanpa sapaan, intro, atau basa-basi.
- Konkret: benda, angka, situasi, atau gestur yang bisa dilihat. Hindari abstraksi seperti "mindset" tanpa contoh.
- Anti-klise: tangga kesuksesan, kupu-kupu dari kepompong, gunung es, tetesan air melubangi batu, pohon dari biji, otak kanan-kiri, dan "rahasia" tanpa isi.
- Jangan mengarang fakta, angka, testimoni, sertifikat, atau klaim hasil instan.
- Bahasa sehari-hari, satu kalimat satu maksud, 2.3-3.2 kata per detik.
- Visual harus bisa dipahami tanpa suara.
- Tanpa wajah, emoji wajah, logo merek lain, atau aset berhak cipta.
- Akhiri dengan penutup atau ajakan yang terasa manusiawi, bukan iklan kaku.`;
}

function sceneQualityChecklist(): string {
  return `Quality gate kode:
1. Apakah objek utama masuk sebelum 0.35 detik dan terlihat jelas tanpa suara?
2. Apakah setiap detik punya gerak kecil, dan klimaks terjadi di 55-80% durasi?
3. Apakah semua teks berada di safe area dan tidak menabrak zona subtitle?
4. Apakah kontras teks minimal 4.5:1 dan hanya ada 2-4 warna dominan?
5. Apakah aset yang dipakai ada di katalog dan maksimal 3 per scene?
6. Apakah tidak ada wajah, URL, gambar eksternal, atau perintah terlarang?
7. Apakah penanda SCENE lengkap, berurutan, dan jumlahnya sesuai?
8. Apakah kode hanya memakai s dan ctx, tanpa state antar frame?
9. Apakah setiap scene punya satu titik fokus, bukan lima objek yang bersaing?
10. Apakah tata letak antar scene bervariasi, bukan mengulang komposisi yang sama?`;
}

const sceneSkeleton = `const entrance = s.spring(0, "snappy");
const reveal = s.at(0.15, 0.5);
const night = s.theme === "night";
const surface = night ? s.c.navy : s.c.paper;
const ink = night ? s.c.white : s.c.ink;
s.group({ x: s.cx, y: s.cy, scale: s.lerp(0.82, 1, entrance), rotate: s.wave(0.25, 0.02) }, () => {
  s.card(-180, -120, 360, 240, { r: 32, fill: surface, alpha: 0.96 });
  s.words("Kata kunci", 0, -10, { size: 52, color: ink, mode: "rise", start: 0.05, gap: 0.04, width: 300 });
  s.asset("spark", 150, -100, { size: 42, color: s.c.yellow, draw: reveal, rotate: s.wave(0.2, 0.08) });
});
s.sfx("pop", 0.1, 0.6);`;

export function buildIdeaPrompt(input: PromptBuildInput): string {
  const { config, style, variant = 0 } = input;
  const seed = hashString(
    `${config.topic}|${config.contentType}|${config.styleSlug}|${config.startFrom}|${config.productName ?? ""}|${variant}`
  );
  const language = languageLabels[config.language];
  const duration = durationLabel(config.durationSec);
  const topic = config.topic.trim() || "bebas, pilih topik yang kuat dan spesifik";
  const promoMode = config.startFrom === "promo";
  const font = sceneFontDefinition(config);

  return `Kamu adalah creative director dan penulis konten video pendek berbahasa ${language} untuk TikTok, Reels, dan Shorts. Kamu dikenal karena ide yang tajam, visual, dan tidak pasaran. Kamu menulis untuk kreator Indonesia yang ingin hasil rapi tanpa tim produksi.

${audienceBrief(config)}

${visualDirectionBlock(config, style)}

${creativeStandards()}
${extrasBlock(config)}${sourceBlock(config)}
Aturan ide:
* Tiap ide punya satu pesan yang jelas dan bisa divisualkan dengan benda nyata yang mudah dikenali.
* "visualStyle" ditulis dengan rumus: [gaya] + [pencahayaan/suasana] + [palet warna] + [komposisi/kamera] + [tipografi ${font.label}] + [metafora utama].
* Hook harus menohok dan membuat orang berhenti scroll dalam 1 detik pertama.
* HINDARI metafora pasaran (tangga kesuksesan, tetesan air melubangi batu, kepompong jadi kupu-kupu, pohon dari biji, gunung es, dan sejenisnya).
* Setiap ide harus berbeda: beda pesan, beda metafora, beda jenis hook.
* Bahasa natural, sehari-hari, langsung dipahami sekali dengar. Hindari kata akademis atau serapan tinggi, hindari kalimat puitis atau bertingkat. Satu kalimat satu maksud.
* Jika mode promosi, jangan mengarang klaim, angka, testimoni, atau sertifikat yang tidak ada di data. Tulis klaim netral bila data kurang.
* Bayangkan setiap ide bisa dibuat menjadi 6-8 scene dengan dekorasi ${decorationLabel(config)} dan aset pilihan pengguna. Jangan menulis ide yang butuh 30 objek atau efek film yang mustahil.
${angleSlots(seed, 5)}
Tugas:
Buat tepat 5 ide video pendek ${promoMode ? "promosi" : contentTypeLabel(config)} berbahasa ${language}.
Topik atau kata kunci: ${topic}.
Durasi video: ${duration}. Setiap ide harus punya bahan yang pas untuk durasi itu.

Quality gate ide:
1. Apakah hook bisa dipahami dalam 1 detik pertama?
2. Apakah ada satu metafora visual konkret yang belum pasaran?
3. Apakah ide bisa dibuat dengan 6-8 scene dan aset yang tersedia?
4. Apakah semua field terisi dan tidak ada klaim palsu?
5. Apakah kelima ide benar-benar berbeda satu sama lain?

Format jawaban: HANYA satu blok kode ${codeFence()}json berisi:
{
  "ideas": [
    { "title": "judul singkat", "hook": "kalimat pembuka", "angle": "pesan inti 1-2 kalimat", "visualStyle": "gaya + pencahayaan + palet + komposisi + tipografi + metafora utama" }
  ]
}
Jangan memakai artifact atau canvas. Jangan menambahkan penjelasan di luar blok kode.`;
}

export function buildNarrationPrompt(input: PromptBuildInput): string {
  const { config, style, idea, writerNotes = "" } = input;
  const language = languageLabels[config.language];
  const sceneCount = Math.max(1, Math.round(config.durationSec / APP_CONFIG.sceneSeconds));
  const secondsPerScene = Math.round((config.durationSec / sceneCount) * 10) / 10;
  const ideaTitle = idea?.title ?? "Ide yang dipilih";
  const ideaHook = idea?.hook ?? "";
  const ideaAngle = idea?.angle ?? "";
  const ideaVisual = idea?.visualStyle ?? styleDescription(style);
  const font = sceneFontDefinition(config);

  return `Kamu penulis naskah video pendek ${language} yang juga paham motion design. Kamu menulis naskah yang enak dibacakan suara AI dan mudah divisualkan oleh animator canvas. Kamu membenci naskah yang terdengar seperti brosur.

${audienceBrief(config)}

${visualDirectionBlock(config, style)}

${creativeStandards()}

Ide: ${ideaTitle}
Hook: ${ideaHook}
Pesan inti: ${ideaAngle}
Visual: ${ideaVisual}
Catatan penulis: ${writerNotes.trim() || "(tidak ada)"}
${sourceBlock(config)}${extrasBlock(config)}
Spesifikasi:
* Total durasi ${config.durationSec} detik, sekitar ${sceneCount} scene, kira-kira ${secondsPerScene} detik per scene.
* Nuansa: ${tempoNotes[config.tempo]}. Gaya visual: ${styleDescription(style)}. Rasio ${config.aspect}.
* Struktur: scene 1 hook (maksimal 2 kalimat pendek), scene 2-${Math.max(2, sceneCount - 1)} mengembangkan satu gagasan, scene terakhir menutup atau mengajak. Setiap scene menambah pemahaman baru; jangan mengulang kalimat.
* Narasi tiap scene: 2-3 kalimat pendek, sekitar 2.3-3.2 kata per detik. Satu kalimat satu maksud. Bahasa sehari-hari.
* "visual" menjelaskan APA yang terlihat dan bergerak, selaras kata-kata scene itu (aksi yang terlihat, bukan dekorasi). Sebutkan objek utama, arah gerak, dan perubahan yang terlihat.
* "theme" salah satu: "paper" (terang), "dusk" (senja, suasana berat atau transisi), "night" (gelap, momen klimaks atau serius). Variasikan dengan sengaja.
* Teks di video memakai font ${font.label}; jangan meminta font lain di kolom visual.
* Dekorasi ${decorationLabel(config)} dengan tekstur ${textureLabel(config)}; aset dekorasi hanya dipakai jika memperkuat aksi scene.
* [KINETIC SVG & ANIMATION SYSTEM]:
  - When generating SVG visual scenes, incorporate lively animated SVG paths and keyframes inspired by LivelyIcons (stroke-dasharray draw animations, scale pulses, float oscillations, and kinetic micro-interactions).
  - Provide inline synchronized SVG code with clean CSS keyframe animations for each scene element.
  - Ensure all SVG graphics use vector primitives that scale flawlessly to 9:16 vertical and 16:9 horizontal formats.
* Tanpa wajah pada tokoh.
* Jangan mengarang fakta yang tidak ada di ide atau data pengguna.
* Setiap scene harus mungkin dibuat dengan 5-15 bentuk dan maksimal 3 aset dekorasi.

Quality gate naskah:
1. Apakah scene 1 langsung menohok tanpa sapaan?
2. Apakah setiap scene punya satu aksi visual yang bisa digambar?
3. Apakah total durasi mendekati target dan ritme tidak monoton?
4. Apakah bahasa terdengar diucapkan, bukan dibaca?
5. Apakah ada penutup atau ajakan yang jelas?

Format jawaban: HANYA satu blok ${codeFence()}json:
{
  "title": "...",
  "scenes": [
    { "n": 1, "narration": "...", "visual": "...", "theme": "paper", "durationSec": ${secondsPerScene} }
  ]
}
Jangan menambahkan penjelasan di luar blok.`;
}

export function buildScenePrompt(input: PromptBuildInput): string {
  const { config, style, scenes = [] } = input;
  const sampleCode = style?.sampleCode ?? "";
  const marker = "/" + "/";
  const font = sceneFontDefinition(config);
  const palette = (style?.palette ?? ["#ffffff", "#18161a", "#e0218a", "#8d8790", "#e4dfda"]).join(", ");

  return `<inputs>
Project: VoiceMotion Studio Kinetic Video Engine
${audienceBrief(config)}

Font video: ${font.label} (${font.family}, weight: ${font.weight})
Dekorasi: ${decorationLabel(config)} (intensitas ${config.decorationIntensity}%)
Tekstur: ${textureLabel(config)}
Gaya Subtitle: ${subtitleLabel(config)}
Theme & Style: ${style?.name ?? "Neu-Soft"}
Visual Description: ${style?.descriptionForPrompt ?? "Kinetic visual layout"}
Color Palette: ${palette}
Tempo: ${tempoNotes[config.tempo] ?? "energik"}

Aset dekorasi pilihan pengguna:
${preferredAssetsBlock(config)}

Katalog aset SVG yang valid (hanya ID ini, gunakan s.asset):
${assetCatalog()}

Scene Breakdown:
${scenes
  .map(
    (s) => `SCENE ${s.idx + 1}
Narasi: ${s.narration}
Visual: ${s.visual}
Durasi: ${s.durationSec}s`
  )
  .join("\n\n")}
</inputs>

<direction>
Prinsip desain scene:
- Komposisi: gunakan grid 3x3, satu titik fokus utama, dan ruang kosong yang cukup. Objek utama memakai 55-85% lebar area ilustrasi.
- Hirarki: satu headline, satu subteks opsional, satu aksen. Jangan menaruh lima teks sekaligus.
- Tipografi: font ${font.label} (weight ${font.weight}); headline 46-64, subteks 26-34, label 16-20; line-height 1.1-1.25; maksimal dua baris untuk headline; hindari teks miring kecuali gaya memang mendukung.
- Warna: pilih 2-4 warna dari s.c, gunakan satu aksen, dan pastikan kontras teks minimal 4.5:1.
- Gerak: masuk 0-0.35 detik, idle motion halus, klimaks 55-80%, semua animasi masuk selesai sebelum durasi - 0.25. Gunakan spring/at/pop; hindari gerakan linear yang kaku.
- Suara: 1-4 s.sfx di level atas, selaras dengan gerakan; jangan memanggil sfx di dalam kondisi waktu.
- Tanpa wajah, tanpa emoji, tanpa logo merek.
- Scene harus bisa dipahami tanpa suara.
- [KINETIC SVG & ANIMATION SYSTEM]:
  - When generating SVG visual scenes, incorporate lively animated SVG paths and keyframes inspired by LivelyIcons (stroke-dasharray draw animations, scale pulses, float oscillations, and kinetic micro-interactions).
  - Provide inline synchronized SVG code with clean CSS keyframe animations for each scene element.
  - Ensure all SVG graphics use vector primitives that scale flawlessly to 9:16 vertical and 16:9 horizontal formats.
- Jangan menggambar latar, subtitle, transisi, atau kamera; engine sudah mengurus.
</direction>

<structure>
${scenes
  .map(
    (s) => `SCENE ${s.idx + 1}
Narasi: ${s.narration}
Visual: ${s.visual}
Expected Output Marker: ${marker} ===== SCENE ${s.idx + 1} =====
Timeline:
- 0.0s - 0.35s: Entrance with directional blur or snappy spring.
- 0.5s - 2.5s: Kinetic element reveal / typewriter text / checklist item.
- 2.5s - 5.5s: Focal illustration or card action with wave oscillation.
- 5.5s - ${s.durationSec}s: Climax burst, sound effect, and lock into resting state.`
  )
  .join("\n\n")}
</structure>

<build>
You MUST write pure JavaScript using only the s engine context API.

Canvas Engine API Reference:
${engineApiSummary}

Contoh kerangka kode (tiru polanya, bukan isinya):
${sceneSkeleton}

Example High-Craft Pattern (Replicate this exact code style):
${codeFence()}js
const MG = "#e0218a", INK = "#18161a", MU = "#8d8790", LINE = "#e4dfda";
const flat = { wobble: 0, hatch: false };
const zip = (t0, len, dx, dy, fn) => {
  const k = s.ease.out(s.clamp((s.t - t0) / len, 0, 1));
  if (k <= 0) return;
  const v = 1 - k;
  for (let i = 4; i > 0 && v > 0.02; i--) s.group({ x: dx * v + dx * v * i * 0.12, y: dy * v + dy * v * i * 0.12, alpha: 0.036 * v * (5 - i) }, fn);
  s.group({ x: dx * v, y: dy * v, alpha: Math.min(1, k * 2.5) }, fn);
};
const card = (x, y, w, h, r = 22) => {
  s.rect(x, y + 10, w, h, { r, fill: "#000000", stroke: "none", alpha: 0.06, ...flat });
  s.rect(x, y, w, h, { r, fill: "#ffffff", stroke: LINE, width: 2, ...flat });
};
${codeFence()}

${sampleCode ? `Style Sample Reference:\n${codeFence()}js\n${sampleCode}\n${codeFence()}` : ""}
</build>

<gotchas>
CRITICAL CONSTRAINTS — ANY VIOLATION RENDERS THE CODE UNUSABLE:
1. STRICTLY NO HTML, NO CSS, NO DOM, NO CANVAS GETCONTEXT, NO REACT/JSX! Output pure JavaScript scene code ONLY.
2. NO function wrappers around the scene code (do NOT write function scene1(s) { ... }). The engine evaluates the code body directly with s and ctx in scope.
3. NO persistent state across frames (no module-level variables storing mutable values). All positions, scales, and states MUST be purely derived from s.t.
4. NO Math.random(), NO setInterval(), NO setTimeout(), NO requestAnimationFrame(). Use s.rand(seed) for deterministic randomness.
5. NO comments inside the code (zero code comments). Keep code compact and production-clean.
6. Scene markers MUST be exact:
${scenes.map((s) => `${marker} ===== SCENE ${s.idx + 1} =====`).join("\n")}
7. Wrap every scene inside a SINGLE markdown code block: ${codeFence()}js ... ${codeFence()}.

Quality gate kode:
${sceneQualityChecklist()}
</gotchas>

<start>
Write the complete procedural JavaScript canvas animation code for all scenes now.
Start immediately with ${marker} ===== SCENE ${scenes[0]?.idx ? scenes[0].idx + 1 : 1} =====.
</start>`;
}

export function buildRepairPrompt(input: RepairPromptInput): string {
  return `Jawabanmu sebelumnya bermasalah dan tidak bisa dipakai aplikasi.
Jenis: ${input.kind}
Masalah yang ditemukan:
${input.errors.map((error) => `- ${error}`).join("\n")}

Perbaiki HANYA bagian yang bermasalah, pertahankan sisanya. ${input.formatReminder}
Jawab dengan satu blok kode saja, tanpa penjelasan.

Jawaban sebelumnya:
${input.previousAnswer}`;
}

export function buildPrompt(stage: PromptStage, input: PromptBuildInput): string {
  if (stage === "narration") return buildNarrationPrompt(input);
  if (stage === "scene") return buildScenePrompt(input);
  return buildIdeaPrompt(input);
}
