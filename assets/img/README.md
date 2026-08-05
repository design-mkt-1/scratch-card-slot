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

In the order they appear on the page, left to right, top row then bottom row.
Export at the card's aspect ratio including each brand's background.

Two sizes, as before — desktop and mobile are cut at different ratios:

| Desktop (484×225) | Mobile (237×92) | Brand |
| --- | --- | --- |
| `cas-1.png` | `cas-mob-1.png` | 1XBET |
| `cas-2.png` | `cas-mob-2.png` | 7777 |
| `cas-3.png` | `cas-mob-3.png` | GGBET |
| `cas-4.png` | `cas-mob-4.png` | bet365 |
| `cas-5.png` | `cas-mob-5.png` | ICE Casino |
| `cas-6.png` | `cas-mob-6.png` | VERDE Casino |

Drop them in `assets/img/cas-images/` exactly as before — I convert them to
`op-N.webp` / `op-mob-N.webp` and delete the sources.

### Icons

The auto-scratch arrow is inlined as a data URI in `styles.css`, so nothing to supply.

The trust bar and payment marks were removed from the page, and their SVGs with them.
If they ever come back, they are recoverable from git history.

### Fonts (optional)

If you want to drop the Google Fonts dependency, export **Rubik SemiBold** and
**Inter Regular/Medium/SemiBold/Bold** as WOFF2 into `assets/fonts/` and I'll switch the
page over to local `@font-face` rules.

---

## If your filenames differ

Don't bother renaming — upload whatever Figma gives you and tell me. I'll rename them and
wire everything up. Same if you export different sizes or formats than suggested above;
none of it is load-bearing.
