/**
 * bg-scroll.js — index.html only.
 *
 * Draws bg-frames/frame-001.jpg … frame-300.jpg onto a fixed full-screen
 * <canvas> behind the page, picking whichever frame matches how far down
 * you've scrolled. This is the "video without a video file" effect —
 * cheaper to load and easier to host than an actual video, and it plays
 * in perfect sync with scroll position instead of on its own timeline.
 *
 * Requires:
 *   <canvas id="bgAnimCanvas"></canvas><div class="bg-anim-overlay"></div>
 *   right after <body> (see index.html), and all 300 frames uploaded to
 *   a bg-frames/ folder next to index.html.
 */
(function () {
  "use strict";

  const canvas = document.getElementById("bgAnimCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Respect "reduce motion" — CSS already hides the canvas in that case,
  // so don't bother loading 300 images for nothing.
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const FRAME_COUNT = 300;
  const FRAME_PATH = (n) => `bg-frames/frame-${String(n).padStart(3, "0")}.jpg`;

  const frames = new Array(FRAME_COUNT + 1); // 1-indexed, frames[0] unused
  let currentFrame = -1;
  let rafPending = false;

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    drawFrame(currentFrame === -1 ? 1 : currentFrame, true);
  }

  function drawFrame(n, force) {
    n = Math.min(FRAME_COUNT, Math.max(1, n));
    if (!force && n === currentFrame) return;
    const img = frames[n];
    if (!img || !img.complete || !img.naturalWidth) return; // not loaded yet — keep showing the last drawn frame
    currentFrame = n;

    const cw = canvas.width, ch = canvas.height;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih); // cover, not contain
    const dw = iw * scale, dh = ih * scale;
    const dx = (cw - dw) / 2, dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function frameForScrollPosition() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
    return Math.round(progress * (FRAME_COUNT - 1)) + 1;
  }

  function onScroll() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      rafPending = false;
      drawFrame(frameForScrollPosition());
    });
  }

  // Preload every frame. Total set is ~5MB across 300 small JPEGs, which
  // loads quickly on a normal connection; frame 1 draws as soon as it's
  // ready so there's no blank screen while the rest finish in the
  // background. If the visitor scrolls faster than frames finish
  // loading, drawFrame() just keeps the last successfully-drawn frame
  // on screen until the next one is ready — never a broken image.
  for (let n = 1; n <= FRAME_COUNT; n++) {
    const img = new Image();
    img.decoding = "async";
    img.src = FRAME_PATH(n);
    if (n === 1) img.onload = () => drawFrame(1, true);
    frames[n] = img;
  }

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("scroll", onScroll, { passive: true });
  resizeCanvas();
})();
