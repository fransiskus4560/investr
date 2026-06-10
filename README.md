# Investr — Personal Investment Command Center
### v1.0 · Built together, June 2025

---

## Cara pakai sekarang (tanpa install apapun)

1. Download semua file ini
2. Buka `index.html` langsung di browser
3. Selesai — langsung bisa dipakai

---

## Struktur file

```
investr/
├── index.html          ← Dashboard (halaman utama)
├── css/
│   └── style.css       ← Design system lengkap
├── js/
│   └── app.js          ← Semua logika & data
└── pages/              ← Halaman lain (menyusul)
    ├── watchlist.html
    ├── analisis.html
    ├── portofolio.html
    ├── drip.html
    ├── skenario.html
    └── checklist.html
```

---

## Deploy ke GitHub Pages (gratis, akses dari mana saja)

### Langkah 1 — Buat akun GitHub
Buka github.com → Sign up (gratis)

### Langkah 2 — Buat repository baru
- Klik tombol "+" → "New repository"
- Nama: `investr`
- Pilih: Public
- Klik "Create repository"

### Langkah 3 — Upload file
- Klik "uploading an existing file"
- Drag & drop seluruh folder `investr/`
- Klik "Commit changes"

### Langkah 4 — Aktifkan GitHub Pages
- Buka Settings → Pages
- Source: "Deploy from a branch"
- Branch: `main`, folder: `/ (root)`
- Klik Save

### Langkah 5 — Akses dari mana saja
URL kamu: `https://[username].github.io/investr`

---

## Bug tracking

| # | Deskripsi | Status |
|---|-----------|--------|
| 1 | Market pill inactive: grey bg + white text (sudah di CSS) | Fixed di CSS |

---

## Roadmap

### v1.0 (sekarang)
- [x] Dashboard — struktur lengkap
- [x] Dark / light mode
- [x] Market switcher (IDX, US, ASX, Crypto)
- [x] Stat cards dengan expand chart + timeframe
- [x] Mobile responsive (drawer + bottom nav)
- [x] Toast notifications
- [ ] Halaman Watchlist
- [ ] Halaman Analisis Saham
- [ ] Halaman Portofolio
- [ ] Halaman DRIP Simulator
- [ ] Halaman Skenario
- [ ] Halaman Checklist

### v2.0
- [ ] Firebase database (simpan data portofolio)
- [ ] Login Google
- [ ] Data harga otomatis via Yahoo Finance API
- [ ] Market US, ASX, Crypto live

### v3.0
- [ ] AI "Cuaca Investasi" — analisis real dari data nyata
- [ ] Alert otomatis (push notification)
- [ ] Export laporan PDF
- [ ] Multi-user untuk rilis publik

---

*Built with intention. Every detail matters.*
