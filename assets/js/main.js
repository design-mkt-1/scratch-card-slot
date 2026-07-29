/* Wiring: scratch card → win modal → countdown → CTA. */
(function (w, d) {
  'use strict';

  /* Operator registration URL. Swap this one line when the real link lands. */
  var CTA_URL = 'https://slot.md';

  var COUNTDOWN_SECONDS = 2 * 60 + 36;   // "02 min 36 sec" per the Figma comp

  var canvas   = d.getElementById('scratch');
  var autoBtn  = d.getElementById('auto');
  var modal    = d.getElementById('modal');
  var cta      = d.getElementById('modal-cta');
  var minEl    = d.getElementById('cd-min');
  var secEl    = d.getElementById('cd-sec');

  var card, countdownTimer, lastFocused;

  cta.href = CTA_URL;

  /* ------------------------------------------------------------ modal */

  function pad(n) { return n < 10 ? '0' + n : String(n); }

  function startCountdown() {
    var left = COUNTDOWN_SECONDS;

    function render() {
      minEl.textContent = pad(Math.floor(left / 60));
      secEl.textContent = pad(left % 60);
    }
    render();

    clearInterval(countdownTimer);
    countdownTimer = setInterval(function () {
      left--;
      if (left <= 0) { left = 0; clearInterval(countdownTimer); }   // clamp, don't go negative
      render();
    }, 1000);
  }

  function focusables() {
    return modal.querySelectorAll('a[href], button:not([disabled])');
  }

  function trapFocus(ev) {
    if (ev.key !== 'Tab') return;
    var list = focusables();
    if (!list.length) return;
    var first = list[0], last = list[list.length - 1];

    if (ev.shiftKey && d.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && d.activeElement === last) { ev.preventDefault(); first.focus(); }
  }

  function onKeydown(ev) {
    if (ev.key === 'Escape') closeModal();
    else trapFocus(ev);
  }

  function openModal() {
    if (!modal.hidden) return;
    lastFocused = d.activeElement;

    modal.hidden = false;
    // next frame, so the CSS transition has a start state to animate from
    requestAnimationFrame(function () { modal.classList.add('is-open'); });

    d.body.classList.add('is-locked');
    d.addEventListener('keydown', onKeydown);
    startCountdown();
    cta.focus();
  }

  function closeModal() {
    if (modal.hidden) return;

    modal.classList.remove('is-open');
    d.body.classList.remove('is-locked');
    d.removeEventListener('keydown', onKeydown);
    clearInterval(countdownTimer);

    w.setTimeout(function () { modal.hidden = true; }, 220);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  modal.addEventListener('click', function (ev) {
    if (ev.target.hasAttribute('data-close')) closeModal();
  });

  /* ------------------------------------------------------- scratch card */

  /* Match the cover art to the card art the stylesheet is showing at this width,
     so the gold panel lines up with the frame underneath it exactly. */
  var wide = w.matchMedia('(min-width: 768px)');
  function coverFor(mq) {
    return mq.matches ? 'assets/img/card-cover.webp' : 'assets/img/card-cover-mobile.webp';
  }

  card = new w.ScratchCard(canvas, {
    coverSrc: coverFor(wide),
    onComplete: openModal
  });

  /* Crossing the breakpoint swaps which export the CSS paints, so swap the cover too. */
  var onBreakpoint = function () {
    if (card.done) return;
    card.coverSrc = coverFor(wide);
    card._loadCover();
  };
  if (wide.addEventListener) wide.addEventListener('change', onBreakpoint);
  else if (wide.addListener) wide.addListener(onBreakpoint);   // Safari < 14

  autoBtn.addEventListener('click', function () { card.auto(); });

  /* Re-fit the canvas after layout changes. Debounced, and skipped once the card
     is spent so a resize can't repaint the cover over a revealed prize. */
  var resizeTimer;
  function onResize() {
    if (card.done) return;
    clearTimeout(resizeTimer);
    resizeTimer = w.setTimeout(function () { card.reset(); }, 150);
  }
  w.addEventListener('resize', onResize);
  w.addEventListener('orientationchange', onResize);

  /* Fonts land after first paint; the painted cover draws "?" in Rubik, so repaint
     once they're ready or the glyphs render in the fallback face. */
  if (d.fonts && d.fonts.ready) {
    d.fonts.ready.then(function () { if (!card.done) card.reset(); });
  }

})(window, document);
