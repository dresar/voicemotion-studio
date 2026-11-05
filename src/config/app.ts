export const APP_CONFIG = {
  appName: "VoiceMotion Studio",
  trialDays: 4,
  plans: {
    trial: { projectQuota: 1, credits: 2, label: "Trial", price: 0 },
    starter: { projectQuota: 10, credits: 20, label: "Starter", price: 49000 },
    pro: { projectQuota: 999, credits: 100, label: "Pro", price: 149000 }
  },
  creditCostExport: 1,
  maxPasteSize: 200000,
  ttsVoices: [
    {
      id: "ibu_sari",
      name: "Ibu Sari (Gemini Natural)",
      gender: "female" as const,
      edgeVoice: "id-ID-GadisNeural",
      description: "Suara AI perempuan, hangat & natural"
    },
    {
      id: "bapak_ardi",
      name: "Bapak Ardi (Gemini Pro)",
      gender: "male" as const,
      edgeVoice: "id-ID-ArdiNeural",
      description: "Suara AI laki-laki, tegas & profesional"
    }
  ],
  aiProviders: ["gemini", "claude"] as const,
  styleCategories: ["Semua", "Tenang", "Teknologi", "Pop", "Ilustrasi", "Tipografi"],
  durations: [30, 50, 60],
  contentTypes: [
    { value: "motivation", label: "Motivasi" },
    { value: "education", label: "Edukasi" },
    { value: "humor", label: "Humor" },
    { value: "business", label: "Bisnis" },
    { value: "story", label: "Cerita" },
    { value: "promo", label: "Promosi" }
  ],
  characters: [
    { value: "none", label: "Tanpa karakter" },
    { value: "adult", label: "Orang dewasa" },
    { value: "teen", label: "Remaja" },
    { value: "child", label: "Anak" },
    { value: "mascot", label: "Maskot" }
  ],
  transitions: [
    { value: "auto", label: "Otomatis" },
    { value: "slide", label: "Geser" },
    { value: "zoom", label: "Zoom" },
    { value: "wipe", label: "Wipe" },
    { value: "fade", label: "Fade" }
  ],
  aspects: [
    { value: "9:16", label: "9:16", width: 720, height: 1280 },
    { value: "16:9", label: "16:9", width: 1280, height: 720 },
    { value: "1:1", label: "1:1", width: 1000, height: 1000 },
    { value: "3:4", label: "3:4", width: 900, height: 1200 }
  ],
  sceneFonts: [
    {
      id: "plus-jakarta-sans",
      label: "Plus Jakarta Sans",
      family: "Plus Jakarta Sans",
      weight: 700,
      category: "Modern Sans",
      url: "/fonts/plus-jakarta-sans-700.woff2"
    },
    {
      id: "playfair-display",
      label: "Playfair Display",
      family: "Playfair Display",
      weight: 700,
      category: "Editorial Serif",
      url: "/fonts/playfair-display-700.woff2"
    },
    {
      id: "dm-serif-display",
      label: "DM Serif Display",
      family: "DM Serif Display",
      weight: 400,
      category: "Display Serif",
      url: "/fonts/dm-serif-display-400.woff2"
    },
    {
      id: "bebas-neue",
      label: "Bebas Neue",
      family: "Bebas Neue",
      weight: 400,
      category: "Condensed Display",
      url: "/fonts/bebas-neue-400.woff2"
    },
    {
      id: "space-grotesk",
      label: "Space Grotesk",
      family: "Space Grotesk",
      weight: 700,
      category: "Tech Sans",
      url: "/fonts/space-grotesk-700.woff2"
    },
    {
      id: "caveat",
      label: "Caveat",
      family: "Caveat",
      weight: 700,
      category: "Handwritten",
      url: "/fonts/caveat-700.woff2"
    }
  ],
  decorationStyles: [
    { value: "editorial", label: "Editorial" },
    { value: "minimal", label: "Minimal" },
    { value: "scrapbook", label: "Scrapbook" },
    { value: "geometric", label: "Geometris" },
    { value: "organic", label: "Organik" }
  ],
  textures: [
    { value: "paper", label: "Kertas" },
    { value: "none", label: "Tanpa tekstur" },
    { value: "grain", label: "Grain" },
    { value: "grid", label: "Grid" },
    { value: "dots", label: "Titik" }
  ],
  subtitleStyles: [
    { value: "box", label: "Kotak" },
    { value: "minimal", label: "Minimal" },
    { value: "highlight", label: "Sorot" }
  ],
  defaultConfig: {
    startFrom: "topic" as const,
    language: "id" as const,
    contentType: "motivation" as const,
    topic: "",
    durationSec: 60,
    styleSlug: "neu-soft",
    character: "none",
    brandColor: "follow_style",
    tempo: "energetic" as const,
    transition: "auto",
    aspect: "9:16" as const,
    extras: {
      tone: "",
      avoid: "",
      cta: "",
      contact: ""
    },
    ownNarration: "",
    productName: "",
    productBenefits: "",
    writerNotes: "",
    voiceId: "ibu_sari",
    voiceSpeed: 1,
    scenePause: 0.3,
    sceneFont: "plus-jakarta-sans",
    decorationStyle: "editorial" as const,
    decorationIntensity: 45,
    texture: "paper" as const,
    subtitleStyle: "box" as const,
    preferredAssets: ["spark", "underline"],
    ideaSet: []
  },
  sceneSeconds: 7.5,
  minSceneDuration: 2,
  maxSceneDuration: 20,
  minVideoDuration: 10,
  maxVideoDuration: 180,
  maxScenes: 30,
  ttsSpeed: { min: 0.8, max: 1.3, step: 0.05, default: 1 },
  apiBaseUrl: process.env.NODE_ENV === "development" ? process.env.NEXT_PUBLIC_API_URL ?? "" : ""
} as const;
