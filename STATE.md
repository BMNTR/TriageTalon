# TriageTalon / Ultimate Attack Surface Recon API
**Single Source of Truth & Project Documentation**

Tujuan utama dari dokumen ini adalah agar AI (dan pengembang) selalu memiliki memori dan konteks penuh tentang struktur, arsitektur, dan status terbaru dari proyek ini.

## 🎯 Tujuan Proyek
TriageTalon adalah alat OSINT (Open Source Intelligence) dan *Reconnaissance* berbasis API yang dirancang untuk SecOps, DevOps, dan pemburu *Bug Bounty*. Alat ini mampu memindai target secara asinkron dalam waktu kurang dari 2 detik untuk mengumpulkan data-data krusial, menilai tingkat keamanan (Grade A-F), dan menemukan aset-aset tersembunyi yang berpotensi menjadi celah kerentanan.

## 🚀 Ekosistem & Arsitektur
Proyek ini terbagi menjadi beberapa komponen yang saling terhubung:

1. **Backend API (Vercel)**
   - **Lokasi Kode:** `backend/api.py` (Python FastAPI)
   - **Hosting:** Vercel (URL *deployment* khusus).
   - **Tugas:** Menjalankan logika *scan* OSINT secara asinkron (Subdomain, DNS, Header, dll) dalam waktu kurang dari 10 detik (batas limit Vercel).
   - **Keamanan:** Dilindungi oleh *Proxy Secret*. Menolak semua *request* (401 Unauthorized) kecuali yang memiliki *header* `X-RapidAPI-Proxy-Secret: rahasia_triage_talon_123`.

2. **API Gateway & Monetisasi (RapidAPI)**
   - **Nama:** Ultimate Attack Surface Recon API
   - **Tugas:** Mengelola *rate-limiting*, langganan berbayar, dan meneruskan *request* pengguna ke Vercel dengan menyuntikkan *header* rahasia.

3. **Frontend Website & Live Demo (React + Vercel)**
   - **Lokasi Kode:** `frontend/` (React + Vite + TailwindCSS)
   - **Repositori GitHub:** `BMNTR/TriageTalon`
   - **Hosting URL:** `https://triagetalon.vercel.app`
   - **Tugas:** Halaman *landing page* promosi, dokumentasi instalasi CLI, dan **Scanner Dashboard** yang memanggil RapidAPI langsung dari *browser*. Web ini sepenuhnya di-*hosting* di Vercel, meninggalkan konfigurasi GitHub Pages versi lawas.

4. **Command Line Interface (CLI)**
   - Skrip Python (`recon.py`) yang telah dipublikasikan ke PyPI (`pip install triagetalon`) sehingga pengguna tidak perlu melakukan `git clone` secara manual. Memiliki mode antarmuka *Textual* (TUI) interaktif.

## 🛠️ Fitur Utama API
- **Subdomain Discovery:** Mengambil data subdomain dan IP (via HackerTarget API).
- **Security Headers Grading:** Menilai postur keamanan (A-F) berdasarkan kehadiran *header* kritis (HSTS, CSP, X-Frame-Options, dll).
- **Sensitive File Detection:** Mencari file yang sering bocor dan berbahaya (`.env`, `.git/config`, `robots.txt`).
- **DNS Intelligence:** Mencari *record* A, AAAA, MX, NS, dan TXT (via Google DNS API). Memeriksa ada tidaknya konfigurasi SPF.
- **WHOIS & RDAP:** Mengambil data pendaftar domain, tanggal kedaluwarsa, dan *nameserver*.
- **Async Port Scanner:** Melakukan *port scan* super cepat pada 10 *port* kritis yang sering dieksploitasi (21, 22, 80, 443, 3306, 5432, 27017, 6379, 8080, 8443).
- **Tech Stack Detection:** Mendeteksi server dan teknologi yang digunakan dari *cookie*, *header*, dan tanda tangan respons.
- **Anti-SSRF & WAF Bypass:** Mengeblok pemindaian ke IP internal/lokal dan menyuntikkan *header* `User-Agent` serta `X-Forwarded-For` khusus agar lolos dari blokir WAF (*Web Application Firewall*).

