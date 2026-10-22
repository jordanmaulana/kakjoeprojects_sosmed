# Pengetahuan Produk Ngatur Duit

Folder ini merangkum semua yang perlu diketahui tentang Ngatur Duit sebagai produk: apa isinya, untuk siapa, angka-angkanya datang dari mana, cara menulis tentangnya, dan tampilannya. Pembaca utamanya AI yang nanti merencanakan publikasi media sosial dan pekerjaan lain, supaya tidak perlu membaca kode dulu.

Snapshot: **22 Oktober 2026**, commit `2a6f593`. Kalau kodenya berubah, folder ini ikut diperbarui (lihat bagian terakhir).

## Isi folder

| File | Isi | Baca kalau |
|---|---|---|
| [produk.md](produk.md) | Masalah yang dijawab, fitur per fitur, harga, cara mulai, keterbatasan | Mau tahu apa yang bisa dipromosikan |
| [metodologi.md](metodologi.md) | Tangga kekayaan 6 level, skor kesehatan, 6 template anggaran, sumber tiap angka | Konten edukasi, atau menjelaskan "kenapa angkanya segini" |
| [suara.md](suara.md) | Cara menulis seperti aplikasinya, larangan, contoh kalimat asli, narasi deck | Sebelum menulis caption, thread, atau naskah apa pun |
| [brand.md](brand.md) | Palet warna, font, logo, gambar Open Graph, tautan resmi | Membuat visual atau mengisi bio/link |
| [og.png](og.png) | Gambar Open Graph 1200×630 yang dipakai situs | Butuh gambar siap pakai |

Untuk menulis satu post: baca `suara.md` dulu, lalu bagian fitur yang relevan di `produk.md`. Kalau post menyebut angka, cek `metodologi.md`.

## Fakta inti

- **Nama:** Ngatur Duit (dua kata, D kapital).
- **Situs:** https://ngaturduit.my.id
- **Tagline:** "Naik Level, Satu Bulan Sekali"
- **Deskripsi resmi** (og:description, verbatim):
  > Keuanganmu punya level, dan levelnya bisa naik. Aplikasi ini menunjukkan kamu ada di mana sekarang, apa yang sedang menahan, dan berapa jauh lagi ke level berikutnya.
- **Bot Telegram:** [@ngatur_duit_bot](https://t.me/ngatur_duit_bot)
- **Harga:** gratis. Belum ada paket berbayar.
- **Pasar:** Indonesia. Semua teks aplikasi berbahasa Indonesia, semua angka dalam Rupiah.
- **Pembuat:** Jordan Maulana. Materi untuk pengguna sengaja tidak memakai cerita pendiri (lihat [suara.md](suara.md)).

## Status saluran

- **Akun media sosial:** belum ada sama sekali. Perencanaan mulai dari nol.
- **Yang boleh dipromosikan:** web app di ngaturduit.my.id, bot Telegram, dan connector Claude.
- **Aplikasi Android:** sudah dibuat (Flutter, `mobile/`) tapi **belum rilis publik** dan belum ada di Play Store.

## Jangan dipromosikan, jangan diklaim

- **Aplikasi Android.** Belum rilis. Jangan ditulis "segera hadir" juga, kecuali Jordan bilang sudah ada jadwal.
- **Ringkasan harian/bulanan lewat Telegram.** Perintah `/daily_true` dan `/monthly_true` ada, tapi tidak ada yang mengirim ringkasannya.
- **Laporan PDF.** Hanya ada sebagai endpoint API, tidak ada tombolnya di aplikasi mana pun.
- **Angka traksi** (jumlah pengguna, transaksi tercatat, rating). Tidak ada data yang dipublikasikan, jadi jangan mengarang.
- **Testimoni dan persona karangan** ("Rani, 27 tahun…"). Jordan menghapus persona dari deck karena terbaca bohong.
- **Klaim nasihat keuangan.** Aplikasi ini memberi panduan, bukan nasihat keuangan.
- **Domain lama `ngaturduit.co.id`** dan bot debug `jdebug_bot`. Keduanya masih muncul di file konfigurasi, tapi bukan alamat publik.
- **Chat AI di dalam aplikasi.** Fitur ini sudah dihapus (22 Oktober 2026). Tanya-jawab soal keuangan sekarang lewat Claude.

## Cara memperbarui folder ini

Sumber kebenaran tiap topik ada di kode. Kalau ada yang bertentangan, kode yang benar.

| Topik | Sumber kebenaran |
|---|---|
| Level kekayaan | `apps/transactions/wealth_level.py` |
| Penjelasan level dan sumber | `frontend/src/features/dashboard/content/wealthReference.ts` |
| Skor kesehatan | `apps/transactions/financial_health.py`, label di `frontend/src/lib/score.ts` |
| Template anggaran | `apps/transactions/migrations/0014_seed_budget_templates.py` |
| Copy landing page | `frontend/src/features/landing/` |
| Meta tag dan OG | `frontend/index.html`, `frontend/public/og.png` |
| Palet warna | `frontend/src/index.css`, `frontend/src/lib/chartTheme.ts` |
| Tools Claude | `apps/conversations/agent/tools.py` (`FINANCE_TOOLS`) |
| Inventaris teknis lengkap | [`_docs/FEATURES.md`](../FEATURES.md) |

Kalau `og.png` di `frontend/public/` diganti, salin ulang ke folder ini.
