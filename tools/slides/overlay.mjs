// Usage: node tools/slides/overlay.mjs <post-folder> <out-folder>  (same deps as render.mjs; set CHROMIUM_PATH)
// Render transparent 1080x1440 overlays: one layout for every slide, with a window for the photo.
import { readFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(join(process.cwd(), 'package.json'));
const { chromium } = require('playwright');
const fontB64 = readFileSync(require.resolve('@fontsource-variable/geist/files/geist-latin-wght-normal.woff2')).toString('base64');
const dir = resolve(process.argv[2]); const out = resolve(process.argv[3]); mkdirSync(out, { recursive: true });
const spec = JSON.parse(readFileSync(join(dir, 'slides.json'), 'utf8'));
const W = 1080, H = 1440, C = { x: 600, y: 64, w: 416, h: 1312, r: 40 };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fmt = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<span class="hl">$1</span>').replace(/\n/g, '<br>');
const hole = `M${C.x + C.r} ${C.y}H${C.x + C.w - C.r}A${C.r} ${C.r} 0 0 1 ${C.x + C.w} ${C.y + C.r}V${C.y + C.h - C.r}A${C.r} ${C.r} 0 0 1 ${C.x + C.w - C.r} ${C.y + C.h}H${C.x + C.r}A${C.r} ${C.r} 0 0 1 ${C.x} ${C.y + C.h - C.r}V${C.y + C.r}A${C.r} ${C.r} 0 0 1 ${C.x + C.r} ${C.y}Z`;
const total = spec.slides.length;
const html = (s, i) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Geist; src: url('data:font/woff2;base64,${fontB64}') format('woff2'); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
html, body { width: ${W}px; height: ${H}px; background: transparent; }
body { font-family: Geist, sans-serif; color: #1A1424; position: relative; }
svg { position: absolute; inset: 0; }
.col { position: absolute; left: 72px; top: 0; width: 480px; height: ${H}px; }
.count { position: absolute; top: 72px; left: 0; font-size: 24px; font-weight: 650; color: #863BFF; background: #EFE6FF; border-radius: 999px; padding: 10px 22px; letter-spacing: .04em; }
.content { position: absolute; top: 236px; left: 0; width: 480px; }
.eyebrow { font-size: 25px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; color: #863BFF; margin-bottom: 28px; }
h1 { font-size: 72px; line-height: 1.08; font-weight: 750; letter-spacing: -0.025em; }
.hl { color: #863BFF; }
h1 + * { margin-top: 44px; }
p { font-size: 35px; line-height: 1.42; color: #5E5670; font-weight: 450; }
p + p { margin-top: 24px; }
.list { padding: 0; list-style: none; counter-reset: n; }
.list li { counter-increment: n; font-size: 33px; line-height: 1.4; padding-left: 64px; position: relative; color: #1A1424; }
.list li + li { margin-top: 28px; }
.list li::before { content: counter(n); position: absolute; left: 0; top: 0; width: 42px; height: 42px; border-radius: 50%; background: #EFE6FF; color: #863BFF; font-weight: 700; font-size: 24px; display: flex; align-items: center; justify-content: center; }
.foot { position: absolute; bottom: 72px; left: 0; font-size: 26px; font-weight: 700; color: #863BFF; display: flex; gap: 14px; align-items: center; }
.foot span { color: #5E5670; font-weight: 500; }
</style></head><body>
<svg width="${W}" height="${H}"><defs><radialGradient id="g" cx="0.15" cy="0" r="1.1"><stop offset="0" stop-color="#F1E8FF"/><stop offset="0.5" stop-color="#FBF9FF"/><stop offset="1" stop-color="#FFFFFF"/></radialGradient></defs>
<path fill="url(#g)" fill-rule="evenodd" d="M0 0H${W}V${H}H0Z ${hole}"/></svg>
<div class="col">
<div class="count">${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</div>
<div class="content">
${s.eyebrow ? `<div class="eyebrow">${esc(s.eyebrow)}</div>` : ''}
<h1>${fmt(s.title)}</h1>
${s.list ? `<ol class="list">${s.list.map((x) => `<li>${fmt(x)}</li>`).join('')}</ol>` : ''}
${(s.body || []).map((p) => `<p>${fmt(p)}</p>`).join('')}
</div>
<div class="foot">cariinkerja.id${i < total - 1 ? '<span>Geser &rarr;</span>' : ''}</div>
</div></body></html>`;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: W, height: H } });
for (const [i, s] of spec.slides.entries()) {
  await page.setContent(html(s, i));
  const h = await page.evaluate(() => { const c = document.querySelector('.content'); return c.offsetTop + c.offsetHeight; });
  if (h > H - 150) console.warn(`slide ${i + 1} content ends at ${h}px, overlaps footer`);
  await page.screenshot({ path: join(out, `overlay-${i + 1}.png`), omitBackground: true });
}
await browser.close();
