/**
 * Aaradhya Clothing - High-Performance Canvas Image Sequence Player
 * Provides 60fps frame-accurate rendering, dynamic aspect-ratio cover math,
 * scroll scrubbing, and smooth looping with zero video buffering latency.
 */

export class CanvasSequencePlayer {
  constructor(options = {}) {
    this.canvas = typeof options.canvas === 'string' ? document.querySelector(options.canvas) : options.canvas;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.frames = options.frames || []; // Array of image URLs
    this.fps = options.fps || 12;
    this.loop = options.loop !== undefined ? options.loop : true;
    this.yoyo = options.yoyo !== undefined ? options.yoyo : true; // seamless back-and-forth oscillation
    this.direction = 1; // 1 for forward, -1 for reverse
    this.blend = options.blend !== undefined ? options.blend : true; // smooth cross-dissolve between frames
    this.fit = options.fit || 'cover'; // 'cover' or 'contain'
    this.focalX = options.focalX !== undefined ? options.focalX : 0.5; // 0 to 1 center
    this.focalY = options.focalY !== undefined ? options.focalY : 0.5;
    this.onFrame = options.onFrame || null;
    this.onComplete = options.onComplete || null;

    this.images = [];
    this.currentIndex = 0;
    this.nextIndex = 1;
    this.blendFactor = 0;
    this.isPlaying = false;
    this.lastTimestamp = 0;
    this.interval = 1000 / this.fps;
    this.animationFrameId = null;
    this.isLoaded = false;
    this.loadProgress = 0;
    this.onProgress = options.onProgress || null;

    if (this.canvas) {
      this.init();
    }
  }

  init() {
    this.handleResize = this.resize.bind(this);
    window.addEventListener('resize', this.handleResize);
    this.resize();
    this.preload();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // For full-viewport hero canvases, use window dimensions directly
    // to guarantee zero-gap edge-to-edge coverage
    const isFullViewport = (
      Math.abs(rect.width - window.innerWidth) < 2 &&
      Math.abs(rect.height - window.innerHeight) < 2
    );

    const displayW = isFullViewport ? window.innerWidth : rect.width;
    const displayH = isFullViewport ? window.innerHeight : rect.height;

    const width = Math.max(1, Math.floor(displayW * dpr));
    const height = Math.max(1, Math.floor(displayH * dpr));

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.drawBlendedFrames(0);
    }
  }

  preload() {
    if (!this.frames || !this.frames.length) return;
    let loadedCount = 0;
    const total = this.frames.length;

    this.images = this.frames.map((src, idx) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        this.loadProgress = loadedCount / total;
        if (this.onProgress) {
          this.onProgress(this.loadProgress, loadedCount, total);
        }
        if (loadedCount === 1 && this.currentIndex === 0) {
          this.drawBlendedFrames(0);
        }
        if (loadedCount === total) {
          this.isLoaded = true;
          this.drawBlendedFrames(0);
        }
      };
      img.onerror = () => {
        loadedCount++;
        console.warn(`Failed to load frame ${idx}: ${src}`);
      };
      img.src = src;
      return img;
    });
  }

  drawFrame(img, alpha = 1.0) {
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    if (this.fit === 'cover') {
      const scale = Math.max(cw / iw, ch / ih);
      const nw = iw * scale;
      const nh = ih * scale;
      const nx = (cw - nw) * this.focalX;
      const ny = (ch - nh) * this.focalY;
      this.ctx.drawImage(img, nx, ny, nw, nh);
    } else {
      const scale = Math.min(cw / iw, ch / ih);
      const nw = iw * scale;
      const nh = ih * scale;
      const nx = (cw - nw) / 2;
      const ny = (ch - nh) / 2;
      this.ctx.drawImage(img, nx, ny, nw, nh);
    }
  }

  drawBlendedFrames(fraction = 0) {
    if (!this.ctx || !this.canvas || !this.images.length) return;
    const currentImg = this.images[this.currentIndex];
    if (!currentImg) return;

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    this.ctx.clearRect(0, 0, cw, ch);

    // Draw base current frame
    this.drawFrame(currentImg, 1.0);

    // If blending is active and fraction > 0, cross-dissolve next frame smoothly
    if (this.blend && fraction > 0.05 && this.images[this.nextIndex]) {
      const nextImg = this.images[this.nextIndex];
      // Smooth sinusoidal / cubic easing for dissolution
      const easedAlpha = fraction * fraction * (3 - 2 * fraction);
      this.drawFrame(nextImg, easedAlpha);
    }

    this.ctx.globalAlpha = 1.0;
  }

  drawCurrentFrame() {
    this.drawBlendedFrames(0);
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastTimestamp = performance.now();
    this.loopStep(this.lastTimestamp);
  }

  pause() {
    this.isPlaying = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  loopStep(timestamp) {
    if (!this.isPlaying) return;

    const elapsed = timestamp - this.lastTimestamp;
    const fraction = Math.min(1, Math.max(0, elapsed / this.interval));

    // Render smooth in-between cross-dissolve frame on every display refresh
    this.drawBlendedFrames(fraction);

    if (elapsed >= this.interval) {
      this.lastTimestamp = timestamp - (elapsed % this.interval);
      this.advanceFrame();
    }

    this.animationFrameId = requestAnimationFrame((ts) => this.loopStep(ts));
  }

  advanceFrame() {
    if (!this.frames.length) return;

    if (this.yoyo) {
      let target = this.currentIndex + this.direction;
      if (target >= this.frames.length) {
        this.direction = -1;
        target = this.frames.length - 2;
      } else if (target < 0) {
        this.direction = 1;
        target = 1;
      }
      this.currentIndex = Math.max(0, Math.min(this.frames.length - 1, target));
      this.nextIndex = Math.max(0, Math.min(this.frames.length - 1, this.currentIndex + this.direction));
    } else {
      const next = this.currentIndex + 1;
      if (next >= this.frames.length) {
        if (this.loop) {
          this.currentIndex = 0;
          this.nextIndex = 1;
        } else {
          this.pause();
          if (this.onComplete) this.onComplete();
          return;
        }
      } else {
        this.currentIndex = next;
        this.nextIndex = (this.currentIndex + 1) % this.frames.length;
      }
    }

    if (this.onFrame) {
      this.onFrame(this.currentIndex, this.frames.length);
    }
  }

  stepNext() {
    this.advanceFrame();
    this.drawBlendedFrames(0);
  }

  seekToProgress(progress) {
    if (!this.frames.length) return;
    const clamped = Math.max(0, Math.min(1, progress));
    const targetIndex = Math.min(this.frames.length - 1, Math.floor(clamped * this.frames.length));
    if (targetIndex !== this.currentIndex) {
      this.currentIndex = targetIndex;
      this.drawCurrentFrame();
      if (this.onFrame) {
        this.onFrame(this.currentIndex, this.frames.length);
      }
    }
  }

  destroy() {
    this.pause();
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }
  }
}

/**
 * Generate sequence frame URLs helper
 */
export function generateFrameList(folder, count, prefix, ext = 'jpg', pad = 4) {
  const frames = [];
  for (let i = 1; i <= count; i++) {
    const padded = String(i).padStart(pad, '0');
    frames.push(`assets/${folder}/${prefix}${padded}.${ext}`);
  }
  return frames;
}
