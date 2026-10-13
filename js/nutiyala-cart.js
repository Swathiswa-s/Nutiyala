/**
 * NUTIYALA COUTURE — LUXURY CART & INSTANT CHECKOUT SYSTEM
 * Provides complete Add to Cart, Slide-out Bag Drawer, and Instant "Buy Now" Checkout.
 */

(function () {
  'use strict';

  // Inject Luxury Cart & Checkout CSS
  const style = document.createElement('style');
  style.id = 'nutiyala-cart-styles';
  style.textContent = `
    /* Nutiyala Luxury Cart Drawer Styles */
    .nc-drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(18, 10, 8, 0.65);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      z-index: 99998;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.35s ease, visibility 0.35s ease;
    }

    .nc-drawer-backdrop.active {
      opacity: 1;
      visibility: visible;
    }

    .nc-cart-panel {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      max-width: 460px;
      background: #FAF6F0;
      box-shadow: -10px 0 35px rgba(30, 10, 12, 0.25);
      z-index: 99999;
      transform: translateX(100%);
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1C120C;
    }

    .nc-cart-panel.open {
      transform: translateX(0);
    }

    /* Drawer Header */
    .nc-drawer-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.6rem;
      background: #FFFFFF;
      border-bottom: 1px solid rgba(179, 138, 85, 0.25);
    }

    .nc-drawer-brand {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .nc-drawer-emblem {
      width: 24px;
      height: 24px;
      object-fit: contain;
    }

    .nc-drawer-title-group h3 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 1.45rem;
      margin: 0;
      font-weight: 600;
      color: #3E0F15;
      line-height: 1.1;
    }

    .nc-drawer-subtitle {
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #B38A55;
      font-weight: 600;
    }

    .nc-drawer-close-btn {
      background: none;
      border: none;
      font-size: 1.4rem;
      color: #735D60;
      cursor: pointer;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .nc-drawer-close-btn:hover {
      background: rgba(62, 15, 21, 0.08);
      color: #3E0F15;
    }

    /* Free Shipping Banner */
    .nc-shipping-meter {
      background: #FFFFFF;
      padding: 0.85rem 1.6rem;
      border-bottom: 1px solid rgba(179, 138, 85, 0.15);
    }

    .nc-shipping-text {
      font-size: 0.76rem;
      color: #3E0F15;
      margin: 0 0 0.45rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .nc-progress-bar {
      height: 4px;
      background: rgba(179, 138, 85, 0.2);
      border-radius: 4px;
      overflow: hidden;
    }

    .nc-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #B38A55, #D8B982);
      transition: width 0.4s ease;
      width: 0%;
    }

    /* Body views */
    .nc-drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem 1.6rem;
      display: flex;
      flex-direction: column;
    }

    /* Cart Items */
    .nc-cart-item {
      display: grid;
      grid-template-columns: 75px 1fr auto;
      gap: 1rem;
      background: #FFFFFF;
      border: 1px solid rgba(179, 138, 85, 0.2);
      border-radius: 3px;
      padding: 0.85rem;
      margin-bottom: 0.85rem;
      position: relative;
    }

    .nc-item-img {
      width: 75px;
      height: 100px;
      object-fit: cover;
      border-radius: 2px;
      background: #20120D;
    }

    .nc-item-info {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .nc-item-title {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 1.05rem;
      font-weight: 600;
      color: #3E0F15;
      margin: 0 0 0.25rem;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-decoration: none;
    }

    .nc-item-meta {
      font-size: 0.72rem;
      color: #735D60;
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.45rem;
    }

    .nc-item-meta span {
      background: #FAF8F5;
      padding: 0.15rem 0.45rem;
      border-radius: 2px;
      border: 1px solid rgba(179, 138, 85, 0.2);
    }

    .nc-item-price-row {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    .nc-price-current {
      font-weight: 700;
      color: #3E0F15;
      font-size: 0.92rem;
    }

    .nc-price-orig {
      font-size: 0.76rem;
      color: #9C888B;
      text-decoration: line-through;
    }

    .nc-item-controls {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-end;
    }

    .nc-remove-btn {
      background: none;
      border: none;
      color: #A08C8F;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.2rem;
      transition: color 0.2s;
    }

    .nc-remove-btn:hover {
      color: #9B1C1C;
    }

    .nc-stepper {
      display: flex;
      align-items: center;
      border: 1px solid rgba(179, 138, 85, 0.35);
      border-radius: 2px;
      background: #FAF8F5;
    }

    .nc-stepper button {
      width: 24px;
      height: 24px;
      background: none;
      border: none;
      font-size: 0.85rem;
      font-weight: 700;
      color: #3E0F15;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nc-stepper button:hover {
      background: rgba(179, 138, 85, 0.15);
    }

    .nc-stepper span {
      font-size: 0.78rem;
      font-weight: 600;
      min-width: 20px;
      text-align: center;
      color: #3E0F15;
    }

    /* Empty state */
    .nc-empty-cart {
      text-align: center;
      padding: 3rem 1rem;
      margin: auto 0;
    }

    .nc-empty-cart svg {
      width: 48px;
      height: 48px;
      color: #B38A55;
      margin-bottom: 0.75rem;
    }

    .nc-empty-cart h4 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 1.5rem;
      color: #3E0F15;
      margin: 0 0 0.5rem;
    }

    .nc-empty-cart p {
      font-size: 0.82rem;
      color: #735D60;
      margin: 0 0 1.5rem;
      line-height: 1.5;
    }

    /* Drawer Footer / Bill Summary */
    .nc-drawer-foot {
      background: #FFFFFF;
      padding: 1.25rem 1.6rem;
      border-top: 1px solid rgba(179, 138, 85, 0.25);
    }

    .nc-promo-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .nc-promo-input {
      flex: 1;
      padding: 0.55rem 0.8rem;
      border: 1px solid rgba(179, 138, 85, 0.35);
      border-radius: 2px;
      font-size: 0.78rem;
      text-transform: uppercase;
      background: #FAF8F5;
      outline: none;
    }

    .nc-promo-btn {
      padding: 0.55rem 1rem;
      background: #FAF8F5;
      border: 1px solid #B38A55;
      color: #3E0F15;
      font-size: 0.74rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      cursor: pointer;
      border-radius: 2px;
      text-transform: uppercase;
      transition: all 0.2s;
    }

    .nc-promo-btn:hover {
      background: #B38A55;
      color: #1A0D0B;
    }

    .nc-bill-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      font-size: 0.82rem;
      color: #735D60;
      margin-bottom: 1rem;
    }

    .nc-bill-row {
      display: flex;
      justify-content: space-between;
    }

    .nc-bill-row.discount {
      color: #166534;
      font-weight: 600;
    }

    .nc-bill-row.total {
      font-size: 1.05rem;
      font-weight: 700;
      color: #3E0F15;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      padding-top: 0.65rem;
      margin-top: 0.25rem;
    }

    .nc-action-btn {
      width: 100%;
      height: 48px;
      border-radius: 2px;
      font-size: 0.84rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.25s ease;
      text-decoration: none;
      box-sizing: border-box;
      border: none;
    }

    .nc-btn-checkout {
      background: #3E0F15;
      color: #FAF6F0;
      box-shadow: 0 4px 15px rgba(62, 15, 21, 0.2);
    }

    .nc-btn-checkout:hover {
      background: #5A1827;
      box-shadow: 0 6px 20px rgba(62, 15, 21, 0.35);
    }

    .nc-btn-gold {
      background: #B38A55;
      color: #1A0D0B;
      font-weight: 700;
    }

    .nc-btn-gold:hover {
      background: #D8B982;
    }

    /* Checkout Form in Drawer */
    .nc-checkout-section {
      display: none;
      flex-direction: column;
      height: 100%;
    }

    .nc-checkout-section.active {
      display: flex;
    }

    .nc-checkout-form {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .nc-form-group {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .nc-form-label {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #3E0F15;
    }

    .nc-form-input {
      padding: 0.65rem 0.8rem;
      border: 1px solid rgba(179, 138, 85, 0.35);
      border-radius: 2px;
      font-size: 0.82rem;
      background: #FAF8F5;
      outline: none;
    }

    .nc-form-input:focus {
      border-color: #3E0F15;
      background: #FFFFFF;
    }

    .nc-form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .nc-pay-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }

    .nc-pay-radio {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.65rem 0.85rem;
      background: #FFFFFF;
      border: 1px solid rgba(179, 138, 85, 0.3);
      border-radius: 2px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #3E0F15;
      cursor: pointer;
    }

    .nc-pay-radio input {
      accent-color: #3E0F15;
      width: 15px;
      height: 15px;
    }

    /* Order Success Screen */
    .nc-order-success {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2.5rem 1rem;
      margin: auto 0;
    }

    .nc-order-success.active {
      display: flex;
    }

    .nc-order-success-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #3E0F15;
      color: #D8B982;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
      box-shadow: 0 4px 15px rgba(62, 15, 21, 0.25);
    }

    .nc-order-number-badge {
      display: inline-block;
      padding: 0.4rem 0.9rem;
      background: #F6EEDB;
      border: 1px dashed #B38A55;
      color: #3E0F15;
      font-weight: 700;
      font-size: 0.85rem;
      letter-spacing: 0.08em;
      margin: 0.85rem 0 1.25rem;
      border-radius: 2px;
    }

    /* Toast Notification */
    .nc-toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: #3E0F15;
      color: #FAF6F0;
      border: 1px solid #B38A55;
      padding: 0.85rem 1.4rem;
      border-radius: 3px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.25);
      font-size: 0.84rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      z-index: 999999;
      transform: translateY(120%);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .nc-toast.show {
      transform: translateY(0);
      opacity: 1;
    }
  `;
  document.head.appendChild(style);

  // Cross-environment API URL resolver (works seamlessly on file://, localhost, and custom ports)
  function getApiUrl(endpoint) {
    if (typeof window !== 'undefined' && window.location) {
      if (window.location.origin.startsWith('http://localhost') || window.location.origin.startsWith('http://127.0.0.1')) {
        return endpoint;
      }
      if (window.location.protocol === 'file:') {
        return 'http://localhost:5173' + endpoint;
      }
    }
    return endpoint;
  }

  function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    try {
      const token = localStorage.getItem('nutiyala_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {}
    return headers;
  }

  // Inject Drawer HTML Structure into document body
  function ensureDrawerMarkup() {
    if (document.getElementById('nc-drawer-backdrop')) return;

    const container = document.createElement('div');
    container.innerHTML = `
      <!-- Scrim Overlay -->
      <div class="nc-drawer-backdrop" id="nc-drawer-backdrop"></div>

      <!-- Slide-Out Cart Panel -->
      <aside class="nc-cart-panel" id="nc-cart-panel" aria-label="Shopping Bag">
        
        <!-- ================= VIEW 1: CART / BAG ================= -->
        <div id="nc-view-cart" style="display: flex; flex-direction: column; height: 100%;">
          <div class="nc-drawer-head">
            <div class="nc-drawer-brand">
              <img src="assets/nutiyala-emblem-gold.png" alt="Nutiyala Emblem" class="nc-drawer-emblem">
              <div class="nc-drawer-title-group">
                <h3>Shopping Bag</h3>
                <span class="nc-drawer-subtitle" id="nc-head-count">0 PIECES</span>
              </div>
            </div>
            <button class="nc-drawer-close-btn" id="nc-close-btn" aria-label="Close bag">&times;</button>
          </div>

          <!-- Free Shipping Tracker -->
          <div class="nc-shipping-meter">
            <p class="nc-shipping-text" id="nc-shipping-msg">
              Complimentary Worldwide Shipping on orders over ₹5,000
            </p>
            <div class="nc-progress-bar">
              <div class="nc-progress-fill" id="nc-shipping-fill"></div>
            </div>
          </div>

          <!-- Items Container -->
          <div class="nc-drawer-body" id="nc-items-body">
            <!-- Dynamic Cart Items Rendered Here -->
          </div>

          <!-- Footer Summary -->
          <div class="nc-drawer-foot" id="nc-cart-foot">
            <div class="nc-promo-row">
              <input type="text" id="nc-promo-code" class="nc-promo-input" placeholder="VIP Code (e.g. AURA2026)" value="AURA2026">
              <button class="nc-promo-btn" id="nc-apply-promo">Apply</button>
            </div>

            <div class="nc-bill-breakdown">
              <div class="nc-bill-row">
                <span>Subtotal</span>
                <span id="nc-subtotal">₹0</span>
              </div>
              <div class="nc-bill-row discount" id="nc-discount-row">
                <span>VIP Atelier Privilege (15%)</span>
                <span id="nc-discount">-₹0</span>
              </div>
              <div class="nc-bill-row">
                <span>Couture Express Delivery</span>
                <span id="nc-shipping">FREE</span>
              </div>
              <div class="nc-bill-row total">
                <span>Estimated Total</span>
                <span id="nc-total">₹0</span>
              </div>
            </div>

            <button class="nc-action-btn nc-btn-checkout" id="nc-goto-checkout-btn">
              <span>PROCEED TO CHECKOUT</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        <!-- ================= VIEW 2: INSTANT CHECKOUT ================= -->
        <div id="nc-view-checkout" class="nc-checkout-section">
          <div class="nc-drawer-head">
            <button class="nc-drawer-close-btn" id="nc-back-to-cart" title="Back to Bag" style="font-size: 1.1rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div class="nc-drawer-title-group" style="text-align: center; flex: 1;">
              <h3>Bespoke Checkout</h3>
              <span class="nc-drawer-subtitle">CLIENT DISPATCH DETAILS</span>
            </div>
            <button class="nc-drawer-close-btn" id="nc-close-checkout-btn" aria-label="Close">&times;</button>
          </div>

          <div class="nc-drawer-body">
            <form class="nc-checkout-form" id="nc-checkout-form" onsubmit="return false;">
              <div class="nc-form-group">
                <label class="nc-form-label" for="nc-input-name">Full Name *</label>
                <input type="text" id="nc-input-name" class="nc-form-input" placeholder="e.g. Maharani Zara" required>
              </div>

              <div class="nc-form-row-2">
                <div class="nc-form-group">
                  <label class="nc-form-label" for="nc-input-email">Email Address *</label>
                  <input type="email" id="nc-input-email" class="nc-form-input" placeholder="client@luxury.com" required>
                </div>
                <div class="nc-form-group">
                  <label class="nc-form-label" for="nc-input-phone">Phone / WhatsApp *</label>
                  <input type="tel" id="nc-input-phone" class="nc-form-input" placeholder="+91 98765 43210" required>
                </div>
              </div>

              <div class="nc-form-group">
                <label class="nc-form-label" for="nc-input-street">Delivery Street Address *</label>
                <input type="text" id="nc-input-street" class="nc-form-input" placeholder="House/Flat No., Estate, Street, Landmark" required>
              </div>

              <div class="nc-form-row-2">
                <div class="nc-form-group">
                  <label class="nc-form-label" for="nc-input-city">City *</label>
                  <input type="text" id="nc-input-city" class="nc-form-input" placeholder="e.g. Mumbai" required>
                </div>
                <div class="nc-form-group">
                  <label class="nc-form-label" for="nc-input-pin">Pincode *</label>
                  <input type="text" id="nc-input-pin" class="nc-form-input" placeholder="e.g. 400001" required>
                </div>
              </div>

              <div class="nc-form-group">
                <label class="nc-form-label">Payment Method</label>
                <div class="nc-pay-options">
                  <label class="nc-pay-radio">
                    <input type="radio" name="nc-pay-method" value="Cash on Delivery" checked>
                    <span>Cash on Delivery (Pay at Doorstep)</span>
                  </label>
                  <label class="nc-pay-radio">
                    <input type="radio" name="nc-pay-method" value="UPI / Online Verification">
                    <span>UPI / Net Banking / Card (Instant Confirmation)</span>
                  </label>
                </div>
              </div>
            </form>
          </div>

          <div class="nc-drawer-foot">
            <div class="nc-bill-breakdown">
              <div class="nc-bill-row total">
                <span>Amount to Pay</span>
                <span id="nc-checkout-total">₹0</span>
              </div>
            </div>

            <button class="nc-action-btn nc-btn-checkout" id="nc-submit-order-btn">
              <span>PLACE BESPOKE ORDER</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </button>
          </div>
        </div>

        <!-- ================= VIEW 3: ORDER SUCCESS ================= -->
        <div id="nc-view-success" class="nc-order-success">
          <div class="nc-order-success-icon" style="background: linear-gradient(135deg, #166534, #15803d); color: #fff; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; box-shadow: 0 4px 15px rgba(22,101,52,0.25);">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3 style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.85rem; color: #3E0F15; margin: 0 0 0.35rem; font-weight: 600;">Order Placed Successfully!</h3>
          <p style="font-size: 0.84rem; color: #735D60; margin: 0; line-height: 1.5;">
            Thank you for ordering with Nutiyala Couture! An instant SMS alert has been transmitted to our Store Admin for immediate verification.
          </p>
          <div class="nc-order-number-badge" id="nc-confirmed-order-number" style="display: inline-block; padding: 0.35rem 0.9rem; background: #FAF5EE; border: 1px dashed #B38A55; color: #3E0F15; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.08em; margin: 1rem 0 0.85rem; border-radius: 4px;">ORDER NC-0000</div>
          
          <!-- Live SMS & Confirmation Workflow Card -->
          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px; padding: 0.9rem 1rem; width: 100%; box-sizing: border-box; margin-bottom: 0.9rem; text-align: left; font-size: 0.76rem; color: #166534; line-height: 1.5;">
            <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; margin-bottom: 0.35rem; font-size: 0.8rem;">
              <span>📲 Admin SMS Alert Sent</span>
              <span style="background: #22C55E; color: #fff; font-size: 0.65rem; padding: 1px 6px; border-radius: 10px; font-weight: 700;">ACTIVE</span>
            </div>
            <div>Order & customer dispatch details have been moved directly to Admin SMS. Once Admin verifies and clicks <strong>Confirm Order</strong> in the website portal, your order status changes to <strong>Confirmed</strong> and you will receive an SMS confirmation!</div>
          </div>

          <div style="background: #FFFFFF; border: 1px solid rgba(179, 138, 85, 0.25); border-radius: 6px; padding: 0.9rem 1.1rem; width: 100%; box-sizing: border-box; margin-bottom: 1.25rem; text-align: left; font-size: 0.77rem; color: #4A3A3D;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem; align-items: center;">
              <span style="color: #7A686B;">Order Status:</span>
              <span id="nc-order-status-tag" style="background: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 10px; font-weight: 700; font-size: 0.7rem;">⏳ Awaiting Admin Confirmation</span>
            </div>
            <p style="margin: 0 0 0.35rem;" id="nc-confirmed-address-summary"></p>
            <p style="margin: 0; color: #7A686B; font-size: 0.74rem;"><strong>Notification:</strong> Customer SMS is sent immediately when Admin approves this order.</p>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.65rem; width: 100%;">
            <a href="account.html#orders" class="nc-action-btn nc-btn-checkout" style="text-align: center; text-decoration: none;">TRACK IN MY ORDERS</a>
            <button class="nc-action-btn nc-btn-gold" id="nc-continue-shopping-btn">CONTINUE SHOPPING</button>
          </div>
        </div>

      </aside>

      <!-- Toast Element -->
      <div class="nc-toast" id="nc-toast">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D8B982" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <span id="nc-toast-msg">Item added to your couture bag</span>
      </div>
    `;

    document.body.appendChild(container);
    attachDrawerEvents();
  }

  // Toast Helper
  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById('nc-toast');
    const msgEl = document.getElementById('nc-toast-msg');
    if (!toast || !msgEl) return;
    msgEl.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // Current direct purchase item (if using "Buy Now")
  let directItemToCheckout = null;

  // Drawer Events
  function attachDrawerEvents() {
    const backdrop = document.getElementById('nc-drawer-backdrop');
    const closeBtn = document.getElementById('nc-close-btn');
    const closeCheckoutBtn = document.getElementById('nc-close-checkout-btn');
    const backToCartBtn = document.getElementById('nc-back-to-cart');
    const gotoCheckoutBtn = document.getElementById('nc-goto-checkout-btn');
    const submitOrderBtn = document.getElementById('nc-submit-order-btn');
    const continueShoppingBtn = document.getElementById('nc-continue-shopping-btn');
    const applyPromoBtn = document.getElementById('nc-apply-promo');

    backdrop.addEventListener('click', closeCartDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);
    if (closeCheckoutBtn) closeCheckoutBtn.addEventListener('click', closeCartDrawer);

    if (backToCartBtn) {
      backToCartBtn.addEventListener('click', () => {
        directItemToCheckout = null;
        switchView('cart');
      });
    }

    if (gotoCheckoutBtn) {
      gotoCheckoutBtn.addEventListener('click', () => {
        directItemToCheckout = null;
        switchView('checkout');
      });
    }

    if (continueShoppingBtn) {
      continueShoppingBtn.addEventListener('click', () => {
        closeCartDrawer();
      });
    }

    if (applyPromoBtn) {
      applyPromoBtn.addEventListener('click', () => {
        const code = document.getElementById('nc-promo-code').value.trim().toUpperCase();
        if (code === 'AURA2026') {
          showToast('VIP Privilege Code Applied: 15% Savings');
        } else {
          showToast('Invalid promo code. Use AURA2026');
        }
        refreshCartUI();
      });
    }

    if (submitOrderBtn) {
      submitOrderBtn.addEventListener('click', submitOrder);
    }
  }

  function switchView(viewName) {
    const vCart = document.getElementById('nc-view-cart');
    const vCheckout = document.getElementById('nc-view-checkout');
    const vSuccess = document.getElementById('nc-view-success');

    if (vCart) vCart.style.display = viewName === 'cart' ? 'flex' : 'none';
    if (vCheckout) vCheckout.classList.toggle('active', viewName === 'checkout');
    if (vSuccess) vSuccess.classList.toggle('active', viewName === 'success');
  }

  function openCartDrawer() {
    ensureDrawerMarkup();
    switchView('cart');
    document.getElementById('nc-drawer-backdrop').classList.add('active');
    document.getElementById('nc-cart-panel').classList.add('open');
    document.body.style.overflow = 'hidden';
    refreshCartUI();
  }

  function closeCartDrawer() {
    const panel = document.getElementById('nc-cart-panel');
    const backdrop = document.getElementById('nc-drawer-backdrop');
    if (panel) panel.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Update Header Badges
  async function refreshCartBadges() {
    try {
      const res = await fetch(getApiUrl('/api/cart'), { headers: getAuthHeaders() });
      const data = await res.json();
      const count = data.item_count || 0;
      document.querySelectorAll('#cart-count').forEach(badge => {
        badge.textContent = count;
      });
      const headCount = document.getElementById('nc-head-count');
      if (headCount) headCount.textContent = `${count} ${count === 1 ? 'PIECE' : 'PIECES'}`;
    } catch (e) {}
  }

  // Refresh and Render Cart Contents
  async function refreshCartUI() {
    ensureDrawerMarkup();
    const itemsBody = document.getElementById('nc-items-body');
    const subtotalEl = document.getElementById('nc-subtotal');
    const discountEl = document.getElementById('nc-discount');
    const shippingEl = document.getElementById('nc-shipping');
    const totalEl = document.getElementById('nc-total');
    const checkoutTotalEl = document.getElementById('nc-checkout-total');
    const shippingFill = document.getElementById('nc-shipping-fill');
    const shippingMsg = document.getElementById('nc-shipping-msg');

    itemsBody.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: #735D60;">
        <p>Loading your artisanal selections...</p>
      </div>
    `;

    try {
      const res = await fetch(getApiUrl('/api/cart'), { headers: getAuthHeaders() });
      const data = await res.json();
      const items = data.items || [];
      const subtotal = data.subtotal || 0;
      const count = data.item_count || 0;

      // Update badge
      refreshCartBadges();

      // Free shipping calculation (threshold 5000)
      const threshold = 5000;
      if (subtotal >= threshold) {
        shippingFill.style.width = '100%';
        shippingMsg.innerHTML = '🎉 <strong>Complimentary Worldwide Shipping Unlocked!</strong>';
      } else {
        const remaining = threshold - subtotal;
        const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
        shippingFill.style.width = `${pct}%`;
        shippingMsg.innerHTML = `Add <strong>₹${remaining.toLocaleString('en-IN')}</strong> more for <strong>Complimentary Worldwide Shipping</strong>`;
      }

      // Empty State
      if (items.length === 0) {
        itemsBody.innerHTML = `
          <div class="nc-empty-cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <h4>Your Bag is Empty</h4>
            <p>Your bespoke wardrobe awaits. Discover timeless hand-embroidered kurtis, co-ords, and pure silk creations.</p>
            <a href="/products" class="nc-action-btn nc-btn-checkout" onclick="window.NutiyalaCart.closeCart();">EXPLORE ATELIER</a>
          </div>
        `;
        document.getElementById('nc-cart-foot').style.display = 'none';
        return;
      }

      document.getElementById('nc-cart-foot').style.display = 'block';

      // Render Item List
      itemsBody.innerHTML = items.map(item => `
        <div class="nc-cart-item" data-item-id="${item.id}">
          <img src="${item.image || '/assets/category-single.jpg'}" alt="${item.name}" class="nc-item-img">
          
          <div class="nc-item-info">
            <div>
              <a href="/products/${item.slug}" class="nc-item-title">${item.name}</a>
              <div class="nc-item-meta">
                <span>Size: <strong>${item.size}</strong></span>
                <span>Color: <strong>${item.color}</strong></span>
              </div>
            </div>

            <div class="nc-item-price-row">
              <span class="nc-price-current">₹${item.unit_price.toLocaleString('en-IN')}</span>
              ${item.discount_price ? `<span class="nc-price-orig">₹${item.price.toLocaleString('en-IN')}</span>` : ''}
            </div>
          </div>

          <div class="nc-item-controls">
            <button class="nc-remove-btn" data-action="remove" data-id="${item.id}" title="Remove item">&times;</button>
            <div class="nc-stepper">
              <button data-action="decrease" data-id="${item.id}" ${item.quantity <= 1 ? 'disabled' : ''}>−</button>
              <span>${item.quantity}</span>
              <button data-action="increase" data-id="${item.id}">+</button>
            </div>
          </div>
        </div>
      `).join('');

      // Render breakdown
      const discount = data.discount || 0;
      const shipping = data.shipping || 0;
      const total = data.total || 0;

      subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
      discountEl.textContent = `-₹${discount.toLocaleString('en-IN')}`;
      shippingEl.textContent = shipping === 0 ? 'FREE' : `₹${shipping}`;
      totalEl.textContent = `₹${total.toLocaleString('en-IN')}`;
      if (checkoutTotalEl) checkoutTotalEl.textContent = `₹${total.toLocaleString('en-IN')}`;

      // Stepper & Remove Event Handlers
      itemsBody.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const action = btn.dataset.action;
          const itemId = btn.dataset.id;
          const item = items.find(i => String(i.id) === String(itemId));
          if (!item) return;

          if (action === 'remove') {
            await fetch(getApiUrl(`/api/cart/items/${itemId}`), { method: 'DELETE', headers: getAuthHeaders() });
            showToast('Piece removed from bag');
            refreshCartUI();
          } else if (action === 'increase') {
            await fetch(getApiUrl(`/api/cart/items/${itemId}`), {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify({ quantity: item.quantity + 1 })
            });
            refreshCartUI();
          } else if (action === 'decrease' && item.quantity > 1) {
            await fetch(getApiUrl(`/api/cart/items/${itemId}`), {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify({ quantity: item.quantity - 1 })
            });
            refreshCartUI();
          }
        });
      });

    } catch (e) {
      itemsBody.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #9B1C1C;">
          <p>Failed to retrieve bag items. Please try again.</p>
        </div>
      `;
    }
  }

  // Submit Order (From Checkout Form)
  async function submitOrder() {
    const submitBtn = document.getElementById('nc-submit-order-btn');
    const name = document.getElementById('nc-input-name').value.trim();
    const email = document.getElementById('nc-input-email').value.trim();
    const phone = document.getElementById('nc-input-phone').value.trim();
    const street = document.getElementById('nc-input-street').value.trim();
    const city = document.getElementById('nc-input-city').value.trim();
    const pincode = document.getElementById('nc-input-pin').value.trim();
    const payMethod = document.querySelector('input[name="nc-pay-method"]:checked')?.value || 'Cash on Delivery';
    const promoCode = document.getElementById('nc-promo-code')?.value.trim() || 'AURA2026';

    if (!name || !email || !phone || !street || !city || !pincode) {
      alert('Please fill in all required delivery details (Name, Email, Phone, Street, City, and Pincode).');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>SECURING YOUR ORDER...</span>`;

    const payload = {
      customer: { name, email, phone },
      address: { name, email, phone, street, city, pincode, state: 'India' },
      payment_method: payMethod,
      promo_code: promoCode
    };

    if (directItemToCheckout) {
      payload.direct_item = directItemToCheckout;
    }

    try {
      const res = await fetch(getApiUrl('/api/orders'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order.');
      }

      // Success! Show confirmation screen
      document.getElementById('nc-confirmed-order-number').textContent = `ORDER ID: ${data.order_number}`;
      document.getElementById('nc-confirmed-address-summary').innerHTML = `
        <strong>Dispatch To:</strong> ${name}, ${street}, ${city} — ${pincode}<br>
        <strong>Payment:</strong> ${payMethod} (Total: ₹${data.total.toLocaleString('en-IN')})
      `;

      directItemToCheckout = null;
      refreshCartBadges();
      switchView('success');

    } catch (err) {
      alert(err.message || 'Error processing your couture order.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>PLACE BESPOKE ORDER</span>`;
    }
  }

  // Pre-fill user data if logged in
  async function autofillUserData() {
    try {
      const res = await fetch(getApiUrl('/api/auth/me'), { headers: getAuthHeaders() });
      const data = await res.json();
      if (data && data.user) {
        const u = data.user;
        if (document.getElementById('nc-input-name')) document.getElementById('nc-input-name').value = u.name || '';
        if (document.getElementById('nc-input-email')) document.getElementById('nc-input-email').value = u.email || '';
        if (document.getElementById('nc-input-phone')) document.getElementById('nc-input-phone').value = u.mobile || '';
      }
    } catch (e) {}
  }

  // Global Cart API
  window.NutiyalaCart = {
    open: openCartDrawer,
    openCart: openCartDrawer,
    close: closeCartDrawer,
    closeCart: closeCartDrawer,
    refreshCartBadges: refreshCartBadges,
    addItem: function (productId, size, color, quantity = 1) {
      return window.NutiyalaCart.addToCart(productId, size, color, quantity);
    },

    // Add to Cart
    addToCart: async function (productId, size, color, quantity = 1) {
      ensureDrawerMarkup();
      try {
        const payload = {
          product_id: productId,
          quantity: quantity
        };
        if (size) payload.size = size;
        if (color) payload.color = color;

        const res = await fetch(getApiUrl('/api/cart/items'), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Unable to add creation to bag.');
        }

        showToast('Piece added to your couture bag');
        openCartDrawer();
        refreshCartBadges();
        return true;

      } catch (err) {
        showToast(err.message);
        return false;
      }
    },

    // Buy Now: Prepares direct checkout & opens checkout step instantly
    buyNow: async function (productId, size, color, quantity = 1) {
      ensureDrawerMarkup();
      autofillUserData();

      directItemToCheckout = {
        product_id: productId,
        size: size || '',
        color: color || '',
        quantity: quantity
      };

      // Also add to cart for seamless state
      fetch(getApiUrl('/api/cart/items'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ product_id: productId, size, color, quantity })
      }).then(() => refreshCartBadges()).catch(() => {});

      // Switch straight to Checkout View
      switchView('checkout');
      document.getElementById('nc-drawer-backdrop').classList.add('active');
      document.getElementById('nc-cart-panel').classList.add('open');
      document.body.style.overflow = 'hidden';

      // Update checkout bill
      try {
        const pRes = await fetch(getApiUrl(`/api/products/${productId}`));
        const pData = await pRes.json();
        if (pData && pData.product) {
          const pr = pData.product;
          const unit = pr.discount_price || pr.price;
          const sub = unit * quantity;
          const disc = Math.round(sub * 0.15);
          const ship = sub >= 5000 ? 0 : 250;
          const tot = Math.max(0, sub - disc + ship);
          const el = document.getElementById('nc-checkout-total');
          if (el) el.textContent = `₹${tot.toLocaleString('en-IN')}`;
        }
      } catch (e) {}
    },

    // Open Checkout: Opens drawer directly on the checkout/delivery step
    openCheckout: function () {
      ensureDrawerMarkup();
      autofillUserData();
      directItemToCheckout = null;
      switchView('checkout');
      document.getElementById('nc-drawer-backdrop').classList.add('active');
      document.getElementById('nc-cart-panel').classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  };

  // Auto-bind bag buttons across document
  document.addEventListener('DOMContentLoaded', () => {
    ensureDrawerMarkup();
    refreshCartBadges();
    autofillUserData();

    // Bind any header cart icon button (#cart-btn or .cart-btn-wrap)
    document.querySelectorAll('#cart-btn, .cart-btn-wrap').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openCartDrawer();
      });
    });
  });

})();
