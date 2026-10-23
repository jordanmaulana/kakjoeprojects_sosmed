# Instagram posting

Posts are prepared in this repo and scheduled by hand in the Instagram app. All products
share **one Instagram account**.

- Each post is a folder with its images, caption and time.
- Every PR checks the posts against Instagram's limits.
- [`instagram-queue.md`](../../instagram-queue.md) lists every post that is ready and not
  yet scheduled, soonest first. Each entry has image downloads, a caption you can copy, and
  the time. It updates itself when posts change on `main`, and every morning at 06:00 WIB.
- Once a week, open the queue on your phone and schedule that week's posts in Instagram
  (about 10 minutes). Instagram then publishes them on time by itself.

No Meta developer app, tokens or third-party service. Instagram's built-in scheduler needs a
**Business or Creator** account (Instagram → Settings → Account type and tools), and can
schedule up to 75 days ahead.

## Making a post

Create a folder under the product, named by date and a short slug:

```
ngaturduit.my.id/instagram/2026-10-28-naik-level/
├── 1.jpg          # one image = single post; 2–10 images = carousel, in file-name order
├── 2.jpg
├── caption.md     # the caption, exactly as it should appear
└── post.json
```

`post.json`:

```json
{
  "at": "2026-10-28 19:00",
  "status": "ready"
}
```

| Field | Meaning |
|---|---|
| `at` | When it should go out. Read as **WIB** unless you add an offset (`2026-10-28T19:00:00+08:00`). |
| `status` | `ready` (default): shows in the queue. `draft`: still being worked on, hidden. `scheduled`: already queued in the Instagram app, hidden. |
| `images` | Optional list of image paths relative to the folder. Without it, every `.jpg`/`.png` in the folder is used. |

In `caption.md`, `<!-- comments -->` are notes to yourself and don't appear in the queue.

Images: `.jpg` or `.png`, at least 1080px wide, between 4:5 portrait (1080×1350) and
1.91:1 landscape (1080×566). 1080×1080 always works. In a carousel, use the same ratio for
every image.

[`ngaturduit.my.id/instagram/2099-01-01-contoh`](../../ngaturduit.my.id/instagram/2099-01-01-contoh)
is a complete example. It's a draft, so it never shows in the queue.

## Scheduling the week

For each post in [`instagram-queue.md`](../../instagram-queue.md):

1. Tap each **Download** link and save the image to your phone.
2. In Instagram, tap **+ → Post** and pick the images in the order listed. Tap **Next**.
3. Copy the caption block (GitHub shows a copy button on it) and paste it.
4. Open **More options → Schedule this post** (called Advanced settings in some app
   versions), set the date and time, and tap **Schedule**.
5. Mark it done so it leaves the queue: tell Claude which posts you scheduled, or set
   `"status": "scheduled"` in the post's `post.json`, or run `npm run ig -- done <folder>`.

To change or cancel a post you've already scheduled, open **Scheduled content** from the
menu on your Instagram profile.

## Checks

Every PR runs the **Test** check, which stops the PR if a post has:

- a caption over 2,200 characters, more than 30 hashtags or more than 20 @mentions
- no image, more than 10 images, an image over 8 MB, or an image Instagram would crop
- a missing or invalid `at`, or an unknown `status`

It warns (without failing) when `at` has passed for a post still marked `ready`, when `at`
is more than 75 days away, or when an image is under 1080px wide.

## Commands

```bash
npm run ig -- list                  # every post folder and its status
npm run ig -- check [<folder>]      # check posts (all of them by default)
npm run ig -- queue                 # print the queue page
npm run ig -- queue --write         # save it to instagram-queue.md
npm run ig -- done <folder>...      # mark posts as scheduled
npm test
```
