# Jangan serahkan KK di tahap wawancara (reel)

- Workflow: 1 (topic)
- Format: reel, produced (animated text + stock photos), 8 scenes × 5 s = 40 s
- Jordan's ask (2026-10-25): "Generate motion videos for Instagram Reels about this topic. If possible, provide real images about job applying in Indonesia."
- Product: cariinkerja.id
- Selling level: 1, same as the carousel (near-sensitive topic: scams, pinjol). Product name only in the top-left mark, the last scene and the caption's last line.
- Point of view and sources: same as the carousel, see `cariinkerja.id/instagram/2026-11-03-jangan-serahkan-kk/brief.md`. No new facts were added.

## How it's made

- `scenes.json` holds the on-screen text per scene. `tools/slides/reel.mjs` renders each scene to `scenes/scene-N.mp4` (1080×1920, 30 fps, 5 s, Geist, light cariinkerja theme): progress bar, word-by-word headline, highlight marker, count-up number, list items one by one.
- Each scene leaves a plain window at x 60, y 240, 960×740. The photo goes there in Canva, on top of the scene video, because photo sites and Canva downloads are blocked from Claude's environment.
- Canva design with all 8 scenes and photos: https://canva.link/im08uieuv1h03y8 ("Edukasi pencari kerja Indonesia"). Export it from Canva as MP4 (Share > Download > MP4). Claude can't download from Canva, so the finished MP4 isn't in this folder; add it here once exported if it should be kept.

## Photos

Picked from Canva's library by Canva's generator. They show Indonesian settings (a "Bursa Kerja" job fair, an interview in hijab, a Kartu Keluarga next to a "Lamaran Kerja" envelope), but several look AI-generated rather than real photographs: the KK and envelope have made-up printed text. Fine as illustration, but don't present them as real events.
