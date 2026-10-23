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
    'post.json': JSON.stringify({ account: 'x', at: FUTURE }),
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
    'post.json': JSON.stringify({ account: 'x', at: '2020-01-01 10:00' }),
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

test('a story takes one image and ignores the caption', () => {
  const dir = postDir({
    'post.json': JSON.stringify({ account: 'x', at: FUTURE, type: 'story' }),
    'caption.md': 'ignored',
    'a.jpg': fakeJpeg(1080, 1920),
  });
  const r = checkPost(loadPost(dir));
  assert.deepEqual(r.errors, []);
  assert.match(r.warnings.join('\n'), /Stories do not show a caption/);
});

// Runs the real CLI against a fake Postiz server and checks what it sends.
test('schedule uploads, creates the post, and writes a receipt', async (t) => {
  const calls = [];
  const server = createServer((req, res) => {
    let body = [];
    req.on('data', (c) => body.push(c));
    req.on('end', () => {
      body = Buffer.concat(body);
      calls.push({ method: req.method, url: req.url, auth: req.headers.authorization, body });
      res.setHeader('Content-Type', 'application/json');
      if (req.url.startsWith('/public/v1/integration-settings/')) {
        return res.end(JSON.stringify({ output: { maxLength: 2200, rules: 'test rule', settings: { properties: { post_type: { enum: ['post', 'story'] } } } } }));
      }
      if (req.url === '/public/v1/upload') return res.end(JSON.stringify({ id: 'm1', path: 'https://uploads.postiz.test/a.jpg' }));
      if (req.url === '/public/v1/posts') return res.end(JSON.stringify([{ postId: 'p1', integration: 'ig-1' }]));
      res.statusCode = 404; res.end('{}');
    });
  });
  await new Promise((r) => server.listen(0, r));
  t.after(() => server.close());

  // The CLI reads accounts.json next to itself, so run a copy in a temp folder.
  const root = mkdtempSync(join(tmpdir(), 'igrepo-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'tools', 'instagram'), { recursive: true });
  for (const f of ['instagram.mjs', 'lib.mjs']) copyFileSync(join(HERE, f), join(root, 'tools', 'instagram', f));
  writeFileSync(join(root, 'tools', 'instagram', 'accounts.json'), JSON.stringify({ demo: 'ig-1' }));
  const post = join(root, 'demo', 'instagram', 'p');
  mkdirSync(post, { recursive: true });
  writeFileSync(join(post, 'post.json'), JSON.stringify({ account: 'demo', at: FUTURE }));
  writeFileSync(join(post, 'caption.md'), 'Halo\n\nbaris dua');
  writeFileSync(join(post, '1.jpg'), fakeJpeg(1080, 1350));

  const run = () => new Promise((resolve) => {
    const p = spawn(process.execPath, [join(root, 'tools', 'instagram', 'instagram.mjs'), 'schedule', post], {
      env: { ...process.env, POSTIZ_API_KEY: 'k123', POSTIZ_API_URL: `http://127.0.0.1:${server.address().port}` },
    });
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (out += d));
    p.on('close', (code) => resolve({ code, out }));
  });

  const first = await run();
  assert.equal(first.code, 0, first.out);
  assert.deepEqual(calls.map((c) => c.url), ['/public/v1/integration-settings/ig-1', '/public/v1/upload', '/public/v1/posts']);
  assert.ok(calls.every((c) => c.auth === 'k123'));

  const upload = calls[1].body.toString('latin1');
  assert.match(upload, /name="file"; filename="1\.jpg"/);
  assert.match(upload, /Content-Type: image\/jpeg/);

  const sent = JSON.parse(calls[2].body.toString());
  assert.equal(sent.type, 'schedule');
  assert.equal(sent.date, '2099-01-01T12:00:00.000Z');
  assert.deepEqual(sent.posts[0].integration, { id: 'ig-1' });
  assert.deepEqual(sent.posts[0].settings, { post_type: 'post' });
  assert.equal(sent.posts[0].value[0].content, 'Halo\n\nbaris dua');
  assert.deepEqual(sent.posts[0].value[0].image, [{ id: 'm1', path: 'https://uploads.postiz.test/a.jpg' }]);

  const receipt = JSON.parse(readFileSync(join(post, '.postiz.json'), 'utf8'));
  assert.deepEqual(receipt.postIds, ['p1']);

  // A second run must not send it again.
  const second = await run();
  assert.equal(second.code, 0, second.out);
  assert.match(second.out, /already sent/);
  assert.equal(calls.length, 3);
});
