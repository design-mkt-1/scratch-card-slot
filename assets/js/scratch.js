/* Canvas scratch-off.
   Paints a gold "?" cover over the prize grid and erases it under the pointer with
   destination-out compositing. Once ~55% is cleared the rest fades and onComplete fires. */
(function (w) {
  'use strict';

  var THRESHOLD   = 0.55;   // fraction cleared before we auto-finish
  var SAMPLE_STEP = 8;      // check every Nth pixel per axis when measuring progress
  var SAMPLE_MS   = 100;    // throttle progress measurement
  var BRUSH_FRAC  = 0.085;  // brush radius as a fraction of the canvas's short edge

  function ScratchCard(canvas, opts) {
    opts = opts || {};
    this.canvas      = canvas;
    this.ctx         = canvas.getContext('2d', { willReadFrequently: true });
    this.coverSrc    = opts.coverSrc || null;
    this.onComplete  = opts.onComplete || function () {};
    this.symbols     = opts.symbols || ['?', '?', '?', '?', '?', '?'];

    this.done        = false;
    this.drawing     = false;
    this.last        = null;
    this.lastSample  = 0;
    this.coverImg    = null;

    this._onDown = this._down.bind(this);
    this._onMove = this._move.bind(this);
    this._onUp   = this._up.bind(this);

    canvas.addEventListener('pointerdown', this._onDown);
    canvas.addEventListener('pointermove', this._onMove);
    w.addEventListener('pointerup', this._onUp);
    w.addEventListener('pointercancel', this._onUp);

    this._loadCover();
  }

  /* ---------------------------------------------------------------- cover */

  ScratchCard.prototype._loadCover = function () {
    var self = this;
    if (!this.coverSrc) { this.reset(); return; }

    var img = new Image();
    img.onload  = function () { self.coverImg = img; self.reset(); };
    img.onerror = function () { self.coverImg = null; self.reset(); };  // fall back to painted cover
    img.src = this.coverSrc;
  };

  /** Size the backing store to the CSS box × devicePixelRatio and repaint the cover. */
  ScratchCard.prototype.reset = function () {
    var rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    var dpr = Math.min(w.devicePixelRatio || 1, 2);   // cap at 2 — 3x costs a lot for no visible gain
    this.canvas.width  = Math.round(rect.width  * dpr);
    this.canvas.height = Math.round(rect.height * dpr);

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._paintCover(rect.width, rect.height);

    /* The cover art is a rounded card on a transparent background, so a chunk of
       the canvas is already clear before anyone touches it. Record that baseline
       once, and measure progress only against the pixels that started opaque —
       otherwise the corners alone would count as ~10% scratched. */
    var m = this._measure();
    this._baseClear = m ? m.clear : 0;

    this.done = false;
    this.canvas.style.opacity = '1';
    this.canvas.style.pointerEvents = '';
  };

  ScratchCard.prototype._paintCover = function (cw, ch) {
    var ctx = this.ctx;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, cw, ch);

    if (this.coverImg) {
      // cover-fit the artwork, preserving aspect ratio
      var img = this.coverImg;
      var scale = Math.max(cw / img.width, ch / img.height);
      var dw = img.width * scale, dh = img.height * scale;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      return;
    }

    // --- painted stand-in, used until assets/img/card-cover.png exists ---
    var g = ctx.createLinearGradient(0, 0, cw * 0.4, ch);
    g.addColorStop(0,    '#f7d67a');
    g.addColorStop(0.45, '#eab949');
    g.addColorStop(1,    '#d59a24');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);

    // grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cw / 3, ch * 0.06);      ctx.lineTo(cw / 3, ch * 0.94);
    ctx.moveTo(cw * 2 / 3, ch * 0.06);  ctx.lineTo(cw * 2 / 3, ch * 0.94);
    ctx.moveTo(cw * 0.04, ch / 2);      ctx.lineTo(cw * 0.96, ch / 2);
    ctx.stroke();

    // "?" glyphs on the 3×2 grid
    var size = Math.min(cw / 3, ch / 2) * 0.52;
    ctx.font = '700 ' + size + 'px Rubik, Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#4a3210';
    for (var r = 0; r < 2; r++) {
      for (var c = 0; c < 3; c++) {
        ctx.fillText('?', cw * (c + 0.5) / 3, ch * (r + 0.5) / 2);
      }
    }
  };

  /* --------------------------------------------------------------- input */

  ScratchCard.prototype._point = function (ev) {
    var r = this.canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  };

  ScratchCard.prototype._down = function (ev) {
    if (this.done) return;
    this.drawing = true;
    this.last = this._point(ev);
    if (this.canvas.setPointerCapture) {
      try { this.canvas.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    }
    this._stamp(this.last, this.last);
  };

  ScratchCard.prototype._move = function (ev) {
    if (!this.drawing || this.done) return;
    ev.preventDefault();
    var p = this._point(ev);
    this._stamp(this.last, p);
    this.last = p;

    var now = Date.now();
    if (now - this.lastSample > SAMPLE_MS) {
      this.lastSample = now;
      if (this.progress() >= THRESHOLD) this.finish();
    }
  };

  ScratchCard.prototype._up = function () {
    if (!this.drawing) return;
    this.drawing = false;
    this.last = null;
    if (!this.done && this.progress() >= THRESHOLD) this.finish();
  };

  /* --------------------------------------------------------------- erase */

  /** Erase a capsule between two points — stamping arcs along the segment so a
      fast drag doesn't leave gaps between sampled pointer positions. */
  ScratchCard.prototype._stamp = function (from, to) {
    var rect = this.canvas.getBoundingClientRect();
    var radius = Math.min(rect.width, rect.height) * BRUSH_FRAC;
    var ctx = this.ctx;

    ctx.globalCompositeOperation = 'destination-out';

    var dx = to.x - from.x, dy = to.y - from.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var steps = Math.max(1, Math.ceil(dist / (radius * 0.4)));

    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      ctx.beginPath();
      ctx.arc(from.x + dx * t, from.y + dy * t, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  /** Count transparent vs sampled pixels on a coarse grid. */
  ScratchCard.prototype._measure = function () {
    var cw = this.canvas.width, ch = this.canvas.height;
    if (!cw || !ch) return null;

    var data;
    try {
      data = this.ctx.getImageData(0, 0, cw, ch).data;
    } catch (e) {
      return null;   // tainted canvas (cover served cross-origin) — never block on this
    }

    var clear = 0, total = 0;
    var stride = 4 * SAMPLE_STEP;

    for (var row = 0; row < ch; row += SAMPLE_STEP) {
      var base = row * cw * 4;
      for (var off = 0; off < cw * 4; off += stride) {
        if (data[base + off + 3] < 128) clear++;
        total++;
      }
    }
    return { clear: clear, total: total };
  };

  /** Fraction of the *scratchable* area erased, ignoring pixels that the cover
      art left transparent to begin with. */
  ScratchCard.prototype.progress = function () {
    var m = this._measure();
    if (!m) return 0;

    var scratchable = m.total - this._baseClear;
    if (scratchable <= 0) return 0;

    return Math.max(0, (m.clear - this._baseClear) / scratchable);
  };

  /* -------------------------------------------------------------- finish */

  ScratchCard.prototype.finish = function () {
    if (this.done) return;
    this.done = true;
    this.drawing = false;
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.opacity = '0';          // CSS transitions this out
    var self = this;
    w.setTimeout(function () { self.onComplete(); }, 420);
  };

  /** Auto-scratch: sweep the brush across the card, then finish. */
  ScratchCard.prototype.auto = function () {
    if (this.done || this.autoRunning) return;
    this.autoRunning = true;

    var rect = this.canvas.getBoundingClientRect();
    var self = this;
    var start = null;
    var DURATION = 900;

    function frame(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / DURATION);
      var ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

      // three horizontal passes, alternating direction, marching down the card
      var pass = ease * 3;
      var band = Math.floor(pass);
      var within = pass - band;
      var y = rect.height * (band + 0.5) / 3;
      var x = (band % 2 === 0) ? rect.width * within : rect.width * (1 - within);
      var p = { x: x, y: y };

      self._stamp(self.last || p, p);
      self.last = p;

      if (t < 1) {
        w.requestAnimationFrame(frame);
      } else {
        self.autoRunning = false;
        self.last = null;
        self.finish();
      }
    }
    w.requestAnimationFrame(frame);
  };

  ScratchCard.prototype.destroy = function () {
    this.canvas.removeEventListener('pointerdown', this._onDown);
    this.canvas.removeEventListener('pointermove', this._onMove);
    w.removeEventListener('pointerup', this._onUp);
    w.removeEventListener('pointercancel', this._onUp);
  };

  w.ScratchCard = ScratchCard;

})(window);
