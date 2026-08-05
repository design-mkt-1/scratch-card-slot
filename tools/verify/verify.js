/* End-to-end verification for the landing page.
 *
 * Dev-only. The site itself has no toolchain and no dependencies — this script
 * is the harness used to check changes, not part of the build.
 *
 *   cd tools/verify && npm install
 *   node verify.js                     # serves ../.. and checks it
 *   BASE=https://design-mkt-1.github.io/scratch-card-slot/ node verify.js
 *
 * If Playwright cannot find a browser, point it at one:
 *   CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node verify.js
 *
 * Exits non-zero if any check fails, so it can gate a commit.
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const PORT = 8799;
const failures = [];
const note = (ok, label, detail) => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? '   ' + detail : ''}`);
  if (!ok) failures.push(label + (detail ? ' — ' + detail : ''));
};

/* Figma mobile frame targets (RO 1:745 / RU 1:1314, both 375×646).
   Deliberate departures from the comp, agreed with the client — do not "fix":
     title top    49  (Figma 75)   headroom trimmed
     title font   39  (Figma 34)   enlarged
     hero height  ~667 (Figma 646) auto-scratch button keeps a tappable padding */
const MOBILE_TARGETS = [
  ['title font',      'titleFs',   39],
  ['title rows',      'rows',       2],
  ['card top',        'cardTop',  249],
  ['card width',      'cardW',    342],
  ['hint font',       'hintFs',    12],
  ['auto font',       'autoFs',    14],
  ['auto icon',       'autoIcon',  18],
  ['warn title font', 'warnFs',    20],
];

function serve() {
  const types = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript',
                  '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml',
                  '.ico':'image/x-icon', '.woff2':'font/woff2' };
  return new Promise(res => {
    const s = http.createServer((req, rep) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      const f = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
      if (!fs.existsSync(f)) { rep.writeHead(404); return rep.end('nope'); }
      rep.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(rep);
    });
    s.listen(PORT, () => res(s));
  });
}

async function scratch(page) {
  const b = await page.locator('#scratch').boundingBox();
  await page.mouse.move(b.x + 20, b.y + 25);
  await page.mouse.down();
  for (let row = 0; row < 6; row++) {
    const y = b.y + (b.height * (row + 0.5)) / 6;
    for (let i = 0; i <= 24; i++) {
      const t = row % 2 === 0 ? i / 24 : 1 - i / 24;
      await page.mouse.move(b.x + b.width * t, y);
    }
  }
  await page.mouse.up();
}

