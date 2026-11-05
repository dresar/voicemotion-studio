export type LivelyMotionType =
  | "scale"
  | "rotate"
  | "pulse"
  | "bounce"
  | "draw"
  | "spin"
  | "wiggle"
  | "heartbeat"
  | "float";

export interface LivelyIconMeta {
  id: string;
  componentName: string;
  name: string;
  category: "Actions" | "Communication" | "Media" | "Devices" | "Shapes" | "Emotions";
  defaultMotion: LivelyMotionType;
  tags: string[];
}

export const LIVELY_MOTION_TYPES: LivelyMotionType[] = [
  "draw",
  "pulse",
  "bounce",
  "rotate",
  "float",
  "wiggle",
  "scale",
  "spin",
  "heartbeat"
];

export const LIVELY_ICONS_CATALOG: LivelyIconMeta[] = [
  {
    id: "sparkles",
    componentName: "Sparkles",
    name: "Sparkles",
    category: "Emotions",
    defaultMotion: "pulse",
    tags: ["magic", "shine", "ai", "glow"]
  },
  {
    id: "zap",
    componentName: "Zap",
    name: "Petir Energi",
    category: "Actions",
    defaultMotion: "bounce",
    tags: ["energy", "fast", "speed", "power"]
  },
  {
    id: "play",
    componentName: "Play",
    name: "Play Video",
    category: "Media",
    defaultMotion: "scale",
    tags: ["start", "video", "media", "player"]
  },
  {
    id: "video",
    componentName: "Video",
    name: "Kamera Video",
    category: "Media",
    defaultMotion: "draw",
    tags: ["recording", "film", "movie", "creator"]
  },
  {
    id: "film",
    componentName: "Film",
    name: "Roll Film",
    category: "Media",
    defaultMotion: "rotate",
    tags: ["cinema", "scene", "reel", "motion"]
  },
  {
    id: "camera",
    componentName: "Camera",
    name: "Kamera Foto",
    category: "Media",
    defaultMotion: "pulse",
    tags: ["photo", "snapshot", "lens", "visual"]
  },
  {
    id: "music",
    componentName: "Music",
    name: "Nada Musik",
    category: "Media",
    defaultMotion: "float",
    tags: ["audio", "song", "tempo", "tune"]
  },
  {
    id: "mic",
    componentName: "Mic",
    name: "Mikrofon Suara",
    category: "Media",
    defaultMotion: "pulse",
    tags: ["voice", "tts", "narration", "sound"]
  },
  {
    id: "heart",
    componentName: "Heart",
    name: "Hati",
    category: "Emotions",
    defaultMotion: "heartbeat",
    tags: ["love", "favorite", "like", "warm"]
  },
  {
    id: "star",
    componentName: "Star",
    name: "Bintang",
    category: "Emotions",
    defaultMotion: "wiggle",
    tags: ["rate", "popular", "gold", "highlight"]
  },
  {
    id: "smile",
    componentName: "Smile",
    name: "Senyum Bahagia",
    category: "Emotions",
    defaultMotion: "bounce",
    tags: ["happy", "cheerful", "vibe", "friendly"]
  },
  {
    id: "sun",
    componentName: "Sun",
    name: "Matahari Cerah",
    category: "Emotions",
    defaultMotion: "spin",
    tags: ["bright", "day", "warmth", "optimism"]
  },
  {
    id: "moon",
    componentName: "Moon",
    name: "Bulan Tenang",
    category: "Emotions",
    defaultMotion: "float",
    tags: ["night", "calm", "sleep", "dream"]
  },
  {
    id: "flame",
    componentName: "Flame",
    name: "Api Semangat",
    category: "Emotions",
    defaultMotion: "pulse",
    tags: ["hot", "fire", "trending", "viral"]
  },
  {
    id: "check",
    componentName: "Check",
    name: "Centang Berhasil",
    category: "Actions",
    defaultMotion: "draw",
    tags: ["done", "success", "approved", "ok"]
  },
  {
    id: "arrow-right",
    componentName: "ArrowRight",
    name: "Panah Maju",
    category: "Actions",
    defaultMotion: "bounce",
    tags: ["forward", "next", "continue", "progress"]
  },
  {
    id: "refresh",
    componentName: "Refresh",
    name: "Putar Ulang",
    category: "Actions",
    defaultMotion: "spin",
    tags: ["reload", "sync", "cycle", "loop"]
  },
  {
    id: "download",
    componentName: "Download",
    name: "Unduh Berkas",
    category: "Actions",
    defaultMotion: "bounce",
    tags: ["save", "export", "file", "disk"]
  },
  {
    id: "message-square",
    componentName: "MessageSquare",
    name: "Pesan Obrolan",
    category: "Communication",
    defaultMotion: "float",
    tags: ["chat", "comment", "discussion", "text"]
  },
  {
    id: "bell",
    componentName: "Bell",
    name: "Lonceng Notifikasi",
    category: "Communication",
    defaultMotion: "wiggle",
    tags: ["alert", "notification", "ring", "notice"]
  },
  {
    id: "mail",
    componentName: "Mail",
    name: "Surat Email",
    category: "Communication",
    defaultMotion: "draw",
    tags: ["inbox", "message", "letter", "contact"]
  },
  {
    id: "send",
    componentName: "Send",
    name: "Kirim Langsung",
    category: "Communication",
    defaultMotion: "scale",
    tags: ["dispatch", "paperplane", "post", "fly"]
  },
  {
    id: "smartphone",
    componentName: "Smartphone",
    name: "Ponsel Pintar",
    category: "Devices",
    defaultMotion: "pulse",
    tags: ["mobile", "portrait", "916", "screen"]
  },
  {
    id: "monitor",
    componentName: "Monitor",
    name: "Layar Komputer",
    category: "Devices",
    defaultMotion: "draw",
    tags: ["desktop", "screen", "display", "169"]
  },
  {
    id: "cpu",
    componentName: "Cpu",
    name: "Chip Prosesor",
    category: "Devices",
    defaultMotion: "pulse",
    tags: ["hardware", "tech", "data", "ai"]
  },
  {
    id: "compass",
    componentName: "Compass",
    name: "Kompas Arah",
    category: "Shapes",
    defaultMotion: "rotate",
    tags: ["direction", "navigation", "map", "guide"]
  },
  {
    id: "globe",
    componentName: "Globe",
    name: "Bola Dunia",
    category: "Shapes",
    defaultMotion: "spin",
    tags: ["world", "earth", "network", "global"]
  },
  {
    id: "award",
    componentName: "Award",
    name: "Medali Penghargaan",
    category: "Shapes",
    defaultMotion: "bounce",
    tags: ["trophy", "winner", "achievement", "badge"]
  }
];

export function findLivelyIcon(idOrName: string): LivelyIconMeta | undefined {
  const query = idOrName.toLowerCase().trim();
  return LIVELY_ICONS_CATALOG.find(
    (item) =>
      item.id.toLowerCase() === query ||
      item.componentName.toLowerCase() === query ||
      item.name.toLowerCase() === query
  );
}

