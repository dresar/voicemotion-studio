# Keputusan Teknis

Dokumen ini mencatat keputusan penting, alasan, dan penyimpangan dari spesifikasi
referensi. Tujuannya agar developer berikutnya tahu mengapa sesuatu dibuat
seperti ini.

## 1. Frontend Static Export

Next.js 14 dipakai dengan `output: "export"`, `trailingSlash: true`, dan
`images.unoptimized: true`. Setiap route menghasilkan folder dengan
`index.html` sendiri, lalu seluruh `out/` disalin ke `backend/static/`.
Go melayani file tersebut dan melakukan SPA fallback hanya untuk path tanpa
ekstensi file.

Konsekuensi:

- Tidak ada Next.js server di produksi.
- Route harus statis; tidak ada API route Next.js.
- `/_ui` tidak bisa dipakai karena folder berawalan `_` dianggap privat oleh
  App Router. Galeri komponen dipindahkan ke `/ui`.

## 2. Satu Binary Go

Backend memakai Echo v4, SQLite modernc (tanpa CGO), JWT HS256, dan bcrypt.
`main.go` mencari file statis, menyajikan `index.html`, dan menangani `/api/*`.
Frontend produksi selalu memakai URL relatif `/api`; `NEXT_PUBLIC_API_URL`
hanya dipakai di development. Ini mencegah build produksi tidak sengaja
menunjuk ke `localhost:3000`.

## 3. TTS Tanpa Service Python Permanen

Go memanggil `edge-tts` sebagai subprocess dengan timeout 30 detik. Hasil
disimpan sebagai `uploads/tts/<sha256>.mp3`; hash mencakup teks, suara, dan
kecepatan. Jika edge-tts gagal dan `GOOGLE_TTS_API_KEY` tersedia, backend
memakai Google Cloud TTS REST.

Rate limit TTS diubah dari 5 menjadi **30 permintaan per menit per user**.
Spesifikasi awal 5/menit bertentangan dengan acceptance criteria yang meminta
8 scene dibuat berurutan. Dengan 30/menit, "Buat Semua Suara" untuk 8 scene
tetap berjalan tanpa menunggu satu menit.

Di lingkungan pengembangan ini, `edge-tts 7.2.8` menerima HTTP 403 dari endpoint
Microsoft. Itu masalah jaringan/endpoint eksternal, bukan kode aplikasi.
Fallback Google TTS membutuhkan API key yang valid.

## 4. Dua Suara, Tanpa Voice Clone

Super prompt memakai mode ringan: dua suara preset Indonesia (`Ibu Sari` dan
`Bapak Ardi`) dan tanpa voice clone. Skema `voice_clones` dari PRD v2 tidak
dibuat. Ini mengurangi kompleksitas VPS dan menghindari model clone yang berat.

## 5. Skema Database

Skema mengikuti super prompt dengan beberapa kolom tambahan:

- `users.password_hash` untuk login email/password.
- `users.disabled` untuk menonaktifkan akun dari admin.
- `projects.selected_idea` (JSON) selain `selected_idea_id`. Frontend perlu
  menampilkan judul, hook, dan angle ide terpilih tanpa join ke tabel lain.
- `scenes.code_error` untuk pesan error mesin.

Tabel `idea_sets` disediakan sesuai skema referensi, tetapi set ide saat ini
disimpan di `projects.config.ideaSet` agar satu kali simpan proyek membawa
seluruh konteks. Ini menghindari endpoint tambahan dan menjaga autosave tetap
sederhana.

Style pack tidak disimpan di database; dibaca dari `backend/data/styles.json`
dan di-cache di memori. Katalog hanya delapan item dan tidak perlu CRUD.

## 6. Prompt Builder Deterministik

`lib/prompt/buildPrompt.ts` tidak memakai `Math.random`. Variasi sudut ide
dipilih dari katalog dengan hash FNV-1a dari topik, jenis konten, gaya, dan
mode mulai. Input yang sama selalu menghasilkan prompt yang sama. Variasi
jawaban datang dari model AI, bukan dari prompt yang berubah diam-diam.

Penomoran scene pada prompt kode memakai `scene.idx + 1`, bukan indeks array.
Dengan begitu, mengirim satu scene ke AI tetap menghasilkan penanda
`// ===== SCENE N =====` yang benar dan hasil tempelannya masuk ke scene yang
tepat.

## 7. Parser Toleran

