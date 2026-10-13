/**
 * Aaradhya Clothing - Wishlist Management Module
 * Manages saved products, heart icon toggling, nav count badges,
 * and sliding wishlist drawer with instant 'Move to Bag' capability.
 */

export class WishlistManager {
  constructor(options = {}) {
    this.storageKey = 'aaradhya_wishlist_ids';
    this.wishlistIds = this.loadIds();
    this.allProducts = options.products || [];
    this.onMoveToCart = options.onMoveToCart || null;

    this.drawer = document.getElementById('wishlistDrawer');
    this.backdrop = document.getElementById('wishlistBackdrop');
    this.closeBtn = document.getElementById('wishlistCloseBtn');
    this.itemsContainer = document.getElementById('wishlistItemsList');
    this.emptyState = document.getElementById('wishlistEmptyState');
    this.badgeEl = document.getElementById('navWishlistCount');
    this.mobileBadgeEl = document.getElementById('mobileWishlistCount');

    this.init();
  }

  init() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    if (this.backdrop) {
      this.backdrop.addEventListener('click', () => this.close());
    }
    this.updateBadges();
  }

  loadIds() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  saveIds() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.wishlistIds));
    } catch (e) {
      console.error('Failed to save wishlist', e);
    }
    this.updateBadges();
    this.render();
  }

  toggle(product) {
    const id = typeof product === 'string' ? product : product.id;
    const index = this.wishlistIds.indexOf(id);

    if (index > -1) {
      this.wishlistIds.splice(index, 1);
    } else {
      this.wishlistIds.push(id);
    }

    this.saveIds();
    this.syncHeartIcons();
    return this.isInWishlist(id);
  }

  isInWishlist(id) {
    return this.wishlistIds.includes(id);
  }

  getProducts() {
    return this.allProducts.filter((p) => this.wishlistIds.includes(p.id));
  }

  updateBadges() {
    const count = this.wishlistIds.length;
    if (this.badgeEl) {
      this.badgeEl.textContent = count;
      this.badgeEl.style.display = count > 0 ? 'flex' : 'none';
    }
    if (this.mobileBadgeEl) {
      this.mobileBadgeEl.textContent = count;
      this.mobileBadgeEl.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  }

  syncHeartIcons() {
    document.querySelectorAll('[data-wishlist-id]').forEach((btn) => {
      const id = btn.dataset.wishlistId;
      if (this.isInWishlist(id)) {
        btn.classList.add('active');
        btn.setAttribute('aria-label', 'Remove from wishlist');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-label', 'Save to wishlist');
      }
    });
  }

  open() {
    this.render();
    if (this.drawer && this.backdrop) {
      this.drawer.classList.add('open');
      this.backdrop.classList.add('open');
      document.body.classList.add('drawer-open');
    }
  }

  close() {
    if (this.drawer && this.backdrop) {
      this.drawer.classList.remove('open');
      this.backdrop.classList.remove('open');
      document.body.classList.remove('drawer-open');
    }
  }

  render() {
    const products = this.getProducts();

    if (!products.length) {
      if (this.emptyState) this.emptyState.style.display = 'flex';
      if (this.itemsContainer) this.itemsContainer.style.display = 'none';
      return;
    }

    if (this.emptyState) this.emptyState.style.display = 'none';
    if (this.itemsContainer) this.itemsContainer.style.display = 'block';

    if (this.itemsContainer) {
      this.itemsContainer.innerHTML = products.map((item) => `
        <div class="wishlist-item" data-id="${item.id}">
          <div class="wishlist-item-img">
            <img src="${item.primaryImage}" alt="${item.name}" loading="lazy" />
          </div>
          <div class="wishlist-item-details">
            <div class="wishlist-item-cat">${item.categoryName}</div>
            <h4 class="wishlist-item-title">${item.name}</h4>
            <div class="wishlist-item-price">${item.formattedPrice}</div>
            <div class="wishlist-item-actions">
              <button type="button" class="btn-wishlist-move" data-move-id="${item.id}">
                Move to Bag
              </button>
              <button type="button" class="btn-wishlist-remove" data-remove-id="${item.id}" title="Remove">
                Remove
              </button>
            </div>
          </div>
        </div>
      `).join('');

      // Attach button listeners
      this.itemsContainer.querySelectorAll('[data-move-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.moveId;
          const prod = this.allProducts.find((p) => p.id === id);
          if (prod && this.onMoveToCart) {
            this.toggle(id); // remove from wishlist
            this.close();
            this.onMoveToCart(prod);
          }
        });
      });

      this.itemsContainer.querySelectorAll('[data-remove-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.removeId;
          this.toggle(id);
        });
      });
    }
  }
}
