# Metodologi: angka dan sumbernya

Prinsip produk: **tiap angka ada sumbernya, dan yang tidak ada sumbernya ditulis apa adanya.** Copy landing: "Tiap angka ada sumbernya" / "Termasuk yang nggak ada sumbernya — itu juga ditulis apa adanya."

Konten yang menyebut angka harus mengikuti file ini. Jangan membulatkan, mengganti sumber, atau menyajikan angka buatan aplikasi seolah-olah hasil riset.

## Tangga Kekayaan

### Cara hitung

- **Kekayaan bersih** = saldo semua dompet + transaksi yang tidak masuk dompet mana pun. Aset (motor, rumah yang dicatat di fitur Aset) tidak ikut.
- **Rata-rata pengeluaran bulanan** = rata-rata **6 bulan terakhir yang sudah lewat**. Bulan berjalan tidak dihitung karena datanya belum lengkap.
- **Bulan tertutup** = kekayaan bersih ÷ rata-rata pengeluaran bulanan.
- **Rasio tabungan** = (pemasukan − pengeluaran) ÷ pemasukan.
- Level = **level tertinggi yang semua syaratnya terpenuhi.**
- Syaratnya dalam **bulan pengeluaranmu sendiri, bukan rupiah**, jadi skalanya ikut penghasilan dan ikut naik bersama inflasi. Copy landing: "Tiap level ditentukan oleh berapa bulan pengeluaran yang sanggup ditutup kekayaanmu, dan namanya diambil dari kebebasan yang dibeli. Ukurannya ikut naik bersama inflasi."

### Enam level

| Lv | Nama | Label | Syarat | Tagline (verbatim) | Dasar |
|---|---|---|---|---|---|
| 1 | Bertahan | Belum ada cadangan | tidak ada | "Tiap bulan uangnya habis, kadang malah kurang. Sisa Rp50rb pun sudah kemajuan." | Titik awal |
| 2 | Aman | Sebulan napas | ≥1 bulan, tabungan ≥0% | "Pemasukan sudah nutup pengeluaran dan mulai ada sisa. Tabungannya belum kuat kalau motor tiba-tiba masuk bengkel besar." | |
| 3 | Stabil | Tiga bulan napas | ≥3 bulan, tabungan ≥10% | "Kalau penghasilan berhenti besok, kamu masih bisa jalan 3 bulan tanpa jual apa-apa." | OJK 3×, Babylon 10% |
| 4 | Terjamin | Setahun napas | ≥12 bulan, tabungan ≥20% | "Setahun biaya hidup sudah tersimpan. Nganggur setahun pun rekening masih jalan." | OJK 6–12×, 50/30/20 |
| 5 | Merdeka | Gaji jadi opsional | ≥300 bulan | "Aset kamu menutup 25 tahun pengeluaran, ambang aturan 4%. Gaji sekarang statusnya tambahan." | Aturan 4% |
| 6 | Berlimpah | Bisa berbagi | ≥600 bulan | "Aset menutup 50 tahun pengeluaran. Di angka ini harga sudah jarang jadi bahan pertimbangan." | **Bukan dari literatur** |

Warna level di [brand.md](brand.md). Tangga ini tidak pernah memakai merah.

### Penjelasan per level (verbatim, dari dialog referensi)

- **Bertahan:** "Belum ada cadangan sama sekali. Motor masuk bengkel Rp800rb atau anak sakit seminggu langsung berubah jadi pinjaman. Yang perlu dikejar dulu satu saja: akhir bulan masih ada sisa."
- **Aman:** "Pemasukan sudah lewat dari pengeluaran dan mulai numpuk. Belanja harian aman, tapi cadangannya belum sampai sebulan penuh, jadi satu tagihan rumah sakit masih bisa menguras habis."
- **Stabil:** "Sudah ada tiga bulan pengeluaran tersimpan dan nabung sudah jalan rutin. Kalau kerjaan hilang, kamu punya waktu cari pengganti tanpa buru-buru ambil tawaran pertama."
- **Terjamin:** "Setahun biaya hidup tersimpan. Resign, pindah kota, atau perusahaan tutup masih bisa dilewati pakai tabungan sendiri sambil menata ulang."
- **Merdeka:** "Asetnya sudah cukup besar sampai imbal hasilnya bisa nutup biaya hidup tanpa nyentuh pokoknya. Gaji bulanan berhenti pun pengeluaran tetap jalan."
- **Berlimpah:** "Dua kali lipat angka Level 5. Di titik ini kebanyakan keputusan belanja berhenti soal sanggup atau nggak, dan pindah ke soal mau dipakai buat apa."

### "Aman dibeli" dan "Belum waktunya" (contoh, verbatim)

