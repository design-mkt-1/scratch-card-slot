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

GitHub Pages is wired up in `.github/workflows/pages.yml` and publishes the repository
root on every push to the default branch.

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

The stylesheet references the files below. Every one has a CSS gradient or solid-colour
fallback behind it, so the page renders correctly even while they are missing — drop the
real exports in at these exact paths and they take over with no code changes.

| Path | What it is |
| --- | --- |
| `assets/img/hero-bg.webp` | Hero background artwork (export the composed `BG` node, 1920×1080) |
| `assets/img/card-frame.png` | Gold card frame, transparent centre |
| `assets/img/card-cover.png` | Gold "?" scratch cover painted onto the canvas |
| `assets/img/sym-10.png` | `10` symbol |
| `assets/img/sym-coin.png` | `100 LEI` coin |
| `assets/img/sym-book.png` | Book symbol |
| `assets/img/sym-pharaoh.png` | Pharaoh symbol |
| `assets/img/op-1.png` … `op-6.png` | Operator logos, in the order they appear |
| `assets/img/icon-refresh.svg` | Auto-scratch icon |
| `assets/img/icon-fast.svg`, `icon-star.svg`, `icon-only.svg` | Trust bar icons |
| `assets/img/pay-mastercard.svg`, `pay-paynet.svg`, `pay-mia.svg` | Payment marks |

If `card-cover.png` is absent the canvas paints a gold gradient with six `?` glyphs
instead, which is close to the designed cover.

## Fonts

Rubik (display) and Inter (body) load from Google Fonts in `index.html`. For a
self-contained deploy — or to avoid the third-party request under GDPR — download both as
WOFF2, drop them in `assets/fonts/`, replace the `<link>` with local `@font-face` rules,
and keep the existing `--font-display` / `--font-body` custom properties pointing at them.

## Browser support

Modern evergreen browsers. Uses Pointer Events, `aspect-ratio`, `clamp()` and canvas
compositing — all baseline in current Chrome, Firefox, Safari and Edge.
