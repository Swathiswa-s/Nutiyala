/**
 * Aaradhya Clothing - Luxury Haute Couture Hero Cinema Film Director
 * High-end cinematic fashion editorial transition engine powered by GSAP.
 * Scene 01 -> Scene 02 -> Scene 03 -> Scene 04 -> Scene 01 loop.
 */

export const HERO_SCENES = [
  {
    id: 0,
    media: 'aaradhya/assets/videos/window.webp',
    poster: 'aaradhya/assets/window/aspose_video_134346631091478633_out0001.jpg',
    tag: '✦ Haute Couture Autumn / Festive • Scene 01',
    title: 'Crafted with <span>Grace.</span>',
    desc: 'Contemporary silhouettes, timeless Indian craftsmanship.',
    label: 'Haveli Grace',
    focal: 'center 38%',
    cameraStart: { scale: 1.0, x: -10, y: 0 },
    cameraEnd: { scale: 1.08, x: 12, y: 0 }
  },
  {
    id: 1,
    media: 'aaradhya/assets/videos/shawl_tie.webp',
    poster: 'aaradhya/assets/images/pexels/pashmina_shawl_new_1.jpg',
    tag: '✦ The Pashmina & Cashmere Archive • Scene 02',
    title: 'Woven in <span>Eternity.</span>',
    desc: 'Artisan-spun Himalayan cashmere with heritage hand-needlework.',
    label: 'Pashmina Archive',
    focal: 'center 32%',
    cameraStart: { scale: 1.07, x: 10, y: 0 },
    cameraEnd: { scale: 1.01, x: -12, y: 0 }
  },
  {
    id: 2,
    media: 'aaradhya/assets/videos/walk.webp',
    poster: 'aaradhya/assets/images/pexels/rosewood_coord_new_1.jpg',
    tag: '✦ Architectural Silhouettes • Scene 03',
    title: 'Poetry in <span>Motion.</span>',
    desc: 'Pure mulberry and Chanderi silks sculpted to flow with every stride.',
    label: 'Royal Motion',
    focal: 'center 35%',
    cameraStart: { scale: 1.0, x: 0, y: -8 },
    cameraEnd: { scale: 1.08, x: 0, y: 10 }
  },
  {
    id: 3,
    media: 'aaradhya/assets/videos/campaign.webp',
    poster: 'aaradhya/assets/images/pexels/sage_kurti_1.jpg',
    tag: '✦ The Royal Atelier • Scene 04',
    title: 'A Legacy of <span>Gold.</span>',
    desc: 'Antique zari and resham motifs hand-embroidered by master artisans.',
    label: 'Atelier Grandeur',
    focal: 'center 36%',
    cameraStart: { scale: 1.08, x: -8, y: 0 },
    cameraEnd: { scale: 1.01, x: 10, y: 0 }
  }
];

export class HeroCampaignFilm {
  constructor(options = {}) {
    this.container = document.querySelector(options.container || '#heroSection');
    if (!this.container) return;

    this.scenes = HERO_SCENES;
    this.currentIndex = 0;
    this.isTransitioning = false;
    this.sceneDuration = options.duration || 5.2; // seconds per scene
    this.timer = null;
    this.gsap = window.gsap;

    // Cache DOM Elements
    this.viewport = this.container.querySelector('.hero-cinema-viewport');
    this.sceneEls = Array.from(this.container.querySelectorAll('.hero-scene'));
    this.timelineBtns = Array.from(this.container.querySelectorAll('.timeline-scene-btn'));
    
    this.tagEl = document.getElementById('heroTag');
    this.titleEl = document.getElementById('heroTitle');
    this.descEl = document.getElementById('heroDesc');
    this.ctasEl = document.getElementById('heroCtas');
    this.contentEl = document.getElementById('heroContent');

    this.activeProgressTween = null;
    this.activeCameraTween = null;

    this.init();
  }

