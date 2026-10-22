# Produk

## Apa itu Ngatur Duit

Aplikasi pencatat keuangan pribadi untuk orang Indonesia. Kamu mencatat pemasukan dan pengeluaran dengan mengetik seperti chat biasa ("kopi 25rb"). Dari catatan itu aplikasi menghitung tiga hal: **level kekayaanmu** (1 sampai 6), **skor kesehatan keuangan** (0 sampai 100), dan **pembagian gaji dalam rupiah** menurut enam template anggaran.

Yang membedakannya dari aplikasi pencatat lain: tiap angka punya sumber yang disebut terbuka (OJK, buku, riset), dan angka yang tidak ada sumbernya juga ditandai apa adanya.

## Masalah yang dijawab

Deck untuk calon pengguna (`_docs/pitch/deck.html`) membingkainya sebagai tiga pertanyaan yang orang tanyakan sendiri dan jarang dapat jawaban:

1. "Sekarang aku di mana?" → **skor kesehatan** dan **level**
2. "Ini wajar nggak buat orang kayak aku?" → **tangga kekayaan**, diukur dari pengeluaranmu sendiri
3. "Terus aku harus ngapain?" → **"Penghalangnya"** dan **template anggaran**

Tiga keluhan di slide masalah: "Tidak pernah ada yang mengajarkan", "50/30/20 kamu hafal. Rupiahnya berapa?", "Tahu angkanya, tidak tahu artinya".

## Untuk siapa

Orang Indonesia yang ingin tahu posisi keuangannya tanpa ribet mencatat. Gate level memakai kelipatan pengeluaran, bukan nominal rupiah, jadi levelnya adil untuk penghasilan berapa pun: "Bukan angka rupiah, jadi levelnya adil buat penghasilan berapa pun." Contoh template dan daftar belanja per level dikalibrasi ke pengeluaran umum sekitar Rp5–8 juta sebulan.

## Di mana bisa dipakai

