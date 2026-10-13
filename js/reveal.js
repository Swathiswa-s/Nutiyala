/**
 * Aaradhya Clothing - Opening Brand Reveal Experience
 * Orchestrates the shawl_tie cinematic fabric unravelling,
 * graceful typography emergence, and smooth curtain transition into the homepage.
 */

import { CanvasSequencePlayer, generateFrameList } from './canvas-player.js';

export class BrandReveal {
  constructor(options = {}) {
    this.overlay = document.getElementById('revealOverlay');
    this.canvas = document.getElementById('revealCanvas');
    this.brandContainer = document.getElementById('revealBrand');
    this.brandTitle = document.getElementById('revealTitle');
    this.brandTagline = document.getElementById('revealTagline');
    this.exploreBtn = document.getElementById('revealExploreBtn');
    this.skipBtn = document.getElementById('revealSkipBtn');
    this.progressBar = document.getElementById('revealProgress');

    this.onEnter = options.onEnter || null;
    this.player = null;
    this.hasExited = false;
    this.autoTransitionTimer = null;

    this.init();
  }

  init() {
    if (!this.overlay || !this.canvas) return;

    // Check if previously seen in this session
    const seen = sessionStorage.getItem('aaradhya_reveal_seen');
    if (seen === 'true' && !window.location.hash.includes('replay')) {
      this.fastDismiss();
      return;
    }

    // Build frame list (42 frames in shawl_tie)
    const frames = generateFrameList('shawl_tie', 42, 'aspose_video_134346544637228527_out', 'jpg', 4);

    this.player = new CanvasSequencePlayer({
      canvas: this.canvas,
      frames: frames,
      fps: 9, // Graceful slow-motion fabric parting
      loop: false,
      yoyo: false,
      blend: true, // soft crossfade between frames
      fit: 'cover',
      focalX: 0.5,
      focalY: 0.45,
      onProgress: (p) => {
        if (this.progressBar) {
          this.progressBar.style.width = `${Math.round(p * 100)}%`;
        }
      },
      onFrame: (index, total) => {
        // Frame 18+: Fabric begins to untie and part
        if (index >= 18 && this.brandContainer) {
          this.brandContainer.classList.add('visible');
        }
        if (index >= 24 && this.brandTagline) {
          this.brandTagline.classList.add('visible');
        }
        if (index >= 34 && this.exploreBtn) {
          this.exploreBtn.classList.add('visible');
        }
      },
      onComplete: () => {
        // Hold final frame and allow user to click or auto-transition after 3.5s
        if (this.exploreBtn) {
          this.exploreBtn.classList.add('visible');
        }
        this.autoTransitionTimer = setTimeout(() => {
          if (!this.hasExited) {
            this.enterHomepage();
          }
        }, 3600);
      }
    });

    // Start playback when first frames ready
    this.player.play();

    // Event listeners
    if (this.exploreBtn) {
      this.exploreBtn.addEventListener('click', () => this.enterHomepage());
    }
    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', () => this.enterHomepage());
    }

    // Keydown to dismiss with Escape or Space
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'Escape' || e.key === ' ') && !this.hasExited) {
        this.enterHomepage();
      }
    }, { once: true });
  }

  enterHomepage() {
    if (this.hasExited) return;
    this.hasExited = true;
    if (this.autoTransitionTimer) {
      clearTimeout(this.autoTransitionTimer);
    }

    sessionStorage.setItem('aaradhya_reveal_seen', 'true');

    if (this.overlay) {
      this.overlay.classList.add('fade-out');
      setTimeout(() => {
        this.overlay.classList.add('hidden');
        if (this.player) {
          this.player.pause();
        }
        // Notify app to animate hero elements
        if (this.onEnter) {
          this.onEnter();
        }
        document.body.classList.remove('reveal-locked');
      }, 950);
    }
  }

  fastDismiss() {
    this.hasExited = true;
    if (this.overlay) {
      this.overlay.classList.add('hidden');
    }
    document.body.classList.remove('reveal-locked');
    if (this.onEnter) {
      this.onEnter();
    }
  }

  replay() {
    this.hasExited = false;
    sessionStorage.removeItem('aaradhya_reveal_seen');
    if (this.overlay) {
      this.overlay.classList.remove('hidden', 'fade-out');
    }
    if (this.brandContainer) {
      this.brandContainer.classList.remove('visible');
    }
    if (this.brandTagline) {
      this.brandTagline.classList.remove('visible');
    }
    if (this.exploreBtn) {
      this.exploreBtn.classList.remove('visible');
    }
    document.body.classList.add('reveal-locked');

    if (this.player) {
      this.player.currentIndex = 0;
      this.player.play();
    } else {
      this.init();
    }
  }
}
