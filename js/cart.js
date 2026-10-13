/**
 * Aaradhya Clothing - Luxury Shopping Cart Module
 * Handles cart state, slide-over drawer UI, quantity math,
 * free shipping milestone calculation, and "Added to your collection" notifications.
 */

export class ShoppingCart {
  constructor(options = {}) {
    this.storageKey = 'aaradhya_cart_items';
    this.items = this.loadItems();
    this.freeShippingThreshold = 5000;
    this.standardShippingFee = 350;
    this.discountPercentage = 0;
    this.discountCode = '';

    this.onCheckoutClick = options.onCheckoutClick || null;

    this.drawer = document.getElementById('cartDrawer');
    this.backdrop = document.getElementById('cartBackdrop');
    this.closeBtn = document.getElementById('cartCloseBtn');
    this.itemsContainer = document.getElementById('cartItemsList');
    this.emptyState = document.getElementById('cartEmptyState');
    this.footerEl = document.getElementById('cartFooter');
    this.badgeEl = document.getElementById('navCartCount');
    this.mobileBadgeEl = document.getElementById('mobileCartCount');
    this.subtotalEl = document.getElementById('cartSubtotal');
    this.shippingEl = document.getElementById('cartShipping');
    this.discountRow = document.getElementById('cartDiscountRow');
    this.discountEl = document.getElementById('cartDiscount');
    this.totalEl = document.getElementById('cartTotal');
    this.progressBar = document.getElementById('cartShippingProgress');
    this.progressText = document.getElementById('cartShippingText');
    this.promoInput = document.getElementById('cartPromoInput');
    this.promoBtn = document.getElementById('cartPromoApplyBtn');
    this.checkoutBtn = document.getElementById('cartCheckoutBtn');
    this.toastEl = document.getElementById('toastNotification');

    this.init();
  }

