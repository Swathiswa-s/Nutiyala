/**
 * Aaradhya Clothing - Scroll Storytelling & Editorial Orchestration
 * Handles sticky navbar blur, IntersectionObserver reveals,
 * tailoring & window canvas sequence players, side mega-menu, and catalog filtering.
 */

import { CanvasSequencePlayer, generateFrameList } from './canvas-player.js';

export class ScrollStorytelling {
  constructor(options = {}) {
    this.products = options.products || [];
    this.onQuickView = options.onQuickView || null;
    this.onAddToCart = options.onAddToCart || null;
    this.onToggleWishlist = options.onToggleWishlist || null;
    this.isWishlisted = options.isWishlisted || (() => false);

    this.header = document.getElementById('siteHeader');
    this.sideMenu = document.getElementById('collectionsDrawer');
    this.sideMenuBackdrop = document.getElementById('collectionsBackdrop');
    this.sideMenuClose = document.getElementById('collectionsCloseBtn');
    this.collectionsTriggers = document.querySelectorAll('[data-open-collections]');

    this.catalogGrid = document.getElementById('productCatalogGrid');
    this.filterBtns = document.querySelectorAll('.cat-filter-btn');

    this.tailoringPlayer = null;
    this.heroPlayer = null;
    this.storyPlayer = null;
    this.aboutPlayer = null;

    this.currentCategory = 'all';

    this.init();
  }

  init() {
    this.initNavbarScroll();
    this.initSideMenu();
    this.initCatalogFilter();
    this.initEditorialCanvases();
    this.initScrollReveals();
    this.renderCatalog(this.currentCategory);
  }

  initNavbarScroll() {
    if (!this.header) return;
    const checkScroll = () => {
      if (window.scrollY > 40) {
        this.header.classList.add('navbar-scrolled');
      } else {
        this.header.classList.remove('navbar-scrolled');
      }
    };
    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
  }