| Saluran | Status | Catatan |
|---|---|---|
| Web app, ngaturduit.my.id | Live | Semua fitur ada di sini |
| Bot Telegram [@ngatur_duit_bot](https://t.me/ngatur_duit_bot) | Live | Hanya untuk mencatat dan login. Tidak bisa melihat, mengubah, atau menghapus transaksi |
| Claude (connector) | Live sejak 21 Okt 2026 | Tanya jawab soal keuanganmu, hanya membaca |
| Aplikasi Android | Belum rilis | Jangan dipromosikan |

## Fitur

Tanggal = kapan fitur pertama masuk ke kode. Copy dalam tanda kutip = teks asli di aplikasi.

### 1. Catat lewat chat (fitur utama)

- Ketik seperti chat: "Beli kopi 30k", "Gaji bulan ini 8.5jt", "Bayar listrik 450rb". Satu baris satu transaksi, jadi satu pesan bisa berisi beberapa transaksi.
- AI mengenali singkatan rupiah (5K, 2rb, 1,5jt), menentukan pemasukan atau pengeluaran, kategori, dan tanggal ("kemarin" juga bisa), lalu membalas dengan komentar singkat.
- Di web: kotak tambah cepat berlabel "Tulis biasa aja", pintasan ⌘K / Ctrl+K. Demo di landing berjudul "Tambah dari Chat".
- Di Telegram: kirim pesan apa saja yang tidak diawali `/`. Balasan bot: "✅ Berhasil mencatat {n} transaksi!"
- Copy landing: "Makanya mencatat dibikin sesingkat mungkin: ketik seperti chat biasa, sisanya diurus AI." dan "Bisa lewat aplikasi atau lewat bot Telegram, tanpa buka form."
- **Batas:** selalu masuk ke dompet default (belum bisa menyebut nama dompet di kalimat). Teks saja, belum bisa foto struk atau suara.

### 2. Input manual dan riwayat transaksi

- Form "Isi manual": jenis, nominal (singkatan langsung diterjemahkan), kategori, dompet, tombol cepat "Hari ini / Kemarin".
- Riwayat bisa dikelompokkan per kategori (dengan diagram lingkaran) atau per tanggal, pindah bulan, filter per dompet. Edit dan hapus dari web.
- Kategori berbahasa Indonesia, misalnya makan, jajan, transportasi, tagihan, cicilan, zakat (pengeluaran) dan gaji, freelance, bonus, THR, dividen (pemasukan).

### 3. Dompet, transfer, saldo awal

- Banyak dompet (rekening, e-wallet, tunai), satu jadi default.
- **Transfer antar dompet** dicatat sebagai pasangan, dan tidak dihitung sebagai pemasukan atau pengeluaran di total mana pun.
- **Saldo awal:** "dompet ini isinya Rp X per tanggal D". Kamu bisa mulai kapan saja tanpa memasukkan riwayat lama.

### 4. Transaksi Rutin (20 Sep 2026)

- Tagihan dan pemasukan bulanan dicatat otomatis: sewa, cicilan, gaji. Pilih tanggal, dompet, kategori, nominal. Bisa dijeda dan dilanjutkan. Tanggal 31 jatuh ke hari terakhir bulan pendek.
- **Batas:** transaksinya baru tercatat saat kamu membuka web app. Bulan yang terlewat dikejar sampai 24 bulan, kecuali bulan saat aturannya dijeda.

### 5. Aset dan "Cek harga jual" (27 Sep 2026)

- Catat barang berharga (motor, mobil, HP, tanah) dengan bulan/tahun beli, harga, dan catatan.
- Dashboard menampilkan **"Total kekayaan"**: uang ditambah nilai aset.
- Pengeluaran bisa diubah jadi aset lewat tombol "Jadikan Aset".
- **"Cek harga jual":** AI mencari harga barang bekas serupa di OLX, Mobil123, Tokopedia, Shopee, Facebook Marketplace, dan lainnya, lalu memberi perkiraan harga plus tautan sumbernya. **Butuh akun berumur 3 bulan.**
- Aset sengaja **tidak** ikut menghitung level dan skor, karena mobil bukan uang yang bisa dibelanjakan.

### 6. Skor kesehatan keuangan, 0–100

- Empat komponen: rasio tabungan (35%), dana darurat (25%), stabilitas pengeluaran (25%), stabilitas pendapatan (15%). Detail di [metodologi.md](metodologi.md).
- Label: Sangat Baik (≥80), Baik (≥60), Cukup (≥40), Perlu Perbaikan.
- Copy landing: "Skor yang bilang kenapa kamu masih di situ" dan "Levelmu cuma menyebut posisi. Skor 0–100 ini memecahnya jadi empat hal yang bisa kamu ubah bulan depan."

### 7. Tangga Kekayaan, 6 level (16 Agu 2026)

- Bertahan → Aman → Stabil → Terjamin → Merdeka → Berlimpah. Diukur dari berapa bulan pengeluaran yang bisa ditutup kekayaanmu.
- Tiap level menampilkan:
  - daftar "Aman dibeli" dan "Belum waktunya"
  - batas belanja harian "nggak usah dipikir"
  - batas "pikirkan dulu semalam" untuk sekali beli
  - **headroom**: berapa yang boleh dibelanjakan sebelum level turun
  - progres ke level berikutnya, dan **"Penghalangnya"**, contohnya "Kurang 4,2 bulan dana darurat"
- Landing punya versi interaktif: "Kamu ada di level berapa?" / "Klik salah satu untuk lihat apa yang aman dibeli di sana."
- Tabel lengkap dan sumber di [metodologi.md](metodologi.md).

### 8. Statistik

- Periode: Semua / 3 bulan / 6 bulan.
- Isi: kartu skor kesehatan, tren total saldo (1 Okt 2026), tren surplus bulanan (rata-rata, tertinggi, terendah), tren pengeluaran 5 kategori teratas.

### 9. Template anggaran (19 Agu 2026)

- Enam cara membagi gaji: 50/30/20, 40/30/20/10, 70/20/10 Babylon, 6 Toples, Solusi 60%, 80/20.
- Isi penghasilan bulanan ("5jt" juga bisa), tiap pos langsung tampil dalam rupiah.
- Copy landing: "Hampir semua orang pernah dengar 50/30/20. Hampir nggak ada yang pernah melihatnya dalam bentuk rupiah miliknya sendiri, per pos, per bulan."
- Demo di landing bisa dicoba tanpa daftar: "Boleh disingkat: 5jt, 500rb, 30k… Nggak disimpan ke mana-mana."
- **Batas:** aplikasi belum membandingkan belanja aslimu dengan template.

### 10. Kepribadian Finansial (2 Okt 2026)

- Agen AI menelusuri transaksi 3 bulan terakhirmu, lalu memberi julukan arketipe, tagline, ringkasan, 3–5 sifat **lengkap dengan bukti dari datamu sendiri**, dan 1–2 saran.
- Langkah agen tampil langsung saat berjalan ("Cari kebiasaan yang berulang…"). Satu bacaan bisa makan 2–3 menit. Tombol "Baca ulang" menjalankan ulang.
- **Butuh:** akun berumur 3 bulan dan minimal 10 transaksi dalam 3 bulan terakhir.
- Ada di halaman Profil.

### 11. Tanya Claude soal keuanganmu (21 Okt 2026)

- Hubungkan Ngatur Duit ke Claude (claude.ai, Claude Desktop, aplikasi Claude di HP). Cara: di Claude buka Settings → Connectors → Add custom connector, tempel URL dari halaman Pengaturan, lalu setujui di halaman "Hubungkan ke Claude".
- Bisa ditanya, misalnya: "gimana keuangan saya?", "pengeluaran makan naik apa turun?", "boleh nggak saya beli X?", total kekayaan, kebiasaan belanja.
- Claude memakai 15 tool yang **hanya membaca**: "Claude bisa membaca transaksi, dompet, dan ringkasan keuanganmu, tapi nggak bisa mengubah data."
- Claude diberi aturan yang sama dengan aplikasi: angka harus dari tool, level adalah "panduan, bukan vonis", dan di Level 1–2 harus ada satu langkah konkret, bukan cuma "jangan beli".
- Tidak ada gate umur akun. Cara menyambungkan hanya ada di web (halaman Pengaturan).

### 12. Bot Telegram

| Perintah | Fungsi |
|---|---|
| (pesan biasa) | Catat transaksi lewat chat |
| `/start`, `/help` | Teks pembuka |
| `/login` | Kode OTP + tautan login ke web, berlaku 5 menit |
| `/delete_account` | Hapus akun dan semua data, **langsung tanpa konfirmasi** |

Perintah yang tidak dikenal dibalas "Mau ngapain siih :v". Perintah `/daily_*` dan `/monthly_*` ada tapi tidak mengirim apa-apa, jadi jangan dipromosikan.

### 13. Masuk dan daftar

- **Telegram:** pesan pertama ke bot langsung membuat akun, tanpa form.
- **Web:** Google, email + kata sandi, atau kode OTP dari bot Telegram.

### 14. Lain-lain

- Tampilan terang (bawaan). Mode gelap hanya bisa dipilih manual di Pengaturan.
- Hapus akun: lewat bot Telegram. Web belum punya tombolnya.

## Harga dan gate

- **Semua gratis.** Tidak ada langganan dan tidak ada pembayaran di mana pun. Deck: "Tanpa biaya" / "Belum ada paket berbayar".
- Satu-satunya pembatas: **akun berumur 3 bulan** untuk dua fitur AI yang mahal, yaitu Kepribadian Finansial dan Cek harga jual. Pengguna yang belum memenuhi melihat tanggal fitur itu terbuka: "Asisten AI kebuka setelah 3 bulan pakai. Punyamu mulai {tanggal}."
- Semua yang lain, termasuk connector Claude, terbuka sejak transaksi pertama. Copy penutup landing: "Skor, level, template, dan sumber tiap angkanya terbuka sejak transaksi pertama."

## Cara mulai

1. Buka ngaturduit.my.id, klik "Coba Sekarang", daftar pakai Google atau email. Atau kirim pesan ke [@ngatur_duit_bot](https://t.me/ngatur_duit_bot).
2. Catat transaksi pertama: ketik "kopi 25rb".
3. Isi saldo awal dompet supaya total kekayaan dan levelnya langsung masuk akal.

## Keterbatasan yang wajib disebut terbuka

Aplikasinya sendiri menyebut ini di bagian "Tiap angka ada sumbernya". Konten juga harus jujur soal ini, jangan disembunyikan.

- **Utang belum dihitung.** "Kalau kamu punya cicilan atau pinjaman, level aslinya lebih rendah dari yang ditampilkan di sini."
- **Aset likuid belum dipisahkan.** Rumah dan tanah ikut terhitung sebagai dana darurat.
- **Level 5 dan 6** memakai aturan 4% atas kekayaan bersih, bukan penghasilan pasif yang benar-benar terukur.
- **Level butuh data.** Rata-rata pengeluaran diambil dari 6 bulan terakhir yang sudah lewat, jadi bulan pertama hasilnya belum stabil.
- **Level itu relatif.** "Rp4 juta dengan pengeluaran Rp1 juta sebulan itu Stabil di sini, tapi tetap bukan kaya."
- **Catat lewat chat** selalu masuk dompet default dan hanya menerima teks.
- **Transaksi rutin** baru tercatat saat web app dibuka.
- "Semua angka di sini panduan, bukan nasihat keuangan."
