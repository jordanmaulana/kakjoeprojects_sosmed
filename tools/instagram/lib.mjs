// Pure helpers for reading and checking an Instagram post folder.
// No network calls here, so everything in this file can be tested offline.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve, extname, basename } from 'node:path';

export const LIMITS = {
  captionChars: 2200,
  hashtags: 30,
  mentions: 20,
  carouselMax: 10,
  imageBytes: 8 * 1024 * 1024,
  // Feed images must sit between 4:5 portrait and 1.91:1 landscape.
  feedRatioMin: 4 / 5,
  feedRatioMax: 1.91,
  storyRatio: 9 / 16,
};

export const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
export const RECEIPT = '.instagram.json';
const DEFAULT_OFFSET = '+07:00'; // WIB

// Read width and height from a PNG, JPEG or WebP header.
export function imageSize(buf) {
  // PNG: signature, then IHDR with width and height as big-endian uint32.
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), format: 'png' };
  }
  // JPEG: walk the markers until a start-of-frame segment.
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const len = buf.readUInt16BE(i + 2);
      const isSOF = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isSOF) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7), format: 'jpeg' };
      }
      i += 2 + len;
    }
    return null;
  }
  // WebP: RIFF....WEBP then VP8 / VP8L / VP8X chunk.
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8X') {
      return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3), format: 'webp' };
    }
    if (chunk === 'VP8 ') {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff, format: 'webp' };
    }
    if (chunk === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1, format: 'webp' };
    }
  }
  return null;
}

// Turn "2026-10-28 19:00" (WIB unless an offset is given) into a UTC ISO string.
export function parseWhen(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('"at" is missing. Example: "2026-10-28 19:00" (WIB).');
  let s = value.trim().replace(' ', 'T');
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) s += ':00';
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(s)) s += DEFAULT_OFFSET;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error(`"at" is not a valid date: ${value}`);
  return d.toISOString();
}