Bahan bagus untuk konten "di level kamu, ini aman dibeli". Daftar lengkap di `apps/transactions/wealth_level.py`.

| Level | Aman dibeli | Belum waktunya |
|---|---|---|
| 1 Bertahan | "Sabun, deterjen, gas melon", "Obat warung dan periksa ke puskesmas" | "Paylater buat barang yang bukan kebutuhan", "Ganti HP padahal yang lama masih nyala" |
| 2 Aman | "Satu langganan streaming", "Kursus online di bawah Rp200rb" | "Liburan naik pesawat", "Cicilan motor baru" |
| 3 Stabil | "Traktir teman sesekali", "Liburan tiga hari ke luar kota" | "Liburan ke luar negeri", "DP rumah" |
| 4 Terjamin | "Liburan ke Jepang atau Eropa", "Umrah" | "Rumah dibayar kontan", "Resign tanpa pemasukan pengganti" |
| 5 Merdeka | "Rumah dibayar kontan", "Kuliah anak sampai lulus" | "Yayasan atau beasiswa yang jalan tiap tahun" |
| 6 Berlimpah | "Rumah buat orang tua", "Bikin yayasan, beasiswa, atau wakaf produktif" | (kosong) "Daftar 'belum waktunya' kosong di level ini. Yang bikin repot tinggal mutusin mana yang benar-benar mau kamu danai." |

Barang yang menyebut harga otomatis turun ke "belum waktunya" kalau harganya melebihi headroom pengguna.

### Angka turunan

| Angka | Rumus | Status sumber |
|---|---|---|
| Batas "nggak usah dipikir" harian | 0,5% × rata-rata pengeluaran bulanan. Tidak tersedia di Level 1 | **Patokan aplikasi sendiri.** Idenya dari Maggiulli, angka aslinya 0,01% kekayaan bersih dan tidak dipakai |
| Batas "pikirkan dulu semalam" | 1% × kekayaan bersih | **Adaptasi** aturan 1% Glen James (aslinya 1% penghasilan setahun) |
| Headroom | kekayaan bersih − (syarat bulan level sekarang × rata-rata pengeluaran) | Hitungan aplikasi |
| Progres ke level berikutnya | Skala logaritmik dari ambang level sebelumnya. Deck: "Kalau dihitung penggandaan, 60 bulan itu setengah jalan" dari 12 ke 300 | Hitungan aplikasi |
| "Penghalangnya" | Syarat yang paling jauh tertinggal, misalnya "Kurang 4,2 bulan dana darurat" | Hitungan aplikasi |
| Batas pengeluaran masuk akal | Rata-rata pengeluaran di bawah **Rp609.160** (garis kemiskinan BPS Maret 2025) dianggap catatan belum lengkap, levelnya 1 | BPS |

Kenapa 0,01% Maggiulli tidak dipakai (verbatim): "kekayaan bersih Rp59 juta berarti cuma Rp5.954 per belanja, padahal es teh saja sudah Rp5.000 … Ini patokan kami sendiri, bukan angka Maggiulli."

### Keputusan yang sudah diambil

Level sengaja **relatif** (kelipatan pengeluaran), bukan nominal absolut. Ambang UMP/KHL dan pita kekayaan absolut Maggiulli sudah diteliti dan ditolak (26 Agu 2026): UMP berbeda Rp2,3–5,7 juta antar provinsi, dan dengan pita Maggiulli sekitar 98% orang Indonesia akan tertahan di Level 1–2. Jangan usulkan lagi di konten atau rencana fitur.

## Skor Kesehatan Keuangan (0–100)

Jumlah tertimbang empat komponen:

| Komponen | Bobot | Nilai komponen |
|---|---|---|
| Rasio tabungan | 35% | ≥30% → 100, ≥20% → 80, ≥10% → 60, ≥0% → 40, ≥−10% → 20, lainnya 0 |
| Dana darurat (bulan tertutup) | 25% | ≥6 → 100, ≥3 → 80, ≥1 → 60, ≥0,5 → 40, >0 → 20, lainnya 0 |
| Stabilitas pengeluaran (variasi bulanan) | 25% | Variasi ≤15% → 100, ≤30% → 85, ≤50% → 70, ≤75% → 50, ≤100% → 30, lainnya 10 |
| Stabilitas pendapatan (variasi bulanan) | 15% | Sama seperti stabilitas pengeluaran |

- Data kurang dari 2 bulan: stabilitas diberi nilai netral 70. Deck: "Pemula tidak dihukum cuma karena baru mulai."
- Label: **Sangat Baik** ≥80, **Baik** ≥60, **Cukup** ≥40, **Perlu Perbaikan** <40.
- Hubungan dengan level (copy landing): "tabungan dan dana darurat menyumbang 60% dari skor — dan dua-duanya persis syarat buat naik ke level berikutnya. Skormu naik dan levelmu naik lewat pekerjaan yang sama."

