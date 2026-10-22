# Suara: cara menulis tentang Ngatur Duit

Suara produk **sudah ada di aplikasinya**, terutama di `frontend/src/features/dashboard/content/wealthReference.ts`. Caption, thread, naskah video, dan email harus terdengar seperti file itu. Jangan menciptakan nada baru.

Jordan pernah menolak copy deck lama sebagai "AI slop" walaupun teks aplikasinya sendiri sudah bagus. Masalahnya: deck itu menjauh dari suara produk. Aturan di bawah dibuat supaya itu tidak terulang.

## Aturan

1. **Sapa satu orang dengan "kamu".** Jangan "pengguna", "kalian", "Anda", atau "teman-teman".
2. **Tanya, lalu jawab datar.** Pertanyaan yang orang tanyakan sendiri, lalu jawaban langsung tanpa basa-basi.
3. **Punchline di barisnya sendiri.**
4. **Angka konkret, bukan abstraksi.** "es teh saja sudah Rp5.000", "Motor masuk bengkel Rp800rb". Pakai harga dan barang sehari-hari di Indonesia: es teh, gas melon, puskesmas, ojek online, arisan.
5. **Sebut batasannya terang-terangan dan di depan,** bukan disembunyikan sebagai disclaimer di akhir.
6. **Kembalikan keputusan ke pembaca.** Aplikasi memberi panduan, pembaca yang memutuskan.
7. **Jangan menghakimi.** Level itu posisi, bukan nilai diri. Untuk Level 1–2, beri satu langkah konkret, jangan cuma "jangan beli". Rumusan di instruksi Claude: "Level kekayaan itu panduan, bukan vonis. Jangan pernah menghakimi."
8. **Tiap angka disertai sumbernya.** Kalau angkanya buatan aplikasi, bilang begitu (lihat [metodologi.md](metodologi.md)).

### Ejaan dua register

- **Narasi** (kalimat penjelas): `tidak`, `kalau`, `saja`.
- **Ucapan yang dikutip, judul yang dibaca seperti omongan, bubble chat:** `nggak`, `kalo`, `aja`.

Contoh: narasi "Kalau mencatatnya ribet, tidak akan jalan." Ucapan "Ini wajar nggak buat orang kayak aku?"

Kosakata santai yang dipakai aplikasi: nutup, nyentuh, numpuk, nganggur, jalanin, kebuka.

## Larangan

Ini yang Jordan sebut "AI slop":

- **Pembuka pasif:** "Dijawab…", "Dirancang untuk…", "Dihadirkan…".
- **Judul simetris berpasangan:** "Bukan sekadar X, tapi Y" / "Lebih hemat, lebih tenang."
- **Aposisi em-dash:** "Ngatur Duit — aplikasi yang…". Pakai titik atau koma.
- **Triad abstrak sama berat:** "mudah, cepat, dan aman", "transparan, akurat, terpercaya".
- **Persona karangan:** "Rani, 27, karyawan swasta…". Kalau butuh ilustrasi, tulis untuk "kamu" dan beri label bahwa itu ilustrasi (deck slide 9 melakukan ini).
- **Metrik karangan:** jumlah pengguna, persen penghematan, rating. Tidak ada data publik.
- **Cerita pendiri, "aku/saya" sebagai pembuat.** Deck untuk calon pengguna sengaja tanpa slide pendiri; materi publik lainnya mengikuti.
- **Janji hasil** ("pasti naik level", "bebas finansial dalam setahun") dan **istilah nasihat** ("rekomendasi investasi").

## Contoh kalimat asli (verbatim, boleh dikutip)

Dari `wealthReference.ts` dan `wealth_level.py`:

1. "Belum ada cadangan sama sekali. Motor masuk bengkel Rp800rb atau anak sakit seminggu langsung berubah jadi pinjaman. Yang perlu dikejar dulu satu saja: akhir bulan masih ada sisa."
2. "Belanja harian aman, tapi cadangannya belum sampai sebulan penuh, jadi satu tagihan rumah sakit masih bisa menguras habis."
3. "Kalau kerjaan hilang, kamu punya waktu cari pengganti tanpa buru-buru ambil tawaran pertama."
4. "Asetnya sudah cukup besar sampai imbal hasilnya bisa nutup biaya hidup tanpa nyentuh pokoknya. Gaji bulanan berhenti pun pengeluaran tetap jalan."
5. "Di titik ini kebanyakan keputusan belanja berhenti soal sanggup atau nggak, dan pindah ke soal mau dipakai buat apa."
6. "…ada ambang di mana belanja terlalu kecil untuk layak dipikirkan, dan capek mikirinnya lebih mahal daripada uangnya sendiri."
7. "kekayaan bersih Rp59 juta berarti cuma Rp5.954 per belanja, padahal es teh saja sudah Rp5.000"
8. "Anggap saja patokan, bukan target yang teruji."
9. "Rp4 juta dengan pengeluaran Rp1 juta sebulan itu Stabil di sini, tapi tetap bukan kaya."
10. "Aplikasi belum memperhitungkan utang. Kalau kamu punya cicilan atau pinjaman, level aslinya lebih rendah dari yang ditampilkan di sini."
11. "Tiap bulan uangnya habis, kadang malah kurang. Sisa Rp50rb pun sudah kemajuan."
12. "Semua angka di sini panduan, bukan nasihat keuangan."

Dari landing page:

- "Naik Level, Satu Bulan Sekali"
- "Keuanganmu punya level, dan levelnya bisa naik."
- "Bukan angka rupiah, jadi levelnya adil buat penghasilan berapa pun."
- "Skor yang bilang kenapa kamu masih di situ"
- "Hampir semua orang pernah dengar 50/30/20. Hampir nggak ada yang pernah melihatnya dalam bentuk rupiah miliknya sendiri, per pos, per bulan."
- "Tiap angka ada sumbernya"
- "Level berikutnya mulai dari catatan hari ini."
- Contoh input chat: "Beli kopi 30k", "Gaji bulan ini 8.5jt", "Bayar listrik 450rb"

Dari bot Telegram (nada iseng boleh di sini): "Mau ngapain siih :v"

## Narasi yang sudah ada: deck calon pengguna

`_docs/pitch/deck.html` (PDF: `_docs/pitch/ngaturduit-deck.pdf`). Tulang punggungnya bukan tur fitur, tapi satu orang yang belajar tiga hal tentang uangnya: posisinya (skor), wajar atau tidak (tangga), dan langkah berikutnya (template).

Judul slide, cocok jadi bahan seri konten:

1. Naik Level, Satu Bulan Sekali
2. "Kalau lampunya mati, kebanyakan orang menyalakan lilin." Lanjutannya: "Pengeluaran membengkak, solusinya hemat bulan depan. Itu lilin. Terang sebentar, besok gelap lagi. Yang jarang dicari: kenapa lampunya mati."
3. Tiga pertanyaan yang kamu tanya sendiri, dan jarang ada jawabannya
4. Angkanya penting. Yang lebih penting: kamu tahu kenapa angkanya segitu
5. Enam level, dan yang diukur bukan saldomu
6. Tahu posisi itu setengah. Setengahnya lagi: tahu jaraknya
7. Enam cara membagi gaji, dalam rupiahmu
8. Dua angka yang kamu bawa terus, walaupun aplikasinya tidak dibuka
9. Gajimu tetap. Yang naik: kejelasannya. (ilustrasi 12 bulan, berlabel karangan)
10. Kalau mencatatnya ribet, tidak akan jalan
11. Asisten yang menjelaskan, bukan yang mengambil alih
12. Kalau mau mengajarkan, ya sebut angkanya datang dari mana
13. Mulai dari satu pesan

Kalimat penutup deck:
> Yang penting bukan kamu sekarang di level berapa.
> Yang penting kamu tahu, dan tahu langkah berikutnya apa.

**Bagian deck yang sudah usang:** slide 5 masih memakai label kebebasan lama ("belanja harian", "makan di luar", "liburan", …); label sekarang ada di [metodologi.md](metodologi.md). Palet deck juga versi lama (latar krem `#FAF8F0`); pakai [brand.md](brand.md).

## Tentang `_docs/pitch/speak_style.md`

File itu **bukan panduan gaya**. Isinya artikel Medium Jordan ("Bertahan dan berkembang dalam karir", Nov 2024) yang ditempel utuh. Berguna untuk merasakan cara Jordan bercerita: mengajar lewat kejadian sehari-hari, rendah hati, kalimat inti tebal satu baris, mengakui batas. Metafora lampu dan lilin di deck slide 2 berasal dari artikel itu.

Artikel itu ditulis sebagai "aku". Materi produk tidak: materi produk selalu bicara ke "kamu".