// Caption file: drop HTML comments (notes to self) and trim.
export function readCaption(text) {
  return text.replace(/<!--[\s\S]*?-->/g, '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function countHashtags(caption) {
  return (caption.match(/(^|\s)#[\p{L}\p{N}_]+/gu) || []).length;
}

export function countMentions(caption) {
  return (caption.match(/(^|\s)@[A-Za-z0-9._]+/g) || []).length;
}

// Load a post folder into a plain object. Throws on anything unreadable.
export function loadPost(dir) {
  const root = resolve(dir);
  const metaPath = join(root, 'post.json');
  if (!existsSync(metaPath)) throw new Error(`No post.json in ${dir}`);
  let meta;
  try {
    meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  } catch (e) {
    throw new Error(`post.json in ${dir} is not valid JSON: ${e.message}`);
  }

  const captionPath = join(root, 'caption.md');
  const caption = existsSync(captionPath) ? readCaption(readFileSync(captionPath, 'utf8')) : '';

  // Images: listed in post.json (relative to the folder), or every image file in the folder by name.
  const imagePaths = Array.isArray(meta.images) && meta.images.length
    ? meta.images.map((p) => resolve(root, p))
    : readdirSync(root)
        .filter((f) => IMAGE_EXTS.includes(extname(f).toLowerCase()))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((f) => join(root, f));

  const images = imagePaths.map((path) => {
    if (!existsSync(path)) return { path, missing: true };
    const buf = readFileSync(path);
    return { path, name: basename(path), bytes: statSync(path).size, size: imageSize(buf) };
  });

  const receiptPath = join(root, RECEIPT);
  const receipt = existsSync(receiptPath) ? JSON.parse(readFileSync(receiptPath, 'utf8')) : null;

  return {
    dir: root,
    at: meta.at,
    postType: meta.type || 'post',
    status: meta.status || 'schedule',
    caption,
    images,
    receipt,
  };
}

// Check a loaded post against Instagram's limits.
// Returns { errors, warnings, when }. errors block scheduling; warnings do not.
// With requireFuture (the default) a time in the past is an error; the publisher
// turns it off because a due post is exactly what it is looking for.
export function checkPost(post, { now = new Date(), maxChars = LIMITS.captionChars, requireFuture = true } = {}) {
  const errors = [];
  const warnings = [];
  let when = null;

  if (!['post', 'story'].includes(post.postType)) errors.push(`"type" must be "post" or "story", got "${post.postType}".`);
  if (!['schedule', 'draft'].includes(post.status)) errors.push(`"status" must be "schedule" or "draft", got "${post.status}".`);

  try {
    when = parseWhen(post.at);
    if (requireFuture && new Date(when) <= now) {
      errors.push(`"at" (${post.at}) is in the past. It would go out on the next publish run.`);
    }
  } catch (e) {
    errors.push(e.message);
  }

  // Caption
  if (post.postType === 'post') {
    if (!post.caption) warnings.push('caption.md is empty. The post will go out with no caption.');
    if ([...post.caption].length > maxChars) errors.push(`Caption is ${[...post.caption].length} characters. The limit is ${maxChars}.`);
    const tags = countHashtags(post.caption);
    if (tags > LIMITS.hashtags) errors.push(`Caption has ${tags} hashtags. Instagram allows ${LIMITS.hashtags}.`);
    const mentions = countMentions(post.caption);
    if (mentions > LIMITS.mentions) errors.push(`Caption has ${mentions} @mentions. Instagram allows ${LIMITS.mentions}.`);
  } else if (post.caption) {
    warnings.push('Stories do not show a caption. caption.md will be ignored.');
  }

  // Images
  const n = post.images.length;
  if (n === 0) errors.push('No image found. Put a .jpg in the folder or list it under "images".');
  if (post.postType === 'post' && n > LIMITS.carouselMax) errors.push(`${n} images. A carousel holds at most ${LIMITS.carouselMax}.`);
  if (post.postType === 'story' && n > 1) errors.push(`A story takes one image, found ${n}.`);

  for (const img of post.images) {
    if (img.missing) { errors.push(`Image not found: ${img.path}`); continue; }
    if (!IMAGE_EXTS.includes(extname(img.path).toLowerCase())) { errors.push(`${img.name}: not an image Instagram takes (use .jpg).`); continue; }
    if (img.bytes > LIMITS.imageBytes) errors.push(`${img.name} is ${(img.bytes / 1048576).toFixed(1)} MB. The limit is 8 MB.`);
    if (!img.size) { errors.push(`${img.name}: could not read the image size. Is the file a real image?`); continue; }
    const { width, height, format } = img.size;
    const ratio = width / height;
    if (post.postType === 'post' && (ratio < LIMITS.feedRatioMin - 0.005 || ratio > LIMITS.feedRatioMax + 0.005)) {
      errors.push(`${img.name} is ${width}×${height} (ratio ${ratio.toFixed(2)}). Feed images must be between 4:5 (0.80) and 1.91:1.`);
    }
    if (post.postType === 'story' && Math.abs(ratio - LIMITS.storyRatio) > 0.02) {
      warnings.push(`${img.name} is ${width}×${height}. Stories look best at 9:16 (e.g. 1080×1920).`);
    }
    if (width < 320) warnings.push(`${img.name} is only ${width}px wide. Instagram will upscale it; 1080px is ideal.`);
    if (format !== 'jpeg') errors.push(`${img.name} is ${format.toUpperCase()}. Instagram's API only takes JPEG: export it as .jpg.`);
  }

  if (n > 1 && post.postType === 'post') {
    const ratios = post.images.filter((i) => i.size).map((i) => (i.size.width / i.size.height).toFixed(2));
    if (new Set(ratios).size > 1) warnings.push('Carousel images have different ratios. Instagram crops them all to the first one.');
  }

  return { errors, warnings, when };
}
