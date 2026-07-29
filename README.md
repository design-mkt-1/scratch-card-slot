# Răzuiește și câștigă — scratch card landing page

Interactive scratch-card landing page for slot.md. Static HTML/CSS/JS — **no build step,
no dependencies, no Node required**.

Design source: Figma file `W8WKIJ5gQUpMkrCUlf3ZE8` ("Slot").

## Run locally

Any static file server works. For example:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Opening `index.html` straight off the filesystem mostly works too, but a server is
preferable so the canvas can read the cover image without tainting.

## Deploying

Copy the repository contents to any web root. There is nothing to compile.

```
index.html
assets/css/styles.css
assets/js/*.js
assets/img/*
```

### GitHub Pages preview

`.github/workflows/pages.yml` publishes the repository root on every push to `main`.

**One-time setup:** go to **Settings → Pages** and set **Source** to **GitHub Actions**.
This cannot be automated — creating a Pages site needs admin rights that the workflow's
`GITHUB_TOKEN` does not have, so the first run fails with
`Get Pages site failed` until it is switched on. After that, re-run the workflow
(Actions → Deploy to GitHub Pages → Run workflow) and the site goes live at
`https://design-mkt-1.github.io/scratch-card-slot/`.

## Languages

One page, two locales. The active locale is resolved in this order:

1. `?lang=ro` / `?lang=ru` on the URL — use this for campaign links
2. previously chosen locale in `localStorage`
3. the browser's `navigator.languages`
4. Romanian

All copy lives in `assets/js/locales.js`, keyed by `data-i18n` attributes in the markup.
To change a string, edit the dictionary — not the HTML.

There is deliberately **no visible language switcher**, because none appears in the Figma
design. `window.I18N.set('ru')` switches at runtime if you ever want to wire one up.

## Configuration

| What | Where |
| --- | --- |
| CTA destination | `CTA_URL` at the top of `assets/js/main.js` (currently `https://slot.md`) |
| Countdown length | `COUNTDOWN_SECONDS` in `assets/js/main.js` (currently 2 min 36 sec) |
| Scratch threshold | `THRESHOLD` in `assets/js/scratch.js` (currently 0.55) |

The card is **always a win** — the grid is fixed at three `100 LEI` symbols, matching the
design. There is no prize logic and no backend call.

## Assets

All artwork is exported from Figma and converted to WebP. Sources are PNG at 2×;
the originals stay in git history rather than the working tree, so GitHub Pages does not
deploy ~18 MB of unused files.

Anything sized per breakpoint exists twice — phones load only the small export, desktops
only the large one. They are never stacked as CSS fallback layers, which would make every
phone download both.

| Path | What it is |
| --- | --- |
| `hero-bg.webp` / `hero-bg-mobile.webp` | Hero background, 2560×1440 and 750×1456 |
| `card-base.webp` / `card-base-mobile.webp` | Revealed card — frame, cream face, grid lines and the three `100 LEI` symbols, all one image |
| `card-cover.webp` / `card-cover-mobile.webp` | The gold "?" panel the canvas paints and the pointer erases |
| `card-empty.webp` | Frame with an empty face. Unused — kept as a spare |
| `op-1.webp` … `op-6.webp` | Operator logos, desktop (645×300) |
| `op-mob-1.webp` … `op-mob-6.webp` | Operator logos, mobile (300×122) |
| `icon-fast.svg`, `icon-star.svg`, `icon-only.svg` | Trust bar icons — each draws its own teal ring |
| `pay-mastercard.svg`, `pay-paynet.svg`, `pay-mia.svg` | Payment marks |
| `sym-*.webp` | Individual prize symbols. Unused — the card art already contains them; kept in case the grid ever needs to be built from parts |

The auto-scratch refresh icon is inlined as a data URI in `styles.css`, since it was not
in the export set.

**Cover and base must stay aligned.** Both include the same frame, so erasing the cover
over the frame reveals an identical frame underneath and the seam is invisible. If either
is re-exported, re-export both at the same crop.

### Still to come

The gold "A" flourish that sits over the hero is its own Figma layer and is not part of
the background export, so it is currently missing on both breakpoints. The mobile
background also excludes the clover, which the desktop one bakes in. Drop those in and
tell me and I will layer them over `.hero__bg`.

### Re-converting

Conversion used Pillow — `quality=90–92` with `alpha_quality=100` for anything with
transparency, `quality=86` for the opaque backgrounds. This is a one-off authoring step,
not a build step: the site itself has no toolchain.

## Fonts

Rubik (display) and Inter (body) load from Google Fonts in `index.html`. For a
self-contained deploy — or to avoid the third-party request under GDPR — download both as
WOFF2, drop them in `assets/fonts/`, replace the `<link>` with local `@font-face` rules,
and keep the existing `--font-display` / `--font-body` custom properties pointing at them.

## Browser support

Modern evergreen browsers. Uses Pointer Events, `aspect-ratio`, `clamp()` and canvas
compositing — all baseline in current Chrome, Firefox, Safari and Edge.
