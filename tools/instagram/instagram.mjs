#!/usr/bin/env node
// Publish Instagram posts (image(s) + caption) straight through Instagram's own API.
//
//   node tools/instagram/instagram.mjs accounts
//   node tools/instagram/instagram.mjs list
//   node tools/instagram/instagram.mjs check   <post-folder>...
//   node tools/instagram/instagram.mjs publish <post-folder>... [--now] [--dry-run]
//   node tools/instagram/instagram.mjs publish --due [--dry-run]
//   node tools/instagram/instagram.mjs refresh [--update-github-secrets]
//
// Each account needs a token in IG_TOKEN_<ACCOUNT> (e.g. IG_TOKEN_NGATURDUIT).
// Instagram downloads the images itself, from GitHub's public raw links.
// See tools/instagram/README.md.

import { writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative, dirname, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { loadPost, checkPost, RECEIPT } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const MAX_LATE_HOURS = 24; // a post more than this late is skipped, not published
const POLL_MS = Number(process.env.IG_POLL_MS || 3000);
const POLL_TRIES = 40; // about 2 minutes

// ---------- Instagram Graph API ----------

const API_BASE = (process.env.IG_API_BASE || 'https://graph.instagram.com').replace(/\/+$/, '');
const API_VERSION = process.env.IG_API_VERSION || 'v23.0';

function tokenEnvName(account) {
  return `IG_TOKEN_${account.toUpperCase()}`;
}

function tokenFor(account) {
  const name = tokenEnvName(account);
  const token = process.env[name];
  if (!token) throw new Error(`${name} is not set. Add the token for "${account}" (see tools/instagram/README.md).`);
  return token;
}

async function graph(token, method, path, params = {}) {
  const url = new URL(`${API_BASE}/${API_VERSION}/${path.replace(/^\//, '')}`);
  const init = { method };
  if (method === 'GET') {
    for (const [k, v] of Object.entries({ ...params, access_token: token })) url.searchParams.set(k, v);
  } else {
    init.body = new URLSearchParams({ ...params, access_token: token });
  }
  const res = await fetch(url, init);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok || data.error) {
    const e = data.error || {};
    throw new Error(`Instagram ${method} ${path} failed (${res.status}): ${e.message || text.slice(0, 300)}${e.error_user_msg ? ` ${e.error_user_msg}` : ''}`);
  }
  return data;
}

async function whoAmI(token) {
  const me = await graph(token, 'GET', 'me', { fields: 'user_id,username' });
  return { id: me.user_id || me.id, username: me.username };
}