---

## 📝 Changelog & Riwayat Pembaruan
*Setiap ada perubahan, perbaikan, atau penambahan fitur, WAJIB ditulis di bawah ini agar riwayat proyek tidak hilang.*

- **[2026-07-28] Web App Migration, Vercel Deployment & PyPI Release:**
  - **React Migration:** Menulis ulang seluruh halaman statis (`docs/index.html`) menjadi aplikasi React SPA modern dengan bundler Vite di dalam folder `frontend/`.
  - **Vercel Migration:** Mematikan GitHub Pages dan menghapus folder `docs/`. Proyek *frontend* dipindahkan 100% menggunakan Vercel untuk otomatisasi *build* & CI/CD. URL baru: `triagetalon.vercel.app`.
  - **PyPI Release:** Mempublikasikan proyek ini ke Python Package Index (PyPI) versi 1.0.0. Metode instalasi di *README* diubah sepenuhnya dari `git clone` menjadi sangat instan: `pip install triagetalon`. Memperbarui seluruh `setup.py` untuk membungkus perintah `talon`.
  - **Logo & UI Polish:** Menyelaraskan seluruh elemen visual *website* dengan membuat ikon SVG spesifik *Target Crosshair* oranye (sasaran tembak / ⌖) untuk *favicon*, *navbar*, dan *footer*. Menghilangkan logo-logo sisa bawaan *template* VoltAgent dan menata tipografi *Pricing Card*.

- **[2026-07-27] CLI Visual Refinement & Production Hardening (v2.0.0):**
  - Merapikan tampilan hasil scan agar konsisten dengan filosofi desain monokromatik + aksen `#FF3E00` (aksen kini benar-benar hanya dipakai untuk grade lemah C/D/F dan alert, bukan campuran hijau/kuning/merah).
  - Menambahkan kolom `MofNCompleteColumn` dan `TimeElapsedColumn` pada progress bar, serta tabel **Top Vulnerable Targets** (diurutkan F > D > C, lalu jumlah exposure) di akhir scan.
  - Tabel Scan Summary kini menampilkan Elapsed Time dan Throughput (req/s).
  - Validasi & normalisasi domain (`normalize_domain`): membuang skema URL/port/trailing slash, menolak format domain tidak valid, dan deduplikasi otomatis saat membaca `-l/--list`; baris tidak valid dilaporkan (bukan diam-diam diproses).
  - `requests.Session` dengan retry/backoff (urllib3 `Retry`) untuk error transient (500/502/503/504) serta penanganan eksplisit untuk timeout dan connection error.
  - Penanganan Ctrl+C yang lebih baik (tidak lagi menampilkan traceback mentah) baik saat scan berjalan, saat prompt API key, maupun pada mode interaktif.
  - `~/.triagetalon.json` kini disimpan dengan permission `0600` (owner-only) agar API key tidak bisa dibaca user lain di sistem multi-user.
  - Penghapusan konstanta placeholder `YOUR_RAPIDAPI_KEY_HERE` yang rawan salah paham; kunci hardcode kini opsional (`None` secara default).
  - `-d/--domain` dan `-l/--list` dibuat mutually exclusive di argparse.
  - Fitur baru: `--timeout` (per-request timeout), `--fail-on-weak` (exit code 1 jika ditemukan grade C/D/F, untuk CI gating), `--no-banner`, `--version`.
  - Perbaikan bug laten pada pemotongan newline akhir di `format_result` (sebelumnya bergantung pada indexing karakter `Text` yang rapuh).
  - Penanganan *fatal error* (401/403/429) kini menyimpan hasil parsial dan tetap mencetak ringkasan, alih-alih langsung `return` tanpa output.

