# Verification harness

Dev-only. **The site has no build step and no dependencies** — this folder is
separate tooling and is never deployed.

```bash
cd tools/verify
npm install
node verify.js
```

Checks, in order:

1. **Network** — no 4xx/failed requests at 1920 and 375. Google Fonts is ignored:
   it is blocked inside the build container but fine for real visitors.
2. **Behaviour** — for desktop/mobile × RO/RU: `html lang`, no horizontal overflow,
   scratching opens the win modal, the countdown ticks, the CTA points at slot.md,
   Escape closes, no page errors.
3. **Auto-scratch** — the button reaches the same win modal as dragging.
4. **Mobile measurements** — type scale and card geometry at 375 against the Figma
   frame. The deliberate departures from the comp are documented in `verify.js`;
   don't "correct" them.
5. **Headline / clover clearance** — at 320, 375, 414, 430, 500, 600 and 767. This
   is a regression guard: the two collided once when mobile mixed capped font
   sizes with uncapped `vw` artwork.
6. **Desktop sanity** — card 856 wide, 3-column operator grid, headline inline.

Exit code is non-zero on any failure.

Against the live site instead of a local copy:

```bash
BASE=https://design-mkt-1.github.io/scratch-card-slot/ node verify.js
```

If Playwright can't find a browser, point it at one:

```bash
CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node verify.js
```
