// Render a reel's scenes.json into one 1080x1920 MP4 per scene (scene-1.mp4, ...).
// Each scene leaves a plain tinted window (PHOTO below) where the photo goes; the photo is
// laid on top in Canva, because photo sites are blocked from the cloud environment.
// Usage: node tools/slides/reel.mjs <reel-folder> [out-folder]
// Needs: npm i --no-save playwright @fontsource-variable/geist, ffmpeg, CHROMIUM_PATH.
import { readFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(join(process.cwd(), 'package.json'));
const { chromium } = require('playwright');
const fontB64 = readFileSync(require.resolve('@fontsource-variable/geist/files/geist-latin-wght-normal.woff2')).toString('base64');
const dir = resolve(process.argv[2]);
const out = resolve(process.argv[3] || join(dir, 'scenes'));
mkdirSync(out, { recursive: true });
const spec = JSON.parse(readFileSync(join(dir, 'scenes.json'), 'utf8'));
const W = 1080, H = 1920, FPS = 30, SEC = spec.seconds || 5;
export const PHOTO = { x: 60, y: 240, w: 960, h: 740 };
const N = spec.scenes.length;
const only = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
// Split a title into word spans; **text** words are highlighted.
function words(title) {
  const parts = [];
  title.split(/(\*\*.+?\*\*)/).forEach((chunk) => {
    const hl = chunk.startsWith('**');
    const text = hl ? chunk.slice(2, -2) : chunk;
    text.split(/(\n| )/).forEach((w) => {
      if (w === '\n') parts.push('<br>');
      else if (w.trim()) parts.push(`<span class="w${hl ? ' hl' : ''}">${esc(w)}</span>`);
    });
  });
  return parts;
}

function html(s, i) {
  const t0 = s.still ? -10 : 0; // "still" scenes start with the title already in place
  let t = 0.15;
  const eyebrow = s.eyebrow ? `<div class="eyebrow a" style="--d:${t0 + t}s">${esc(s.eyebrow)}</div>` : '';
  t += s.eyebrow ? 0.2 : 0;
  let count = '';
  if (s.count) { count = `<div class="count a" style="--d:${t0 + t}s" data-to="${s.count}" data-from="${t0 + t}">0</div>`; t += 1.2; }
  const ws = words(s.title);
  let k = 0;
  const title = `<h1 style="font-size:${s.size || 86}px">${ws.map((w) => w === '<br>' ? w
    : w.replace('class="w', `style="--d:${t0 + t + 0.06 * k++}s" class="a w`)).join(' ')}</h1>`;
  t += 0.06 * k + 0.45;
  const hlDelay = t0 + t;
  t = s.still ? 0.2 : t + 0.15;
  const chips = s.chips ? `<div class="chips">${s.chips.map((c, j) => `<span class="chip a" style="--d:${t + 0.3 * j}s">${esc(c)}</span>`).join('')}</div>` : '';
  if (s.chips) t += 0.3 * s.chips.length;
  const list = s.list ? `<ol class="list">${s.list.map((c, j) => `<li class="a" style="--d:${t + 0.45 * j}s"><b>${(s.start || 1) + j}</b><span>${esc(c)}</span></li>`).join('')}</ol>` : '';
  if (s.list) t += 0.45 * s.list.length;
  const body = (s.body || []).map((p, j) => `<p class="a" style="--d:${t + 0.2 * j}s">${esc(p)}</p>`).join('');
  t += 0.2 * (s.body || []).length;
  const brand = s.brand ? `<div class="brandbig a pop" style="--d:${t + 0.2}s">cariinkerja.id</div>` : '';
  const segs = Array.from({ length: N }, (_, j) => `<i class="${j < i ? 'done' : j === i ? 'now' : ''}"></i>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Geist; src: url('data:font/woff2;base64,${fontB64}') format('woff2'); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
body { font-family: Geist, sans-serif; color: #1A1424; position: relative;
  background: radial-gradient(90% 50% at 0% 100%, #F1E8FF 0%, rgba(241,232,255,0) 70%), radial-gradient(80% 40% at 100% 0%, #F3ECFF 0%, rgba(243,236,255,0) 70%), #FCFBFF; }
.bar { position: absolute; top: 140px; left: 60px; right: 60px; display: flex; gap: 10px; }
.bar i { flex: 1; height: 8px; border-radius: 4px; background: #E7E0F5; overflow: hidden; position: relative; }
.bar i.done { background: #863BFF; }
.bar i.now::after { content: ''; position: absolute; inset: 0; background: #863BFF; transform-origin: left; animation: fill ${SEC}s linear both; }
@keyframes fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.brand { position: absolute; top: 176px; left: 60px; font-size: 28px; font-weight: 700; color: #863BFF; letter-spacing: .01em; }
.shadow { position: absolute; left: ${PHOTO.x + 22}px; top: ${PHOTO.y + 22}px; width: ${PHOTO.w}px; height: ${PHOTO.h}px; background: #863BFF; }
.photo { position: absolute; left: ${PHOTO.x}px; top: ${PHOTO.y}px; width: ${PHOTO.w}px; height: ${PHOTO.h}px; background: #EFE6FF; }
.text { position: absolute; left: 72px; top: ${PHOTO.y + PHOTO.h + 60}px; width: 860px; }
.a { animation: up .5s cubic-bezier(.2,.8,.2,1) var(--d) both; }
@keyframes up { from { opacity: 0; transform: translateY(36px); } to { opacity: 1; transform: none; } }
.pop { animation-name: pop; }
@keyframes pop { 0% { opacity: 0; transform: scale(.85); } 70% { opacity: 1; transform: scale(1.04); } 100% { opacity: 1; transform: none; } }
.eyebrow { font-size: 30px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; color: #863BFF; margin-bottom: 22px; }
.count { font-size: 140px; font-weight: 800; letter-spacing: -0.04em; color: #863BFF; line-height: 1; margin-bottom: 8px; font-variant-numeric: tabular-nums; }
h1 { line-height: 1.08; font-weight: 750; letter-spacing: -0.025em; }
.w { display: inline-block; }
.hl { color: #863BFF; position: relative; }
.hl::after { content: ''; position: absolute; left: -4px; right: -4px; bottom: 0.06em; height: 0.26em; background: #E2D2FF; z-index: -1; transform-origin: left;
  animation: mark .45s ease-out ${hlDelay}s both; }
@keyframes mark { from { transform: scaleX(0); } to { transform: scaleX(1); } }
h1 + * { margin-top: 30px; }
p { font-size: 38px; line-height: 1.38; color: #5E5670; font-weight: 450; }
.chips { display: flex; flex-wrap: wrap; gap: 14px; }
.chip { font-size: 32px; font-weight: 600; color: #4B2A99; background: #EFE6FF; border-radius: 999px; padding: 12px 26px; }
.list { list-style: none; padding: 0; }
.list li { display: flex; gap: 22px; font-size: 38px; line-height: 1.32; font-weight: 500; }
.list li + li { margin-top: 22px; }
.list b { flex: none; width: 54px; height: 54px; border-radius: 50%; background: #863BFF; color: #fff; font-size: 30px; display: flex; align-items: center; justify-content: center; margin-top: -2px; }
.brandbig { display: inline-block; margin-top: 30px; font-size: 40px; font-weight: 750; color: #fff; background: #863BFF; border-radius: 999px; padding: 14px 34px; }
</style></head><body>
<div class="bar">${segs}</div>
<div class="brand">cariinkerja.id</div>
<div class="shadow"></div><div class="photo"></div>
<div class="text">${eyebrow}${count}${title}${chips}${list}${body}${brand}</div>
<script>
window.setT = (sec) => {
  document.getAnimations().forEach((a) => { a.pause(); a.currentTime = sec * 1000; });
  document.querySelectorAll('.count').forEach((el) => {
    const to = Number(el.dataset.to.replace(/\\./g, '')); const from = Number(el.dataset.from);
    const p = Math.min(1, Math.max(0, (sec - from) / 1.1)); const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(to * e).toLocaleString('id-ID');
  });
};
</script></body></html>`;
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage({ viewport: { width: W, height: H } });
for (const [i, s] of spec.scenes.entries()) {
  if (only && !only.includes(i + 1)) continue;
  await page.setContent(html(s, i));
  await page.evaluate(() => document.fonts.ready);
  const bottom = await page.evaluate(() => document.querySelector('.text').getBoundingClientRect().bottom);
  if (bottom > 1560) console.warn(`scene ${i + 1}: text ends at ${Math.round(bottom)}px, inside Instagram's caption area`);
  const file = join(out, `scene-${i + 1}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '20', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0; f < SEC * FPS; f++) {
    await page.evaluate((sec) => window.setT(sec), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (c) => (c ? j(new Error(`ffmpeg ${c}`)) : r())));
  await page.screenshot({ path: join(out, `scene-${i + 1}-end.png`) });
  console.log('wrote', file);
}
await browser.close();
