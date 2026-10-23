import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { imageSize, parseWhen, readCaption, countHashtags, loadPost, checkPost } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OG = join(HERE, '..', '..', 'ngaturduit.my.id', 'product_knowledge', 'og.png');

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

const FUTURE = '2099-01-01 19:00';

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

test('a good feed post passes', () => {
  const dir = postDir({
    'post.json': JSON.stringify({ at: FUTURE }),
    'caption.md': 'Halo #tes',
    '1.jpg': fakeJpeg(1080, 1350),
  });
  const r = checkPost(loadPost(dir));
  assert.deepEqual(r.errors, []);
  assert.equal(r.when, '2099-01-01T12:00:00.000Z');
});

test('limits are enforced', () => {
  const tags = Array.from({ length: 31 }, (_, i) => `#t${i}`).join(' ');
  const files = {
    'post.json': JSON.stringify({ at: '2020-01-01 10:00' }),
    'caption.md': 'a'.repeat(2201) + ' ' + tags,
    'tall.jpg': fakeJpeg(1080, 1920), // 9:16 is too tall for the feed
  };
  for (let i = 0; i < 10; i++) files[`c${i}.jpg`] = fakeJpeg(1080, 1080);
  const r = checkPost(loadPost(postDir(files)));
  const all = r.errors.join('\n');
  assert.match(all, /in the past/);
  assert.match(all, /characters/);
  assert.match(all, /31 hashtags/);
  assert.match(all, /at most 10/);
  assert.match(all, /tall\.jpg is 1080×1920/);
});

test('PNG is refused because Instagram only takes JPEG', () => {
  const dir = postDir({ 'post.json': JSON.stringify({ at: FUTURE }), 'a.png': readFileSync(OG) });
  assert.match(checkPost(loadPost(dir)).errors.join('\n'), /only takes JPEG/);
});

test('a story takes one image and ignores the caption', () => {
  const dir = postDir({
    'post.json': JSON.stringify({ at: FUTURE, type: 'story' }),
    'caption.md': 'ignored',
    'a.jpg': fakeJpeg(1080, 1920),
  });
  const r = checkPost(loadPost(dir));
  assert.deepEqual(r.errors, []);
  assert.match(r.warnings.join('\n'), /Stories do not show a caption/);
});

// ---------- publishing against a fake Instagram ----------

// A fake graph.instagram.com that also serves the images. Records every call.
async function fakeInstagram(t) {
  const calls = [];
  let next = 1;
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const url = new URL(req.url, 'http://x');
      const params = Object.fromEntries(req.method === 'POST' ? new URLSearchParams(body) : url.searchParams);
      calls.push({ method: req.method, path: url.pathname, params });
      const json = (o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
      if (url.pathname.startsWith('/img/')) { res.setHeader('Content-Type', 'image/jpeg'); return res.end(); }
      if (url.pathname === '/refresh_access_token') return json({ access_token: 'new-token', expires_in: 5184000 });
      if (params.access_token !== 'tok-demo') { res.statusCode = 400; return json({ error: { message: 'bad token' } }); }
      if (url.pathname === '/v23.0/me') return json({ user_id: '1784', username: 'demo_ig' });
      if (url.pathname === '/v23.0/1784/media') return json({ id: `c${next++}` });
      if (url.pathname === '/v23.0/1784/media_publish') return json({ id: 'm99' });
      if (/^\/v23\.0\/c\d+$/.test(url.pathname)) return json({ status_code: 'FINISHED' });
      if (url.pathname === '/v23.0/m99') return json({ permalink: 'https://www.instagram.com/p/abc/' });
      res.statusCode = 404; json({ error: { message: 'not found' } });
    });
  });
  await new Promise((r) => server.listen(0, r));
  t.after(() => server.close());
  return { calls, base: `http://127.0.0.1:${server.address().port}` };
}

// A throwaway copy of the repo layout, so the CLI finds posts under */instagram/.
function fakeRepo(t, posts) {
  const root = mkdtempSync(join(tmpdir(), 'igrepo-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'tools', 'instagram'), { recursive: true });
  for (const f of ['instagram.mjs', 'lib.mjs']) copyFileSync(join(HERE, f), join(root, 'tools', 'instagram', f));
  for (const [name, files] of Object.entries(posts)) {
    const dir = join(root, 'demo', 'instagram', name);
    mkdirSync(dir, { recursive: true });
    for (const [f, content] of Object.entries(files)) writeFileSync(join(dir, f), content);
  }
  return root;
}

function run(root, args, ig) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [join(root, 'tools', 'instagram', 'instagram.mjs'), ...args], {
      cwd: root,
      env: { PATH: process.env.PATH, IG_TOKEN: 'tok-demo', IG_API_BASE: ig.base, IMAGE_BASE_URL: `${ig.base}/img`, IG_POLL_MS: '1' },
    });
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (out += d));
    p.on('close', (code) => resolve({ code, out }));
  });
}