// Create a media container, then wait until Instagram has fetched and processed it.
async function createContainer(token, igId, params) {
  const { id } = await graph(token, 'POST', `${igId}/media`, params);
  for (let i = 0; i < POLL_TRIES; i++) {
    const c = await graph(token, 'GET', id, { fields: 'status_code,status' });
    if (c.status_code === 'FINISHED') return id;
    if (c.status_code === 'ERROR' || c.status_code === 'EXPIRED') {
      throw new Error(`Instagram could not process the media (${c.status_code}${c.status ? `: ${c.status}` : ''}).`);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  throw new Error('Instagram took too long to process the media. Try again later.');
}

// ---------- image URLs ----------

function git(...args) {
  return execFileSync('git', args, { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

// Where Instagram can download the images from: GitHub's raw link at a fixed commit.
function imageUrlBase() {
  if (process.env.IMAGE_BASE_URL) return process.env.IMAGE_BASE_URL.replace(/\/+$/, '');
  if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_SHA) {
    return `https://raw.githubusercontent.com/${process.env.GITHUB_REPOSITORY}/${process.env.GITHUB_SHA}`;
  }
  const remote = git('remote', 'get-url', 'origin');
  const m = remote.match(/github\.com[:/]([^/]+\/[^/]+?)(\.git)?$/) || remote.match(/\/git\/([^/]+\/[^/]+?)(\.git)?$/);
  if (!m) throw new Error(`Cannot tell the GitHub repo from origin (${remote}). Set IMAGE_BASE_URL.`);
  const sha = git('rev-parse', 'HEAD');
  if (!git('branch', '-r', '--contains', sha)) throw new Error('This commit is not pushed yet, so GitHub cannot serve the images. Push first.');
  return `https://raw.githubusercontent.com/${m[1]}/${sha}`;
}

function imageUrl(base, path) {
  const rel = relative(REPO, path).split(sep).join('/');
  if (!process.env.IMAGE_BASE_URL && !process.env.GITHUB_SHA) {
    // Locally: the file must be committed exactly as it is on disk.
    try { git('ls-files', '--error-unmatch', rel); } catch { throw new Error(`${rel} is not committed. Commit and push it first.`); }
    try { git('diff', '--quiet', 'HEAD', '--', rel); } catch { throw new Error(`${rel} has changes that are not committed.`); }
  }
  return `${base}/${rel.split('/').map(encodeURIComponent).join('/')}`;
}

async function checkUrl(url) {
  const res = await fetch(url, { method: 'HEAD' });
  const type = res.headers.get('content-type') || '';
  if (!res.ok) throw new Error(`Image is not reachable (${res.status}): ${url}`);
  if (!type.startsWith('image/jpeg')) throw new Error(`Image is served as "${type}", Instagram needs image/jpeg: ${url}`);
}

// ---------- helpers ----------

function rel(p) {
  return relative(process.cwd(), p) || '.';
}

function printCheck(post, result) {
  console.log(`\n${rel(post.dir)}`);
  console.log(`  account: ${post.account ?? '?'}   type: ${post.postType}   status: ${post.status}`);
  console.log(`  at: ${post.at ?? '?'}${result.when ? `  (UTC ${result.when})` : ''}`);
  console.log(`  images: ${post.images.map((i) => i.name || basename(i.path)).join(', ') || 'none'}`);
  console.log(`  caption: ${[...post.caption].length} chars`);
  if (post.receipt) console.log(`  already published: ${post.receipt.permalink || post.receipt.mediaId} on ${post.receipt.publishedAt}`);
  for (const w of result.warnings) console.log(`  ⚠ ${w}`);
  for (const e of result.errors) console.log(`  ✖ ${e}`);
  if (!result.errors.length) console.log('  ✔ ready');
}

// Every folder under <product>/instagram/ that has a post.json.
function findPostFolders() {
  const out = [];
  for (const product of readdirSync(REPO, { withFileTypes: true })) {
    if (!product.isDirectory() || product.name.startsWith('.') || ['tools', 'node_modules'].includes(product.name)) continue;
    const ig = join(REPO, product.name, 'instagram');
    if (!existsSync(ig)) continue;
    for (const d of readdirSync(ig, { withFileTypes: true })) {
      if (d.isDirectory() && existsSync(join(ig, d.name, 'post.json'))) out.push(join(ig, d.name));
    }
  }
  return out.sort();
}

// ---------- commands ----------

async function cmdAccounts() {
  const names = Object.keys(process.env).filter((k) => /^IG_TOKEN_[A-Z0-9_]+$/.test(k) && process.env[k]);
  if (!names.length) return console.log('No IG_TOKEN_<ACCOUNT> variables are set.');
  for (const name of names) {
    const account = name.slice('IG_TOKEN_'.length).toLowerCase();
    try {
      const me = await whoAmI(process.env[name]);
      console.log(`  ${account.padEnd(14)} @${me.username}  (id ${me.id})`);
    } catch (e) {
      console.log(`  ${account.padEnd(14)} ✖ ${e.message}`);
    }
  }
}

function cmdCheck(dirs) {
  if (!dirs.length) throw new Error('Give at least one post folder.');
  let bad = 0;
  for (const dir of dirs) {
    let post;
    try { post = loadPost(dir); } catch (e) { console.log(`\n${dir}\n  ✖ ${e.message}`); bad++; continue; }
    const result = checkPost(post, { requireFuture: !post.receipt });
    printCheck(post, result);
    if (result.errors.length) bad++;
  }
  if (bad) process.exitCode = 1;
}

function cmdList() {
  const folders = findPostFolders();
  if (!folders.length) return console.log('No post folders found under */instagram/.');
  for (const dir of folders) {
    try {
      const post = loadPost(dir);
      const state = post.receipt ? `published ${post.receipt.publishedAt}` : post.status === 'draft' ? 'draft (on hold)' : 'waiting';
      console.log(`${rel(dir).padEnd(55)} ${String(post.account).padEnd(14)} ${String(post.at).padEnd(18)} ${state}`);
    } catch (e) {
      console.log(`${rel(dir).padEnd(55)} ✖ ${e.message}`);
    }
  }
}

// Publish one post. Returns 'published' | 'skipped' and throws on failure.
async function publishOne(dir, { now, force, dryRun, base, quietSkip }) {
  const post = loadPost(dir);
  const skip = (why) => { if (!quietSkip) console.log(`\n${rel(post.dir)}\n  ↷ ${why}`); return 'skipped'; };

  if (post.receipt) return skip(`already published: ${post.receipt.permalink || post.receipt.mediaId}`);
  if (post.status === 'draft') return skip('status is "draft". Change it to "schedule" to publish.');

  const result = checkPost(post, { requireFuture: false });
  if (result.when && !force) {
    const lateMs = now - new Date(result.when);
    if (lateMs < 0) return skip(`not due yet (${post.at} WIB).`);
    if (lateMs > MAX_LATE_HOURS * 3600e3) {
      // Not an error: failing here would turn every run red until someone edits the post.
      const msg = `${rel(post.dir)}: "at" is more than ${MAX_LATE_HOURS} hours ago, so it was not published. Update "at", or publish it by hand with --now.`;
      console.log(process.env.GITHUB_ACTIONS ? `::warning::${msg}` : `\n⚠ ${msg}`);
      return 'skipped';
    }
  }
  printCheck(post, result);
  if (result.errors.length) throw new Error(`${rel(post.dir)} has problems. Nothing was published.`);

  const urls = post.images.map((img) => imageUrl(base, img.path));
  if (dryRun) {
    console.log(`  (dry run) would publish to "${post.account}" with:\n    ${urls.join('\n    ')}`);
    return 'skipped';
  }

  for (const u of urls) await checkUrl(u);
  const token = tokenFor(post.account);
  const me = await whoAmI(token);
  console.log(`  → @${me.username}`);

  let creationId;
  if (post.postType === 'story') {
    creationId = await createContainer(token, me.id, { media_type: 'STORIES', image_url: urls[0] });
  } else if (urls.length === 1) {
    creationId = await createContainer(token, me.id, { image_url: urls[0], caption: post.caption });
  } else {
    const children = [];
    for (const u of urls) children.push(await createContainer(token, me.id, { image_url: u, is_carousel_item: 'true' }));
    creationId = await createContainer(token, me.id, { media_type: 'CAROUSEL', children: children.join(','), caption: post.caption });
  }

  const { id: mediaId } = await graph(token, 'POST', `${me.id}/media_publish`, { creation_id: creationId });

  // Write the receipt straight away so a later failure can never cause a second post.
  const receipt = { mediaId, account: post.account, username: me.username, publishedAt: new Date().toISOString(), scheduledFor: result.when, images: urls };
  writeFileSync(join(post.dir, RECEIPT), JSON.stringify(receipt, null, 2) + '\n');
  try {
    const { permalink } = await graph(token, 'GET', mediaId, { fields: 'permalink' });
    receipt.permalink = permalink;
    writeFileSync(join(post.dir, RECEIPT), JSON.stringify(receipt, null, 2) + '\n');
  } catch { /* the post is live; the link is only nice to have */ }
  console.log(`  ✔ published ${receipt.permalink || mediaId}`);
  return 'published';
}

async function cmdPublish(dirs, flags) {
  const due = flags.due;
  if (!due && !dirs.length) throw new Error('Give a post folder, or --due to publish every post whose time has come.');
  const folders = due ? findPostFolders() : dirs;
  const base = imageUrlBase();
  const now = new Date();
  let published = 0, failed = 0;
  for (const dir of folders) {
    try {
      const r = await publishOne(dir, { now, force: flags.now, dryRun: flags.dryRun, base, quietSkip: due });
      if (r === 'published') published++;
    } catch (e) {
      failed++;
      console.error(`  ✖ ${e.message}`);
    }
  }
  console.log(`\n${published} published, ${failed} failed.`);
  if (failed) process.exitCode = 1;
}

// Long-lived tokens last 60 days. Refreshing gives a fresh 60 days.
async function cmdRefresh(flags) {
  const names = Object.keys(process.env).filter((k) => /^IG_TOKEN_[A-Z0-9_]+$/.test(k) && process.env[k]);
  if (!names.length) return console.log('No IG_TOKEN_<ACCOUNT> variables are set. Nothing to renew.');
  let failed = 0;
  for (const name of names) {
    try {
      const url = new URL(`${API_BASE}/refresh_access_token`);
      url.searchParams.set('grant_type', 'ig_refresh_token');
      url.searchParams.set('access_token', process.env[name]);
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data.access_token) throw new Error(data.error?.message || `HTTP ${res.status}`);
      const days = Math.round((data.expires_in || 0) / 86400);
      if (flags.updateGithubSecrets) {
        // The new token goes to gh on stdin, never to the log.
        execFileSync('gh', ['secret', 'set', name], { input: data.access_token, stdio: ['pipe', 'ignore', 'inherit'] });
        console.log(`✔ ${name} refreshed (valid ${days} more days) and saved to GitHub secrets.`);
      } else {
        console.log(`✔ ${name} refreshed (valid ${days} more days). New token:\n${data.access_token}`);
      }
    } catch (e) {
      failed++;
      console.error(`✖ ${name}: ${e.message}`);
    }
  }
  if (failed) process.exitCode = 1;
}

// ---------- main ----------

const [cmd, ...rest] = process.argv.slice(2);
const flags = {
  now: rest.includes('--now'),
  due: rest.includes('--due'),
  dryRun: rest.includes('--dry-run'),
  updateGithubSecrets: rest.includes('--update-github-secrets'),
};
const dirs = rest.filter((a) => !a.startsWith('--'));

try {
  switch (cmd) {
    case 'accounts': await cmdAccounts(); break;
    case 'list': cmdList(); break;
    case 'check': cmdCheck(dirs); break;
    case 'publish': await cmdPublish(dirs, flags); break;
    case 'refresh': await cmdRefresh(flags); break;
    default:
      console.log(`Usage:
  node tools/instagram/instagram.mjs accounts               show which Instagram account each token belongs to
  node tools/instagram/instagram.mjs list                   list post folders and their state
  node tools/instagram/instagram.mjs check <folder>...      check posts against Instagram's limits (offline)
  node tools/instagram/instagram.mjs publish <folder>...    publish posts whose time has come
      --now        publish now even if "at" is later (or long past)
      --dry-run    check everything, publish nothing
  node tools/instagram/instagram.mjs publish --due          publish every due post in the repo (used by the GitHub Action)
  node tools/instagram/instagram.mjs refresh                renew the 60-day tokens
      --update-github-secrets   save the new tokens with "gh secret set"`);
      if (cmd) process.exitCode = 1;
  }
} catch (e) {
  console.error(`✖ ${e.message}`);
  process.exitCode = 1;
}