(async () => {
  const server = process.env.BASE ? null : await serve();
  const BASE = process.env.BASE || `http://127.0.0.1:${PORT}/`;
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});

  /* ---- 1. no failing requests ---- */
  console.log('\n[1] network');
  for (const w of [1920, 375]) {
    const p = await (await browser.newContext({ viewport: { width: w, height: 900 } })).newPage();
    const bad = [];
    p.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
    p.on('requestfailed', r => {
      // Google Fonts is blocked inside the build container but fine for real users
      if (!r.url().includes('fonts.googleapis.com')) bad.push('FAILED ' + r.url());
    });
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    note(bad.length === 0, `@${w} no failing requests`, bad.join('; '));
    await p.close();
  }

  /* ---- 2. behaviour, both locales, both breakpoints ---- */
  console.log('\n[2] behaviour');
  for (const [label, vp] of [['desktop', { width: 1920, height: 1080 }],
                             ['mobile',  { width: 375,  height: 812 }]]) {
    for (const lang of ['ro', 'ru']) {
      const ctx = await browser.newContext({ viewport: vp });
      const p = await ctx.newPage();
      const errs = [];
      p.on('pageerror', e => errs.push(e.message));
      await p.goto(`${BASE}?lang=${lang}`, { waitUntil: 'networkidle' });
      await p.waitForTimeout(400);

      const tag = `${label}/${lang}`;
      note((await p.getAttribute('html', 'lang')) === lang, `${tag} html lang`);
      note(await p.evaluate(() =>
        document.documentElement.scrollWidth <= document.documentElement.clientWidth),
        `${tag} no horizontal overflow`);

      await scratch(p);
      await p.waitForTimeout(900);
      const open = await p.locator('#modal').isVisible();
      note(open, `${tag} scratch opens the win modal`);

      if (open) {
        const t0 = await p.locator('#cd-sec').innerText();
        await p.waitForTimeout(1600);
        note(t0 !== await p.locator('#cd-sec').innerText(), `${tag} countdown ticks`);
        note((await p.getAttribute('#modal-cta', 'href')).includes('slot.md'), `${tag} CTA target`);
        await p.keyboard.press('Escape');
        await p.waitForTimeout(400);
        note(!(await p.locator('#modal').isVisible()), `${tag} Escape closes the modal`);
      }
      note(errs.length === 0, `${tag} no page errors`, errs.join('; '));
      await ctx.close();
    }
  }

  /* ---- 3. auto-scratch reaches the same outcome ---- */
  console.log('\n[3] auto-scratch');
  {
    const p = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.waitForTimeout(300);
    await p.click('#auto');
    await p.waitForTimeout(2000);
    note(await p.locator('#modal').isVisible(), 'auto-scratch opens the win modal');
    await p.close();
  }

  /* ---- 4. mobile measurements against the Figma frame ---- */
  console.log('\n[4] mobile @375 vs Figma');
  {
    const p = await (await browser.newContext({ viewport: { width: 375, height: 812 } })).newPage();
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    const m = await p.evaluate(() => {
      const px = s => parseFloat(s), q = s => document.querySelector(s);
      const hero = q('.hero').getBoundingClientRect(), t = q('h1');
      const tr = t.getBoundingClientRect(), cr = q('.card').getBoundingClientRect();
      return {
        titleFs: px(getComputedStyle(t).fontSize),
        rows: q('.hero__title').querySelectorAll('.hero__title-line').length,
        cardTop: cr.top - hero.top, cardW: cr.width,
        hintFs: px(getComputedStyle(q('.hero__hint')).fontSize),
        autoFs: px(getComputedStyle(q('.auto')).fontSize),
        autoIcon: q('.auto__icon').getBoundingClientRect().width,
        warnFs: px(getComputedStyle(q('.warn__title')).fontSize),
      };
    });
    for (const [label, key, want] of MOBILE_TARGETS) {
      const got = m[key], d = got - want;
      note(Math.abs(d) <= Math.max(2, want * 0.04), `${label}`,
           `figma ${want}, got ${got.toFixed(1)} (${d >= 0 ? '+' : ''}${d.toFixed(1)})`);
    }
    await p.close();
  }

  /* ---- 5. the headline must never collide with the clover ---- */
  console.log('\n[5] headline / clover clearance');
  for (const w of [320, 375, 414, 430, 500, 600, 767]) {
    const p = await (await browser.newContext({ viewport: { width: w, height: 900 } })).newPage();
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.waitForTimeout(350);
    const gap = await p.evaluate(() => {
      const hero = document.querySelector('.hero').getBoundingClientRect();
      const tr = document.querySelector('h1').getBoundingClientRect();
      const cs = getComputedStyle(document.querySelector('.hero__bg'));
      const nums = s => (s.match(/-?[\d.]+px/g) || []).map(parseFloat);
      const size = nums(cs.backgroundSize.split(',')[0])[0];
      const y = nums(cs.backgroundPosition.split(',')[0])[1];
      return (y + size * 0.1284) - (tr.bottom - hero.top);  // clover art starts 12.84% down
    });
    note(gap >= -6, `@${w} clover clears the headline`, `gap ${gap.toFixed(0)}px`);
    await p.close();
  }

  /* ---- 6. desktop sanity ---- */
  console.log('\n[6] desktop @1920');
  {
    const p = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
    await p.goto(BASE, { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    const d = await p.evaluate(() => ({
      card: document.querySelector('.card').getBoundingClientRect().width,
      cols: getComputedStyle(document.querySelector('.ops')).gridTemplateColumns.split(' ').length,
      rows: document.querySelectorAll('.hero__title-line').length,
      inline: getComputedStyle(document.querySelector('.hero__title-line')).display,
    }));
    note(Math.abs(d.card - 856) < 4, 'card is 856 wide', `got ${d.card.toFixed(0)}`);
    note(d.cols === 3, 'operator grid is 3 columns', `got ${d.cols}`);
    note(d.inline === 'inline', 'headline rows go inline', `got ${d.inline}`);
    await p.close();
  }

  await browser.close();
  if (server) server.close();

  console.log('\n' + '='.repeat(52));
  if (failures.length) {
    console.log(`${failures.length} FAILURE(S):`);
    failures.forEach(f => console.log('  - ' + f));
    process.exit(1);
  }
  console.log('all checks passed');
})();
