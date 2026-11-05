# 🎬 VoiceMotion Studio

Aplikasi web pembuat video pendek vertikal dengan suara AI Bahasa Indonesia.
Alur empat tahap: **Ide → Narasi → Suara → Animasi**, dengan pendekatan **BYO-AI**
(Bawa AI sendiri): aplikasi menyusun prompt, kamu mengirimnya ke Claude/ChatGPT/Gemini,
lalu menempel jawabannya kembali.

## Stack

- **Frontend:** Next.js 14 (static export) + React 18 + TypeScript + Tailwind CSS
- **State:** Zustand
- **Validasi:** Zod 4
- **Backend:** Go 1.22+ dengan Echo v4
- **Database:** SQLite (modernc.org/sqlite, tanpa CGO)
- **Auth:** Google OAuth + email/password + JWT bcrypt
- **TTS:** Microsoft Edge TTS melalui subprocess `edge-tts`, fallback Google Cloud TTS
- **Tipografi:** font lokal Plus Jakarta Sans, Playfair Display, DM Serif Display, Bebas Neue, Space Grotesk, Caveat
- **Aset:** pustaka 24 aset SVG vektor untuk dekorasi scene, dipakai lewat `s.asset`
- **Engine:** Canvas 2D di Web Worker, sandbox pre-scan, watchdog 45 ms, fallback tipografi
- **Export:** MediaRecorder (MP4 jika browser mendukung, fallback WebM)
- **Test:** Vitest untuk parser, prompt builder, sandbox, aset, dan runtime style pack

## Fitur

- Login Google OAuth dan login email/password untuk akun yang dibuat admin.
- Trial 4 hari, plan Trial/Starter/Pro, kredit export, dan panel admin.
- Tiga titik mulai: topik, narasi sendiri, promosi produk/jasa.
- Stepper empat tahap dengan status terkunci, aktif, dan selesai.
- Form konfigurasi lengkap: bahasa, jenis konten, durasi, gaya, karakter, warna brand,
  tempo, transisi, rasio, dan pengaturan tambahan.
- Delapan style pack orisinal dengan palet, deskripsi prompt, dan sample code.
- Studio visual: pilih font video, gaya dekorasi, tekstur latar, intensitas dekorasi,
  gaya subtitle, dan maksimal empat aset SVG yang boleh dipakai AI.
- Pustaka 24 aset SVG vektor orisinal dengan preview di UI dan API `s.asset` di engine.
- Prompt Claude panjang dan lengkap: konteks audiens, arah visual, tipografi,
  katalog aset, aturan komposisi, motion, SFX, quality gate, dan kerangka kode.
- Pratinjau prompt yang bisa disunting, dengan pilihan Claude/ChatGPT/Gemini,
  hitungan karakter, estimasi token, salin, dan buka AI.
- Prompt builder deterministik untuk ide, narasi, dan kode scene.
- Parser toleran: pagar kode, kutip pintar, trailing comma, teks pembuka, error ramah.
- Grid ide, editor narasi per scene, indikator kata/detik, drag reorder.
- Dua suara TTS Indonesia: Ibu Sari dan Bapak Ardi, kecepatan 0.8-1.3×.
- Preview animasi, scrub, strip scene, status kompilasi, panduan safe area, dan export video.
- PWA manifest + service worker untuk shell aplikasi.
- Coach marks onboarding lima langkah.
- Responsif dari 360 px, target sentuh 44 px, safe-area iOS, `100dvh`.

## Arsitektur

```text
Browser
  │
  ├─ GET /                 → Go menyajikan static/index.html
  ├─ GET /app/workspace/   → static/app/workspace/index.html (route statis)
  ├─ GET /_next/**         → chunk JS/CSS hasil build
  ├─ GET /api/**           → handler Go (auth, proyek, scene, TTS, kredit, admin)
  └─ GET /api/tts/audio/** → file MP3 dari uploads/tts

Build:
  Next.js output: export
    → frontend/out
    → disalin ke backend/static
    → go build → satu binary backend/voicemotion

Production:
  satu proses Go di port 3000
  tidak ada Next.js server
  tidak ada service Python permanen
```

## Prasyarat

- Node.js 20+
- Go 1.22+
- Python 3.10+ dan `pip` hanya jika memakai edge-tts
- Git

## Menjalankan Development

### 1. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Frontend development berjalan di `http://localhost:3001` dan memanggil API di
`http://localhost:3000` melalui `NEXT_PUBLIC_API_URL`.

### 2. Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` minimal:

```env
JWT_SECRET=isi-dengan-random-64-karakter
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=password-admin-yang-kuat
```

Lalu jalankan:

```bash
go mod tidy
go run main.go
```

Backend berjalan di `http://localhost:3000`. Saat pertama kali dijalankan, admin
dibuat otomatis dari `ADMIN_EMAIL` dan `ADMIN_PASSWORD`, lalu style pack dimuat
dari `backend/data/styles.json`.

### 3. TTS

```bash
pip3 install edge-tts
```

atau:

```bash
./deploy/install-tts.sh
```

