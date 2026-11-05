export type AssetRenderMode = "fill" | "stroke";
export type AssetCategory = "aksen" | "bentuk" | "garis" | "simbol";

export interface SceneAsset {
  id: string;
  label: string;
  description: string;
  path: string;
  mode: AssetRenderMode;
  category: AssetCategory;
}

export const sceneAssets: SceneAsset[] = [
  {
    id: "spark",
    label: "Spark",
    description: "percikan bintang empat sudut untuk aksen kecil dan momen penting",
    path: "M50 4 L60 40 L96 50 L60 60 L50 96 L40 60 L4 50 L40 40 Z",
    mode: "fill",
    category: "aksen"
  },
  {
    id: "star",
    label: "Star",
    description: "bintang lima sudut klasik untuk penekanan dan apresiasi",
    path: "M50 5 L61 38 L96 38 L68 59 L79 92 L50 71 L21 92 L32 59 L4 38 L39 38 Z",
    mode: "fill",
    category: "simbol"
  },
  {
    id: "burst",
    label: "Burst",
    description: "ledakan dua belas sinar untuk klimaks dan pengumuman",
    path: "M50 2 L57 30 L78 10 L70 38 L98 32 L78 50 L98 68 L70 62 L78 90 L57 70 L50 98 L43 70 L22 90 L30 62 L2 68 L22 50 L2 32 L30 38 L22 10 L43 30 Z",
    mode: "fill",
    category: "aksen"
  },
  {
    id: "blob",
    label: "Blob",
    description: "bentuk organik lembut untuk latar bentuk dan bayangan warna",
    path: "M82 22 C94 36 92 61 77 76 C62 91 34 96 19 81 C4 66 6 38 21 23 C36 8 70 8 82 22 Z",
    mode: "fill",
    category: "bentuk"
  },
  {
    id: "heart",
    label: "Heart",
    description: "hati untuk apresiasi, empati, dan ajakan peduli",
    path: "M50 88 C20 68 6 52 6 35 C6 19 18 8 33 8 C42 8 48 13 50 18 C52 13 58 8 67 8 C82 8 94 19 94 35 C94 52 80 68 50 88 Z",
    mode: "fill",
    category: "simbol"
  },
  {
    id: "bolt",
    label: "Bolt",
    description: "petir untuk kejutan, ide cepat, dan energi",
    path: "M58 4 L18 56 L45 56 L36 96 L84 40 L55 40 Z",
    mode: "fill",
    category: "simbol"
  },
  {
    id: "leaf",
    label: "Leaf",
    description: "daun untuk pertumbuhan, kesehatan, dan nuansa alami",
    path: "M86 14 C46 12 14 32 14 66 C14 78 22 88 36 88 C68 88 88 54 86 14 Z",
    mode: "fill",
    category: "bentuk"
  },
  {
    id: "quote",
    label: "Quote",
    description: "tanda kutip besar untuk membingkai kalimat penting",
    path: "M16 64 C8 56 6 44 10 32 C14 20 24 10 38 6 L42 16 C32 20 26 28 26 36 C34 36 40 42 40 50 C40 60 32 68 22 68 C20 68 18 66 16 64 Z M58 64 C50 56 48 44 52 32 C56 20 66 10 80 6 L84 16 C74 20 68 28 68 36 C76 36 82 42 82 50 C82 60 74 68 64 68 C62 68 60 66 58 64 Z",
    mode: "fill",
    category: "simbol"
  },
  {
    id: "cloud",
    label: "Cloud",
    description: "awan untuk suasana ringan, mimpi, dan ruang bernapas",
    path: "M28 72 C14 72 4 62 4 50 C4 38 13 28 25 28 C30 16 41 8 54 8 C70 8 83 20 85 36 C93 39 98 46 98 54 C98 64 90 72 80 72 Z",
    mode: "fill",
    category: "bentuk"
  },
  {
    id: "tape",
    label: "Tape",
    description: "potongan selotip kertas untuk nuansa scrapbook dan catatan",
    path: "M12 28 L88 18 L90 74 L16 84 Z",
    mode: "fill",
    category: "bentuk"
  },
  {
    id: "cursor",
    label: "Cursor",
    description: "kursor panah untuk menunjuk detail dan arah baca",
    path: "M22 10 L78 50 L50 54 L64 84 L50 90 L36 60 L20 78 Z",
    mode: "fill",
    category: "simbol"
  },
  {
    id: "play",
    label: "Play",
    description: "segitiga putar untuk ajakan menonton dan langkah berikutnya",
    path: "M28 16 L84 50 L28 84 Z",
    mode: "fill",
    category: "simbol"
  },
  {
    id: "ring",
    label: "Ring",
    description: "cincin tipis untuk orbit, fokus, dan penanda lingkaran",
    path: "M50 8 A42 42 0 1 1 49.9 8 Z",
    mode: "stroke",
    category: "garis"
  },
  {
    id: "squiggle",
    label: "Squiggle",
    description: "garis coret tangan untuk penekanan dan energi spontan",
    path: "M4 60 C18 20 34 20 48 50 C62 80 78 80 96 40",
    mode: "stroke",
    category: "garis"
  },
  {
    id: "underline",
    label: "Underline",
    description: "garis bawah tangan untuk menandai kata atau angka penting",
    path: "M6 58 C28 48 60 68 94 50",
    mode: "stroke",
    category: "garis"
  },
  {
    id: "arrow",
    label: "Arrow",
    description: "panah melengkung untuk alur, arah, dan hubungan antar objek",
    path: "M6 70 C30 24 62 18 92 32 M72 12 L94 32 L70 50",
    mode: "stroke",
    category: "garis"
  },
  {
    id: "wave",
    label: "Wave",
    description: "gelombang berulang untuk ritme, suara, dan aliran data",
    path: "M2 50 C10 20 18 20 26 50 C34 80 42 80 50 50 C58 20 66 20 74 50 C82 80 90 80 98 50",
    mode: "stroke",
    category: "garis"
  },
  {
    id: "spiral",
    label: "Spiral",
    description: "spiral untuk proses, pertumbuhan, dan fokus yang berputar",
    path: "M50 50 C50 43 57 43 57 50 C57 60 43 60 43 50 C43 37 63 37 63 50 C63 67 37 67 37 50 C37 30 67 30 67 50",
    mode: "stroke",
    category: "garis"
  },
  {
    id: "frame",
    label: "Frame",
    description: "bingkai tipis untuk membingkai kutipan dan potongan visual",
    path: "M14 14 L86 14 L86 86 L14 86 Z",
    mode: "stroke",
    category: "bentuk"
  },
  {
    id: "asterisk",
    label: "Asterisk",
    description: "tanda bintang garis untuk catatan, penjelasan, dan aksen",
    path: "M50 12 L50 88 M18 31 L82 69 M82 31 L18 69",
    mode: "stroke",
    category: "aksen"
  },
  {
    id: "check",
    label: "Check",
    description: "centang tebal untuk selesai, benar, dan langkah tercapai",
    path: "M18 52 L40 74 L84 26",
    mode: "stroke",
    category: "simbol"
  },
  {
    id: "cross",
    label: "Cross",
    description: "silang untuk mitos yang dipatahkan dan hal yang dihindari",
    path: "M26 26 L74 74 M74 26 L26 74",
    mode: "stroke",
    category: "simbol"
  },
  {
    id: "plus",
    label: "Plus",
    description: "tanda tambah untuk penambahan, langkah baru, dan koneksi",
    path: "M50 14 L50 86 M14 50 L86 50",
    mode: "stroke",
    category: "aksen"
  },
  {
    id: "grid",
    label: "Grid",
    description: "grid tipis untuk nuansa teknologi, data, dan struktur",
    path: "M10 10 L90 10 M10 40 L90 40 M10 70 L90 70 M10 10 L10 90 M40 10 L40 90 M70 10 L70 90",
    mode: "stroke",
    category: "garis"
  }
];

export function findSceneAsset(id: string): SceneAsset | undefined {
  return sceneAssets.find((asset) => asset.id === id);
}

export function assetCatalog(): string {
  return sceneAssets
    .map((asset) => `- ${asset.id} (${asset.label}): ${asset.description}`)
    .join("\n");
}