  init() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    if (this.backdrop) {
      this.backdrop.addEventListener('click', () => this.close());
    }
    if (this.promoBtn && this.promoInput) {
      this.promoBtn.addEventListener('click', () => this.applyPromo());
      this.promoInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.applyPromo();
      });
    }
    if (this.checkoutBtn) {
      this.checkoutBtn.addEventListener('click', () => {
        this.close();
        if (this.onCheckoutClick) {
          this.onCheckoutClick(this.getSummary());
        }
      });
    }

    this.render();
  }

  loadItems() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  saveItems() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (e) {
      console.error('Failed to save cart items', e);
    }
    this.render();
  }

  addItem(product, size = 'M', color = null, quantity = 1) {
    const selectedColor = color || (product.colors && product.colors[0] ? product.colors[0].name : 'Natural');
    const existingIndex = this.items.findIndex(
      (item) => item.id === product.id && item.size === size && item.color === selectedColor
    );

    if (existingIndex > -1) {
      this.items[existingIndex].quantity += quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        categoryName: product.categoryName,
        price: product.price,
        formattedPrice: product.formattedPrice,
        image: product.primaryImage,
        size: size,
        color: selectedColor,
        quantity: quantity
      });
    }

    this.saveItems();
    this.showToast(product.name, size);
    this.open();
  }

  removeItem(index) {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
      this.saveItems();
    }
  }

  updateQuantity(index, delta) {
    if (index >= 0 && index < this.items.length) {
      const newQty = this.items[index].quantity + delta;
      if (newQty <= 0) {
        this.removeItem(index);
      } else {
        this.items[index].quantity = Math.min(newQty, 10);
        this.saveItems();
      }
    }
  }

  clear() {
    this.items = [];
    this.discountPercentage = 0;
    this.discountCode = '';
    this.saveItems();
  }

  getSubtotal() {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getShipping() {
    const subtotal = this.getSubtotal();
    if (subtotal === 0 || subtotal >= this.freeShippingThreshold) {
      return 0;
    }
    return this.standardShippingFee;
  }

  getDiscount() {
    const subtotal = this.getSubtotal();
    if (this.discountPercentage > 0) {
      return Math.round(subtotal * (this.discountPercentage / 100));
    }
    return 0;
  }

  getTotal() {
    return Math.max(0, this.getSubtotal() - this.getDiscount() + this.getShipping());
  }

  getTotalCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  getSummary() {
    return {
      items: [...this.items],
      subtotal: this.getSubtotal(),
      shipping: this.getShipping(),
      discount: this.getDiscount(),
      discountCode: this.discountCode,
      total: this.getTotal()
    };
  }

  applyPromo() {
    if (!this.promoInput) return;
    const code = this.promoInput.value.trim().toUpperCase();
    const msgEl = document.getElementById('cartPromoMsg');

    if (code === 'AARADHYA10') {
      this.discountPercentage = 10;
      this.discountCode = code;
      if (msgEl) {
        msgEl.textContent = '10% atelier inaugural privilege applied!';
        msgEl.className = 'cart-promo-msg success';
      }
    } else if (code === 'HERITAGE15') {
      this.discountPercentage = 15;
      this.discountCode = code;
      if (msgEl) {
        msgEl.textContent = '15% heritage collector privilege applied!';
        msgEl.className = 'cart-promo-msg success';
      }
    } else {
      if (msgEl) {
        msgEl.textContent = 'Invalid privilege code. Try AARADHYA10';
        msgEl.className = 'cart-promo-msg error';
      }
      return;
    }
    this.render();
  }

  open() {
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

  showToast(productName, size) {
    if (!this.toastEl) return;
    const titleEl = this.toastEl.querySelector('.toast-title');
    const descEl = this.toastEl.querySelector('.toast-desc');

    if (titleEl) titleEl.textContent = 'Added to your collection';
    if (descEl) descEl.textContent = `${productName} (Size: ${size})`;

    this.toastEl.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 3800);
  }

  render() {
    const totalCount = this.getTotalCount();
    const subtotal = this.getSubtotal();
    const shipping = this.getShipping();
    const discount = this.getDiscount();
    const total = this.getTotal();

    // Update badges
    if (this.badgeEl) {
      this.badgeEl.textContent = totalCount;
      this.badgeEl.style.display = totalCount > 0 ? 'flex' : 'none';
    }
    if (this.mobileBadgeEl) {
      this.mobileBadgeEl.textContent = totalCount;
      this.mobileBadgeEl.style.display = totalCount > 0 ? 'inline-flex' : 'none';
    }

    // Toggle Empty State vs Items
    if (!this.items.length) {
      if (this.emptyState) this.emptyState.style.display = 'flex';
      if (this.itemsContainer) this.itemsContainer.style.display = 'none';
      if (this.footerEl) this.footerEl.style.display = 'none';
      if (this.progressBar) this.progressBar.style.width = '0%';
      if (this.progressText) this.progressText.textContent = `Complimentary insured delivery on orders over ₹${this.freeShippingThreshold.toLocaleString('en-IN')}`;
      return;
    }

    if (this.emptyState) this.emptyState.style.display = 'none';
    if (this.itemsContainer) this.itemsContainer.style.display = 'block';
    if (this.footerEl) this.footerEl.style.display = 'block';

    // Free shipping progress
    const remaining = Math.max(0, this.freeShippingThreshold - subtotal);
    const progressPercent = Math.min(100, Math.round((subtotal / this.freeShippingThreshold) * 100));

    if (this.progressBar) {
      this.progressBar.style.width = `${progressPercent}%`;
    }
    if (this.progressText) {
      if (remaining === 0) {
        this.progressText.innerHTML = `✨ <strong>Complimentary insured delivery</strong> unlocked!`;
      } else {
        this.progressText.innerHTML = `Add <strong>₹${remaining.toLocaleString('en-IN')}</strong> more for complimentary delivery`;
      }
    }

    // Render items list
    if (this.itemsContainer) {
      this.itemsContainer.innerHTML = this.items.map((item, index) => `
        <div class="cart-item" data-index="${index}">
          <div class="cart-item-image">
            <img src="${item.image}" alt="${item.name}" loading="lazy" />
          </div>
          <div class="cart-item-info">
            <div class="cart-item-category">${item.categoryName || 'Aaradhya'}</div>
            <h4 class="cart-item-title">${item.name}</h4>
            <div class="cart-item-meta">
              <span>Size: <strong>${item.size}</strong></span>
              <span class="meta-dot">•</span>
              <span>Color: <strong>${item.color}</strong></span>
            </div>
            <div class="cart-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
            <div class="cart-item-controls">
              <div class="qty-stepper">
                <button type="button" class="qty-btn btn-qty-dec" data-action="dec" data-index="${index}" aria-label="Decrease quantity">−</button>
                <span class="qty-value">${item.quantity}</span>
                <button type="button" class="qty-btn btn-qty-inc" data-action="inc" data-index="${index}" aria-label="Increase quantity">+</button>
              </div>
              <button type="button" class="cart-item-remove" data-action="remove" data-index="${index}" title="Remove item">
                Remove
              </button>
            </div>
          </div>
        </div>
      `).join('');

      // Attach item controls listeners
      this.itemsContainer.querySelectorAll('[data-action]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          const idx = parseInt(btn.dataset.index, 10);
          if (action === 'inc') this.updateQuantity(idx, 1);
          if (action === 'dec') this.updateQuantity(idx, -1);
          if (action === 'remove') this.removeItem(idx);
        });
      });
    }

    // Update Totals
    if (this.subtotalEl) this.subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    if (this.shippingEl) {
      this.shippingEl.textContent = shipping === 0 ? 'Complimentary' : `₹${shipping.toLocaleString('en-IN')}`;
      if (shipping === 0) this.shippingEl.classList.add('text-free');
      else this.shippingEl.classList.remove('text-free');
    }
    if (this.discountRow && this.discountEl) {
      if (discount > 0) {
        this.discountRow.style.display = 'flex';
        this.discountEl.textContent = `-₹${discount.toLocaleString('en-IN')}`;
      } else {
        this.discountRow.style.display = 'none';
      }
    }
    if (this.totalEl) this.totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
  }
}
