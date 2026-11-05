# Changelog

## Fase 1 — Fondasi Frontend

- Next.js 14 + TypeScript + Tailwind dengan static export dan trailing slash.
- Token soft-blue neumorphism, Plus Jakarta Sans, Caveat, dan aturan aksesibilitas.
- Komponen UI: Button, Card, Input, Textarea, Select, Chip, Segmented, Modal,
  Sheet, Toast, Tabs, Progress, Skeleton, Tooltip, Accordion, Avatar, Logo,
  EmptyState, ConfirmDialog, Icon set internal.
- Halaman galeri komponen di `/ui`.
- Tipe global, konfigurasi aplikasi, kamus Bahasa Indonesia, API client,
  token storage, dan utilitas.

## Fase 2 — Backend Go

- Echo server dengan middleware JWT, CORS, rate limit, body limit, dan security
  headers.
- SQLite migration otomatis dan seed admin dari environment.
- Google OAuth dan login email/password dengan bcrypt + JWT.
- CRUD proyek, batch scene, ownership check, kuota proyek, dan duplikat.
- TTS edge-tts subprocess + cache SHA256 + fallback Google TTS.
- Kredit idempotent, export log, delapan style pack, dan panel admin API.
- SPA static serving dengan fallback aman.

## Fase 3 — Auth dan Shell Frontend

- Zustand store auth dan project.
- Guard rute client-side untuk static export, termasuk token OAuth di query.
- Halaman masuk, pilih titik mulai, workspace header, strip trial, stepper empat
  tahap, bottom action bar, sheet proyek, dan panel proyek desktop.
- Autosave debounce 600 ms dengan indikator simpan dan proteksi retry loop.

## Fase 4 — Proyek dan Konfigurasi

- Form konfigurasi lengkap: mulai dari, bahasa, jenis konten, topik/narasi
  sendiri/promo, durasi preset/custom, gaya, karakter, warna brand, tempo,
  transisi, rasio, dan pengaturan tambahan.
- Modal style picker dengan preview, palet, kategori, pencarian, dan delapan
  style pack.
- Ringkasan setelan untuk tab selain Ide.

## Fase 5 — Prompt, BYO-AI, Ide, dan Narasi

- Prompt builder deterministik untuk ide, narasi, kode scene, dan repair.
- Buka Claude/ChatGPT dengan prefill URL, Gemini via clipboard, fallback
  clipboard saat popup diblokir.
- Modal cara kirim empat langkah dengan opsi jangan tampilkan lagi.
- Parser toleran dengan Zod, pesan error Bahasa Indonesia, dan 12 fixture test.
- Sheet tempel jawaban untuk ide, narasi, dan kode.
- Grid ide, pemilihan ide, editor narasi per scene, drag reorder, tema, durasi,
  indikator kata/detik, dan total durasi.

## Fase 6 — Suara

- Pemilihan dua suara Indonesia dan sample Web Speech.
- Kecepatan 0.8-1.3×, jeda antar scene, generate per scene, dan generate semua
  dengan progres.
- Pengukuran durasi audio dan penyesuaian durasi scene otomatis.
- Pemutar audio kustom per scene.

## Fase 7 — Engine Animasi dan Export

- Web Worker + OffscreenCanvas, runtime `s` lengkap dengan primitif gambar,
  easing, spring, words, group, card, SFX, dan palet.
- Pre-scan sandbox, kompilasi strict, dry-run tiga waktu, fallback tipografi.
- Watchdog 45 ms, transfer ImageBitmap, retry engine.
- Preview, playback, scrub, strip scene, status kompilasi, dan editor kode.
- Export MediaRecorder dengan mixing audio TTS + SFX, progres, pembatalan,
  pemotongan kredit setelah sukses, dan unduhan MP4/WebM.

## Fase 8 — Admin, PWA, Harga, Privasi, Coach Marks

- Panel admin: daftar pengguna, buat akun, edit plan/kredit/kuota/role/status,
  tambah kredit, statistik, dan sebaran plan.
- Halaman harga tiga tier, tabel perbandingan, FAQ, dan CTA admin.
- Halaman kebijakan privasi.
- Manifest PWA dan service worker cache shell.
- Coach marks lima langkah dengan sorotan target dan status localStorage.
- README, DECISIONS, CHANGELOG, build script Linux/Windows, install TTS, dan
  systemd unit.

## Peningkatan Editor, Font, Aset SVG, dan Prompt

- Enam font lokal WOFF2: Plus Jakarta Sans, Playfair Display, DM Serif Display,
  Bebas Neue, Space Grotesk, dan Caveat, lengkap dengan lisensi OFL.
- Font video bisa dipilih per proyek; UI, preview, subtitle, dan worker canvas
  memakai font yang sama.
- Pustaka 24 aset SVG vektor orisinal dengan preview picker dan API `s.asset`.
- Pengaturan studio visual: gaya dekorasi, intensitas dekorasi, tekstur latar,
  gaya subtitle, dan maksimal empat aset pilihan.
- Prompt ide, narasi, dan kode scene diperluas dengan konteks audiens, arah
  visual, tipografi, palet, katalog aset, komposisi, motion, SFX, quality gate,
  dan kerangka kode.
- Pratinjau prompt yang bisa disunting, hitungan karakter/token, pilihan AI,
  salin, dan buka AI.
- Overlay panduan safe area pada preview animasi.
- `next/font/google` diganti font lokal agar build tidak bergantung jaringan.
- Total test menjadi 31.

## Belum Termasuk

- Voice clone.
- Transisi scene dan kamera bawaan engine yang lengkap.
- Word timing asli dari TTS.
- Fallback iframe Safari lama.
- Watermark trial.
- Pembayaran otomatis.
- Reset password via email.
- Affiliate.
- Uji visual browser otomatis (agent-browser tidak tersedia di lingkungan ini).
