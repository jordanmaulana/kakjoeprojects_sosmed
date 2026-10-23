#!/usr/bin/env node
// Schedule an Instagram post (image(s) + caption) through Postiz.
//
//   node tools/instagram/instagram.mjs accounts
//   node tools/instagram/instagram.mjs check    <post-folder>...
//   node tools/instagram/instagram.mjs schedule <post-folder>... [--draft] [--dry-run] [--force]
//   node tools/instagram/instagram.mjs list
//
// Needs POSTIZ_API_KEY for accounts/schedule. POSTIZ_API_URL is optional
// (defaults to Postiz cloud; set it for a self-hosted Postiz).
// See tools/instagram/README.md.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPost, checkPost, RECEIPT } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');
const ACCOUNTS_FILE = join(HERE, 'accounts.json');

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

// ---------- Postiz API ----------

function api() {
  const key = process.env.POSTIZ_API_KEY;
  if (!key) fail('POSTIZ_API_KEY is not set. Create one in Postiz under Settings → Public API.');
  const base = (process.env.POSTIZ_API_URL || 'https://api.postiz.com').replace(/\/+$/, '');

  async function request(path, init = {}) {
    const headers = { Authorization: key, ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...init.headers };
    const res = await fetch(base + path, { ...init, headers });
    const text = await res.text();
    if (!res.ok) throw new Error(`Postiz ${init.method || 'GET'} ${path} failed (${res.status}): ${text.slice(0, 500)}`);
    try { return JSON.parse(text); } catch { return text; }
  }

  return {
    integrations: () => request('/public/v1/integrations'),
    settings: (id) => request(`/public/v1/integration-settings/${id}`),
    upload: (buf, name) => {
      const form = new FormData();
      const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
      form.append('file', new Blob([buf], { type: MIME[ext] || 'application/octet-stream' }), name);
      return request('/public/v1/upload', { method: 'POST', body: form });
    },
    createPost: (body) => request('/public/v1/posts', { method: 'POST', body: JSON.stringify(body) }),
  };
}

// ---------- helpers ----------

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

function loadAccounts() {
  if (!existsSync(ACCOUNTS_FILE)) return {};
  return JSON.parse(readFileSync(ACCOUNTS_FILE, 'utf8'));
}

function rel(p) {
  return relative(process.cwd(), p) || '.';
}

function isInstagram(i) {
  return /instagram/i.test(i.identifier || i.providerIdentifier || '');
}

function printCheck(post, result) {
  console.log(`\n${rel(post.dir)}`);
  console.log(`  account: ${post.account ?? '?'}   type: ${post.postType}   status: ${post.status}`);
  console.log(`  at: ${post.at ?? '?'}${result.when ? `  (UTC ${result.when})` : ''}`);
  console.log(`  images: ${post.images.map((i) => i.name || basename(i.path)).join(', ') || 'none'}`);
  console.log(`  caption: ${[...post.caption].length} chars`);
  if (post.receipt) console.log(`  already scheduled: post ${post.receipt.postIds?.join(', ')} on ${post.receipt.scheduledAt}`);
  for (const w of result.warnings) console.log(`  ⚠ ${w}`);
  for (const e of result.errors) console.log(`  ✖ ${e}`);
  if (!result.errors.length) console.log('  ✔ ready');
}

