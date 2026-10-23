import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { imageSize, parseWhen, readCaption, countHashtags, loadPost, checkPost } from './lib.mjs';
import { buildQueue } from './instagram.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OG = join(HERE, '..', '..', 'ngaturduit.my.id', 'product_knowledge', 'og.png');
const CLI = join(HERE, 'instagram.mjs');

// Smallest header a JPEG size reader needs: SOI, then a SOF0 segment.
function fakeJpeg(width, height) {
  const b = Buffer.alloc(30);
  b.set([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08]);
  b.writeUInt16BE(height, 7);
  b.writeUInt16BE(width, 9);
  return b;
}

function postDir(files) {
  const dir = mkdtempSync(join(tmpdir(), 'igpost-'));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content);
  return dir;
}

// A throwaway repo with <product>/instagram/<name>/ folders.
function fakeRepo(t, posts) {
  const root = mkdtempSync(join(tmpdir(), 'igrepo-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const dirs = {};
  for (const [name, files] of Object.entries(posts)) {
    const dir = join(root, 'demo.id', 'instagram', name);
    mkdirSync(dir, { recursive: true });
    for (const [f, content] of Object.entries(files)) writeFileSync(join(dir, f), content);
    dirs[name] = dir;
  }
  return { root, dirs };
}

const NOW = new Date('2026-10-23T03:00:00Z'); // Fri 23 Oct 2026, 10:00 WIB
const jpg = fakeJpeg(1080, 1350);

// ---------- checks ----------

test('reads PNG and JPEG sizes', () => {
  assert.deepEqual(imageSize(readFileSync(OG)), { width: 1200, height: 630, format: 'png' });
  assert.deepEqual(imageSize(fakeJpeg(1080, 1350)), { width: 1080, height: 1350, format: 'jpeg' });
  assert.equal(imageSize(Buffer.from('not an image')), null);
});

test('times default to WIB', () => {
  assert.equal(parseWhen('2026-10-28 19:00'), '2026-10-28T12:00:00.000Z');
  assert.equal(parseWhen('2026-10-28T19:00:00Z'), '2026-10-28T19:00:00.000Z');
  assert.throws(() => parseWhen('besok'));
});

test('caption drops comments and counts hashtags', () => {
  assert.equal(readCaption('<!-- note -->\nHalo\n\n\n\n#a #b'), 'Halo\n\n#a #b');
  assert.equal(countHashtags('#satu dua #tiga x#bukan'), 2);
});

test('a good post passes, PNG included', () => {
  const dir = postDir({ 'post.json': JSON.stringify({ at: '2026-10-28 19:00' }), 'caption.md': 'Halo #tes', '1.jpg': jpg, '2.png': readFileSync(OG) });
  const r = checkPost(loadPost(dir), { now: NOW });
  assert.deepEqual(r.errors, []);
  assert.equal(r.when, '2026-10-28T12:00:00.000Z');
  assert.match(r.warnings.join('\n'), /different ratios/);
});

test('limits are enforced', () => {
  const tags = Array.from({ length: 31 }, (_, i) => `#t${i}`).join(' ');
  const files = {
    'post.json': JSON.stringify({ at: '2026-10-28 19:00', status: 'later' }),
    'caption.md': 'a'.repeat(2201) + ' ' + tags,
    'tall.jpg': fakeJpeg(1080, 1920), // 9:16 is too tall for the feed
    'x.webp': 'not allowed',
  };
  for (let i = 0; i < 10; i++) files[`c${i}.jpg`] = fakeJpeg(1080, 1080);
  const r = checkPost(loadPost(postDir(files)), { now: NOW });
  const all = r.errors.join('\n');
  assert.match(all, /"status" must be one of/);
  assert.match(all, /characters/);
  assert.match(all, /31 hashtags/);
  assert.match(all, /at most 10/);
  assert.match(all, /tall\.jpg is 1080×1920/);
});

test('timing problems are warnings, not errors', () => {
  const past = checkPost(loadPost(postDir({ 'post.json': JSON.stringify({ at: '2026-10-01 10:00' }), 'caption.md': 'x', '1.jpg': jpg })), { now: NOW });
  assert.deepEqual(past.errors, []);
  assert.match(past.warnings.join('\n'), /has passed/);
  const far = checkPost(loadPost(postDir({ 'post.json': JSON.stringify({ at: '2027-06-01 10:00' }), 'caption.md': 'x', '1.jpg': jpg })), { now: NOW });
  assert.match(far.warnings.join('\n'), /more than 75 days/);
});

// ---------- queue page ----------

test('the queue lists ready posts by week, soonest first', (t) => {
  const { dirs } = fakeRepo(t, {
    b: { 'post.json': JSON.stringify({ at: '2026-11-03 09:00' }), 'caption.md': 'Kedua', '1.jpg': jpg },
    a: { 'post.json': JSON.stringify({ at: '2026-10-28 19:00' }), 'caption.md': 'Pertama ```kode```', '1.jpg': jpg, '2.jpg': jpg },
    old: { 'post.json': JSON.stringify({ at: '2026-10-20 19:00' }), 'caption.md': 'Lewat', '1.jpg': jpg },
    draft: { 'post.json': JSON.stringify({ at: '2026-10-29 19:00', status: 'draft' }), '1.jpg': jpg },
    done: { 'post.json': JSON.stringify({ at: '2026-10-30 19:00', status: 'scheduled' }), '1.jpg': jpg },
    bad: { 'post.json': JSON.stringify({ at: '2026-10-31 19:00' }), '1.jpg': fakeJpeg(1080, 1920) },
  });
  const md = buildQueue(Object.values(dirs), { now: NOW, repo: 'me/repo' });

  // Order: missed first, then by week.
  const order = ['## Missed', 'Lewat', '## Week of Mon 26 Oct 2026', 'Wed 28 Oct 2026, 19:00 WIB', 'Pertama', '## Week of Mon 2 Nov 2026', 'Tue 3 Nov 2026, 09:00 WIB', 'Kedua', '## Needs fixing'];
  let at = -1;
  for (const s of order) {
    const i = md.indexOf(s);
    assert.ok(i > at, `"${s}" out of order`);
    at = i;
  }
  assert.doesNotMatch(md, /draft|demo\.id\/instagram\/done/);
  assert.match(md, /demo\.id\/instagram\/bad`: 1\.jpg is 1080×1920/);
  assert.match(md, /· demo\.id\n/);
  // Images in order with download links, and a caption block that survives backticks.
  assert.match(md, /1\. \[Download 1\.jpg\]\(https:\/\/raw\.githubusercontent\.com\/me\/repo\/main\/.*\/a\/1\.jpg\)/);
  assert.match(md, /2\. \[Download 2\.jpg\]/);
  assert.match(md, /````text\nPertama ```kode```\n````/);
});

test('an empty queue says so', () => {
  assert.match(buildQueue([], { now: NOW, repo: null }), /Nothing to schedule right now/);
});

test('done marks a post scheduled and keeps its other fields', (t) => {
  const { dirs } = fakeRepo(t, { p: { 'post.json': JSON.stringify({ at: '2026-10-28 19:00' }), '1.jpg': jpg } });
  const r = spawnSync(process.execPath, [CLI, 'done', dirs.p], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(readFileSync(join(dirs.p, 'post.json'), 'utf8')), { at: '2026-10-28 19:00', status: 'scheduled' });
});
