# Baru wawancara, udah diminta KK?

- Type: produced (animated text over stock photos, no face)
- Length: 40 s (8 scenes × 5 s)
- Audio: no voice, instrumental music only (no vocals, so the text stays the focus). Mood: calm with a little tension in scenes 1 to 4, lighter and reassuring in 5 to 8. Aim for 90 to 100 BPM: at 96 BPM every 5 s scene cut lands on a bar line.
  - Included: `music.mp3`, an original lo-fi track made for this reel by `tools/music/lofi.py` (synthesized, no samples, so nothing to license). 16 bars at 96 BPM, 2 bars per scene: piano and a clock tick on the hook, beat comes in at 0:05, a short break before 0:20, then it turns major with a melody for the "what to do" half, and fades out over the last 2 s. `scenes-music/` holds the scene videos with their 5 s slice of the track, which is what the Canva reel uses.
  - Instead, from Instagram's library: Reels editor, Audio, search "lofi", "suspense", "curious" or "corporate calm". A business account only sees the commercial-use library, so anything listed there is safe to use.
  - Or in Canva before exporting: Add audio in the timeline, search the same words, keep only tracks marked "Commercial use allowed", start at 0:00, fade out the last 2 s, then re-export.
  - Avoid: popular songs with vocals, and horror stingers or dramatic hits. The tone is a friendly warning, not fear.
  - Optional: Jordan reads the headlines as a voice-over. If so, drop the music to about 20%.
- Cover text: Baru wawancara, udah diminta KK? (scene 1's last frame)

| Time | On screen (text) | Photo |
|---|---|---|
| 0–5 s | Baru wawancara, udah diminta **KK?** / Tahan dulu ya. | Interview, candidate in hijab |
| 5–10 s | Jadi gini. Satu lembar KK isinya data **sekeluarga.** / NIK dan nomor KK · Tanggal lahir, agama, pekerjaan · Nama ibu kandung | KK next to a lamaran kerja envelope |
| 10–15 s | Data OJK. **23.469** (counts up) laporan penipuan lowongan kerja. / Laporan ke Indonesia Anti-Scam Centre, Nov 2024 sampai Jan 2026. | Job fair crowd ("Bursa Kerja") |
| 15–20 s | Datanya dipakai buat apa? Dijual, atau dipakai **pinjam atas namamu.** / Banyak korban baru tahu pas tagihannya datang. | Worried man with phone and a bill |
| 20–25 s | Terus kapan perusahaan butuh KK? Biasanya **setelah kamu diterima.** / Buat daftar BPJS Kesehatan keluargamu, atau ngurus tanggungan pajak. | Handshake with HR |
| 25–30 s | Kalau tetap diminta. Lakuin ini dulu. 1 Tanya buat apa, dan disimpan di mana. 2 Cek perusahaannya: website resmi, email kantor, bukan @gmail.com. | Woman at a desk with a laptop |
| 30–35 s | 3 Kasih tulisan di fotonya: "Hanya untuk rekrutmen PT X". 4 Diminta bayar apa pun? Berhenti di situ. | Interview, hands and clipboard |
| 35–40 s | Perusahaan yang serius **bisa nunggu** sampai kamu diterima. / Data keluargamu bukan syarat wawancara. / cariinkerja.id | Professional walking into an office |

## Notes

- All text stays above y 1560 and left of x 940, clear of Instagram's caption and buttons.
- The scene videos are in `scenes/`. To change wording: edit scenes.json, run `node tools/slides/reel.mjs <this folder>`, and swap the video on that Canva page.