Uji manual:

```bash
edge-tts --text "Halo, ini uji suara bahasa Indonesia." \
         --voice id-ID-ArdiNeural \
         --write-media /tmp/tes.mp3
```

Jika `edge-tts` tidak tersedia atau endpoint Microsoft menolak koneksi, isi
`GOOGLE_TTS_API_KEY` di `backend/.env` sebagai fallback. Buat API key di Google
Cloud Console, aktifkan Cloud Text-to-Speech API, lalu salin key ke variabel
tersebut. Kuota gratis Standard voice adalah 4 juta karakter per bulan.

### 4. Buka aplikasi

- Development: `http://localhost:3001`
- Production lokal setelah build: `http://localhost:3000`
- Login memakai akun admin dari `.env` atau login Google jika OAuth dikonfigurasi.

## Build Produksi

Linux/macOS:

```bash
./deploy/build.sh
```

Windows PowerShell:

```powershell
.\deploy\build.ps1
```

Script akan menjalankan test, typecheck, build frontend, menyalin `out/` ke
`backend/static/`, lalu `go build`. Setelah itu:

```bash
cd backend
./voicemotion
```

Atau gunakan service systemd dari `deploy/voicemotion.service` (sesuaikan path
dan user). Frontend produksi memakai URL API relatif `/api`, jadi tidak perlu
`NEXT_PUBLIC_API_URL` saat build produksi.

## Environment Backend

| Variabel | Default | Fungsi |
|---|---|---|
| `PORT` | `3000` | Port server Go |
| `JWT_SECRET` | dibuat acak jika kosong | Secret tanda tangan JWT |
| `JWT_EXPIRY_HOURS` | `168` | Masa berlaku token |
| `TRIAL_DAYS` | `4` | Durasi trial akun Google baru |
| `GOOGLE_CLIENT_ID` | kosong | Client ID OAuth Google |
| `GOOGLE_CLIENT_SECRET` | kosong | Client secret OAuth Google |
| `GOOGLE_REDIRECT_URL` | `http://localhost:3000/api/auth/google/callback` | Callback OAuth |
| `DATABASE_URL` | `./voicemotion.db` | Path SQLite |
| `EDGE_TTS_CMD` | `edge-tts` | Perintah edge-tts |
| `TTS_TIMEOUT_SECONDS` | `30` | Batas waktu subprocess TTS |
| `GOOGLE_TTS_API_KEY` | kosong | Fallback Google Cloud TTS |
| `STATIC_DIR` | `./static` | Folder hasil build frontend |
| `UPLOAD_DIR` | `./uploads` | Folder cache audio |
| `STYLES_PATH` | `./data/styles.json` | Katalog style pack |
| `ADMIN_EMAIL` | `admin@example.com` | Email admin awal |
| `ADMIN_PASSWORD` | kosong | Password admin awal |
| `APP_ENV` | `development` | Menentukan cookie aman dan CSP |
| `APP_URL` | kosong | URL frontend untuk redirect OAuth |
| `CORS_ORIGINS` | `http://localhost:3001,http://localhost:3000` | Origin yang diizinkan |

## Environment Frontend Development

