# Instagram posting

Put an image and a caption in a folder, merge it to `main`, and it is published on
Instagram at the time you set. It uses Instagram's own API directly, with no other
service in between. Plain Node 20+, no dependencies.

How it works:

- A GitHub Action ([`instagram-publish.yml`](../../.github/workflows/instagram-publish.yml))
  runs every 15 minutes and publishes every post folder whose time has come.
- Instagram downloads the images itself from GitHub's public raw links (this repo is
  public), pinned to the exact commit, so a later edit can't change a live post.
- After publishing, the Action commits a receipt (`.instagram.json`) into the folder, so the
  same post is never published twice.
- A second Action ([`instagram-refresh-token.yml`](../../.github/workflows/instagram-refresh-token.yml))
  renews the access tokens every Monday. Tokens expire after 60 days if they aren't renewed.

## One-time setup

### 1. Instagram account

It must be a **Business** or **Creator** account (Instagram app → Settings → Account type
and tools). A Facebook Page is not needed.

### 2. Meta developer app

1. Go to [developers.facebook.com](https://developers.facebook.com/apps) → **Create app**.
   Choose the use case for managing content on Instagram, and the **Business** app type.
2. In the app, open **App roles → Roles → Add people → Instagram Tester** and add the
   Instagram account. Accept the invite in Instagram (Settings → Apps and websites →
   Tester invites, or on instagram.com).
3. Open **Instagram → API setup with Instagram login → Generate access tokens**, add the
   account, and generate a token. It needs the `instagram_business_basic` and
   `instagram_business_content_publish` permissions. The token lasts 60 days.

The app can stay in **development mode**. That is enough for posting to accounts that are
testers on the app, so Meta's app review isn't needed. (Meta renames these menus from time
to time. If something isn't where it's described here, look for "Instagram API with
Instagram Login".)

### 3. GitHub secrets

In the repo: **Settings → Secrets and variables → Actions → New repository secret**.

| Secret | Value |
|---|---|
| `IG_TOKEN_NGATURDUIT` | The token for the Ngatur Duit account (same for `IG_TOKEN_CARIINKERJA`, `IG_TOKEN_AIBURNOUT`). Only add the ones you use. |
| `GH_SECRETS_TOKEN` | A [fine-grained GitHub token](https://github.com/settings/personal-access-tokens/new) for this repo only, with **Secrets: Read and write**. The weekly renewal uses it to save the new Instagram tokens. |

The account name in `post.json` decides which token is used: `"account": "ngaturduit"` →
`IG_TOKEN_NGATURDUIT`. For a new account, add its secret and add one line for it in both
workflow files.

To check a token locally: `IG_TOKEN_NGATURDUIT=... npm run ig -- accounts` prints which
Instagram account it belongs to.

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
| `account` | Which account to post to (see secrets above). |
| `at` | When to publish. Read as **WIB** unless you add an offset (`2026-10-28T19:00:00+08:00`). |
| `type` | `post` (feed, default) or `story` (one 9:16 image, no caption). |
| `status` | `schedule` (default) to publish at `at`, or `draft` to keep it on hold. |
| `images` | Optional list of image paths relative to the folder. Without it, every `.jpg` in the folder is used. |

In `caption.md`, `<!-- comments -->` are notes to yourself and are not published.

Images must be **JPEG**: Instagram's API doesn't take PNG or WebP. Feed images must be
between 4:5 portrait (1080×1350) and 1.91:1 landscape (1080×566). 1080×1080 is always safe.

[`ngaturduit.my.id/instagram/2099-01-01-contoh`](../../ngaturduit.my.id/instagram/2099-01-01-contoh)
is a complete example. It is a draft dated 2099, so it is never published.

Open a PR with the folder. The **Test** check validates every post (caption ≤ 2,200
characters, ≤ 30 hashtags, ≤ 20 @mentions, 1–10 JPEGs of ≤ 8 MB in the right ratio, time
in the future). Once merged, the post goes out on the first run after `at`.

## Timing

- GitHub runs scheduled Actions on a best-effort basis, so a post can go out a few minutes
  (sometimes 15–30) after `at`.
- A post more than 24 hours late is **not** published, so an old folder merged by mistake
  can't go out. The run shows a warning. Change `at`, or publish it by hand (below).
- GitHub pauses scheduled Actions in a repo with no commits for 60 days. If that happens,
  re-enable them under the Actions tab.

## Commands

```bash
npm run ig -- list                          # every post folder and its state
npm run ig -- check   <folder>              # check a post against Instagram's limits
npm run ig -- publish <folder> --dry-run    # show what would be published, publish nothing
npm run ig -- publish <folder> --now        # publish right now (folder must be committed and pushed)
npm run ig -- publish --due                 # what the Action runs
npm run ig -- refresh                       # renew tokens and print them
npm test
```

To publish from your own machine, set the token (`export IG_TOKEN_NGATURDUIT=...`), and
commit and push the folder first, because Instagram fetches the image from GitHub. Commit
the `.instagram.json` it writes afterwards.

Publishing is final: to change or remove a live post, do it in the Instagram app.
Instagram caps how many posts an account can publish through the API in 24 hours (100 at the time of writing).
