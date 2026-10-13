/* ==========================================================================
   AARADHYA • GSAP SCROLL-TRIGGERED MOTION SYSTEM
   Cinematic scroll animations, parallax, text reveals, image masks
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Bail out if GSAP or ScrollTrigger are not loaded
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  // Respect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  // ==========================================================================
  // LOADING SEQUENCE
  // ==========================================================================
  const loadTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

  loadTimeline
    .from('.brand-logo', { opacity: 0, x: -30, duration: 0.7, clearProps: 'all' })
    .from('.nav-link', { opacity: 0, y: -15, stagger: 0.06, duration: 0.5, clearProps: 'all' }, '-=0.3')
    .from('.header-icon-btn', { opacity: 0, scale: 0.7, stagger: 0.05, duration: 0.4, clearProps: 'all' }, '-=0.3')
    .from('.hero-top-card', { opacity: 0, duration: 0.9, clearProps: 'all' }, '-=0.4')
    .from('.hero-badge', { opacity: 0, y: 20, duration: 0.5, clearProps: 'all' }, '-=0.4')
    .from('.hero-title', { opacity: 0, y: 35, duration: 0.7, clearProps: 'all' }, '-=0.3')
    .from('.hero-subtitle', { opacity: 0, y: 25, duration: 0.5, clearProps: 'all' }, '-=0.3')
    .from('.hero-cta-group', { opacity: 0, y: 20, duration: 0.5, clearProps: 'all' }, '-=0.2');

  // ==========================================================================
  // GENERIC FADE-UP REVEALS for [data-reveal="fade-up"]
  // ==========================================================================
  gsap.utils.toArray('[data-reveal="fade-up"]').forEach((el) => {
    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        end: 'top 50%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: 50,
      duration: 0.9,
      ease: 'power3.out'
    });
  });

  // ==========================================================================
  // IMAGE MASK REVEALS for [data-reveal="mask-left"] and [data-reveal="mask-right"]
  // ==========================================================================
  gsap.utils.toArray('[data-reveal="mask-left"], [data-reveal="mask-right"]').forEach((el) => {
    const direction = el.dataset.reveal === 'mask-left' ? -1 : 1;
    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        end: 'top 40%',
        toggleActions: 'play none none none'
      },
      clipPath: direction > 0
        ? 'inset(0% 100% 0% 0%)'
        : 'inset(0% 0% 0% 100%)',
      opacity: 0,
      duration: 1.1,
      ease: 'power4.out',
      clearProps: 'clipPath'
    });
  });

  // ==========================================================================
  // HERO PARALLAX (Subtle Ken Burns on scroll)
  // ==========================================================================
  const heroCard = document.querySelector('.hero-top-card');
  const heroVideo = document.querySelector('.hero-video');
  if (heroCard && heroVideo) {
    gsap.to(heroVideo, {
      scrollTrigger: {
        trigger: heroCard,
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      },
      scale: 1.12,
      y: 60,
      ease: 'none'
    });

    // Hero text parallax
    gsap.to('.hero-overlay-content', {
      scrollTrigger: {
        trigger: heroCard,
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      },
      y: -50,
      opacity: 0.3,
      ease: 'none'
    });
  }

  // ==========================================================================
  // STORY SECTION ANIMATIONS
  // ==========================================================================
  const storySection = document.querySelector('.story-section');
  if (storySection) {
    // Animate story text elements sequentially
    const storyTl = gsap.timeline({
      scrollTrigger: {
        trigger: storySection,
        start: 'top 75%',
        end: 'top 30%',
        toggleActions: 'play none none none'
      }
    });

    storyTl
      .from('.story-section .section-subtitle', { opacity: 0, x: -30, duration: 0.6 })
      .from('.story-section .section-heading', { opacity: 0, y: 30, duration: 0.7 }, '-=0.3')
      .from('.story-section .story-lead', { opacity: 0, y: 20, duration: 0.5 }, '-=0.3')
      .from('.story-section .story-body', { opacity: 0, y: 20, duration: 0.5 }, '-=0.2')
      .from('.story-section .highlight-item', { opacity: 0, y: 25, stagger: 0.15, duration: 0.5 }, '-=0.2')
      .from('.story-section .story-cta-wrap', { opacity: 0, y: 15, duration: 0.4 }, '-=0.1');

    // Story image parallax
    gsap.to('.story-main-img', {
      scrollTrigger: {
        trigger: '.story-image-frame',
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: 1
      },
      y: -30,
      ease: 'none'
    });
  }

  // ==========================================================================
  // CATEGORY SECTION
  // ==========================================================================
  const categorySection = document.querySelector('.category-section');
  if (categorySection) {
    gsap.from('.category-card', {
      scrollTrigger: {
        trigger: '.category-accordion-container',
        start: 'top 82%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: 60,
      stagger: 0.12,
      duration: 0.8,
      ease: 'power3.out'
    });
  }

  // ==========================================================================
  // LOOKBOOK SECTION - Staggered entry
  // ==========================================================================
  const lookbookSection = document.querySelector('.lookbook-section');
  if (lookbookSection) {
    const lbTl = gsap.timeline({
      scrollTrigger: {
        trigger: lookbookSection,
        start: 'top 90%',
        toggleActions: 'play none none none',
        onComplete: () => {
          gsap.set('.lookbook-satellites-left .satellite-card, .model-image-wrapper, .lookbook-satellites-right .satellite-card, .lookbook-details-card', { clearProps: 'all' });
        }
      }
    });

    lbTl
      .from('.lookbook-satellites-left .satellite-card', {
        opacity: 0,
        x: -40,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power3.out',
        clearProps: 'all'
      })
      .from('.model-image-wrapper', {
        opacity: 0,
        scale: 0.95,
        duration: 0.7,
        ease: 'power3.out',
        clearProps: 'all'
      }, '-=0.4')
      .from('.lookbook-satellites-right .satellite-card', {
        opacity: 0,
        x: 40,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power3.out',
        clearProps: 'all'
      }, '-=0.5')
      .from('.lookbook-details-card', {
        opacity: 0,
        y: 25,
        duration: 0.6,
        ease: 'power3.out',
        clearProps: 'all'
      }, '-=0.4');
  }

  // ==========================================================================
  // PRODUCT GRID - Unified clean row entry (All cards aligned on same line)
  // ==========================================================================
  gsap.from('.product-card', {
    scrollTrigger: {
      trigger: '.product-grid',
      start: 'top 88%',
      toggleActions: 'play none none none'
    },
    opacity: 0,
    duration: 0.5,
    ease: 'power2.out',
    clearProps: 'all'
  });

  // ==========================================================================
  // CRAFTSMANSHIP SECTION - Parallax Background + Staggered Steps
  // ==========================================================================
  const craftSection = document.querySelector('.craftsmanship-banner-section');
  if (craftSection) {
    gsap.to('.craftsmanship-bg-img', {
      scrollTrigger: {
        trigger: craftSection,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1
      },
      y: -60,
      scale: 1.08,
      ease: 'none'
    });

    gsap.from('.craft-step-card', {
      scrollTrigger: {
        trigger: '.craft-steps-grid',
        start: 'top 92%',
        toggleActions: 'play none none none',
        onComplete: () => {
          gsap.set('.craft-step-card', { clearProps: 'all' });
        }
      },
      opacity: 0,
      y: 25,
      stagger: 0.08,
      duration: 0.5,
      ease: 'power2.out',
      clearProps: 'all'
    });
  }

  // ==========================================================================
  // EDITORIAL STATEMENT - Large Typography Scroll Animation
  // ==========================================================================
  const statementSection = document.querySelector('.editorial-statement-section');
  if (statementSection) {
    // Typography pinch-in
    const statementTl = gsap.timeline({
      scrollTrigger: {
        trigger: statementSection,
        start: 'top 70%',
        toggleActions: 'play none none none'
      }
    });

    statementTl
      .from('.statement-eyebrow', { opacity: 0, y: 20, duration: 0.5 })
      .from('.statement-main', {
        opacity: 0,
        y: 50,
        clipPath: 'inset(100% 0% 0% 0%)',
        duration: 1,
        ease: 'power4.out',
        clearProps: 'clipPath'
      }, '-=0.2')
      .from('.statement-sub', { opacity: 0, y: 20, duration: 0.5 }, '-=0.3');

    // Statement image parallax
    gsap.to('.statement-model-img', {
      scrollTrigger: {
        trigger: '.statement-img-pod',
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: 1
      },
      y: -40,
      ease: 'none'
    });
  }

  // ==========================================================================
  // MARQUEE TICKER - Speed up on scroll
  // ==========================================================================
  const tickerTrack = document.querySelector('.statement-ticker-track');
  if (tickerTrack) {
    gsap.to('.ticker-inner', {
      scrollTrigger: {
        trigger: tickerTrack,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.5
      },
      x: '-=200',
      ease: 'none'
    });
  }

  // ==========================================================================
  // HORIZONTAL STORYTELLING CARDS - Staggered reveal
  // ==========================================================================
  gsap.from('.story-chapter-card', {
    scrollTrigger: {
      trigger: '.storytelling-track',
      start: 'top 82%',
      toggleActions: 'play none none none'
    },
    opacity: 0,
    x: 80,
    stagger: 0.15,
    duration: 0.8,
    ease: 'power3.out'
  });

  // ==========================================================================
  // COMMUNITY GALLERY - Staggered Reveal
  // ==========================================================================
  gsap.from('.gallery-item', {
    scrollTrigger: {
      trigger: '.community-gallery-grid',
      start: 'top 85%',
      toggleActions: 'play none none none'
    },
    opacity: 0,
    y: 40,
    scale: 0.94,
    stagger: 0.1,
    duration: 0.7,
    ease: 'power3.out'
  });

  // ==========================================================================
  // PHILOSOPHY - Elegant text reveal
  // ==========================================================================
  const philosophySection = document.querySelector('.philosophy-section');
  if (philosophySection) {
    const philTl = gsap.timeline({
      scrollTrigger: {
        trigger: philosophySection,
        start: 'top 68%',
        toggleActions: 'play none none none'
      }
    });

    philTl
      .from('.philosophy-watermark', { opacity: 0, scale: 0.5, duration: 0.7 })
      .from('.philosophy-text', {
        opacity: 0,
        y: 40,
        duration: 0.9,
        ease: 'power3.out'
      }, '-=0.3')
      .from('.philosophy-sub', { opacity: 0, y: 20, duration: 0.5 }, '-=0.2')
      .from('.botanical-gold-divider', {
        opacity: 0,
        scaleX: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, '-=0.2');
  }

  // ==========================================================================
  // FINAL CTA
  // ==========================================================================
  const finalCta = document.querySelector('.final-cta-section');
  if (finalCta) {
    const ctaTl = gsap.timeline({
      scrollTrigger: {
        trigger: finalCta,
        start: 'top 72%',
        toggleActions: 'play none none none'
      }
    });

    ctaTl
      .from('.cta-eyebrow', { opacity: 0, y: 20, duration: 0.5 })
      .from('.cta-heading', { opacity: 0, y: 40, duration: 0.8 }, '-=0.2')
      .from('.cta-body', { opacity: 0, y: 20, duration: 0.5 }, '-=0.3')
      .from('.cta-button-row', { opacity: 0, y: 25, duration: 0.5 }, '-=0.2')
      .from('.cta-guarantees span', { opacity: 0, y: 15, stagger: 0.1, duration: 0.4 }, '-=0.2');
  }

  // ==========================================================================
  // FOOTER STAGGERED ENTRY
  // ==========================================================================
  const footer = document.querySelector('.site-footer');
  if (footer) {
    gsap.from('.footer-grid > *', {
      scrollTrigger: {
        trigger: footer,
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: 30,
      stagger: 0.12,
      duration: 0.7,
      ease: 'power3.out'
    });
  }

  // ==========================================================================
  // MAGNETIC BUTTONS (Desktop Only)
  // ==========================================================================
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.magnetic-btn').forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, {
          x: x * 0.25,
          y: y * 0.25,
          duration: 0.35,
          ease: 'power2.out'
        });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  // ==========================================================================
  // GOLD HAIRLINE DRAW ANIMATION
  // ==========================================================================
  document.querySelectorAll('.gold-hairline').forEach((line) => {
    gsap.from(line, {
      scrollTrigger: {
        trigger: line,
        start: 'top 90%',
        toggleActions: 'play none none none'
      },
      scaleX: 0,
      duration: 0.8,
      ease: 'power3.out'
    });
  });

  // ==========================================================================
  // SECTION HEADING CHARACTER SPLIT ANIMATION (EDITORIAL FEEL)
  // ==========================================================================
  document.querySelectorAll('.section-heading').forEach((heading) => {
    // Split words for stagger
    const words = heading.textContent.trim().split(/\s+/);
    if (words.length > 1 && !heading.closest('[data-reveal]')) {
      heading.innerHTML = words.map(w => `<span class="heading-word">${w}</span>`).join(' ');
      gsap.from(heading.querySelectorAll('.heading-word'), {
        scrollTrigger: {
          trigger: heading,
          start: 'top 88%',
          toggleActions: 'play none none none'
        },
        opacity: 0,
        y: 30,
        stagger: 0.06,
        duration: 0.7,
        ease: 'power3.out'
      });
    }
  });

  // ==========================================================================
  // NAV LINK ACTIVE STATE ON SCROLL
  // ==========================================================================
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  sections.forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => setActiveNav(section.id),
      onEnterBack: () => setActiveNav(section.id)
    });
  });

  function setActiveNav(sectionId) {
    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href === '#' + sectionId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  console.log('✦ Aaradhya GSAP Motion System initialized');
});