// Every folder under <product>/instagram/ that has a post.json.
function findPostFolders() {
  const out = [];
  for (const product of readdirSync(REPO, { withFileTypes: true })) {
    if (!product.isDirectory() || product.name.startsWith('.') || product.name === 'tools' || product.name === 'node_modules') continue;
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
  const list = await api().integrations();
  const all = Array.isArray(list) ? list : list.integrations || [];
  const ig = all.filter(isInstagram);
  if (!ig.length) {
    console.log('No Instagram account is connected in Postiz yet. Connect one under Add Channel → Instagram.');
    return;
  }
  const accounts = loadAccounts();
  const byId = Object.fromEntries(Object.entries(accounts).map(([k, v]) => [v, k]));
  console.log('Instagram accounts in Postiz:\n');
  for (const i of ig) {
    const mapped = byId[i.id] ? `→ "${byId[i.id]}" in accounts.json` : '(not in accounts.json yet)';
    console.log(`  ${i.id}  ${i.name || ''} ${i.profile ? `@${i.profile}` : ''}  [${i.identifier}]${i.disabled ? ' DISABLED' : ''}  ${mapped}`);
  }
  console.log(`\nPut the id you want next to each account name in ${rel(ACCOUNTS_FILE)}.`);
}

function cmdCheck(dirs) {
  if (!dirs.length) fail('Give at least one post folder.');
  let bad = 0;
  const accounts = loadAccounts();
  for (const dir of dirs) {
    let post;
    try { post = loadPost(dir); } catch (e) { console.log(`\n${dir}\n  ✖ ${e.message}`); bad++; continue; }
    const result = checkPost(post);
    if (post.account && !accounts[post.account]) {
      result.errors.push(`Account "${post.account}" has no Postiz id in tools/instagram/accounts.json yet.`);
    }
    printCheck(post, result);
    if (result.errors.length) bad++;
  }
  if (bad) process.exit(1);
}

function cmdList() {
  const folders = findPostFolders();
  if (!folders.length) return console.log('No post folders found under */instagram/.');
  for (const dir of folders) {
    try {
      const post = loadPost(dir);
      const state = post.receipt ? `scheduled ${post.receipt.scheduledAt}` : 'not scheduled';
      console.log(`${rel(dir).padEnd(55)} ${String(post.account).padEnd(14)} ${String(post.at).padEnd(18)} ${state}`);
    } catch (e) {
      console.log(`${rel(dir).padEnd(55)} ✖ ${e.message}`);
    }
  }
}

async function cmdSchedule(dirs, flags) {
  if (!dirs.length) fail('Give at least one post folder.');
  const accounts = loadAccounts();
  const postiz = flags.dryRun ? null : api();
  const settingsCache = {};

  for (const dir of dirs) {
    const post = loadPost(dir);
    if (flags.draft) post.status = 'draft';

    if (post.receipt && !flags.force) {
      console.log(`\n${rel(post.dir)}\n  ↷ skipped: already sent to Postiz (post ${post.receipt.postIds?.join(', ')}). Use --force to send it again.`);
      continue;
    }

    const integrationId = accounts[post.account];
    if (!integrationId) fail(`${rel(post.dir)}: account "${post.account}" has no Postiz id in ${rel(ACCOUNTS_FILE)}. Run "accounts" to find it.`);

    // Read the account's rules from Postiz before posting. Settings that do not
    // apply are dropped silently by Postiz, so this is the place to catch them.
    let maxChars;
    if (postiz) {
      settingsCache[integrationId] ??= await postiz.settings(integrationId);
      const s = settingsCache[integrationId]?.output ?? settingsCache[integrationId] ?? {};
      if (typeof s.maxLength === 'number') maxChars = s.maxLength;
      if (s.rules) console.log(`\nPostiz rules for ${post.account}:\n  ${String(s.rules).split('\n').join('\n  ')}`);
      const postTypeField = s.settings?.properties?.post_type;
      const allowed = postTypeField?.enum || postTypeField?.anyOf?.map((o) => o.const).filter(Boolean);
      if (allowed?.length && !allowed.includes(post.postType)) {
        fail(`${rel(post.dir)}: Postiz does not accept post_type "${post.postType}" for this account (allowed: ${allowed.join(', ')}).`);
      }
    }

    const result = checkPost(post, maxChars ? { maxChars } : {});
    printCheck(post, result);
    if (result.errors.length) fail(`${rel(post.dir)} has problems. Nothing was sent.`);

    if (flags.dryRun) {
      console.log(`  (dry run) would ${post.status === 'draft' ? 'save a draft' : 'schedule'} for ${result.when} on ${post.account} (${integrationId}).`);
      continue;
    }

    // 1. Upload every image. Instagram only takes media hosted by Postiz.
    const uploaded = [];
    for (const img of post.images) {
      const res = await postiz.upload(readFileSync(img.path), img.name);
      if (!res?.path) fail(`Upload of ${img.name} returned no path: ${JSON.stringify(res)}`);
      console.log(`  ↑ uploaded ${img.name}`);
      uploaded.push({ id: res.id || Math.random().toString(36).slice(2, 10), path: res.path });
    }

    // 2. Create the post.
    const body = {
      type: post.status,
      date: result.when,
      shortLink: false,
      tags: [],
      posts: [{
        integration: { id: integrationId },
        value: [{ content: post.postType === 'story' ? '' : post.caption, image: uploaded }],
        // Postiz fills in the provider type from the integration id.
        settings: { post_type: post.postType },
      }],
    };
    const created = await postiz.createPost(body);
    const ids = (Array.isArray(created) ? created : [created]).map((p) => p?.postId || p?.id).filter(Boolean);

    // 3. Save a receipt so this folder is never sent twice.
    const receipt = {
      postIds: ids,
      group: (Array.isArray(created) ? created[0] : created)?.group,
      account: post.account,
      integrationId,
      status: post.status,
      scheduledAt: result.when,
      sentAt: new Date().toISOString(),
      media: uploaded.map((u) => u.path),
    };
    writeFileSync(join(post.dir, RECEIPT), JSON.stringify(receipt, null, 2) + '\n');
    console.log(`  ✔ ${post.status === 'draft' ? 'draft saved' : 'scheduled'} in Postiz (post ${ids.join(', ') || '?'}). Receipt: ${rel(join(post.dir, RECEIPT))}`);
  }
}

// ---------- main ----------

const [cmd, ...rest] = process.argv.slice(2);
const flags = {
  draft: rest.includes('--draft'),
  dryRun: rest.includes('--dry-run'),
  force: rest.includes('--force'),
};
const dirs = rest.filter((a) => !a.startsWith('--'));

try {
  switch (cmd) {
    case 'accounts': await cmdAccounts(); break;
    case 'check': cmdCheck(dirs); break;
    case 'list': cmdList(); break;
    case 'schedule': await cmdSchedule(dirs, flags); break;
    default:
      console.log(`Usage:
  node tools/instagram/instagram.mjs accounts                 list Instagram accounts connected in Postiz
  node tools/instagram/instagram.mjs list                     list post folders and whether they were sent
  node tools/instagram/instagram.mjs check <folder>...        check posts offline against Instagram's limits
  node tools/instagram/instagram.mjs schedule <folder>...     upload images and schedule in Postiz
      --draft     save as a draft in Postiz instead of scheduling
      --dry-run   check everything, send nothing
      --force     send again even if the folder has a receipt`);
      process.exit(cmd ? 1 : 0);
  }
} catch (e) {
  fail(e.message);
}