const iso = (msFromNow) => new Date(Date.now() + msFromNow).toISOString();

test('publish --due publishes only due posts, once', async (t) => {
  const ig = await fakeInstagram(t);
  const jpg = fakeJpeg(1080, 1350);
  const root = fakeRepo(t, {
    due: { 'post.json': JSON.stringify({ at: iso(-60e3) }), 'caption.md': 'Halo\n\nbaris dua', '1.jpg': jpg },
    later: { 'post.json': JSON.stringify({ at: iso(3600e3) }), '1.jpg': jpg },
    draft: { 'post.json': JSON.stringify({ at: iso(-60e3), status: 'draft' }), '1.jpg': jpg },
    stale: { 'post.json': JSON.stringify({ at: iso(-48 * 3600e3) }), '1.jpg': jpg },
  });

  const first = await run(root, ['publish', '--due'], ig);
  assert.equal(first.code, 0, first.out);
  assert.match(first.out, /1 published, 0 failed/);
  assert.match(first.out, /stale: "at" is more than 24 hours ago/); // warned, not published

  const posts = calls(ig).filter((c) => c.method === 'POST');
  assert.deepEqual(posts.map((c) => c.path), ['/v23.0/1784/media', '/v23.0/1784/media_publish']);
  assert.deepEqual(posts[0].params, {
    image_url: `${ig.base}/img/demo/instagram/due/1.jpg`,
    caption: 'Halo\n\nbaris dua',
    access_token: 'tok-demo',
  });
  assert.equal(posts[1].params.creation_id, 'c1');

  const receipt = JSON.parse(readFileSync(join(root, 'demo', 'instagram', 'due', '.instagram.json'), 'utf8'));
  assert.equal(receipt.mediaId, 'm99');
  assert.equal(receipt.permalink, 'https://www.instagram.com/p/abc/');
  for (const name of ['later', 'draft', 'stale']) assert.ok(!existsSync(join(root, 'demo', 'instagram', name, '.instagram.json')), name);

  // Running again publishes nothing new.
  const before = ig.calls.length;
  const second = await run(root, ['publish', '--due'], ig);
  assert.match(second.out, /0 published/);
  assert.equal(ig.calls.filter((c, i) => i >= before && c.method === 'POST').length, 0);
});

function calls(ig) { return ig.calls.filter((c) => !c.path.startsWith('/img/')); }

test('a carousel creates one container per image, then the carousel', async (t) => {
  const ig = await fakeInstagram(t);
  const root = fakeRepo(t, {
    c: {
      'post.json': JSON.stringify({ at: iso(-60e3) }),
      'caption.md': 'Geser',
      '1.jpg': fakeJpeg(1080, 1080),
      '2.jpg': fakeJpeg(1080, 1080),
    },
  });
  const r = await run(root, ['publish', join(root, 'demo', 'instagram', 'c')], ig);
  assert.equal(r.code, 0, r.out);
  const media = ig.calls.filter((c) => c.method === 'POST' && c.path.endsWith('/media'));
  assert.equal(media.length, 3);
  assert.equal(media[0].params.is_carousel_item, 'true');
  assert.equal(media[1].params.is_carousel_item, 'true');
  assert.deepEqual({ ...media[2].params, access_token: undefined }, { media_type: 'CAROUSEL', children: 'c1,c2', caption: 'Geser', access_token: undefined });
});

test('a post that is not due is left alone unless --now', async (t) => {
  const ig = await fakeInstagram(t);
  const root = fakeRepo(t, { s: { 'post.json': JSON.stringify({ at: iso(3600e3), type: 'story' }), '1.jpg': fakeJpeg(1080, 1920) } });
  const dir = join(root, 'demo', 'instagram', 's');

  const waiting = await run(root, ['publish', dir], ig);
  assert.match(waiting.out, /not due yet/);
  assert.equal(ig.calls.filter((c) => c.method === 'POST').length, 0);

  const now = await run(root, ['publish', dir, '--now'], ig);
  assert.equal(now.code, 0, now.out);
  const media = ig.calls.find((c) => c.method === 'POST' && c.path.endsWith('/media'));
  assert.equal(media.params.media_type, 'STORIES');
  assert.equal(media.params.caption, undefined);
});

test('refresh prints a new token', async (t) => {
  const ig = await fakeInstagram(t);
  const root = fakeRepo(t, {});
  const r = await run(root, ['refresh'], ig);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /IG_TOKEN refreshed \(valid 60 more days\)/);
  assert.match(r.out, /new-token/);
});