  initSideMenu() {
    this.collectionsTriggers.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openSideMenu();
      });
    });

    if (this.sideMenuClose) {
      this.sideMenuClose.addEventListener('click', () => this.closeSideMenu());
    }
    if (this.sideMenuBackdrop) {
      this.sideMenuBackdrop.addEventListener('click', () => this.closeSideMenu());
    }

    // Category click inside side menu
    document.querySelectorAll('[data-filter-category]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const cat = link.dataset.filterCategory;
        this.closeSideMenu();
        this.setCategory(cat);
        const section = document.getElementById('collectionSection');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  openSideMenu() {
    if (this.sideMenu && this.sideMenuBackdrop) {
      this.sideMenu.classList.add('open');
      this.sideMenuBackdrop.classList.add('open');
      document.body.classList.add('drawer-open');
    }
  }

  closeSideMenu() {
    if (this.sideMenu && this.sideMenuBackdrop) {
      this.sideMenu.classList.remove('open');
      this.sideMenuBackdrop.classList.remove('open');
      document.body.classList.remove('drawer-open');
    }
  }

  initCatalogFilter() {
    this.filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.setCategory(btn.dataset.category || 'all');
      });
    });
  }

  setCategory(category) {
    this.currentCategory = category;
    // Sync button states
    this.filterBtns.forEach((btn) => {
      if (btn.dataset.category === category) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    this.renderCatalog(category);
  }

  renderCatalog(category = 'all') {
    if (!this.catalogGrid) return;

    let filtered = this.products;
    if (category === 'new-arrivals') {
      filtered = this.products.filter((p) => p.isNew);
    } else if (category === 'bestsellers') {
      filtered = this.products.filter((p) => p.isBestseller);
    } else if (category !== 'all') {
      filtered = this.products.filter((p) => p.category === category);
    }

    if (!filtered.length) {
      this.catalogGrid.innerHTML = `
        <div class="catalog-empty">
          <p>No handcrafted masterworks currently found in this category.</p>
        </div>
      `;
      return;
    }

    this.catalogGrid.innerHTML = filtered.map((item) => {
      const isSaved = this.isWishlisted(item.id);
      return `
        <article class="product-card" data-product-id="${item.id}">
          <div class="product-card-media">
            ${item.badge ? `<span class="product-badge">${item.badge}</span>` : ''}
            
            <button type="button" class="product-wishlist-btn ${isSaved ? 'active' : ''}" data-wishlist-id="${item.id}" aria-label="Save to Wishlist">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>

            <div class="product-image-container">
              <img src="${item.primaryImage}" alt="${item.name}" class="product-img primary-img" loading="lazy" />
              ${item.secondaryImage ? `
                <img src="${item.secondaryImage}" alt="${item.name} alternate view" class="product-img secondary-img" loading="lazy" />
              ` : ''}
            </div>

            <!-- Quick Action Hover Bar -->
            <div class="product-hover-actions">
              <button type="button" class="btn-card-quickview" data-qv-id="${item.id}">
                Quick View
              </button>
              <button type="button" class="btn-card-addbag" data-bag-id="${item.id}">
                Add to Bag
              </button>
            </div>
          </div>

          <div class="product-card-info">
            <span class="product-card-cat">${item.categoryName}</span>
            <h3 class="product-card-title">
              <a href="#quickview" data-qv-id="${item.id}">${item.name}</a>
            </h3>

            <div class="product-card-price-row">
              <span class="card-price">${item.formattedPrice}</span>
              ${item.formattedOriginalPrice ? `<span class="card-price-orig">${item.formattedOriginalPrice}</span>` : ''}
            </div>

            ${item.colors && item.colors.length ? `
              <div class="product-card-swatches">
                ${item.colors.map((c, i) => `
                  <span class="card-swatch ${i === 0 ? 'active' : ''}" style="background-color: ${c.hex};" title="${c.name}"></span>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');

    this.bindCardEvents();
  }

  bindCardEvents() {
    // Quick View buttons
    this.catalogGrid.querySelectorAll('[data-qv-id]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const id = el.dataset.qvId;
        const prod = this.products.find((p) => p.id === id);
        if (prod && this.onQuickView) {
          this.onQuickView(prod);
        }
      });
    });

    // Add to Bag buttons
    this.catalogGrid.querySelectorAll('[data-bag-id]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const id = el.dataset.bagId;
        const prod = this.products.find((p) => p.id === id);
        if (prod && this.onAddToCart) {
          const defaultSize = prod.sizes && prod.sizes.length ? prod.sizes[0] : 'M';
          const defaultColor = prod.colors && prod.colors.length ? prod.colors[0].name : null;
          this.onAddToCart(prod, defaultSize, defaultColor, 1);
        }
      });
    });

    // Wishlist buttons
    this.catalogGrid.querySelectorAll('[data-wishlist-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.wishlistId;
        const prod = this.products.find((p) => p.id === id);
        if (prod && this.onToggleWishlist) {
          const isNowSaved = this.onToggleWishlist(prod);
          if (isNowSaved) {
            btn.classList.add('active');
            btn.querySelector('svg').setAttribute('fill', 'currentColor');
          } else {
            btn.classList.remove('active');
            btn.querySelector('svg').setAttribute('fill', 'none');
          }
        }
      });
    });
  }

  initEditorialCanvases() {
    // 1. Hero Window Video Canvas (4K UHD 3840×2160 16:9 fashion sequence from assets/window)
    const heroCanvas = document.getElementById('heroCanvas');
    if (heroCanvas) {
      const windowFrames = generateFrameList('window', 62, 'aspose_video_134346631091478633_out', 'jpg', 4);

      // Intelligent focal positioning:
      // On landscape/desktop, center the 16:9 composition naturally.
      // On portrait/mobile, shift focal to keep the model & garment visible.
      const isPortrait = window.innerHeight > window.innerWidth;
      const heroFocalX = isPortrait ? 0.5 : 0.5;   // centered horizontally always
      const heroFocalY = isPortrait ? 0.35 : 0.5;   // on mobile, bias upward to keep model's face/torso

      this.heroPlayer = new CanvasSequencePlayer({
        canvas: heroCanvas,
        frames: windowFrames,
        fps: 8, // slow-motion editorial pacing
        loop: true,
        yoyo: true, // seamless continuous oscillation
        blend: true, // sub-frame cross-dissolve
        fit: 'cover',
        focalX: heroFocalX,
        focalY: heroFocalY
      });
      this.heroPlayer.play();

      // Update focal point on orientation change
      window.addEventListener('resize', () => {
        if (this.heroPlayer) {
          const portrait = window.innerHeight > window.innerWidth;
          this.heroPlayer.focalY = portrait ? 0.35 : 0.5;
        }
      });
    }

    // 2. Tailoring & Craftsmanship Canvas (720x1280 tailoring sequence from assets/tailoring)
    const tailoringCanvas = document.getElementById('tailoringCanvas');
    if (tailoringCanvas) {
      const tailoringFrames = generateFrameList('tailoring', 52, 'aspose_video_134346559696189503_out', 'jpg', 4);
      this.tailoringPlayer = new CanvasSequencePlayer({
        canvas: tailoringCanvas,
        frames: tailoringFrames,
        fps: 8,
        loop: true,
        yoyo: true,
        blend: true,
        fit: 'cover',
        focalX: 0.5,
        focalY: 0.4
      });

      // Play when in view to save resources
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.tailoringPlayer.play();
          } else {
            this.tailoringPlayer.pause();
          }
        });
      }, { threshold: 0.15 });

      observer.observe(tailoringCanvas);
    }

    // 3. Second Brand Story Canvas (assets/campaign from documents (6).zip)
    const storyCanvas = document.getElementById('storyCanvas');
    if (storyCanvas) {
      const campaignFrames = generateFrameList('campaign', 52, 'aspose_video_134346598059049370_out', 'jpg', 4);
      this.storyPlayer = new CanvasSequencePlayer({
        canvas: storyCanvas,
        frames: campaignFrames,
        fps: 8,
        loop: true,
        yoyo: true,
        blend: true,
        fit: 'cover',
        focalX: 0.5,
        focalY: 0.5
      });

      const storyObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.storyPlayer.play();
          } else {
            this.storyPlayer.pause();
          }
        });
      }, { threshold: 0.15 });

      storyObserver.observe(storyCanvas);
    }

    // 4. About Section Canvas (assets/window sequence — same Haveli colonnade)
    const aboutCanvas = document.getElementById('aboutCanvas');
    if (aboutCanvas) {
      const aboutFrames = generateFrameList('window', 62, 'aspose_video_134346631091478633_out', 'jpg', 4);
      this.aboutPlayer = new CanvasSequencePlayer({
        canvas: aboutCanvas,
        frames: aboutFrames,
        fps: 8,
        loop: true,
        yoyo: true,
        blend: true,
        fit: 'cover',
        focalX: 0.5,
        focalY: 0.45
      });

      const aboutObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.aboutPlayer.play();
          } else {
            this.aboutPlayer.pause();
          }
        });
      }, { threshold: 0.15 });

      aboutObserver.observe(aboutCanvas);
    }
  }

  initScrollReveals() {
    const revealElements = document.querySelectorAll('.scroll-reveal, .editorial-quote, .craft-text-col, .story-text-col');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach((el) => observer.observe(el));
  }
}