Parser menerima:

- Blok ```json```, ```javascript```, atau blok tanpa bahasa.
- Teks pembuka sebelum blok kode.
- Kutip pintar, BOM, zero-width character, komentar JSON, dan trailing comma.
- Array langsung yang dibungkus menjadi `{ ideas: [...] }` atau `{ scenes: [...] }`.

Validasi memakai Zod. Pesan error menyebut nomor ide/scene dan field yang
bermasalah. Input dibatasi 200.000 karakter sebelum Zod agar tidak memicu
konsumsi memori berlebihan.

Zod di-upgrade dari 3 ke **4.6.7** karena advisory konsumsi memori. Skema
disesuaikan dari `required_error` ke `error`, dan seluruh test parser tetap
lulus.

## 8. Sandbox Engine

Kode AI dijalankan di Web Worker dengan `new Function`. Sebelum dieksekusi:

- String dan komentar dihapus dari pemeriksaan agar kata seperti "window" di
  dalam teks scene tidak salah tolak.
- Identifier berbahaya ditolak: `fetch`, `XMLHttpRequest`, `WebSocket`,
  `document`, `window`, `globalThis`, `self`, `localStorage`, `Function`,
  `eval` (melalui identifier), `setTimeout`, `while`, `Math.random`,
  `constructor`, `__proto__`, `prototype`, dan sejenisnya.
- Loop `for (;;)` ditolak.
- Body dibungkus mode strict dan global berbahaya di-shadow sebagai parameter
  `undefined`.

Watchdog frame adalah **45 ms**. Jika worker tidak membalas, worker dihentikan,
promise ditolak, dan UI menampilkan error serta tombol muat ulang. Scene tanpa
kode atau dengan kode gagal otomatis memakai fallback tipografi kinetik.

CSP menyertakan `'unsafe-eval'` karena `new Function` membutuhkannya. Ini
trade-off keamanan: eksekusi tetap diisolasi di worker, pre-scan menolak token
berbahaya, dan tidak ada akses DOM/jaringan dari kode scene. Tanpa
`unsafe-eval`, engine tidak bisa berjalan saat disajikan Go.

## 9. Export MediaRecorder

Export memakai `canvas.captureStream(30)` + `MediaRecorder`, dengan audio TTS
dan SFX dicampur lewat Web Audio `MediaStreamDestination`. Format dipilih dari
dukungan browser:

1. `video/mp4;codecs=avc1...,mp4a...`
2. `video/mp4`
3. `video/webm;codecs=vp9,opus`
4. WebM lain

WebCodecs + mp4-muxer tidak dipakai karena muxing audio AAC dari beberapa
buffer TTS dan SFX menambah kompleksitas besar tanpa manfaat langsung untuk
VPS ini. `mp4-muxer` dihapus dari dependensi agar tidak menjadi dependensi mati.
Export berjalan real-time, menampilkan progres, dan bisa dibatalkan.

Kredit dipotong setelah file berhasil dibuat, tepat sebelum unduhan. Jika
pemotongan kredit gagal, file tidak diunduh. Log export dibuat setelah unduhan;
kegagalan log tidak membatalkan video yang sudah jadi.

## 10. Keamanan

- JWT disimpan di localStorage sesuai spesifikasi frontend. Ini rentan jika ada
  XSS; React melakukan escaping, CSP membatasi sumber script, dan tidak ada
  `dangerouslySetInnerHTML` di aplikasi. Untuk hardening lanjutan, gunakan
  cookie HttpOnly + CSRF.
- Password email di-hash bcrypt.
- Semua query memakai parameter binding.
- Kepemilikan proyek diperiksa pada setiap endpoint proyek/scene.
- Token JWT divalidasi ulang ke database untuk memeriksa role dan status
  disabled pada setiap request.
- Rate limit login 10/menit per IP dan TTS 30/menit per user.
- Audio TTS disajikan lewat capability URL berisi SHA256. Tidak ada autentikasi
  pada route audio karena elemen `<audio>` tidak mengirim header Authorization;
  nama file 64 karakter hex tidak dapat ditebak.
- Header keamanan: `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`, dan CSP.
- `CORS_ORIGINS` membatasi origin development.

## 11. Batasan Implementasi

- Transisi antar scene, gerak kamera, dan word timing dari TTS belum menjadi
  fitur engine penuh. Subtitle memakai reveal proporsional. Kode scene tetap
  dapat membuat transisi internal sendiri.
