# Instagram posting through Postiz

Put an image and a caption in a folder, run one command, and the post is scheduled on
Instagram through [Postiz](https://postiz.com). No dependencies: plain Node 20+.

## One-time setup

1. **Instagram account.** It must be a Business or Creator account (Instagram app →
   Settings → Account type). Personal accounts cannot be posted to through the API.
2. **Connect it in Postiz.** In Postiz: Add Channel → Instagram. Do this once per account.
3. **API key.** In Postiz: Settings → Public API → copy the key. Make it available as an
   environment variable, never in a file in this repo:
   ```bash
   export POSTIZ_API_KEY=...
   # Only for a self-hosted Postiz (its backend URL, often ending in /api):
   export POSTIZ_API_URL=https://postiz.example.com/api
   ```
4. **Map account names to Postiz ids.** Run
   ```bash
   npm run ig -- accounts
   ```
   and copy each id into [`accounts.json`](accounts.json) next to the name you want to use
   (`ngaturduit`, `cariinkerja`, `aiburnout`, or add your own). These ids are not secret.

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
  "account": "ngaturduit",
  "at": "2026-10-28 19:00",
  "type": "post",
  "status": "schedule"
}
```

| Field | Meaning |
|---|---|
| `account` | A name from `accounts.json`. |
| `at` | When to publish. Read as **WIB** unless you add an offset (`2026-10-28T19:00:00+08:00`). |
| `type` | `post` (feed, default) or `story` (one 9:16 image, no caption). |
| `status` | `schedule` (default) to queue it, or `draft` to only save it in Postiz for review. |
| `images` | Optional list of image paths relative to the folder, if you want to reuse an image from elsewhere (see the example). Without it, every image in the folder is used. |

In `caption.md`, `<!-- comments -->` are notes to yourself and are not sent.

[`ngaturduit.my.id/instagram/2099-01-01-contoh`](../../ngaturduit.my.id/instagram/2099-01-01-contoh)
is a complete example (a draft dated 2099, so it is harmless).

## Commands

```bash
npm run ig -- list                       # every post folder and whether it was sent
npm run ig -- check    <folder>          # offline check against Instagram's limits
npm run ig -- schedule <folder> --dry-run   # full check incl. Postiz rules, sends nothing
npm run ig -- schedule <folder> --draft     # save in Postiz as a draft to preview
npm run ig -- schedule <folder>             # upload images and schedule
npm test                                    # run the tests
```

`schedule` does, in order:

1. Reads the account's rules from Postiz and checks the post against them.
2. Checks the post: caption ≤ 2,200 characters, ≤ 30 hashtags, ≤ 20 @mentions, 1–10
   images, each ≤ 8 MB, feed ratio between 4:5 and 1.91:1, publish time at least 5 minutes ahead.
   Any problem stops it before anything is sent.
3. Uploads each image to Postiz (Instagram only accepts media hosted by Postiz).
4. Creates the post and writes `.postiz.json` (a receipt) into the folder.

**Commit the receipt.** A folder with a `.postiz.json` is skipped next time, so the same post
is never scheduled twice. Use `--force` to send it again on purpose (for example after
deleting the post in Postiz).

To change or cancel a scheduled post, do it in the Postiz app, then delete `.postiz.json` if
you want to send the folder again.

## Notes

- JPEG is the safest format. PNG and WebP get a warning: Instagram's API is built around JPEG,
  so if a post fails to publish, export the image as `.jpg`.
- The first time, schedule with `--draft` and look at the preview in Postiz to make sure
  line breaks in the caption come through the way you want.