| Variabel | Default | Fungsi |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | `VoiceMotion Studio` | Nama tampilan |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3001` | URL aplikasi |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | Base API saat development |

## API Ringkas

| Method | Path | Fungsi |
|---|---|---|
| `GET` | `/api/health` | Cek status server |
| `GET` | `/api/auth/google` | Mulai OAuth Google |
| `GET` | `/api/auth/google/callback` | Callback OAuth dan redirect dengan token |
| `POST` | `/api/auth/login` | Login email/password |
| `POST` | `/api/auth/logout` | Logout stateless |
| `GET` | `/api/auth/me` | User dari JWT |
| `GET` | `/api/projects` | Daftar proyek |
| `POST` | `/api/projects` | Buat proyek dengan cek kuota |
| `GET/PUT/DELETE` | `/api/projects/:id` | Detail, update, hapus |
| `POST` | `/api/projects/:id/duplicate` | Duplikat proyek dan scene |
| `GET/PUT` | `/api/projects/:id/scenes` | Ambil dan batch simpan scene |
| `GET` | `/api/styles` | Delapan style pack |
| `GET` | `/api/styles/:slug` | Detail style pack |
| `GET` | `/api/tts/voices` | Dua suara Indonesia |
| `POST` | `/api/tts/synthesize` | Buat audio per scene (cache SHA256) |
| `GET` | `/api/tts/audio/:filename` | Serve audio cache |
| `GET` | `/api/credits/balance` | Saldo kredit |
| `POST` | `/api/credits/spend` | Potong kredit idempotent |
| `POST` | `/api/exports` | Catat export |
| `GET` | `/api/admin/users` | Daftar pengguna (admin) |
| `POST` | `/api/admin/users` | Buat akun email (admin) |
| `PUT` | `/api/admin/users/:id` | Ubah plan/kredit/status (admin) |
| `POST` | `/api/admin/users/:id/credits` | Tambah kredit (admin) |

## Testing

```bash
cd frontend
npm test
npm run typecheck
npm run build
```

```bash
cd backend
gofmt -l .
go vet ./...
go build ./...
```

Test frontend mencakup 31 test dalam 5 file:

- 12 fixture parser: JSON bersih, pagar kode, kutip pintar, trailing comma,
  teks pembuka, field kosong, ide kurang dari lima, JSON rusak, kode scene
  dengan penanda, dan kode berantakan.
- 7 test sandbox: `while(true)`, `fetch`, `Math.random`, loop tanpa batas,
  kode normal, dan kata terlarang di dalam string.
- 5 test runtime: semua delapan sample code style pack, background/subtitle,
  tiga gaya subtitle, tiga tekstur, `s.asset`, dan determinisme `s.rand`.
- 5 test prompt builder: determinisme, prompt narasi, penomoran scene,
  panjang prompt Claude, serta font dan aset yang dipilih.
- 2 test aset: keunikan katalog, lookup, dan isi katalog prompt.

## Struktur Folder

```text
voicemotion-studio/
├── frontend/               Next.js static export
│   ├── src/app/            halaman masuk, app, workspace, harga, admin, privasi, ui
│   ├── src/components/     UI, layout, workspace, modals
│   ├── src/lib/            prompt, parse, engine, assets, tts, ai, i18n
│   ├── src/store/          auth, project, styles
│   └── public/             manifest, service worker, ikon, fonts
├── backend/                Go + Echo + SQLite
│   ├── handlers/           auth, project, scene, tts, style, credit, admin
│   ├── middleware/         JWT, CORS, rate limit, security headers
│   ├── db/                 koneksi, migrasi, schema.sql
│   ├── data/styles.json    delapan style pack
│   └── static/             hasil build frontend (diabaikan git)
├── deploy/                 build.sh, build.ps1, install-tts.sh, systemd
├── README.md
├── DECISIONS.md
└── CHANGELOG.md
```

## Verifikasi

Yang sudah dijalankan di lingkungan ini:

- `npm test` → 31 test lulus.
- `npm run typecheck` → lulus.
- `npm run build` → semua route statis berhasil, termasuk font lokal dan worker engine.
- `go build`, `go vet`, `gofmt -l` → bersih.
- `GET /`, `/masuk/`, `/app/`, `/app/workspace/`, `/harga/`, `/admin/`,
  `/kebijakan-privasi/`, `/ui/` → HTTP 200.
- `GET /api/health`, login admin, CRUD proyek, batch scene, style, kredit
  idempotent, dan admin users → berhasil.
- Worker chunk engine disajikan dan sandbox test menolak kode berbahaya.

Yang belum diverifikasi di lingkungan ini:

- Uji visual interaktif browser (agent-browser tidak terpasang).
- Generate audio nyata: `edge-tts 7.2.8` di mesin ini menerima HTTP 403 dari
  endpoint Microsoft. Jalur Google TTS sudah disiapkan tetapi membutuhkan API key.
- Export MP4 nyata di browser, karena bergantung pada MediaRecorder dan audio.

## Batasan yang Diketahui

- **Tanpa voice clone** sesuai mode ringan pada super prompt. Dua suara preset
  Indonesia tersedia.
- **Font dan aset bersifat kurasi.** Enam font dan 24 aset SVG tersedia di
  `frontend/public/fonts` dan `src/lib/engine/assets.ts`. Belum ada unggah
  font atau SVG kustom. Lisensi font OFL disertakan sebagai file
  `*-LICENSE.txt` di folder font.
- **Export memakai MediaRecorder**, bukan WebCodecs + mp4-muxer. MP4 dipakai
  jika browser mendukung; jika tidak, file WebM. Export berjalan real-time.
- **Transisi antar scene, kamera, dan word timing** disederhanakan. Subtitle
  memakai reveal proporsional, bukan timing kata dari TTS.
- **Fallback iframe Safari lama** belum diimplementasikan. Browser yang tidak
  mendukung Worker + OffscreenCanvas akan menampilkan pesan dan tombol muat ulang.
- **Pembayaran otomatis** belum aktif. Halaman harga mengarahkan ke admin.
- **Next.js 14** dipakai untuk static export. Temuan `npm audit` pada fitur
  server Next.js (Server Components, Image Optimizer, Server Actions, rewrites)
  tidak menjadi permukaan produksi karena yang dikirim hanya file statis yang
  dilayani Go. Zod sudah di-upgrade ke 4.6.7.
- **Token JWT disimpan di localStorage** sesuai spesifikasi frontend. Untuk
  keamanan lebih tinggi, pertimbangkan cookie HttpOnly + CSRF token.
- **Audio TTS disajikan lewat capability URL** berisi hash SHA256. Nama file
  tidak dapat ditebak, tetapi siapa pun yang memiliki URL dapat memutar audio.

## Push ke GitHub

```bash
git remote add origin https://github.com/USERNAME/voicemotion-studio.git
git push -u origin main
```

Jangan commit `.env`, database, uploads, atau hasil build. Semua sudah tercakup
di `.gitignore`.
