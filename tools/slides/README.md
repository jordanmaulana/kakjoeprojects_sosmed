# Slides

Turns a post's `slides.json` into carousel images (1080×1350, 4:5) in the product's brand
colours, so the text on the slides lives in the repo and can be edited like the caption.

```bash
npm i --no-save playwright @fontsource-variable/geist   # once
npx playwright install chromium                         # once, if no Chromium is installed
node tools/slides/render.mjs <post-folder>              # writes 1.png, 2.png, ... next to slides.json
```

`slides.json`:

```json
{
  "theme": "ngaturduit",
  "slides": [
    { "title": "Gaji naik **Rp2 juta**.", "body": ["One paragraph.", "Another."] },
    { "tag": "Ilustrasi, angkanya karangan", "eyebrow": "Label", "title": "…",
      "rows": [["Label", "Value"], ["Total", "Value", true]] },
    { "title": "…", "list": ["Step one", "Step two"] },
    { "title": "…", "body": ["…"], "brand": "Ngatur Duit · ngaturduit.my.id" }
  ]
}
```

| Field | Meaning |
|---|---|
| `theme` | `ngaturduit` (light, blue) or `cariinkerja` (dark, purple). |
| `title` | Big text. `**word**` puts it in the accent colour, `\n` breaks the line. `size` overrides the font size (px). |
| `eyebrow` | Small uppercase label above the title. |
| `tag` | Pill above everything. Use it for "Ilustrasi" when numbers are made up. |
| `body` | Paragraphs under the title. |
| `rows` | A card of label/value rows. A third value `true` makes the row bold. |
| `list` | Numbered steps. |
| `brand` | Bottom-left line. Leave it out on every slide except the last, and leave it out entirely on Level 0 posts ([content-playbook.md](../../content-playbook.md#2-selling-levels)). |

If Chromium or Playwright live somewhere unusual, set `CHROMIUM_PATH` and
`PLAYWRIGHT_MODULE`.
