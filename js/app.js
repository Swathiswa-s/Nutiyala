/* ==========================================================================
   AARADHYA • LUXURY FASHION BOUTIQUE
   Interactive Experience & Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // State Management
  const state = {
    cart: [
      {
        id: 'p4',
        title: 'Beige Embroidered Kurti',
        size: 'M',
        color: 'Champagne Beige',
        price: 1399,
        quantity: 1,
        image: 'assets/model-beige.jpg'
      }
    ],
    wishlist: [],
    discountCode: 'AURA2026',
    discountRate: 0.15,
    freeShippingThreshold: 5000,
    currentLook: 'beige',
    selectedSize: 'M'
  };

  // ==========================================================================
  // COMPREHENSIVE VIRTUAL FITTING CATALOG BY CATEGORY
  // ==========================================================================
  const lookbookCatalog = {
    'hijabs-shawls': [
      {
        id: 'hs1',
        title: 'Pure Silk Luxury Hijab',
        categoryName: 'Hijabs & Shawls',
        categoryKey: 'hijabs-shawls',
        price: 1299,
        origPrice: 1750,
        discount: '25% OFF',
        colorName: 'Desert Gold Silk',
        swatchColor: '#D4AF37',
        image: 'assets/luxury_hijab.png',
        modelImage: 'assets/luxury_hijab.png',
        desc: 'Pure mulberry silk drape with handcrafted micro-zardozi borders and featherlight head veil, styled on our muse for sublime modesty and luxury.',
        craftHours: '65 Craft Hours • Pure Mulberry Silk',
        objectPosition: 'center 12%'
      },
      {
        id: 'hs2',
        title: 'Heritage Pashmina Gold Shawl',
        categoryName: 'Hijabs & Shawls',
        categoryKey: 'hijabs-shawls',
        price: 1899,
        origPrice: 2450,
        discount: '22% OFF',
        colorName: 'Antique Amber',
        swatchColor: '#C59A45',
        image: 'assets/luxury_shawl.png',
        modelImage: 'assets/luxury_shawl.png',
        desc: 'Woven royal Kashmiri pashmina with intricate gold zari jaal and antique Mughal medallion borders, draped over bespoke atelier wear.',
        craftHours: '120 Craft Hours • Hand-loomed Pashmina',
        objectPosition: 'center 10%'
      }
    ],
    'kurti': [
      {
        id: 'k1',
        title: 'Emerald Green Embroidered Kurti',
        categoryName: 'Kurti',
        categoryKey: 'kurti',
        price: 1499,
        origPrice: 1999,
        discount: '25% OFF',
        colorName: 'Royal Emerald',
        swatchColor: '#1A4D3E',
        image: 'assets/emerald_green.png',
        modelImage: 'assets/emerald_green.png',
        desc: 'Handcrafted raw silk kurti adorned with intricate dabka necklines, hand-cut scallop hem, and regal zardozi embellishments.',
        craftHours: '180 Craft Hours • Raw Silk & Zardozi',
        objectPosition: 'center 8%'
      },
      {
        id: 'k2',
        title: 'Terracotta Raw Silk Kurti',
        categoryName: 'Kurti',
        categoryKey: 'kurti',
        price: 1599,
        origPrice: 2199,
        discount: '27% OFF',
        colorName: 'Imperial Terracotta',
        swatchColor: '#A85138',
        image: 'assets/category-kurtis.jpg',
        modelImage: 'assets/category-kurtis.jpg',
        desc: 'Terracotta raw silk with handcrafted gold zardozi neckline and sheer dupatta, inspired by the cinematic fashion atelier film.',
        craftHours: '140 Craft Hours • Botanical Dye Silk',
        objectPosition: 'center 15%'
      },
      {
        id: 'k3',
        title: 'Chanderi Gold Leaf Kurti',
        categoryName: 'Kurti',
        categoryKey: 'kurti',
        price: 1449,
        origPrice: 1950,
        discount: '26% OFF',
        colorName: 'Forest Green',
        swatchColor: '#2D5A46',
        image: 'assets/product-emerald.jpg',
        modelImage: 'assets/product-emerald.jpg',
        desc: 'Breathable pure chanderi with hand-block printed botanical accents and delicate antique gota highlights.',
        craftHours: '95 Craft Hours • Chanderi Weave',
        objectPosition: 'center 12%'
      }
    ],
    'festival-wear-kurti': [
      {
        id: 'fw1',
        title: 'Maroon Velvet Festival Kurti',
        categoryName: 'Festival Wear Kurti',
        categoryKey: 'festival-wear-kurti',
        price: 1899,
        origPrice: 2499,
        discount: '24% OFF',
        colorName: 'Royal Velvet Maroon',
        swatchColor: '#5A1E28',
        image: 'assets/maroon_velvet.png',
        modelImage: 'assets/maroon_velvet.png',
        desc: 'Opulent silk velvet festival ensemble enriched with royal dabka, tilla, sequins, and heritage gota needlework.',
        craftHours: '210 Craft Hours • Silk Velvet & Dabka',
        objectPosition: 'center 10%'
      },
      {
        id: 'fw2',
        title: 'Noorani Ivory Royal Anarkali',
        categoryName: 'Festival Wear Kurti',
        categoryKey: 'festival-wear-kurti',
        price: 2499,
        origPrice: 3200,
        discount: '22% OFF',
        colorName: 'Ivory Gold Zari',
        swatchColor: '#E6DCB8',
        image: 'assets/model-anarkali-full.jpg',
        modelImage: 'assets/model-anarkali-full.jpg',
        desc: 'Heirloom champagne ivory floor-sweeping festive kurti with 32 hand-pleated kalis and Banarasi brocade border.',
        craftHours: '280 Craft Hours • 32-Kali Banarasi',
        objectPosition: 'center 15%'
      },
      {
        id: 'fw3',
        title: 'Champagne Gold Festive Gown',
        categoryName: 'Festival Wear Kurti',
        categoryKey: 'festival-wear-kurti',
        price: 2299,
        origPrice: 2999,
        discount: '23% OFF',
        colorName: 'Gilded Champagne',
        swatchColor: '#D8B982',
        image: 'assets/category-single.jpg',
        modelImage: 'assets/category-single.jpg',
        desc: 'Tissue organza flared festive kurti styled with antique brocade and a celestial gold zardozi veil.',
        craftHours: '230 Craft Hours • Tissue Organza',
        objectPosition: 'center 12%'
      }
    ],
    'casual-coords': [
      {
        id: 'cc1',
        title: 'Tailored Navy Casual Co-ords',
        categoryName: 'Casual Co-ords',
        categoryKey: 'casual-coords',
        price: 1699,
        origPrice: 2200,
        discount: '23% OFF',
        colorName: 'Midnight Navy',
        swatchColor: '#1A2E40',
        image: 'assets/navy_coord.png',
        modelImage: 'assets/navy_coord.png',
        desc: 'Tailored royal navy two-piece coordinated set with structured tunic lapel and tapered trousers for modern elegance.',
        craftHours: '85 Craft Hours • Structured Weave',
        objectPosition: 'center 12%'
      },
      {
        id: 'cc2',
        title: 'Espresso Velvet Tailored Co-ord',
        categoryName: 'Casual Co-ords',
        categoryKey: 'casual-coords',
        price: 1999,
        origPrice: 2600,
        discount: '23% OFF',
        colorName: 'Espresso Bronze',
        swatchColor: '#3A2418',
        image: 'assets/category-coord.jpg',
        modelImage: 'assets/category-coord.jpg',
        desc: 'Bespoke espresso brown velvet jacket and fluid palazzo set with royal Mughal botanical embroidery.',
        craftHours: '160 Craft Hours • Velvet Tailoring',
        objectPosition: 'center 15%'
      },
      {
        id: 'cc3',
        title: 'Sapphire Linen Everyday Co-ord',
        categoryName: 'Casual Co-ords',
        categoryKey: 'casual-coords',
        price: 1599,
        origPrice: 2100,
        discount: '24% OFF',
        colorName: 'Sapphire Blue',
        swatchColor: '#243A5E',
        image: 'assets/product-navy.jpg',
        modelImage: 'assets/product-navy.jpg',
        desc: 'Pure breathable linen blend relaxed co-ord suit with contrast thread detailing and brass button accents.',
        craftHours: '70 Craft Hours • Organic Linen',
        objectPosition: 'center 10%'
      }
    ],
    'daily-wear-kurtis': [
      {
        id: 'dw1',
        title: 'Champagne Beige Daily Kurti',
        categoryName: 'Daily Wear Kurtis',
        categoryKey: 'daily-wear-kurtis',
        price: 1399,
        origPrice: 1899,
        discount: '26% OFF',
        colorName: 'Champagne Beige',
        swatchColor: '#D9C3A5',
        image: 'assets/beige_kurti.png',
        modelImage: 'assets/beige_kurti.png',
        desc: 'Understated ivory & sand silhouettes crafted in breathable weaves for everyday grace, comfort, and effortless poise.',
        craftHours: '90 Craft Hours • Breathable Mulberry Silk',
        objectPosition: 'center 10%'
      },
      {
        id: 'dw2',
        title: 'Sand Cotton Embroidered Kurti',
        categoryName: 'Daily Wear Kurtis',
        categoryKey: 'daily-wear-kurtis',
        price: 1299,
        origPrice: 1750,
        discount: '26% OFF',
        colorName: 'Warm Sand',
        swatchColor: '#C2B29A',
        image: 'assets/model-beige.jpg',
        modelImage: 'assets/model-beige.jpg',
        desc: 'Soft organic cotton mulmul tunic with delicate floral thread embroidery on the neckline and cuff slits.',
        craftHours: '75 Craft Hours • Hand-spun Mulmul',
        objectPosition: 'center 12%'
      }
    ]
  };

  // Build 'all' Outfits Collection
  lookbookCatalog['all'] = [
    lookbookCatalog['hijabs-shawls'][0],
    lookbookCatalog['kurti'][0],
    lookbookCatalog['festival-wear-kurti'][0],
    lookbookCatalog['casual-coords'][0],
    lookbookCatalog['daily-wear-kurtis'][0],
    lookbookCatalog['hijabs-shawls'][1]
  ];

  // Flat lookup dictionary for modal, cart, and compatibility
  const products = {};
  Object.values(lookbookCatalog).flat().forEach((item) => {
    products[item.id] = item;
  });
  // Maintain backward-compatible keys
  products.beige = products.dw1;
  products.maroon = products.fw1;
  products.emerald = products.k1;
  products.navy = products.cc1;



  // ==========================================================================
  // 2. STICKY HEADER TRANSFORMATION
  // ==========================================================================
  const siteHeader = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      siteHeader.classList.add('scrolled');
    } else {
      siteHeader.classList.remove('scrolled');
    }
  }, { passive: true });

  // ==========================================================================
  // 2. ATELIER LEFT SIDEBAR NAVIGATION DRAWER (Three-Dash Menu)
  // ==========================================================================
  const headerMenuToggle = document.getElementById('header-menu-toggle') || document.getElementById('mobile-toggle');
  const leftSidebar = document.getElementById('atelier-left-sidebar') || document.getElementById('mobile-drawer');
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn') || document.getElementById('drawer-close-btn');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');

  const openSidebar = () => {
    if (leftSidebar) {
      leftSidebar.classList.add('open');
      leftSidebar.setAttribute('aria-hidden', 'false');
    }
    if (sidebarBackdrop) {
      sidebarBackdrop.classList.add('active');
      sidebarBackdrop.setAttribute('aria-hidden', 'false');
    }
    if (headerMenuToggle) {
      headerMenuToggle.setAttribute('aria-expanded', 'true');
    }
    document.body.classList.add('sidebar-drawer-open');
    if (window.lucide) {
      window.lucide.createIcons();
    }
  };

  const closeSidebar = () => {
    if (leftSidebar) {
      leftSidebar.classList.remove('open');
      leftSidebar.setAttribute('aria-hidden', 'true');
    }
    if (sidebarBackdrop) {
      sidebarBackdrop.classList.remove('active');
      sidebarBackdrop.setAttribute('aria-hidden', 'true');
    }
    if (headerMenuToggle) {
      headerMenuToggle.setAttribute('aria-expanded', 'false');
    }
    document.body.classList.remove('sidebar-drawer-open');
  };

  if (headerMenuToggle) {
    headerMenuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (leftSidebar && leftSidebar.classList.contains('open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', closeSidebar);
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeSidebar);
  }

  // Close when clicking any nav link inside sidebar
  if (leftSidebar) {
    leftSidebar.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeSidebar();
      });
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && leftSidebar && leftSidebar.classList.contains('open')) {
      closeSidebar();
    }
  });

  // ==========================================================================
  // 3. TOP HERO CINEMATIC VIDEO PLAYER CONTROLS
  // ==========================================================================
  const heroVideo = document.getElementById('hero-video');
  const videoPlayToggle = document.getElementById('video-play-toggle');
  const playPauseIcon = document.getElementById('play-pause-icon');
  const videoCurrentTime = document.getElementById('video-current-time');
  const videoDuration = document.getElementById('video-duration');
  const videoScrubberTrack = document.getElementById('video-scrubber-track');
  const videoScrubberFill = document.getElementById('video-scrubber-fill');
  const videoScrubberThumb = document.getElementById('video-scrubber-thumb');
  const videoMuteToggle = document.getElementById('video-mute-toggle');
  const volumeIcon = document.getElementById('volume-icon');
  const videoFullscreenBtn = document.getElementById('video-fullscreen-btn');
  const heroWatchBtn = document.getElementById('hero-watch-btn');
  const videoTheaterModal = document.getElementById('video-theater-modal');
  const theaterVideo = document.getElementById('theater-video');
  const theaterCloseBtn = document.getElementById('theater-close-btn');
  const theaterBackdrop = document.getElementById('theater-backdrop');

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (heroVideo) {
    // Ensure video runs continuously on loop without timer
    heroVideo.play().catch(() => {});

    heroVideo.addEventListener('loadedmetadata', () => {
      if (videoDuration && !isNaN(heroVideo.duration)) {
        videoDuration.textContent = formatTime(heroVideo.duration);
      }
    });

    heroVideo.addEventListener('timeupdate', () => {
      if (!isNaN(heroVideo.duration)) {
        const percent = (heroVideo.currentTime / heroVideo.duration) * 100;
        if (videoScrubberFill) videoScrubberFill.style.width = `${percent}%`;
        if (videoScrubberThumb) videoScrubberThumb.style.left = `${percent}%`;
        if (videoCurrentTime) videoCurrentTime.textContent = formatTime(heroVideo.currentTime);
      }
    });

    // Play / Pause Toggle
    if (videoPlayToggle) {
      videoPlayToggle.addEventListener('click', () => {
        if (heroVideo.paused) {
          heroVideo.play();
          videoPlayToggle.innerHTML = '<i data-lucide="pause"></i>';
        } else {
          heroVideo.pause();
          videoPlayToggle.innerHTML = '<i data-lucide="play"></i>';
        }
        if (window.lucide) lucide.createIcons();
      });
    }

    // Interactive Scrubber Drag / Click
    if (videoScrubberTrack) {
      let isDragging = false;

      const seek = (e) => {
        const rect = videoScrubberTrack.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const fraction = clickX / rect.width;
        if (!isNaN(heroVideo.duration)) {
          heroVideo.currentTime = fraction * heroVideo.duration;
        }
      };

      videoScrubberTrack.addEventListener('mousedown', (e) => {
        isDragging = true;
        seek(e);
      });

      window.addEventListener('mousemove', (e) => {
        if (isDragging) seek(e);
      });

      window.addEventListener('mouseup', () => {
        isDragging = false;
      });
    }

    // Mute / Unmute
    if (videoMuteToggle) {
      videoMuteToggle.addEventListener('click', () => {
        heroVideo.muted = !heroVideo.muted;
        if (heroVideo.muted) {
          videoMuteToggle.innerHTML = '<i data-lucide="volume-x"></i>';
          showToast('Video muted');
        } else {
          videoMuteToggle.innerHTML = '<i data-lucide="volume-2"></i>';
          showToast('Sound enabled');
        }
        if (window.lucide) lucide.createIcons();
      });
    }

    // Fullscreen / Theater
    if (videoFullscreenBtn) {
      videoFullscreenBtn.addEventListener('click', () => {
        if (videoTheaterModal && theaterVideo) {
          videoTheaterModal.classList.add('open');
          theaterVideo.currentTime = heroVideo.currentTime;
          theaterVideo.play();
        }
      });
    }

    // "Watch Our Story" CTA opens theater
    if (heroWatchBtn) {
      heroWatchBtn.addEventListener('click', () => {
        if (videoTheaterModal && theaterVideo) {
          videoTheaterModal.classList.add('open');
          theaterVideo.play();
        }
      });
    }

    // Close theater
    const closeTheater = () => {
      if (videoTheaterModal && theaterVideo) {
        videoTheaterModal.classList.remove('open');
        theaterVideo.pause();
      }
    };

    if (theaterCloseBtn) theaterCloseBtn.addEventListener('click', closeTheater);
    if (theaterBackdrop) theaterBackdrop.addEventListener('click', closeTheater);

    const openProcessVideoBtn = document.getElementById('open-process-video-btn');
    if (openProcessVideoBtn) {
      openProcessVideoBtn.addEventListener('click', () => {
        if (videoTheaterModal && theaterVideo) {
          videoTheaterModal.classList.add('open');
          theaterVideo.play();
        }
      });
    }
  }

  // ==========================================================================
  // 4. INNOVATIVE VIRTUAL FITTING ROOM ("ONE GIRL, MANY STYLES")
  // ==========================================================================
  const centralModelImg = document.getElementById('central-model-img');
  if (centralModelImg) {
    const modelImgWrapper = document.getElementById('model-img-wrapper');
  const silkShimmerSweep = document.getElementById('silk-shimmer-sweep');
  const modelWornTitle = document.getElementById('model-worn-title');
  const hudCategoryTag = document.getElementById('hud-category-tag');
  const satellitesLeft = document.getElementById('satellites-left');
  const satellitesRight = document.getElementById('satellites-right');
  const categoryPills = document.querySelectorAll('.fitting-category-btn');
  const modelPrevBtn = document.getElementById('model-prev-btn');
  const modelNextBtn = document.getElementById('model-next-btn');

  // Configurator details elements
  const lbTitle = document.getElementById('lb-title');
  const lbPrice = document.getElementById('lb-price');
  const lbOrigPrice = document.getElementById('lb-orig-price');
  const lbDiscount = document.getElementById('lb-discount');
  const lbDesc = document.getElementById('lb-desc');
  const lbCraftHours = document.getElementById('lb-craft-hours');
  const lbCategoryTag = document.getElementById('lb-category-tag');
  const selectedColorName = document.getElementById('selected-color-name');
  const lbSwatchesList = document.getElementById('lb-swatches-list');
  const sizePills = document.querySelectorAll('.size-pill');
  const lbAddCartBtn = document.getElementById('lb-add-cart-btn');
  const lbViewDetailsBtn = document.getElementById('lb-view-details-btn');
  const tracerPaths = document.querySelectorAll('.tracer-path');

  let activeCategoryKey = 'all';
  let activeCategoryOutfits = lookbookCatalog['all'];
  state.currentLook = activeCategoryOutfits[0].id;

  // Try-On Outfit Function
  const tryOnOutfit = (outfitId, isSmooth = true) => {
    const outfit = products[outfitId] || activeCategoryOutfits[0];
    if (!outfit) return;

    state.currentLook = outfit.id;

    // Trigger Silk Shimmer Light Beam Effect
    if (silkShimmerSweep) {
      silkShimmerSweep.classList.remove('active');
      void silkShimmerSweep.offsetWidth; // Trigger reflow
      silkShimmerSweep.classList.add('active');
    }

    if (modelImgWrapper) {
      modelImgWrapper.classList.add('trying-on');
      setTimeout(() => modelImgWrapper.classList.remove('trying-on'), 400);
    }

    // Crossfade Central Model Image to Newly Worn Outfit
    if (centralModelImg) {
      centralModelImg.style.opacity = '0.35';
      centralModelImg.style.transform = 'scale(0.97)';
      setTimeout(() => {
        centralModelImg.src = outfit.modelImage;
        centralModelImg.alt = `Muse wearing ${outfit.title}`;
        if (outfit.objectPosition) {
          centralModelImg.style.objectPosition = outfit.objectPosition;
        }
        centralModelImg.style.opacity = '1';
        centralModelImg.style.transform = 'scale(1.0)';
      }, 200);
    }

    // Update Floating Muse Badge
    if (modelWornTitle) {
      modelWornTitle.textContent = outfit.title;
    }

    // Update Configurator Card Details
    if (lbTitle) lbTitle.textContent = outfit.title;
    if (lbPrice) lbPrice.textContent = `₹${outfit.price.toLocaleString()}`;
    if (lbOrigPrice) lbOrigPrice.textContent = `₹${outfit.origPrice.toLocaleString()}`;
    if (lbDiscount) lbDiscount.textContent = outfit.discount;
    if (lbDesc) lbDesc.textContent = outfit.desc;
    if (lbCraftHours && outfit.craftHours) lbCraftHours.textContent = outfit.craftHours;
    if (lbCategoryTag) lbCategoryTag.textContent = outfit.categoryName;
    if (selectedColorName) selectedColorName.textContent = outfit.colorName;

    // Update Dynamic Color Swatches in Configurator
    if (lbSwatchesList) {
      lbSwatchesList.innerHTML = `
        <button class="swatch-btn active" style="--swatch-color: ${outfit.swatchColor || '#D4AF37'};" title="${outfit.colorName}"></button>
        <button class="swatch-btn" style="--swatch-color: #5A1E28;" title="Royal Maroon Velvet"></button>
        <button class="swatch-btn" style="--swatch-color: #1A4D3E;" title="Emerald Silk"></button>
        <button class="swatch-btn" style="--swatch-color: #1A2E40;" title="Midnight Navy"></button>
      `;
    }

    // Highlight Satellite Cards across racks
    document.querySelectorAll('.satellite-card').forEach((card) => {
      if (card.dataset.id === outfit.id) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });

    // Tracer curve pulse
    tracerPaths.forEach((path, idx) => {
      path.classList.toggle('active', idx === 0);
    });

    if (isSmooth) {
      showToast(`✦ Muse is now trying on: ${outfit.title}`);
    }
  };

  // Render Outfits on Left & Right Satellite Racks
  const renderLookbookCategory = (categoryKey, autoTryFirst = true) => {
    activeCategoryKey = categoryKey;
    const outfits = lookbookCatalog[categoryKey] || lookbookCatalog['all'];
    activeCategoryOutfits = outfits;

    // Update HUD Category Tag
    if (hudCategoryTag) {
      const activeBtn = document.querySelector(`.fitting-category-btn[data-category="${categoryKey}"]`);
      hudCategoryTag.textContent = activeBtn ? activeBtn.querySelector('.btn-cat-text').textContent : 'All Outfits';
    }

    // Distribute outfits between Left and Right racks
    let leftOutfits = [];
    let rightOutfits = [];

    if (outfits.length === 2) {
      leftOutfits = [outfits[0]];
      rightOutfits = [outfits[1]];
    } else {
      const half = Math.ceil(outfits.length / 2);
      leftOutfits = outfits.slice(0, half);
      rightOutfits = outfits.slice(half);
    }

    const createCardHtml = (item) => `
      <button class="satellite-card ${item.id === state.currentLook ? 'active' : ''}" data-id="${item.id}" aria-label="Try on ${item.title}">
        <div class="satellite-thumb">
          <img src="${item.image}" alt="${item.title}" loading="lazy">
        </div>
        <div class="satellite-info">
          <span class="sat-category">${item.categoryName}</span>
          <span class="sat-name" title="${item.title}">${item.title}</span>
          <span class="sat-price">₹${item.price.toLocaleString()}</span>
        </div>
        <span class="sat-tryon-label"><i data-lucide="sparkles"></i> Try On</span>
        <span class="sat-dot"></span>
      </button>
    `;

    if (satellitesLeft) satellitesLeft.innerHTML = leftOutfits.map(createCardHtml).join('');
    if (satellitesRight) satellitesRight.innerHTML = rightOutfits.map(createCardHtml).join('');

    // Attach click listeners to satellite cards
    document.querySelectorAll('.satellite-card').forEach((card) => {
      card.addEventListener('click', () => {
        tryOnOutfit(card.dataset.id, true);
      });
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Try on first outfit of the selected category if current look is not in this category
    const isCurrentInActive = outfits.some(o => o.id === state.currentLook);
    if (autoTryFirst || !isCurrentInActive) {
      tryOnOutfit(outfits[0].id, false);
    }
  };

  // Category Selector Button Events
  categoryPills.forEach((btn) => {
    btn.addEventListener('click', () => {
      categoryPills.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const catKey = btn.dataset.category;
      renderLookbookCategory(catKey, true);
    });
  });

  // Model Navigation Controls (Previous / Next Dress)
  if (modelPrevBtn) {
    modelPrevBtn.addEventListener('click', () => {
      const currentIndex = activeCategoryOutfits.findIndex(o => o.id === state.currentLook);
      const nextIndex = (currentIndex - 1 + activeCategoryOutfits.length) % activeCategoryOutfits.length;
      tryOnOutfit(activeCategoryOutfits[nextIndex].id, true);
    });
  }

  if (modelNextBtn) {
    modelNextBtn.addEventListener('click', () => {
      const currentIndex = activeCategoryOutfits.findIndex(o => o.id === state.currentLook);
      const nextIndex = (currentIndex + 1) % activeCategoryOutfits.length;
      tryOnOutfit(activeCategoryOutfits[nextIndex].id, true);
    });
  }

  // Size Selector Pills
  sizePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      sizePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      state.selectedSize = pill.dataset.size;
      const sizeDisplay = document.getElementById('selected-size-name');
      if (sizeDisplay) sizeDisplay.textContent = state.selectedSize;
    });
  });

  // Lookbook outfit to SQLite database product mapping
  const outfitToDbMap = {
    'hs1': 7, // Pure Silk Luxury Hijab
    'hs2': 8, // Heritage Pashmina Gold Shawl
    'k1': 3,  // Emerald Green Raw Silk Kurti
    'k2': 3,
    'k3': 3,
    'fw1': 2, // Royal Maroon Silk Velvet Festival Kurti
    'fw2': 4, // Noorani Ivory Royal Anarkali
    'fw3': 4,
    'cc1': 5, // Tailored Navy Casual Co-ords
    'cc2': 6, // Espresso Velvet Tailored Co-ord
    'cc3': 5,
    'dw1': 1, // Beige Embroidered Silk Kurti
    'dw2': 1
  };

  // Add To Cart from Lookbook
  if (lbAddCartBtn) {
    lbAddCartBtn.addEventListener('click', () => {
      const prod = products[state.currentLook] || activeCategoryOutfits[0];
      const dbId = outfitToDbMap[prod.id] || 1;
      if (window.NutiyalaCart) {
        window.NutiyalaCart.addToCart(dbId, state.selectedSize || 'M', prod.colorName || 'Default', 1);
      } else {
        showToast('Piece added to your bag');
      }
    });
  }

  if (lbViewDetailsBtn) {
    lbViewDetailsBtn.addEventListener('click', () => {
      openQuickView(state.currentLook);
    });
  }

  // Initialize the Virtual Fitting Room with 'all' Outfits
  renderLookbookCategory('all', false);
  }

  // ==========================================================================
  // 5. SHOP BY CATEGORY (DYNAMIC FROM SQLITE DATABASE) & SYNERGY
  // ==========================================================================
  const categoryAccordion = document.getElementById('category-accordion');

  function renderSidebarShopCategories(activeCats) {
    const sidebarSubnav = document.getElementById('sidebar-shop-subnav') || document.querySelector('.sidebar-subnav');
    if (!sidebarSubnav || !activeCats || activeCats.length === 0) return;

    sidebarSubnav.innerHTML = activeCats.map(cat => {
      let displayName = (cat.name || '').trim();
      if (displayName.toLowerCase() === 'sareee') {
        displayName = 'Sarees';
      } else if (displayName.length > 0) {
        displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      }
      return `<a href="products.html?category=${encodeURIComponent(cat.slug)}" class="sidebar-subnav-link"><span>•</span> ${displayName}</a>`;
    }).join('');

    sidebarSubnav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeSidebar();
      });
    });
  }

  async function loadShopByCategory() {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      const activeCats = (data.categories || []).filter(c => c.status !== 'Inactive');

      // Synchronize side menu shop subnav with existing active categories
      renderSidebarShopCategories(activeCats);

      if (categoryAccordion && activeCats.length > 0) {
        categoryAccordion.innerHTML = activeCats.map((cat, idx) => {
          const img = cat.image_url || 'assets/emerald_green.png';
          const indexNum = String(idx + 1).padStart(2, '0');
          const countText = cat.product_count > 0 ? `${cat.product_count} Bespoke Pieces` : 'Bespoke Atelier';
          return `
            <div class="category-card ${idx === 0 ? 'active' : ''}" data-category="${cat.slug}">
              <div class="category-card-bg">
                <img src="${img}" alt="${cat.name} Collection" loading="lazy" onerror="this.src='assets/emerald_green.png'">
                <div class="category-card-overlay"></div>
              </div>
              <div class="category-card-content">
                <span class="category-index">${indexNum}</span>
                <h3 class="category-name">${cat.name}</h3>
                <p class="category-desc">${cat.description || 'Artisanal couture creations tailored with timeless finesse.'}</p>
                <div class="category-footer">
                  <span class="category-count">${countText}</span>
                  <a href="products.html?category=${encodeURIComponent(cat.slug)}" class="category-link-arrow" style="text-decoration:none; color:inherit; cursor:pointer;">
                    Explore <i data-lucide="arrow-right"></i>
                  </a>
                </div>
              </div>
            </div>
          `;
        }).join('');

        if (window.lucide) lucide.createIcons();
      }
    } catch (err) {
      console.warn('Could not load dynamic categories, keeping markup', err);
    }
    attachCategoryCardListeners();
  }

  function attachCategoryCardListeners() {
    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach((card) => {
      card.addEventListener('mouseenter', () => {
        categoryCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });

      card.addEventListener('click', (e) => {
        if (e.target.closest('.category-link-arrow')) return;

        categoryCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const catKey = card.dataset.category;
        const catName = card.querySelector('.category-name') ? card.querySelector('.category-name').textContent : '';

        // If matching pill in virtual fitting room exists, sync it
        const targetPill = document.querySelector(`.fitting-category-btn[data-category="${catKey}"]`);
        if (targetPill) {
          targetPill.click();
          const lookbookSection = document.getElementById('lookbook');
          if (lookbookSection) {
            lookbookSection.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          // Navigate to products catalog filtered by this category
          window.location.href = `products.html?category=${encodeURIComponent(catKey)}`;
        }
      });
    });
  }

  loadShopByCategory();

  // ==========================================================================
  // 6. DYNAMIC FEATURED COLLECTION FROM SQLITE DATABASE & FILTERING
  // ==========================================================================
  const productGrid = document.getElementById('product-grid');
  const filterTabs = document.querySelectorAll('.filter-tab');
  let currentFeaturedFilter = 'all';

  // SQLite Products State
  state.dbProducts = [];
  state.dbProductsMap = {};
  state.wishlistIds = new Set();

  async function loadDatabaseProducts() {
    try {
      const res = await fetch('/api/products?status=Active');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      state.dbProducts = data.products || [];
      state.dbProductsMap = {};
      state.dbProducts.forEach(p => {
        state.dbProductsMap[p.id] = p;
        state.dbProductsMap[p.slug] = p;
      });
      renderFeaturedProducts(currentFeaturedFilter);
    } catch (err) {
      console.warn('Could not load products from database, retaining initial catalog:', err);
    }
  }

  function renderFeaturedProducts(filter = 'all') {
    if (!productGrid) return;
    if (!state.dbProducts || state.dbProducts.length === 0) {
      productGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <p>No featured couture pieces available.</p>
        </div>
      `;
      return;
    }

    // Only show products marked as featured in admin side (is_featured === 1)
    const featuredItems = state.dbProducts.filter(p => p.is_featured === 1 || p.is_featured === true || p.is_featured === '1');

    const filtered = featuredItems.filter(p => {
      if (filter === 'all') return true;
      const cat = (p.category_slug || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      if (filter === 'kurti') return cat === 'kurtis';
      if (filter === 'casual-coords') return cat === 'co-ord-sets';
      if (filter === 'hijabs-shawls') return cat === 'hijabs' || cat === 'shawls';
      if (filter === 'festival-wear-kurti') return cat === 'kurtis' && (name.includes('maroon') || name.includes('anarkali') || name.includes('festival'));
      if (filter === 'daily-wear-kurtis') return cat === 'kurtis' && (name.includes('beige') || name.includes('daily') || name.includes('white'));
      return cat.includes(filter);
    });

    if (filtered.length === 0) {
      productGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <p>No featured products in this category yet. You can feature items from the Admin Panel.</p>
        </div>
      `;
      return;
    }

    productGrid.innerHTML = filtered.map(p => {
      const img = p.primary_image || (p.images && p.images[0]) || 'assets/model-beige.jpg';
      const isWishlisted = state.wishlistIds.has(p.id);
      const displayPrice = p.discount_price || p.price;
      const origPrice = p.discount_price ? p.price : null;
      const badge = p.is_featured ? (displayPrice > 14000 ? 'Heirloom Pick' : 'Bestseller') : 'Couture Edit';
      
      const colors = p.available_colors && p.available_colors.length ? p.available_colors : ['Default'];
      const colorDotsHtml = colors.map((c, i) => {
        let hex = '#B38A55';
        const lower = c.toLowerCase();
        if (lower.includes('maroon') || lower.includes('velvet')) hex = '#5A1E28';
        else if (lower.includes('emerald') || lower.includes('green')) hex = '#1A4D3E';
        else if (lower.includes('navy') || lower.includes('blue')) hex = '#1A2E40';
        else if (lower.includes('beige') || lower.includes('sand') || lower.includes('ivory')) hex = '#D9C3A5';
        else if (lower.includes('gold')) hex = '#D4AF37';
        else if (lower.includes('white')) hex = '#F0EDE6';
        return `<span class="swatch-dot ${i === 0 ? 'active' : ''}" style="background-color: ${hex};" title="${c}"></span>`;
      }).join('');

      return `
        <div class="product-card" data-category="${p.category_slug}" data-id="${p.id}">
          <div class="product-image-container">
            <span class="product-card-badge">${badge}</span>
            <button class="product-wishlist-toggle ${isWishlisted ? 'active' : ''}" data-id="${p.id}" aria-label="Add to Wishlist">
              <i data-lucide="heart"></i>
            </button>
            <a href="product-detail.html?slug=${p.slug}" style="display:block; width:100%; height:100%;">
              <img src="${img}" alt="${p.name}" class="primary-prod-img" loading="lazy">
            </a>
            <div class="product-quick-actions">
              <button class="quick-view-btn" data-prod="${p.id}">Quick View</button>
              <button class="quick-add-btn" data-prod="${p.id}">Quick Add +</button>
            </div>
          </div>
          <div class="product-info-block">
            <h3 class="prod-card-title">
              <a href="product-detail.html?slug=${p.slug}" style="color:inherit; text-decoration:none;">${p.name}</a>
            </h3>
            <div class="prod-card-price-row">
              <span class="prod-price">₹${displayPrice.toLocaleString()}</span>
              ${origPrice ? `<span class="prod-orig">₹${origPrice.toLocaleString()}</span>` : ''}
            </div>
            <div class="prod-swatches">
              ${colorDotsHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
    attachProductCardEvents();
  }

  function attachProductCardEvents() {
    // Quick View
    document.querySelectorAll('.quick-view-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        openQuickView(btn.dataset.prod);
      };
    });

    // Quick Add + (Connects straight to SQLite Database Cart)
    document.querySelectorAll('.quick-add-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const prodId = parseInt(btn.dataset.prod);
        const prod = state.dbProductsMap[prodId];
        const defaultSize = prod && prod.available_sizes && prod.available_sizes[0] ? prod.available_sizes[0] : 'M';
        const defaultColor = prod && prod.available_colors && prod.available_colors[0] ? prod.available_colors[0] : 'Default';
        if (window.NutiyalaCart) {
          window.NutiyalaCart.addToCart(prodId, defaultSize, defaultColor, 1);
        } else {
          showToast('Added to bag');
        }
      };
    });

    // Wishlist Toggle (Connects straight to SQLite Database Wishlist)
    document.querySelectorAll('.product-wishlist-toggle').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const prodId = parseInt(btn.dataset.id);
        toggleWishlist(prodId, btn);
      };
    });
  }

  // Filter tab clicks
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFeaturedFilter = tab.dataset.filter;
      if (state.dbProducts.length > 0) {
        renderFeaturedProducts(currentFeaturedFilter);
      }
    });
  });

  // Initial load from SQLite database
  loadDatabaseProducts();

  // ==========================================================================
  // 7. WISHLIST SYSTEM (SYNCED WITH SQLITE DATABASE)
  // ==========================================================================
  const wishlistDrawer = document.getElementById('wishlist-drawer');
  const wishlistBtn = document.getElementById('wishlist-btn');
  const wishlistClose = document.getElementById('wishlist-close');
  const wishlistScrim = document.getElementById('wishlist-scrim');
  const wishlistCountEl = document.getElementById('wishlist-count');
  const wishlistItemsList = document.getElementById('wishlist-items-list');
  const wishlistItemCountText = document.getElementById('wishlist-item-count-text');

  async function loadDatabaseWishlist() {
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        state.wishlistIds = new Set(items.map(i => i.product_id));
        if (wishlistCountEl) wishlistCountEl.textContent = items.length;
        if (wishlistItemCountText) wishlistItemCountText.textContent = `${items.length} ${items.length === 1 ? 'Item' : 'Items'}`;
        renderWishlistDrawerItems(items);
        document.querySelectorAll('.product-wishlist-toggle').forEach(b => {
          const pid = parseInt(b.dataset.id);
          if (state.wishlistIds.has(pid)) b.classList.add('active');
          else b.classList.remove('active');
        });
      }
    } catch (e) {
      console.warn('Could not sync wishlist with database:', e);
    }
  }

  function renderWishlistDrawerItems(items) {
    if (!wishlistItemsList) return;
    if (!items || items.length === 0) {
      wishlistItemsList.innerHTML = `
        <div class="empty-drawer-state">
          <i data-lucide="heart" class="empty-icon"></i>
          <p>Your wishlist is currently empty.</p>
          <a href="#featured" class="btn-chocolate" id="wishlist-explore-btn">Explore Collection</a>
        </div>
      `;
      document.getElementById('wishlist-explore-btn')?.addEventListener('click', () => {
        if (wishlistDrawer) wishlistDrawer.classList.remove('open');
      });
    } else {
      wishlistItemsList.innerHTML = items.map(item => `
        <div class="cart-item-row" data-id="${item.product_id}" style="display: flex; gap: 1rem; align-items: center; padding: 0.85rem 0; border-bottom: 1px solid rgba(179,138,85,0.15);">
          <img src="${item.product_image || 'assets/model-beige.jpg'}" alt="${item.product_name}" class="cart-item-img" style="width: 65px; height: 80px; object-fit: cover; border-radius: 3px;">
          <div class="cart-item-info" style="flex: 1;">
            <div>
              <h4 class="cart-item-title" style="margin: 0 0 0.25rem; font-family: var(--font-serif); font-size: 1.05rem; color: var(--chocolate);">${item.product_name}</h4>
              <span class="cart-item-variant" style="color: var(--gold); font-weight: 600; font-size: 0.82rem;">₹${(item.product_price || 0).toLocaleString()}</span>
            </div>
            <div class="qty-control-row" style="gap: 0.5rem; margin-top: 0.5rem; display: flex;">
              <button class="btn-chocolate" style="padding: 0.35rem 0.75rem; font-size: 0.72rem; letter-spacing: 0.05em; border-radius: 2px;" onclick="window.moveWishlistToBag(${item.product_id}, ${item.id})">Move to Bag</button>
              <button class="item-delete-btn" style="background: none; border: none; font-size: 0.75rem; color: var(--text-muted); cursor: pointer;" onclick="window.removeWishlistItem(${item.id}, ${item.product_id})">Remove</button>
            </div>
          </div>
        </div>
      `).join('');
    }
    if (window.lucide) lucide.createIcons();
  }

  window.moveWishlistToBag = async (productId, wishlistItemId) => {
    if (window.NutiyalaCart) {
      await window.NutiyalaCart.addToCart(productId, 'M', 'Default', 1);
    }
    await window.removeWishlistItem(wishlistItemId, productId);
    if (wishlistDrawer) wishlistDrawer.classList.remove('open');
  };

  window.removeWishlistItem = async (wishlistItemId, productId) => {
    try {
      await fetch(`/api/wishlist/items/${wishlistItemId}`, { method: 'DELETE' });
      state.wishlistIds.delete(productId);
      loadDatabaseWishlist();
      showToast('Removed from Wishlist');
    } catch (e) {}
  };

  async function toggleWishlist(prodId, btn) {
    if (window.NutiyalaAuth && !window.NutiyalaAuth.getUser()) {
      window.NutiyalaAuth.promptWishlistLogin(prodId, (wishlisted) => {
        if (wishlisted) {
          state.wishlistIds.add(prodId);
          if (btn) btn.classList.add('active');
          showToast('Added to your Wishlist ♥');
        } else {
          state.wishlistIds.delete(prodId);
          if (btn) btn.classList.remove('active');
        }
        loadDatabaseWishlist();
      });
      return;
    }

    try {
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: prodId })
      });
      if (res.status === 401) {
        if (window.NutiyalaAuth) {
          window.NutiyalaAuth.promptWishlistLogin(prodId, () => loadDatabaseWishlist());
        }
        return;
      }
      const data = await res.json();
      if (data.wishlisted) {
        state.wishlistIds.add(prodId);
        if (btn) btn.classList.add('active');
        showToast('Added to your Wishlist ♥');
      } else {
        state.wishlistIds.delete(prodId);
        if (btn) btn.classList.remove('active');
        showToast('Removed from Wishlist');
      }
      loadDatabaseWishlist();
    } catch (err) {
      showToast('Wishlist updated');
    }
  }

  if (wishlistBtn && wishlistDrawer && wishlistClose) {
    wishlistBtn.addEventListener('click', () => {
      wishlistDrawer.classList.add('open');
      loadDatabaseWishlist();
    });
    wishlistClose.addEventListener('click', () => wishlistDrawer.classList.remove('open'));
    wishlistScrim?.addEventListener('click', () => wishlistDrawer.classList.remove('open'));
  }
  loadDatabaseWishlist();

  // ==========================================================================
  // 8. QUICK VIEW MODAL (POWERED BY SQLITE DATABASE)
  // ==========================================================================
  const quickViewModal = document.getElementById('quick-view-modal');
  const quickViewClose = document.getElementById('quick-view-close');
  const quickViewBackdrop = document.getElementById('quick-view-backdrop');
  const qvMainImg = document.getElementById('qv-main-img');
  const qvTitle = document.getElementById('qv-title');
  const qvPrice = document.getElementById('qv-price');
  const qvOrig = document.getElementById('qv-orig');
  const qvDesc = document.getElementById('qv-desc');
  const qvSizeList = document.getElementById('qv-size-list');
  const qvAddCartBtn = document.getElementById('qv-add-cart-btn');
  let activeQuickViewProduct = null;
  let qvSelectedSize = 'M';

  async function openQuickView(prodId) {
    let prod = state.dbProductsMap[prodId];
    if (!prod) {
      try {
        const res = await fetch(`/api/products/${prodId}`);
        if (res.ok) {
          const d = await res.json();
          prod = d.product;
        }
      } catch (e) {}
    }
    if (!prod) prod = Object.values(products).find(p => p.id === prodId) || products.beige;
    activeQuickViewProduct = prod;

    const img = prod.primary_image || (prod.images && prod.images[0]) || prod.image || 'assets/model-beige.jpg';
    const displayPrice = prod.discount_price || prod.price;
    const origPrice = prod.discount_price ? prod.price : (prod.origPrice || null);

    if (qvMainImg) qvMainImg.src = img;
    if (qvTitle) qvTitle.textContent = prod.name || prod.title;
    if (qvPrice) qvPrice.textContent = `₹${displayPrice.toLocaleString()}`;
    if (qvOrig) qvOrig.textContent = origPrice ? `₹${origPrice.toLocaleString()}` : '';
    if (qvDesc) qvDesc.textContent = prod.description || prod.desc || 'Handcrafted bespoke atelier couture piece.';

    // Populate sizes
    const sizes = prod.available_sizes && prod.available_sizes.length ? prod.available_sizes : ['XS', 'S', 'M', 'L', 'XL'];
    qvSelectedSize = sizes[0] || 'M';
    if (qvSizeList) {
      qvSizeList.innerHTML = sizes.map((s, idx) => `
        <button class="size-pill ${idx === 0 ? 'active' : ''}" data-size="${s}">${s}</button>
      `).join('');
      qvSizeList.querySelectorAll('.size-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          qvSizeList.querySelectorAll('.size-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          qvSelectedSize = pill.dataset.size;
        });
      });
    }

    if (quickViewModal) quickViewModal.classList.add('open');
  }

  const closeQuickView = () => {
    if (quickViewModal) quickViewModal.classList.remove('open');
  };

  if (quickViewClose) quickViewClose.addEventListener('click', closeQuickView);
  if (quickViewBackdrop) quickViewBackdrop.addEventListener('click', closeQuickView);

  if (qvAddCartBtn) {
    qvAddCartBtn.addEventListener('click', () => {
      if (activeQuickViewProduct) {
        const pid = activeQuickViewProduct.id;
        const color = (activeQuickViewProduct.available_colors && activeQuickViewProduct.available_colors[0]) || activeQuickViewProduct.colorName || 'Default';
        if (window.NutiyalaCart) {
          window.NutiyalaCart.addToCart(pid, qvSelectedSize, color, 1);
        }
        closeQuickView();
      }
    });
  }

  // ==========================================================================
  // 10. SIZE GUIDE MODAL
  // ==========================================================================
  const sizeGuideModal = document.getElementById('size-guide-modal');
  const openSizeGuideBtn = document.getElementById('open-size-guide-btn');
  const footerSizeGuideBtn = document.getElementById('footer-size-guide-btn');
  const sizeGuideClose = document.getElementById('size-guide-close');
  const sizeGuideBackdrop = document.getElementById('size-guide-backdrop');

  const openSizeGuide = (e) => {
    e?.preventDefault();
    if (sizeGuideModal) sizeGuideModal.classList.add('open');
  };

  const closeSizeGuide = () => {
    if (sizeGuideModal) sizeGuideModal.classList.remove('open');
  };

  if (openSizeGuideBtn) openSizeGuideBtn.addEventListener('click', openSizeGuide);
  if (footerSizeGuideBtn) footerSizeGuideBtn.addEventListener('click', openSizeGuide);
  if (sizeGuideClose) sizeGuideClose.addEventListener('click', closeSizeGuide);
  if (sizeGuideBackdrop) sizeGuideBackdrop.addEventListener('click', closeSizeGuide);

  // ==========================================================================
  // 11. LIVE SEARCH MODAL
  // ==========================================================================
  const searchBtn = document.getElementById('search-btn');
  const searchModal = document.getElementById('search-modal');
  const searchClose = document.getElementById('search-close');
  const searchBackdrop = document.getElementById('search-backdrop');
  const liveSearchInput = document.getElementById('live-search-input');
  const searchResultsList = document.getElementById('search-results-list');
  const searchTags = document.querySelectorAll('.search-tag');

  const openSearch = () => {
    if (searchModal) {
      searchModal.classList.add('open');
      setTimeout(() => liveSearchInput?.focus(), 100);
      renderSearchResults('');
    }
  };

  const closeSearch = () => {
    if (searchModal) searchModal.classList.remove('open');
  };

  if (searchBtn) searchBtn.addEventListener('click', openSearch);
  if (searchClose) searchClose.addEventListener('click', closeSearch);
  if (searchBackdrop) searchBackdrop.addEventListener('click', closeSearch);

  // Keyboard shortcut Ctrl+K or Cmd+K
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') {
      closeSearch();
      closeQuickView();
      closeSizeGuide();
      if (window.NutiyalaCart) window.NutiyalaCart.closeCart();
      closeConsultationModal();
    }
  });

  let searchTimeout = null;
  const renderSearchResults = async (query) => {
    if (!searchResultsList) return;
    const q = (query || '').trim();
    if (!q) {
      searchResultsList.innerHTML = `<p style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">Type to search handcrafted kurtis, co-ords, silk hijabs, or pashmina shawls.</p>`;
      return;
    }

    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      const items = data.products || [];

      if (items.length === 0) {
        searchResultsList.innerHTML = `<p style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">No exact styles found for "${q}". Try "Kurti", "Velvet", or "Silk".</p>`;
      } else {
        searchResultsList.innerHTML = items.map(item => {
          const img = item.primary_image || (item.images && item.images[0]) || 'assets/model-beige.jpg';
          const price = item.discount_price || item.price;
          return `
            <div class="search-result-item" onclick="window.selectSearchResult('${item.id}')" style="display:flex; align-items:center; gap:1rem; padding:0.75rem; border-bottom:1px solid rgba(179,138,85,0.15); cursor:pointer;">
              <img src="${img}" alt="${item.name}" class="search-result-thumb" style="width:50px; height:60px; object-fit:cover; border-radius:3px;">
              <div>
                <h5 style="font-family:var(--font-serif); font-size:1.05rem; color:var(--chocolate); margin:0 0 0.2rem;">${item.name}</h5>
                <span style="font-size:0.8rem; color:var(--gold); font-weight:600;">₹${price.toLocaleString()}</span>
                <span style="font-size:0.75rem; color:var(--text-muted); margin-left:0.5rem;">${item.category_name || ''}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (e) {
      searchResultsList.innerHTML = `<p style="padding:1rem; color:var(--text-muted); font-size:0.85rem;">Searching catalogue...</p>`;
    }
  };

  if (liveSearchInput) {
    liveSearchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => renderSearchResults(e.target.value), 250);
    });
  }

  searchTags.forEach((tag) => {
    tag.addEventListener('click', () => {
      const term = tag.dataset.tag;
      if (liveSearchInput) liveSearchInput.value = term;
      renderSearchResults(term);
    });
  });

  window.selectSearchResult = (prodId) => {
    closeSearch();
    openQuickView(prodId);
  };

  // ==========================================================================
  // 12. HORIZONTAL STORYTELLING SLIDER
  // ==========================================================================
  const storySlider = document.getElementById('story-slider');
  const storyPrev = document.getElementById('story-prev');
  const storyNext = document.getElementById('story-next');

  if (storySlider && storyPrev && storyNext) {
    storyPrev.addEventListener('click', () => {
      storySlider.scrollBy({ left: -360, behavior: 'smooth' });
    });
    storyNext.addEventListener('click', () => {
      storySlider.scrollBy({ left: 360, behavior: 'smooth' });
    });
  }

  // ==========================================================================
  // 13. NEWSLETTER & CONSULTATION FORMS (CONNECTED TO SQLITE DATABASE)
  // ==========================================================================
  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletter-email');
      const email = emailInput ? emailInput.value.trim() : '';
      if (!email) return;

      try {
        const res = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        showToast(data.message || `Welcome to the Atelier Circle, ${email}! VIP code: AURA2026`);
        newsletterForm.reset();
      } catch (err) {
        showToast(`Welcome to the Atelier Circle! Your 15% VIP invitation code is AURA2026`);
        newsletterForm.reset();
      }
    });
  }

  // Bespoke Consultation Modal & Form
  const consultationModal = document.getElementById('consultation-modal');
  const consultationClose = document.getElementById('consultation-close');
  const consultationBackdrop = document.getElementById('consultation-backdrop');
  const consultationForm = document.getElementById('consultation-form');
  const bookConsultBtn = document.getElementById('book-consult-btn');

  const openConsultationModal = () => {
    if (consultationModal) consultationModal.classList.add('open');
  };

  const closeConsultationModal = () => {
    if (consultationModal) consultationModal.classList.remove('open');
  };

  if (bookConsultBtn) bookConsultBtn.addEventListener('click', openConsultationModal);
  if (consultationClose) consultationClose.addEventListener('click', closeConsultationModal);
  if (consultationBackdrop) consultationBackdrop.addEventListener('click', closeConsultationModal);

  if (consultationForm) {
    consultationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('consult-name')?.value.trim();
      const email = document.getElementById('consult-email')?.value.trim();
      const phone = document.getElementById('consult-phone')?.value.trim();
      const inquiry_type = document.getElementById('consult-type')?.value;
      const message = document.getElementById('consult-message')?.value.trim();

      try {
        const res = await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, inquiry_type, message })
        });
        const data = await res.json();
        showToast(data.message || 'Consultation reserved in our atelier diary. Sana will contact you within 2 hours.');
        consultationForm.reset();
        closeConsultationModal();
      } catch (err) {
        showToast('Consultation request received! Our styling concierge will contact you shortly.');
        closeConsultationModal();
      }
    });
  }

  // ==========================================================================
  // 14. TOAST NOTIFICATION UTILITY
  // ==========================================================================
  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i data-lucide="sparkles"></i> <span>${message}</span>`;
    container.appendChild(toast);

    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Dynamically load active offer promotional banner
  async function loadActiveOfferBanner() {
    const bannerEl = document.getElementById('top-announcement-bar');
    const textEl = document.getElementById('top-announcement-text');
    if (!bannerEl && !textEl) return;
    try {
      const res = await fetch('/api/offers/active');
      if (!res.ok) {
        if (bannerEl) bannerEl.style.display = 'none';
        document.body.classList.remove('has-active-offer');
        return;
      }
      const data = await res.json();
      if (data && data.offer && (data.offer.offer || data.offer.offer_text)) {
        const offerText = data.offer.offer || data.offer.offer_text;
        if (textEl) textEl.textContent = offerText;
        if (bannerEl) bannerEl.style.display = '';
        document.body.classList.add('has-active-offer');
      } else {
        if (bannerEl) bannerEl.style.display = 'none';
        document.body.classList.remove('has-active-offer');
      }
    } catch (e) {
      if (bannerEl) bannerEl.style.display = 'none';
      document.body.classList.remove('has-active-offer');
      console.warn('Could not load active offer banner:', e);
    }
  }

  loadActiveOfferBanner();

  // Initial cart badge sync from database
  if (window.NutiyalaCart) {
    window.NutiyalaCart.refreshCartBadges();
  }
  document.body.classList.remove('loading');
});