## Template Anggaran

| Template | Pembagian | Tagline (verbatim) | Sumber dan catatan |
|---|---|---|---|
| 50/30/20 | Kebutuhan 50, Keinginan 30, Tabungan dan investasi 20 | "Tiga pos saja. Paling gampang dijalanin bulan pertama." | Elizabeth Warren, via Investopedia |
| 40/30/20/10 | Kebutuhan hidup 40, Cicilan utang 30, Tabungan dan investasi 20, Sosial 10 | "Punya pos cicilan sendiri, jadi utang kelihatan." | Kompas (2024) mengutip OJK. Halaman asli OJK tidak ketemu, dan aplikasi menyebut itu |
| 70/20/10 Babylon | Biaya hidup 70, Bayar utang 20, Tabungan 10 | "Aturan tertua di daftar ini. Umurnya seratus tahun." | The Richest Man in Babylon (1926). Kalau utang lunas jadi 70/30 |
| 6 Toples | Kebutuhan 55, Kebebasan finansial 10, Tabungan jangka panjang 10, Pendidikan 10, Senang-senang 10, Sedekah 5 | "Enam pos, termasuk pos khusus belajar dan senang-senang." | T. Harv Eker, 6 Jars System |
| Solusi 60% | Pengeluaran tetap 60, Dana pensiun 10, Tabungan jangka panjang 10, Pengeluaran tak terduga 10, Senang-senang 10 | "Satu pos besar buat semua yang rutin, empat pos kecil sisanya." | Richard Jenkins (2004). Aslinya dari penghasilan kotor |
| 80/20 | Tabungan dan investasi 20, Sisanya bebas 80 | "Cuma satu aturan: sisihkan 20% duluan, sisanya terserah." | Tidak punya satu sumber asli. Aplikasi menyebutnya patokan |

ZAPFIN (Prita Ghozie) sengaja tidak dimasukkan karena sumber primernya tidak ketemu.

## Daftar sumber

| Sumber | Dipakai untuk | URL |
|---|---|---|
| OJK, "Kenali Rasio Keuangan" | Aset lancar ≥3× pengeluaran bulanan, tabungan ≥10% (Level 3) | https://sikapiuangmu.ojk.go.id/FrontEnd/CMS/Article/40786 |
| OJK, "Dana Darurat? Wajib Tahu dan Wajib Punya!" | Dana darurat 3–6× (belum punya tanggungan), 6–12× (berkeluarga) | https://sikapiuangmu.ojk.go.id/FrontEnd/CMS/Article/10428 |
| George S. Clason, *The Richest Man in Babylon* (1926) | Sisihkan minimal sepersepuluh penghasilan | https://en.wikipedia.org/wiki/The_Richest_Man_in_Babylon |
| Elizabeth Warren, *All Your Worth* (2005) | Aturan 50/30/20, porsi tabungan 20% (Level 4) | https://www.investopedia.com/ask/answers/022916/what-502030-budget-rule.asp |
| William Bengen (1994) dan Trinity Study (1998) | Aturan 4%, jadi 25× pengeluaran setahun = 300 bulan (Level 5) | https://en.wikipedia.org/wiki/4%25_rule |
| Nick Maggiulli, *The Wealth Ladder* (2025) | Enam tingkat, gagasan ambang belanja sepele | https://ofdollarsanddata.com/climbing-the-wealth-ladder/ |
| Glen James, *My Millennial Money* | Aturan 1% untuk menunda belanja impulsif | https://www.cnbc.com/2022/04/12/are-you-an-impulse-shopper-try-the-1percent-rule-to-spend-less.html |
| BPS, garis kemiskinan Maret 2025 | Batas Rp609.160 | |

Catatan: OJK memakai kelipatan **gaji**, aplikasi ini memakai kelipatan **pengeluaran**, karena yang perlu ditutup saat penghasilan berhenti adalah pengeluaran. Sebut perbedaan ini kalau mengutip OJK.

## Tiga angka yang wajib disebut apa adanya

1. **0,5% dari pengeluaran bulanan** (batas harian) adalah patokan aplikasi sendiri, bukan angka Maggiulli.
2. **1% dari kekayaan bersih** adalah adaptasi; aturan asli Glen James memakai penghasilan setahun.
3. **600 bulan (Level 6)** tidak berasal dari penelitian mana pun: "murni kelipatan dua dari Level 5. Anggap saja patokan, bukan target yang teruji."
