# Asset drop folder

Upload the Figma exports **into this folder** (`assets/img/`).

The stylesheet already references every filename below. Each one has a CSS gradient or
solid-colour fallback behind it, so the page works right now without them — the moment a
file lands at the matching name it takes over automatically. **No code changes needed.**

Upload to the `main` branch (or tell me which branch and I'll wire it up there).

---

## Checklist

### Backgrounds

| Filename | What | Suggested export |
| --- | --- | --- |
| `hero-bg.webp` | Hero background artwork — export the whole composed `BG` frame flattened, not the individual layers | 1920×1080, WebP (or PNG/JPG) |
| `hero-bg-mobile.webp` | Optional. Mobile background (`bg` 375×728 in the Elements section). If absent, the desktop image is used and cropped | 750×1456 @2x |

### Scratch card

| Filename | What | Suggested export |
| --- | --- | --- |
| `card-frame.png` | The gold ornate frame. **Transparent centre** — the prize grid shows through it | 856×600, PNG with alpha |
| `card-cover.png` | The gold "?" panel the user scratches off — the full unscratched card face | 812×556, PNG |

If `card-cover.png` is missing, the canvas paints a gold gradient with six `?` glyphs
instead, which is already close to the designed cover.

### Prize symbols

Square, transparent background. Roughly 342×342 (2× the 171px they render at).

| Filename | What |
| --- | --- |
| `sym-coin.png` | The `100 LEI` gold coin — this is the winning symbol, it appears 3× |
| `sym-ten.png` | The pink `10` |
| `sym-book.png` | The book |
| `sym-pharaoh.png` | The pharaoh |

### Operator logos

In the order they appear on the page, left to right, top row then bottom row. Export at
the card's aspect ratio (16:9) including each brand's background colour.

| Filename | Brand in the comp |
| --- | --- |
| `op-1.png` | ybets (pink) |
| `op-2.png` | AI Casino (black) |
| `op-3.png` | Boostake (dark blue) |
| `op-4.png` | Winzbee (purple) |
| `op-5.png` | Jack (black/red) |
| `op-6.png` | bets10 (white) |

### Icons and payment marks

SVG preferred — they scale cleanly and stay crisp on retina.

| Filename | What |
| --- | --- |
| `icon-refresh.svg` | The circular arrow next to "RĂZUIEȘTE AUTOMAT" |
| `icon-fast.svg` | Trust bar — stopwatch ("Plați Instante") |
| `icon-star.svg` | Trust bar — star ("Experiență de 5 stele") |
| `icon-only.svg` | Trust bar — platform ("Unica platformă online…") |
| `pay-mastercard.svg` | Mastercard |
| `pay-paynet.svg` | Paynet |
| `pay-mia.svg` | MIA |

### Fonts (optional)

If you want to drop the Google Fonts dependency, export **Rubik SemiBold** and
**Inter Regular/Medium/SemiBold/Bold** as WOFF2 into `assets/fonts/` and I'll switch the
page over to local `@font-face` rules.

---

## If your filenames differ

Don't bother renaming — upload whatever Figma gives you and tell me. I'll rename them and
wire everything up. Same if you export different sizes or formats than suggested above;
none of it is load-bearing.