- **[2026-07-27] Textual TUI Full-Screen Migration & Double-Card Results:**
  - Memigrasikan alur interaktif `recon.py` ke framework **Textual** sehingga aplikasi berjalan 100% di dalam *Alternate Screen Buffer* layar penuh.
  - Memperbarui teks *placeholder* kotak input menggunakan domain contoh resmi standar RFC 2606 (`example.com`): `Enter target domain to start recon (e.g. example.com)...`.
  - Menambahkan fitur **Clipboard Auto-Copy (`copy` command)**: pengguna dapat mengetik `copy` (salin scan terakhir), `copy 2` (salin scan nomor 2 dari riwayat), atau `copy <domain>` (salin scan domain tertentu) secara instan ke system clipboard tanpa perlu memblok teks manual.
  - Mematikan fitur **Command Palette (`COMMAND_PALETTE = False`)** agar menu pencarian perintah popup dan tombol `^P palette` di sudut bawah tidak lagi muncul atau mengganggu pengguna.
  - Merapikan baris `SubHelp` tip sehingga hanya menampilkan petunjuk ringkas `help`, `clear`, dan `quit`.
  - Menambahkan log status *real-time* di TUI (`[*] Querying RapidAPI & gathering WHOIS/DNS/Headers...`) saat scan berjalan agar pengguna tahu proses HTTP request sedang aktif bekerja di latar belakang.
  - Memperbaiki penanganan pesan error jika API key belum diatur atau terjadi masalah koneksi.
  - Mengubah tampilan hasil *scan* menjadi 2 Card berurutan berksen oranye kemerahan (`#FF3E00`) yang setema dengan Talon: Card JSON murni dengan *github-dark muted syntax highlighting* diikuti tabel ringkasan (*Target Summary*) dengan `title_style="none"` agar tidak memiliki kotak latar belakang putih secara terpisah.
  - Menambahkan fitur **Responsive Banner / Compact Mode** di TUI: jika ukuran jendela terminal kurang dari 85 kolom, logo ASCII otomatis beralih ke mode ringkas 1 baris (`TRIAGETALON v2.0.0`) agar tidak patah.
  - Memperbaiki parser argumen TUI sehingga mendukung opsi `scan -t <domain>` (hanya tampilkan tabel ringkasan) dan `scan -l <file>` (baca daftar domain).
- **[2026-07-27] CLI UI Overhaul & Interactive Continuous Scanning:**
  - Mengubah desain visual `recon.py` dari gaya warna-warni (box) menjadi UI *hacker-style* profesional yang minimalis dan monokromatik dengan aksen oranye kemerahan (`#FF3E00`) hanya untuk *alert*.
  - Mengubah huruf N pada logo *banner* Talon agar benar-benar terlihat seperti huruf N kapital dalam format balok.
  - Memperbaiki sistem *font rendering* ASCII untuk PowerShell di Windows dengan memaksa `sys.stdout.reconfigure(encoding='utf-8')`.
  - Mengubah mekanisme input RapidAPI Key menjadi *prompt* interaktif yang dilengkapi fitur *Auto-Open Browser* menggunakan modul `webbrowser`.
  - Menambahkan fitur *Config Saver* yang otomatis menyimpan API Key pengguna ke dalam file lokal `~/.triagetalon.json`.
  - Menambahkan fitur **Continuous Looping / Interactive Mode**, di mana jika perintah `talon` dipanggil tanpa parameter, skrip akan terus berulang meminta input target secara berurutan dan mengaktifkan mode *Verbose* secara *default*.
- **[2026-07-27] Frontend UI Fix & Timer Addition:**
  - Mengubah kode JavaScript di `index.html` untuk memunculkan `scan_duration_seconds` di hasil *live demo* *website*.
  - Memperbaiki *bug* pada penilaian Grade yang selalu memunculkan `N/A` karena kesalahan alur baca JSON (dari `security_headers?.grade` menjadi `security_analysis?.security_score?.grade`). 
  - Melakukan `git push` ke repositori `BMNTR/TriageTalon`.
- **[2026-07-27] API Security Lockdown (Proxy Secret):**
  - Mengubah kode `api.py` agar memeriksa keberadaan *header* rahasia `X-RapidAPI-Proxy-Secret`.
  - Menetapkan *environment variable* rahasia di `.env.local` dan *dashboard* Vercel.
  - Melakukan instruksi sinkronisasi *header* rahasia ke panel keamanan RapidAPI.
- **[2026-07-26] Proyek Dimulai:** 
  - Membangun Vercel FastAPI backend.
  - Menyusun UI *landing page* dan *tools* asinkron.
