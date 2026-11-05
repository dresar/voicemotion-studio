import { describe, expect, it } from "vitest";
import { parseIdeaAnswer, parseNarrationAnswer, parseSceneCodeAnswer } from "@/lib/parse/parseAnswer";

const cleanIdeas = {
  ideas: [
    { title: "Disiplin Bukan Bakat", hook: "Kamu pikir kamu malas?", angle: "Disiplin dibangun dari sistem kecil, bukan mood besar.", visualStyle: "kertas krem, tinta hitam, satu meja rapi, kamera dekat" },
    { title: "Satu Langkah Kecil", hook: "Mulai dari yang terlalu kecil untuk gagal.", angle: "Langkah kecil yang konsisten mengalahkan rencana besar yang tertunda.", visualStyle: "biru lembut, bayangan panjang, satu kotak dicentang" },
    { title: "Waktu Bukan Musuh", hook: "Waktu tidak mengejarmu.", angle: "Kita yang sering memberi waktu terlalu banyak pekerjaan.", visualStyle: "senja hangat, jam dinding besar, komposisi simetris" },
    { title: "Ruang untuk Gagal", hook: "Gagal sekali bukan akhir.", angle: "Ruang untuk salah membuat orang berani mencoba lagi.", visualStyle: "ruang gelap, satu lampu meja, kertas coretan" },
    { title: "Kebiasaan Kecil", hook: "Kebiasaan kecil terlihat membosankan.", angle: "Justru kebiasaan kecil yang paling sulit dihentikan.", visualStyle: "putih bersih, satu gelas air, gerak lambat" }
  ]
};

describe("parseIdeaAnswer", () => {
  it("membaca JSON bersih", () => {
    const result = parseIdeaAnswer(JSON.stringify(cleanIdeas));
    expect(result.ok).toBe(true);
    expect(result.data?.ideas).toHaveLength(5);
    expect(result.data?.ideas[0].id).toBeTruthy();
  });

  it("membaca jawaban dengan pagar kode json", () => {
    const result = parseIdeaAnswer("```json\n" + JSON.stringify(cleanIdeas) + "\n```");
    expect(result.ok).toBe(true);
    expect(result.data?.ideas).toHaveLength(5);
  });

  it("menormalkan kutip pintar", () => {
    const smart = JSON.stringify(cleanIdeas)
      .replace(/"/g, "“")
      .replace(/“/g, "“")
      .replace(/”/g, "”");
    const result = parseIdeaAnswer(smart);
    expect(result.ok).toBe(true);
    expect(result.data?.ideas).toHaveLength(5);
  });

  it("menerima trailing comma", () => {
    const text = JSON.stringify(cleanIdeas).replace(/\}\]$/, "},],}");
    const result = parseIdeaAnswer(text);
    expect(result.ok).toBe(true);
  });

  it("mengabaikan teks pembuka sebelum blok kode", () => {
    const result = parseIdeaAnswer("Tentu saja! Berikut idenya:\n```json\n" + JSON.stringify(cleanIdeas) + "\n```\nSemoga membantu.");
    expect(result.ok).toBe(true);
  });

  it("memberi error ramah saat hook ide ketiga kosong", () => {
    const broken = JSON.parse(JSON.stringify(cleanIdeas));
    broken.ideas[2].hook = "";
    const result = parseIdeaAnswer(JSON.stringify(broken));
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes("Ide ke-3"))).toBe(true);
    expect(result.issues.some((issue) => issue.message.includes("hook"))).toBe(true);
  });

  it("tetap menerima kurang dari lima ide", () => {
    const result = parseIdeaAnswer(JSON.stringify({ ideas: cleanIdeas.ideas.slice(0, 2) }));
    expect(result.ok).toBe(true);
    expect(result.data?.ideas).toHaveLength(2);
  });

  it("memberi saran saat JSON rusak total", () => {
    const result = parseIdeaAnswer("{\"ideas\": [ { \"title\": \"Satu\", ");
    expect(result.ok).toBe(false);
    expect(result.issues[0].message.toLowerCase()).toContain("json");
    expect(result.issues[0].message.toLowerCase()).toContain("coba");
  });
});

describe("parseNarrationAnswer", () => {
  it("membaca scene dan memberi peringatan durasi", () => {
    const answer = {
      title: "Naskah",
      scenes: [
        { n: 1, narration: "Kebanyakan orang menunda karena menunggu mood.", visual: "Jam dinding berputar cepat", theme: "paper", durationSec: 7.5 },
        { n: 2, narration: "Mulai dari satu langkah kecil hari ini.", visual: "Satu kotak dicentang", theme: "dusk", durationSec: 6 }
      ]
    };
    const result = parseNarrationAnswer("```json\n" + JSON.stringify(answer) + "\n```", 60);
    expect(result.ok).toBe(true);
    expect(result.data?.scenes).toHaveLength(2);
    expect(result.data?.scenes[0].codeStatus).toBe("empty");
    expect(result.issues.length).toBeGreaterThan(0);
  });
});

describe("parseSceneCodeAnswer", () => {
  it("memecah kode dengan penanda SCENE", () => {
    const raw = "```js\n// ===== SCENE 1 =====\nconst k = s.spring(0);\ns.circle(0,0,100,{fill:s.c.blue});\n// ===== SCENE 2 =====\ns.words(\"Halo\",0,0,{size:40});\n```";
    const result = parseSceneCodeAnswer(raw);
    expect(result.ok).toBe(true);
    expect(Object.keys(result.scenes)).toEqual(["1", "2"]);
    expect(result.scenes[1]).toContain("s.spring");
  });

  it("membaca kode berantakan dengan pembungkus fungsi", () => {
    const raw = "Berikut kodenya:\n```javascript\n  // ===== SCENE 1 =====\nfunction (s, ctx) {\n  s.rect(0,0,10,10,{fill:s.c.ink});\n}\n```";
    const result = parseSceneCodeAnswer(raw);
    expect(result.ok).toBe(true);
    expect(result.scenes[1]).toContain("s.rect");
    expect(result.scenes[1]).not.toContain("function");
  });

  it("memakai scene 1 saat penanda tidak ditemukan", () => {
    const result = parseSceneCodeAnswer("```js\ns.circle(0,0,50,{fill:s.c.red});\n```");
    expect(result.ok).toBe(true);
    expect(result.scenes[1]).toContain("s.circle");
    expect(result.issues[0]).toContain("Penanda");
  });
});
