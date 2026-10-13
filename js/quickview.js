/**
 * Aaradhya Clothing - Luxury Product Details & Quick View Modal
 * Editorial modal gallery, size/color selectors, accordions,
 * instant Add-to-Bag and Direct Buy Now flow.
 */

export class ProductQuickView {
  constructor(options = {}) {
    this.products = options.products || [];
    this.onAddToCart = options.onAddToCart || null;
    this.onBuyNow = options.onBuyNow || null;
    this.onToggleWishlist = options.onToggleWishlist || null;
    this.isWishlisted = options.isWishlisted || (() => false);

    this.modal = document.getElementById('productModal');
    this.backdrop = document.getElementById('productModalBackdrop');
    this.closeBtn = document.getElementById('productModalCloseBtn');
    this.contentEl = document.getElementById('productModalContent');

    this.currentProduct = null;
    this.selectedSize = 'M';
    this.selectedColor = null;
    this.quantity = 1;

    this.init();
  }

  init() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    if (this.backdrop) {
      this.backdrop.addEventListener('click', () => this.close());
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  isOpen() {
    return this.modal && this.modal.classList.contains('open');
  }

  open(product) {
    if (!product) return;
    this.currentProduct = product;
    this.selectedSize = (product.sizes && product.sizes.length) ? product.sizes[0] : 'One Size';
    this.selectedColor = (product.colors && product.colors.length) ? product.colors[0].name : 'Default';
    this.quantity = 1;

    this.render();
    if (this.modal && this.backdrop) {
      this.modal.classList.add('open');
      this.backdrop.classList.add('open');
      document.body.classList.add('modal-open');
    }
  }

  close() {
    if (this.modal && this.backdrop) {
      this.modal.classList.remove('open');
      this.backdrop.classList.remove('open');
      document.body.classList.remove('modal-open');
    }
  }

  render() {
    if (!this.contentEl || !this.currentProduct) return;
    const p = this.currentProduct;
    const isSaved = this.isWishlisted(p.id);

    // Gallery images list
    const galleryImages = [p.primaryImage, p.secondaryImage, p.detailImage].filter(Boolean);

    // Recommended pieces
    const recommended = this.products.filter((item) => item.id !== p.id && item.category === p.category).slice(0, 3);
    const fallbackRecs = recommended.length ? recommended : this.products.filter((item) => item.id !== p.id).slice(0, 3);

    this.contentEl.innerHTML = `
      <div class="pv-modal-grid">
        <!-- Left: Image Gallery -->
        <div class="pv-gallery-col">
          <div class="pv-main-image-wrap">
            <img id="pvMainImg" src="${galleryImages[0]}" alt="${p.name}" class="pv-main-image" />
            ${p.badge ? `<span class="pv-badge">${p.badge}</span>` : ''}
          </div>
          ${galleryImages.length > 1 ? `
            <div class="pv-thumbnails">
              ${galleryImages.map((src, idx) => `
                <button type="button" class="pv-thumb-btn ${idx === 0 ? 'active' : ''}" data-src="${src}" aria-label="View angle ${idx + 1}">
                  <img src="${src}" alt="Thumbnail ${idx + 1}" />
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Right: Editorial Details -->
        <div class="pv-info-col">
          <div class="pv-header">
            <span class="pv-category">${p.categoryName}</span>
            <h2 class="pv-title">${p.name}</h2>
            <div class="pv-price-row">
              <span class="pv-price">${p.formattedPrice}</span>
              ${p.formattedOriginalPrice ? `<span class="pv-price-orig">${p.formattedOriginalPrice}</span>` : ''}
              <span class="pv-tax-note">Inclusive of all artisanal taxes</span>
            </div>
            <div class="pv-rating-row">
              <span class="pv-stars">★★★★★</span>
              <span class="pv-rating-text">${p.rating.toFixed(1)} (${p.reviewCount} connoisseurs reviewed)</span>
            </div>
          </div>

          <p class="pv-desc">${p.description}</p>

          <!-- Color Swatches -->
          ${p.colors && p.colors.length ? `
            <div class="pv-option-group">
              <div class="pv-option-header">
                <span class="pv-option-label">Color:</span>
                <span id="pvSelectedColorText" class="pv-option-value">${this.selectedColor}</span>
              </div>
              <div class="pv-color-swatches">
                ${p.colors.map((c, i) => `
                  <button type="button" class="pv-color-swatch ${c.name === this.selectedColor ? 'active' : ''}"
                    style="background-color: ${c.hex};"
                    data-color="${c.name}"
                    data-img="${c.image || ''}"
                    title="${c.name}"
                    aria-label="${c.name}">
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Size Selection -->
          ${p.sizes && p.sizes.length ? `
            <div class="pv-option-group">
              <div class="pv-option-header">
                <span class="pv-option-label">Select Size:</span>
                <button type="button" class="pv-size-guide-btn" id="pvSizeGuideBtn">Size & Silhouette Guide</button>
              </div>
              <div class="pv-size-chips">
                ${p.sizes.map((s) => `
                  <button type="button" class="pv-size-chip ${s === this.selectedSize ? 'active' : ''}" data-size="${s}">
                    ${s}
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Quantity & Action Buttons -->
          <div class="pv-actions-row">
            <div class="pv-qty-box">
              <button type="button" class="pv-qty-btn" id="pvQtyDec" aria-label="Decrease quantity">−</button>
              <span id="pvQtyVal" class="pv-qty-val">${this.quantity}</span>
              <button type="button" class="pv-qty-btn" id="pvQtyInc" aria-label="Increase quantity">+</button>
            </div>

            <button type="button" class="btn-primary pv-btn-add" id="pvAddToCartBtn">
              Add to Collection
            </button>

            <button type="button" class="pv-btn-wishlist ${isSaved ? 'active' : ''}" id="pvWishlistBtn" aria-label="Save to Wishlist" data-wishlist-id="${p.id}">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>

          <!-- Direct Buy Now CTA -->
          <button type="button" class="btn-secondary pv-btn-buynow" id="pvBuyNowBtn">
            Instant Atelier Checkout
          </button>

          <!-- Accordion Information -->
          <div class="pv-accordions">
            <details class="pv-accordion" open>
              <summary class="pv-acc-summary">
                <span>Garment Architecture & Detailing</span>
                <span class="pv-acc-icon">▾</span>
              </summary>
              <div class="pv-acc-content">
                <ul>
                  ${(p.details || []).map((d) => `<li>${d}</li>`).join('')}
                  <li><strong>Fabric:</strong> ${p.fabric}</li>
                  <li><strong>Craft:</strong> ${p.craft}</li>
                  <li><strong>Fit:</strong> ${p.fit}</li>
                </ul>
              </div>
            </details>

            <details class="pv-accordion">
              <summary class="pv-acc-summary">
                <span>Artisanal Care & Preservation</span>
                <span class="pv-acc-icon">▾</span>
              </summary>
              <div class="pv-acc-content">
                <ul>
                  ${(p.care || []).map((c) => `<li>${c}</li>`).join('')}
                </ul>
              </div>
            </details>

            <details class="pv-accordion">
              <summary class="pv-acc-summary">
                <span>Complimentary Shipping & Heritage Keepsake</span>
                <span class="pv-acc-icon">▾</span>
              </summary>
              <div class="pv-acc-content">
                <p>${p.shipping}</p>
                <p>Delivered in an archival Aaradhya keepsake box with silk ribbon, cedar sachet, and personalized artisan provenance card.</p>
              </div>
            </details>
          </div>

          <!-- Recommended complementary pieces -->
          ${fallbackRecs.length ? `
            <div class="pv-recommended-section">
              <h4 class="pv-rec-title">Complete The Ensemble</h4>
              <div class="pv-rec-grid">
                ${fallbackRecs.map((rec) => `
                  <div class="pv-rec-card" data-rec-id="${rec.id}">
                    <img src="${rec.primaryImage}" alt="${rec.name}" />
                    <div class="pv-rec-info">
                      <div class="pv-rec-name">${rec.name}</div>
                      <div class="pv-rec-price">${rec.formattedPrice}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    this.bindEvents(p);
  }

  bindEvents(product) {
    const mainImg = this.contentEl.querySelector('#pvMainImg');

    // Thumbnails click
    this.contentEl.querySelectorAll('.pv-thumb-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.contentEl.querySelectorAll('.pv-thumb-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (mainImg) {
          mainImg.style.opacity = '0.4';
          setTimeout(() => {
            mainImg.src = btn.dataset.src;
            mainImg.style.opacity = '1';
          }, 150);
        }
      });
    });

    // Color Swatches
    this.contentEl.querySelectorAll('.pv-color-swatch').forEach((swatch) => {
      swatch.addEventListener('click', () => {
        this.contentEl.querySelectorAll('.pv-color-swatch').forEach((s) => s.classList.remove('active'));
        swatch.classList.add('active');
        this.selectedColor = swatch.dataset.color;
        const colorText = this.contentEl.querySelector('#pvSelectedColorText');
        if (colorText) colorText.textContent = this.selectedColor;
        if (swatch.dataset.img && mainImg) {
          mainImg.src = swatch.dataset.img;
        }
      });
    });

    // Size Chips
    this.contentEl.querySelectorAll('.pv-size-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        this.contentEl.querySelectorAll('.pv-size-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.selectedSize = chip.dataset.size;
      });
    });

    // Size Guide modal trigger
    const sizeGuideBtn = this.contentEl.querySelector('#pvSizeGuideBtn');
    if (sizeGuideBtn) {
      sizeGuideBtn.addEventListener('click', () => {
        alert('AARADHYA SILHOUETTE GUIDE:\n\nXS: Bust 32-34", Waist 26-28", Hip 36-38"\nS: Bust 34-36", Waist 28-30", Hip 38-40"\nM: Bust 36-38", Waist 30-32", Hip 40-42"\nL: Bust 38-40", Waist 32-34", Hip 42-44"\nXL: Bust 40-42", Waist 34-36", Hip 44-46"\n\nTailored for relaxed luxury drape.');
      });
    }

    // Quantity Stepper
    const qtyVal = this.contentEl.querySelector('#pvQtyVal');
    const qtyInc = this.contentEl.querySelector('#pvQtyInc');
    const qtyDec = this.contentEl.querySelector('#pvQtyDec');

    if (qtyInc) {
      qtyInc.addEventListener('click', () => {
        this.quantity = Math.min(this.quantity + 1, 10);
        if (qtyVal) qtyVal.textContent = this.quantity;
      });
    }
    if (qtyDec) {
      qtyDec.addEventListener('click', () => {
        this.quantity = Math.max(this.quantity - 1, 1);
        if (qtyVal) qtyVal.textContent = this.quantity;
      });
    }

    // Add to Cart
    const addBtn = this.contentEl.querySelector('#pvAddToCartBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (this.onAddToCart) {
          this.onAddToCart(product, this.selectedSize, this.selectedColor, this.quantity);
        }
      });
    }

    // Buy Now
    const buyBtn = this.contentEl.querySelector('#pvBuyNowBtn');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        if (this.onBuyNow) {
          this.close();
          this.onBuyNow(product, this.selectedSize, this.selectedColor, this.quantity);
        }
      });
    }

    // Wishlist Toggle
    const wishBtn = this.contentEl.querySelector('#pvWishlistBtn');
    if (wishBtn) {
      wishBtn.addEventListener('click', () => {
        if (this.onToggleWishlist) {
          const nowSaved = this.onToggleWishlist(product);
          if (nowSaved) {
            wishBtn.classList.add('active');
            wishBtn.querySelector('svg').setAttribute('fill', 'currentColor');
          } else {
            wishBtn.classList.remove('active');
            wishBtn.querySelector('svg').setAttribute('fill', 'none');
          }
        }
      });
    }

    // Recommendation card clicks
    this.contentEl.querySelectorAll('.pv-rec-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.dataset.recId;
        const target = this.products.find((item) => item.id === id);
        if (target) {
          this.open(target);
          this.contentEl.scrollTop = 0;
        }
      });
    });
  }
}
