/**
 * Aaradhya Clothing - Luxury Checkout & Order Confirmation Architecture
 * 
 * Features secure tokenized mock gateway architecture ready for Stripe/Razorpay,
 * complete customer address forms, payment method selection,
 * and order confirmation: “Your Aaradhya story has begun.”
 */

export class CheckoutModal {
  constructor(options = {}) {
    this.onOrderCompleted = options.onOrderCompleted || null;

    this.modal = document.getElementById('checkoutModal');
    this.backdrop = document.getElementById('checkoutBackdrop');
    this.closeBtn = document.getElementById('checkoutCloseBtn');
    this.form = document.getElementById('checkoutForm');
    this.orderSummaryList = document.getElementById('checkoutSummaryItems');
    this.summarySubtotal = document.getElementById('checkoutSummarySubtotal');
    this.summaryShipping = document.getElementById('checkoutSummaryShipping');
    this.summaryDiscountRow = document.getElementById('checkoutSummaryDiscountRow');
    this.summaryDiscount = document.getElementById('checkoutSummaryDiscount');
    this.summaryTotal = document.getElementById('checkoutSummaryTotal');

    this.confirmationView = document.getElementById('orderConfirmationView');
    this.checkoutView = document.getElementById('checkoutFormView');
    this.confirmOrderNumber = document.getElementById('confirmOrderNumber');
    this.confirmCustomerName = document.getElementById('confirmCustomerName');
    this.confirmDeliveryAddress = document.getElementById('confirmDeliveryAddress');
    this.confirmTotalPaid = document.getElementById('confirmTotalPaid');
    this.confirmContinueBtn = document.getElementById('confirmContinueBtn');

    this.currentSummary = null;
    this.selectedPaymentMethod = 'card';

    this.init();
  }

  init() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }
    if (this.backdrop) {
      this.backdrop.addEventListener('click', () => this.close());
    }
    if (this.confirmContinueBtn) {
      this.confirmContinueBtn.addEventListener('click', () => this.close());
    }

    // Payment method tabs
    const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
    paymentRadios.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        this.selectedPaymentMethod = e.target.value;
        this.updatePaymentPanels(e.target.value);
      });
    });

    // Form submission
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.processPayment();
      });
    }
  }

  updatePaymentPanels(method) {
    document.querySelectorAll('.payment-subpanel').forEach((panel) => {
      panel.style.display = 'none';
    });
    const active = document.getElementById(`paymentPanel_${method}`);
    if (active) {
      active.style.display = 'block';
    }
  }

  open(cartSummary) {
    this.currentSummary = cartSummary;
    if (!cartSummary || !cartSummary.items || !cartSummary.items.length) {
      alert('Your collection is empty. Please select an Aaradhya garment before proceeding.');
      return;
    }

    // Reset views
    if (this.checkoutView) this.checkoutView.style.display = 'grid';
    if (this.confirmationView) this.confirmationView.style.display = 'none';

    this.renderSummary();

    if (this.modal && this.backdrop) {
      this.modal.classList.add('open');
      this.backdrop.classList.add('open');
      document.body.classList.add('checkout-open');
    }
  }

  close() {
    if (this.modal && this.backdrop) {
      this.modal.classList.remove('open');
      this.backdrop.classList.remove('open');
      document.body.classList.remove('checkout-open');
    }
  }

  renderSummary() {
    if (!this.currentSummary) return;
    const { items, subtotal, shipping, discount, total } = this.currentSummary;

    if (this.orderSummaryList) {
      this.orderSummaryList.innerHTML = items.map((item) => `
        <div class="chk-item">
          <img src="${item.image}" alt="${item.name}" class="chk-item-img" />
          <div class="chk-item-meta">
            <span class="chk-item-name">${item.name}</span>
            <span class="chk-item-spec">Size: ${item.size} • Color: ${item.color} • Qty: ${item.quantity}</span>
            <span class="chk-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
          </div>
        </div>
      `).join('');
    }

    if (this.summarySubtotal) this.summarySubtotal.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    if (this.summaryShipping) this.summaryShipping.textContent = shipping === 0 ? 'Complimentary' : `₹${shipping.toLocaleString('en-IN')}`;
    if (this.summaryDiscountRow && this.summaryDiscount) {
      if (discount > 0) {
        this.summaryDiscountRow.style.display = 'flex';
        this.summaryDiscount.textContent = `-₹${discount.toLocaleString('en-IN')}`;
      } else {
        this.summaryDiscountRow.style.display = 'none';
      }
    }
    if (this.summaryTotal) this.summaryTotal.textContent = `₹${total.toLocaleString('en-IN')}`;
  }

  processPayment() {
    const submitBtn = document.getElementById('checkoutSubmitBtn');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Place Order';

    // Collect customer address info
    const customer = {
      fullName: document.getElementById('chkFullName')?.value || 'Connoisseur',
      email: document.getElementById('chkEmail')?.value || '',
      phone: document.getElementById('chkPhone')?.value || '',
      address: document.getElementById('chkAddress')?.value || '',
      city: document.getElementById('chkCity')?.value || '',
      state: document.getElementById('chkState')?.value || '',
      postalCode: document.getElementById('chkPostalCode')?.value || '',
      country: document.getElementById('chkCountry')?.value || 'India'
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="spinner-ring"></span>
        <span>Securing Atelier Order...</span>
      `;
    }

    // Simulate secure gateway handshake (Stripe / Razorpay mock)
    setTimeout(() => {
      const orderNumber = `AAR-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }

      this.showConfirmation(orderNumber, customer);

      if (this.onOrderCompleted) {
        this.onOrderCompleted(orderNumber, customer, this.currentSummary);
      }
    }, 1400);
  }

  showConfirmation(orderNumber, customer) {
    if (this.checkoutView) this.checkoutView.style.display = 'none';
    if (this.confirmationView) this.confirmationView.style.display = 'block';

    if (this.confirmOrderNumber) this.confirmOrderNumber.textContent = orderNumber;
    if (this.confirmCustomerName) this.confirmCustomerName.textContent = customer.fullName;
    if (this.confirmDeliveryAddress) {
      this.confirmDeliveryAddress.textContent = `${customer.address}, ${customer.city}, ${customer.state} - ${customer.postalCode}, ${customer.country}`;
    }
    if (this.confirmTotalPaid && this.currentSummary) {
      this.confirmTotalPaid.textContent = `₹${this.currentSummary.total.toLocaleString('en-IN')}`;
    }

    // Scroll checkout modal to top
    if (this.modal) {
      this.modal.scrollTop = 0;
    }
  }
}