- Fallback iframe untuk Safari lama belum dibuat. Browser modern dengan Worker
  dan OffscreenCanvas menjadi target utama; browser tanpa dukungan menampilkan
  pesan dan tombol muat ulang.
- Watermark trial, pembayaran otomatis, reset password, affiliate, dan voice
  clone belum termasuk.
- Next.js 14 memiliki advisory server-side. Produksi hanya menyajikan file
  statis melalui Go; tidak ada Next server, Image Optimizer, Server Actions,
  atau rewrites yang aktif. Audit tetap dilaporkan `npm audit` dan perlu
  ditinjau ulang jika suatu saat pindah ke Next server.
- PostCSS yang dipakai saat build juga dilaporkan advisory. Tidak ada input CSS
  dari pengguna di runtime.

## 12. Verifikasi

Lingkungan ini tidak memiliki `agent-browser`, jadi uji visual interaktif
browser tidak dijalankan. Yang dijalankan: unit test, typecheck, build statis,
`go vet`, `go build`, pemeriksaan route HTTP, login admin, CRUD proyek, batch
scene, style pack, kredit idempotent, dan admin users. Semua sample code style
pack diuji dengan mock Canvas melalui runtime sebenarnya.

## 13. Studio Visual, Font, Aset SVG, dan Prompt Panjang

**Font.** Enam font kurasi disimpan sebagai WOFF2 di `frontend/public/fonts`:
Plus Jakarta Sans, Playfair Display, DM Serif Display, Bebas Neue, Space
Grotesk, dan Caveat. `globals.css` mendefinisikan `@font-face` untuk UI dan
preview. Worker engine memuat font yang dipilih lewat `FontFace` sebelum
compiling scene, sehingga `s.text` dan `s.words` memakai font yang sama dengan
preview.

`next/font/google` dihapus karena build produksi sempat gagal mengambil font
saat cache `next/font` kosong. Font lokal membuat build tidak bergantung
jaringan dan tetap konsisten di VPS. Lisensi OFL disertakan di folder font.

**Aset SVG.** Katalog di `src/lib/engine/assets.ts` berisi 24 aset vektor
orisinal (spark, star, burst, blob, heart, bolt, leaf, quote, cloud, tape,
cursor, play, ring, squiggle, underline, arrow, wave, spiral, frame, asterisk,
check, cross, plus, grid). UI memakai katalog yang sama untuk pemilih aset.
Engine mengekspos `s.asset(id, x, y, o)` yang menggambar `Path2D` dari path
SVG. Bila `Path2D` tidak tersedia (mock test atau browser lama), engine
memakai bentuk fallback sederhana agar tidak crash. Prompt hanya
memperbolehkan ID dari katalog; AI tidak boleh menggambar SVG mentah atau
mengambil gambar eksternal.

**Tekstur dan subtitle.** `drawSceneBackground` mendukung tekstur `paper`,
`grain`, `grid`, `dots`, dan `none`, dengan intensitas dekorasi 0-100%.
`drawSubtitle` mendukung gaya `box`, `minimal`, dan `highlight`, memakai font
dan weight yang dipilih. Preview animasi punya overlay panduan safe area yang
tidak ikut terekam saat export.

**Prompt.** Prompt ide, narasi, dan kode scene diperluas dengan konteks
audiens, arah visual, tipografi, palet, katalog aset, aturan komposisi,
motion, SFX, quality gate, dan kerangka kode. Prompt kode sengaja panjang agar
Claude punya cukup konteks desain. Prompt tetap deterministik.

Pagar kode dibuat lewat fungsi `codeFence()` yang mengembalikan tiga backtick
dari `String.fromCharCode(96)`. Ini menghindari bug SWC/Next yang melakukan
constant-folding pada string backtick dan menghasilkan bundle server tidak
valid. Prompt akhirnya tetap berisi ```json atau ```js seperti biasa.

**Pratinjau prompt.** `PromptPreviewSheet` menampilkan prompt lengkap, bisa
disunting, menghitung karakter dan estimasi token, memilih Claude/ChatGPT/
Gemini, menyalin, atau membuka AI. Prompt yang dikirim adalah versi yang
sedang disunting, bukan selalu prompt hasil builder.

**Test.** Total 31 test: 12 parser, 7 sandbox, 5 runtime, 5 prompt builder,
dan 2 aset.