  init() {
    if (!this.gsap) {
      console.warn('GSAP library not detected, loading fallback');
      return;
    }

    // Set initial scene states
    this.sceneEls.forEach((el, idx) => {
      const media = el.querySelector('.hero-scene-media');
      if (idx === 0) {
        this.gsap.set(el, { opacity: 1, zIndex: 2, display: 'block' });
        el.classList.add('is-active');
        this.startCameraMovement(0, media);
      } else {
        this.gsap.set(el, { opacity: 0, zIndex: 1, display: 'none' });
        el.classList.remove('is-active');
      }
    });

    // Animate in initial text with requested timing
    this.animateTextIn(0, true);

    // Bind Timeline button clicks
    this.timelineBtns.forEach((btn, idx) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.currentIndex === idx || this.isTransitioning) return;
        this.goToScene(idx);
      });
    });

    // Start scene timeline auto-advance
    this.startSceneCycle();

    // Pause / resume on hover if user is interacting with text or buttons
    if (this.contentEl) {
      this.contentEl.addEventListener('mouseenter', () => this.pauseTimer());
      this.contentEl.addEventListener('mouseleave', () => this.resumeTimer());
    }
  }

  startCameraMovement(index, mediaEl) {
    if (!mediaEl || !this.gsap) return;
    const sceneData = this.scenes[index];
    const { cameraStart, cameraEnd } = sceneData;

    // Continuous ultra-slow cinematic camera push/pan
    this.gsap.killTweensOf(mediaEl);
    this.gsap.set(mediaEl, {
      scale: cameraStart.scale,
      xPercent: cameraStart.x,
      yPercent: cameraStart.y,
      transformOrigin: 'center center'
    });

    this.activeCameraTween = this.gsap.to(mediaEl, {
      scale: cameraEnd.scale,
      xPercent: cameraEnd.x,
      yPercent: cameraEnd.y,
      duration: this.sceneDuration + 2.2, // slightly longer than duration for seamless overlap
      ease: 'sine.inOut'
    });
  }

  startSceneCycle() {
    this.updateTimelineUI(this.currentIndex);
  }

  updateTimelineUI(index) {
    this.timelineBtns.forEach((btn, idx) => {
      const fill = btn.querySelector('.timeline-fill');
      if (this.gsap && fill) {
        this.gsap.killTweensOf(fill);
      }

      if (idx === index) {
        btn.classList.add('is-active');
        if (fill && this.gsap) {
          this.gsap.set(fill, { width: '0%' });
          this.activeProgressTween = this.gsap.to(fill, {
            width: '100%',
            duration: this.sceneDuration,
            ease: 'none',
            onComplete: () => {
              this.advanceNext();
            }
          });
        }
      } else {
        btn.classList.remove('is-active');
        if (fill && this.gsap) {
          this.gsap.set(fill, { width: idx < index ? '100%' : '0%' });
        }
      }
    });
  }

  advanceNext() {
    if (this.isTransitioning) return;
    const nextIdx = (this.currentIndex + 1) % this.scenes.length;
    this.goToScene(nextIdx);
  }

  goToScene(targetIndex) {
    if (this.isTransitioning || targetIndex === this.currentIndex) return;
    this.isTransitioning = true;

    if (this.activeProgressTween) {
      this.activeProgressTween.kill();
    }

    const currIdx = this.currentIndex;
    const nextIdx = targetIndex;
    this.currentIndex = nextIdx;

    const currEl = this.sceneEls[currIdx];
    const nextEl = this.sceneEls[nextIdx];
    const nextMedia = nextEl ? nextEl.querySelector('.hero-scene-media') : null;
    const currMedia = currEl ? currEl.querySelector('.hero-scene-media') : null;

    // 1. Text Exit Animation (fade out upward smoothly)
    this.animateTextOut(() => {
      // 2. Update text content
      this.updateTextContent(nextIdx);
      // 3. Staggered Text Entrance with precise luxury editorial timing
      this.animateTextIn(nextIdx, false);
    });

    // 4. Cinematic Scene Cross-Fade & Mask Reveal
    if (nextEl && currEl && this.gsap) {
      this.gsap.set(nextEl, {
        display: 'block',
        zIndex: 3,
        opacity: 0,
        filter: 'blur(8px)'
      });
      this.gsap.set(currEl, { zIndex: 2 });

      // Start next camera movement early with gentle zoom
      this.startCameraMovement(nextIdx, nextMedia);

      // Current scene continues gentle drift and softly fades out
      if (currMedia) {
        this.gsap.to(currMedia, {
          scale: '+=0.02',
          duration: 1.8,
          ease: 'power1.out'
        });
      }

      // Smooth luxury cross-dissolve with gentle blur-to-sharp transition
      this.gsap.to(nextEl, {
        opacity: 1,
        filter: 'blur(0px)',
        duration: 1.8,
        ease: 'power2.inOut',
        onComplete: () => {
          nextEl.classList.add('is-active');
          currEl.classList.remove('is-active');
          this.gsap.set(currEl, { display: 'none', opacity: 0, zIndex: 1 });
          this.gsap.set(nextEl, { zIndex: 2 });
          this.isTransitioning = false;
        }
      });

      this.gsap.to(currEl, {
        opacity: 0,
        duration: 1.6,
        delay: 0.2,
        ease: 'power2.inOut'
      });
    } else {
      this.isTransitioning = false;
    }

    // Update timeline progress bar for the new scene
    this.updateTimelineUI(nextIdx);
  }

  animateTextOut(onComplete) {
    if (!this.gsap) {
      if (onComplete) onComplete();
      return;
    }

    const textElements = [this.tagEl, this.titleEl, this.descEl, this.ctasEl].filter(Boolean);

    this.gsap.to(textElements, {
      opacity: 0,
      y: -14,
      duration: 0.45,
      stagger: 0.03,
      ease: 'power2.in',
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
  }

  updateTextContent(index) {
    const data = this.scenes[index];
    if (this.tagEl) this.tagEl.textContent = data.tag;
    if (this.titleEl) this.titleEl.innerHTML = data.title;
    if (this.descEl) this.descEl.textContent = data.desc;
  }

  animateTextIn(index, isFirst = false) {
    if (!this.gsap) return;

    // Reset initial text positions
    if (this.tagEl) this.gsap.set(this.tagEl, { opacity: 0, y: 15 });
    if (this.titleEl) this.gsap.set(this.titleEl, { opacity: 0, y: 22 });
    if (this.descEl) this.gsap.set(this.descEl, { opacity: 0, y: 18 });
    if (this.ctasEl) this.gsap.set(this.ctasEl, { opacity: 0, y: 18 });

    // Precise luxury timing requested:
    // 0.3 sec -> eyebrow/title appears
    // 0.5 sec -> main heading fades upward
    // 0.7 sec -> description appears
    // 0.9 sec -> CTA appears
    if (this.tagEl) {
      this.gsap.to(this.tagEl, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        delay: isFirst ? 0.3 : 0.3,
        ease: 'power3.out'
      });
    }

    if (this.titleEl) {
      this.gsap.to(this.titleEl, {
        opacity: 1,
        y: 0,
        duration: 0.95,
        delay: isFirst ? 0.5 : 0.5,
        ease: 'power3.out'
      });
    }

    if (this.descEl) {
      this.gsap.to(this.descEl, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        delay: isFirst ? 0.7 : 0.7,
        ease: 'power3.out'
      });
    }

    if (this.ctasEl) {
      this.gsap.to(this.ctasEl, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        delay: isFirst ? 0.9 : 0.9,
        ease: 'power3.out'
      });
    }
  }

  pauseTimer() {
    if (this.activeProgressTween) {
      this.activeProgressTween.pause();
    }
  }

  resumeTimer() {
    if (this.activeProgressTween) {
      this.activeProgressTween.resume();
    }
  }

  destroy() {
    if (this.activeProgressTween) this.activeProgressTween.kill();
    if (this.activeCameraTween) this.activeCameraTween.kill();
  }
}
