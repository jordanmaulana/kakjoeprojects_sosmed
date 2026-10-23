// Render a post's slides.json to 1080x1350 PNGs (1.png, 2.png, ...) in the same folder.
// Usage: node tools/slides/render.mjs <post-folder>
// Needs: npm i --no-save playwright @fontsource-variable/geist   (see README.md)
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(join(process.cwd(), 'package.json'));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const font = require.resolve('@fontsource-variable/geist/files/geist-latin-wght-normal.woff2');
const fontB64 = readFileSync(font).toString('base64');
const outDir = resolve(process.argv[2] || '.');
const specPath = join(outDir, 'slides.json');
const spec = JSON.parse(readFileSync(specPath, 'utf8'));

const THEMES = {
  ngaturduit: {
    bg: '#F4F6FA', ink: '#0F1729', muted: '#5A6478', accent: '#0F6FE0', card: '#FFFFFF',
    rule: '#E1E7F0', tint: '#E4F0FF', bgCss: '#F4F6FA',
  },
  cariinkerja: {
    bg: '#050308', ink: '#FFFFFF', muted: '#A9A3B5', accent: '#A777FF', card: '#1B1622',
    rule: '#2C2536', tint: '#241A35', bgCss: 'radial-gradient(120% 80% at 80% 0%, #2a1748 0%, #1a1424 45%, #050308 100%)',
  },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
// **text** -> accent span
const fmt = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<span class="hl">$1</span>').replace(/\n/g, '<br>');

function slideHtml(slide, i, total) {
  const t = THEMES[spec.theme];
  const rows = slide.rows ? `<div class="card">${slide.rows.map((r) =>
    `<div class="row${(r.total || r[2]) ? ' total' : ''}"><span>${fmt(r[0] ?? r.label)}</span><span class="num">${fmt(r[1] ?? r.value)}</span></div>`).join('')}</div>` : '';
  const list = slide.list ? `<ol class="list">${slide.list.map((x) => `<li>${fmt(x)}</li>`).join('')}</ol>` : '';
  const body = (slide.body || []).map((p) => `<p>${fmt(p)}</p>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family: Geist; src: url('data:font/woff2;base64,${fontB64}') format('woff2'); font-weight: 100 900; }
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1080px; height: 1350px; }
  body { font-family: Geist, sans-serif; background: ${t.bgCss}; color: ${t.ink};
    padding: 110px 96px 96px; display: flex; flex-direction: column; }
  .eyebrow { font-size: 30px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: ${t.accent}; margin-bottom: 36px; }
  h1 { font-size: ${slide.size || 84}px; line-height: 1.08; font-weight: 750; letter-spacing: -0.025em; }
  h1 + * { margin-top: 48px; }
  p { font-size: 40px; line-height: 1.38; color: ${t.muted}; font-weight: 450; }
  p + p { margin-top: 26px; }
  .hl { color: ${t.accent}; }
  .card { background: ${t.card}; border-radius: 28px; padding: 18px 44px; border: 2px solid ${t.rule}; }
  .row { display: flex; justify-content: space-between; gap: 24px; font-size: 36px; padding: 24px 0; border-bottom: 2px solid ${t.rule}; color: ${t.ink}; }
  .row:last-child { border-bottom: 0; }
  .row.total { font-weight: 700; }
  .num { font-variant-numeric: tabular-nums; white-space: nowrap; }
  .card + p, p + .card, .list + p { margin-top: 40px; }
  .list { padding-left: 0; list-style: none; counter-reset: n; }
  .list li { counter-increment: n; font-size: 38px; line-height: 1.36; padding-left: 78px; position: relative; color: ${t.ink}; }
  .list li + li { margin-top: 34px; }
  .list li::before { content: counter(n); position: absolute; left: 0; top: -2px; width: 52px; height: 52px; border-radius: 50%;
    background: ${t.tint}; color: ${t.accent}; font-weight: 700; font-size: 30px; display: flex; align-items: center; justify-content: center; }
  .spacer { flex: 1.4; } .top { flex: 0.6; }
  .foot { display: flex; justify-content: space-between; align-items: center; font-size: 28px; color: ${t.muted}; }
  .brand { font-weight: 700; color: ${t.accent}; }
  .tag { font-size: 26px; color: ${t.muted}; border: 2px solid ${t.rule}; border-radius: 999px; padding: 6px 20px; align-self: flex-start; margin-bottom: 28px; }
  </style></head><body>
  <div class="top"></div>
  ${slide.tag ? `<div class="tag">${esc(slide.tag)}</div>` : ''}
  ${slide.eyebrow ? `<div class="eyebrow">${esc(slide.eyebrow)}</div>` : ''}
  ${slide.title ? `<h1>${fmt(slide.title)}</h1>` : ''}
  ${rows}${list}${body}
  <div class="spacer"></div>
  <div class="foot"><span class="brand">${esc(slide.brand ?? spec.brand ?? '')}</span><span>${total > 1 ? `${i + 1}/${total}` : ''}</span></div>
  </body></html>`;
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (const [i, slide] of spec.slides.entries()) {
  await page.setContent(slideHtml(slide, i, spec.slides.length), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(outDir, `${i + 1}.png`) });
}
await browser.close();
console.log(`rendered ${spec.slides.length} slides to ${outDir}`);
