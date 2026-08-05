# Handoff / audit notes

State as of commit `efa9f3b`. `main` and `claude/landing-page-scratch-card-fxk0ko`
are identical, and the live site matches both.

**Live:** https://design-mkt-1.github.io/scratch-card-slot/ · RU: `?lang=ru`

Read this alongside `README.md` (how it works) and `assets/img/README.md` (the
asset drop folder). This file covers what someone auditing or picking the work up
needs that the code does not say for itself.

---

## What it is

A one-page scratch-card promo for slot.md, built from Figma file
`W8WKIJ5gQUpMkrCUlf3ZE8`. Visitor scratches a gold card (or taps auto-scratch),
uncovers three matching `100 LEI` symbols, and a win modal offers a CTA through
to the operator.

**Plain static HTML/CSS/JS. No build step, no dependencies, no framework.** That
was deliberate: the repo is handed to an IT team who deploy it on the main
domain, and a folder they can copy to any web root is the cleanest handoff.
`tools/verify/` is the one exception — dev-only, never deployed.

## Ground rules worth knowing before changing anything

- **Always a win.** The grid is fixed at three `100 LEI` symbols. No prize logic,
  no backend. This is baked into the card artwork, not computed.
- **One page, two locales.** RO and RU share one `index.html` and one dictionary
  (`assets/js/locales.js`). There are no per-locale files — a copy change is one
  edit covering RO, RU, desktop and mobile. Locale resolves from `?lang=` →
  `localStorage` → `navigator.languages` → RO. There is deliberately no visible
  language switcher; none exists in the design.
- **Mobile scales off one unit.** Every mobile metric is a fraction of
  `--u: min(100vw, 430px)`. Do not reintroduce raw `vw` for mobile sizing — see
  "Bugs already fixed" below for why.

## Deployment — read this before wondering why a push didn't go live

Pushing to `main` **does not** deploy. It has to be triggered by hand:

```
Actions → Deploy to GitHub Pages → Run workflow → branch: claude/landing-page-scratch-card-fxk0ko
```

Why: when Pages was first enabled, GitHub created a `github-pages` *environment*
whose deployment-branch rule was pinned to the default branch at that moment —
`claude/landing-page-scratch-card-fxk0ko`. The repo's default branch has since
been changed to `main`, but that does not retroactively update the environment
rule, so deploys from `main` are still rejected with:

> Branch "main" is not allowed to deploy to github-pages due to environment protection rules.

**The fix (one click, needs repo admin):** Settings → Environments → `github-pages`
→ *Deployment branches and tags* → either delete the old branch rule and add
`main`, or switch to "No restriction". After that, pushes to `main` deploy on
their own and the manual step disappears.

## Environment constraints hit while building

These are properties of the build container, not of the site:

- **`figma.com` is blocked** by the egress policy (403 on CONNECT). The Figma MCP
  server works — it fetches server-side — so structure, copy and measurements can
  be read, but **image bytes cannot be downloaded.** All artwork therefore arrives
  by the client pushing PNGs to `assets/img/`, which are then converted and the
  sources deleted. If a future session can reach figma.com, `download_assets`
  removes that round trip.
- **Google Fonts is blocked too.** `verify.js` ignores that specific failure. Real
  visitors load Rubik and Inter normally. Renders made in the container use
  fallback faces — don't read type differences off them.
- The GitHub **Pages and Environments REST endpoints are blocked** through the
  proxy (403), which is why the environment rule above needs a human.

## Asset pipeline

Sources are PNG at 1.5–2×, converted to WebP with Pillow (`quality=90–92`,
`alpha_quality=100` for anything with transparency; `quality=86` for the opaque
backgrounds). Sources are deleted from the tree afterwards so Pages does not
serve ~18 MB of unused originals — they stay in git history.

Current page weight: **742 KB desktop, 310 KB mobile** first load. Phones never
fetch the desktop art and vice versa; the two are never stacked as CSS fallback
layers, which would make every phone download both.

Sizes in use: operator logos 484×225 desktop / 237×92 mobile; card art 1713×1200
/ 684×476; backgrounds 2560×1440 / 750×1456.

## Bugs already fixed — do not reintroduce

1. **Headline gradient across two lines.** One element spanning two lines stretches
   a single bright→dark ramp over both, leaving row two entirely in the dark half.
   Figma has the headline as two text nodes for exactly this reason. It is now two
   spans, each with its own `background-clip` gradient, going inline at 768px up.
2. **`text-shadow` under `background-clip: text`.** The background paints *below*
   the text layer, so an opaque text-shadow covers the gradient and inverts the
   effect. The gold lip uses `filter: drop-shadow()` instead.
3. **Headline colliding with the clover on wide phones.** Font sizes were
   `clamp()`-capped while artwork stayed on raw `vw`, so past ~485px the clover
   kept growing after the type stopped. Fixed by deriving everything from `--u`.
   `verify.js` step 5 guards this at seven widths.
4. **Scratch progress counting transparent corners.** The cover art is a rounded
   card on transparency, so ~10% read as "already scratched" before anyone touched
   it. Progress now measures against pixels that started opaque.
5. **`--u` leaking into desktop.** It caps at 430, so anything derived from it must
   be re-stated in the `@media (min-width: 768px)` block or desktop inherits
   phone-sized values. Currently re-stated: `max-width`, `.hero__stage` width,
   grid gap, logo margin, aspect ratios.

## Deliberate departures from the Figma comp

All agreed with the client. `verify.js` asserts the current values, so "fixing"
them to match Figma will fail the harness.

| | Figma | Built |
| --- | --- | --- |
| Mobile headroom | 75px | 49px |
| Mobile headline | 34px | 39px |
| Desktop headroom | 144px | 67px |
| Desktop headline | 100px | 113px |
| Countdown start | 02:36 | 57:23 |
| Mobile hero height | 646px | ~667px |

The hero height difference is padding kept on the auto-scratch button so it stays
a usable tap target; Figma draws that row as a bare 18px.

## Open items

- **The RU section heading is a translation, not Figma copy.**
  `ДРУГИЕ ОПЕРАТОРЫ СТАВОК И КАЗИНО В МОЛДОВЕ` was written here because the Figma
  connector was unavailable when the section was rebuilt. Every other RU string
  came verbatim from the design. **Needs sign-off or replacement.**
- **`CTA_URL` is a placeholder** — `https://slot.md` in `assets/js/main.js`, pending
  the real registration URL.
- **The environment deployment rule** (see Deployment above).
- Two RO strings elsewhere in the design looked like typos and were reproduced
  verbatim rather than silently corrected: *"când nu ceva nu merge"* and
  *"Plați Instante"*. The second disappeared with the footer removal.
- The operator section was retitled from *"ATENȚIE LA OPERATORI ILEGALI…"* to
  *"ALȚI OPERATORI…"* and its per-operator copy removed. That changes the section
  from a warning into a neutral listing — flagged at the time, not queried since.

## Removed on request

The trust bar (three teal icons) and the payment-marks footer were removed from
all four variants, along with their six SVGs and dictionary keys. Recoverable
from history if they come back.

## Verifying

```bash
cd tools/verify && npm install && node verify.js
```

Covers network, behaviour across both locales and breakpoints, auto-scratch,
mobile measurements against the Figma frame, headline/clover clearance at seven
widths, and desktop geometry. Non-zero exit on failure. See
`tools/verify/README.md`.
