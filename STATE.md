# TriageTalon / Ultimate Attack Surface Recon API
**Single Source of Truth & Project Documentation**

Tujuan utama dari dokumen ini adalah agar AI (dan pengembang) selalu memiliki memori dan konteks penuh tentang struktur, arsitektur, dan status terbaru dari proyek ini.

## 🎯 Tujuan Proyek
TriageTalon adalah alat OSINT (Open Source Intelligence) dan *Reconnaissance* berbasis API yang dirancang untuk SecOps, DevOps, dan pemburu *Bug Bounty*. Alat ini mampu memindai target secara asinkron dalam waktu kurang dari 2 detik untuk mengumpulkan data-data krusial, menilai tingkat keamanan (Grade A-F), dan menemukan aset-aset tersembunyi yang berpotensi menjadi celah kerentanan.

## 🚀 Ekosistem & Arsitektur
Proyek ini terbagi menjadi beberapa komponen yang saling terhubung:

1. **Backend API (Vercel)**
   - **Lokasi Kode:** `C:\BugBounty\rapidapi-recon\api.py` (Python FastAPI)
   - **Hosting:** Vercel (URL *deployment* khusus).
   - **Tugas:** Menjalankan logika *scan* OSINT secara asinkron (Subdomain, DNS, Header, dll) dalam waktu kurang dari 10 detik (batas limit Vercel).
   - **Keamanan:** Dilindungi oleh *Proxy Secret*. Menolak semua *request* (401 Unauthorized) kecuali yang memiliki *header* `X-RapidAPI-Proxy-Secret: rahasia_triage_talon_123`.

2. **API Gateway & Monetisasi (RapidAPI)**
   - **Nama:** Ultimate Attack Surface Recon API
   - **Tugas:** Mengelola *rate-limiting*, langganan berbayar, dan meneruskan *request* pengguna ke Vercel dengan menyuntikkan *header* rahasia.

3. **Frontend Website & Live Demo (GitHub Pages)**
   - **Lokasi Kode:** `C:\BugBounty\_scripts\TriageTalon\docs\index.html`
   - **Repositori GitHub:** `BMNTR/TriageTalon`
   - **Hosting URL:** `https://bmntr.github.io/TriageTalon/`
   - **Tugas:** Halaman *landing page* promosi yang berisi dokumentasi instalasi CLI dan **Live API Tester** yang memanggil RapidAPI langsung dari *browser* menggunakan JavaScript (Fetch API).

4. **Command Line Interface (CLI)**
   - Skrip Python (`recon.py`) di dalam repositori `TriageTalon` yang memungkinkan pengguna untuk mem- *pipe* hasil *scan* langsung ke *tools* *bug bounty* lain di terminal mereka.

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
