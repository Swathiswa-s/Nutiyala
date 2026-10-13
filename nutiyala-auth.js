/* ==========================================================================
   NUTIYALA COUTURE • AUTH & HEADER ACCOUNT SYNC
   Controls: Header Account Button, My Account Flyout, Real Cart & Wishlist Sync
   ========================================================================== */

(function () {
  let currentUser = null;

  const loginUrl = 'login.html';
  const registerUrl = 'register.html';
  const accountUrl = 'account.html';
  const adminUrl = 'admin-orders.html';
  const homeUrl = 'index.html';

  function getApiUrl(endpoint) {
    if (!endpoint) return '';
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    if (window.location.protocol === 'file:' || !window.location.origin || window.location.origin === 'null') {
      return 'http://localhost:5173' + endpoint;
    }
    return endpoint;
  }

  async function initAuthHeader() {
    // 1. Fetch authenticated user (with offline/localStorage fallback)
    try {
      const token = localStorage.getItem('nutiyala_token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const res = await fetch(getApiUrl('/api/auth/me'), { headers });
      if (res.ok) {
        const data = await res.json();
        currentUser = data ? data.user : null;
      }
    } catch (e) {
      currentUser = null;
    }
    if (!currentUser) {
      try {
        const localUser = localStorage.getItem('nutiyala_user');
        if (localUser) currentUser = JSON.parse(localUser);
      } catch (err) {}
    }

    // 2. Ensure Flyout markup exists
    injectFlyoutMarkup();

    // 3. Update Header Account / Login Button
    const accountBtn = document.getElementById('account-btn');
    const loginText = document.querySelector('.login-btn-label');

    if (accountBtn) {
      if (currentUser) {
        if (currentUser.account_type === 'ADMIN') {
          if (loginText) loginText.textContent = 'ADMIN';
          accountBtn.setAttribute('title', 'Admin Atelier Portal');
          accountBtn.setAttribute('href', adminUrl);
          accountBtn.onclick = (e) => {
            e.preventDefault();
            window.location.href = adminUrl;
          };
        } else {
          const firstName = currentUser.name ? currentUser.name.split(' ')[0].toUpperCase() : 'ACCOUNT';
          if (loginText) loginText.textContent = firstName || 'ACCOUNT';
          accountBtn.setAttribute('title', `My Account: ${currentUser.name}`);
          accountBtn.setAttribute('href', accountUrl);
          accountBtn.onclick = (e) => {
            e.preventDefault();
            openAccountFlyout();
          };
        }
      } else {
        if (loginText) loginText.textContent = 'LOGIN';
        accountBtn.setAttribute('title', 'Sign In to Nutiyala Couture');
        accountBtn.setAttribute('href', loginUrl);
        accountBtn.onclick = (e) => {
          e.preventDefault();
          window.location.href = loginUrl;
        };
      }
    }

    // 4. Update Announcement Bar Login Link
    const annLogin = document.getElementById('announcement-login-link');
    if (annLogin) {
      if (currentUser) {
        if (currentUser.account_type === 'ADMIN') {
          annLogin.textContent = 'Admin Portal';
          annLogin.href = adminUrl;
        } else {
          annLogin.textContent = `Hello, ${currentUser.name.split(' ')[0]}`;
          annLogin.href = accountUrl;
        }
      } else {
        annLogin.textContent = 'Client Sign In';
        annLogin.href = loginUrl;
      }
    }

    // 5. Update Sidebar Login / Account Links
    const sidebarLoginLink = document.getElementById('sidebar-login-link');
    const sidebarLoginLabel = document.getElementById('sidebar-login-label');

    if (sidebarLoginLink) {
      if (currentUser) {
        if (currentUser.account_type === 'ADMIN') {
          if (sidebarLoginLabel) sidebarLoginLabel.textContent = 'Admin Details';
          sidebarLoginLink.href = '#admin-details';
          sidebarLoginLink.onclick = (e) => {
            e.preventDefault();
            closeLeftSidebar();
            openAdminDetailsModal();
          };
        } else {
          if (sidebarLoginLabel) sidebarLoginLabel.textContent = 'My Account';
          sidebarLoginLink.href = accountUrl;
        }
      } else {
        if (sidebarLoginLabel) sidebarLoginLabel.textContent = 'LOGIN';
        sidebarLoginLink.href = loginUrl;
      }
    }

    const directLoginBtn = document.getElementById('sidebar-direct-login-btn');
    const directLoginLabel = document.querySelector('.sidebar-direct-login-label');
    if (directLoginBtn) {
      if (currentUser) {
        if (currentUser.account_type === 'ADMIN') {
          if (directLoginLabel) directLoginLabel.textContent = 'Admin Details & Contact Settings';
          directLoginBtn.href = '#admin-details';
          directLoginBtn.onclick = (e) => {
            e.preventDefault();
            closeLeftSidebar();
            openAdminDetailsModal();
          };
        } else {
          if (directLoginLabel) directLoginLabel.textContent = `Client Portal • ${currentUser.name}`;
          directLoginBtn.href = accountUrl;
        }
      } else {
        if (directLoginLabel) directLoginLabel.textContent = 'Client Portal • Sign In / Register';
        directLoginBtn.href = loginUrl;
      }
    }

    // 6. Inject Admin Controls ONLY if Logged in as Admin
    if (currentUser && currentUser.account_type === 'ADMIN') {
      injectAdminControls();
    }

    // 7. Update Cart and Wishlist Badge Counts from Database
    syncBadgeCounts();
  }

  function closeLeftSidebar() {
    const leftSidebar = document.getElementById('atelier-left-sidebar') || document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (leftSidebar) leftSidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  function injectAdminControls() {
    // 1. Top Admin Floating Bar
    if (!document.getElementById('nutiyala-admin-bar')) {
      document.body.classList.add('admin-bar-active');
      const bar = document.createElement('div');
      bar.className = 'nutiyala-admin-bar';
      bar.id = 'nutiyala-admin-bar';
      bar.innerHTML = `
        <div class="admin-bar-inner">
          <span class="admin-badge"><i data-lucide="shield-check" style="width:14px;height:14px;"></i> ADMIN SESSION ACTIVE</span>
          <div class="admin-quick-links">
            <button id="admin-bar-details-btn" class="admin-bar-link-btn" title="Change Boutique Email, Logo & Phone"><i data-lucide="settings"></i> Admin Details</button>
            <a href="admin-product-edit.html"><i data-lucide="plus-circle"></i> Add Product</a>
            <a href="admin-inventory.html"><i data-lucide="boxes"></i> Inventory</a>
            <a href="admin-orders.html"><i data-lucide="package"></i> Orders</a>
            <a href="admin-customers.html"><i data-lucide="users"></i> Customers</a>
          </div>
          <button id="admin-quick-logout" class="admin-logout-btn"><i data-lucide="log-out" style="width:12px;height:12px;"></i> Logout</button>
        </div>
      `;
      document.body.prepend(bar);

      document.getElementById('admin-quick-logout').addEventListener('click', async () => {
        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch(e){}
        localStorage.removeItem('nutiyala_token');
        localStorage.removeItem('nutiyala_user');
        window.location.reload();
      });

      document.getElementById('admin-bar-details-btn').addEventListener('click', () => {
        openAdminDetailsModal();
      });
    }

    // 2. Sidebar Admin Controls Injection
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav && !document.getElementById('sidebar-admin-section')) {
      const adminSec = document.createElement('div');
      adminSec.className = 'sidebar-admin-section';
      adminSec.id = 'sidebar-admin-section';
      adminSec.innerHTML = `
        <div class="sidebar-admin-title">
          <i data-lucide="shield-check" style="width:14px; height:14px;"></i>
          <span>ADMIN EXECUTIVE ATELIER</span>
        </div>
        <ul class="sidebar-admin-links">
          <li>
            <button type="button" class="sidebar-admin-link sidebar-admin-btn" id="sidebar-admin-details-btn" title="Edit Admin Details & Website Footer">
              <i data-lucide="settings"></i>
              <span style="flex:1; text-align:left;">Admin Details & Footer</span>
              <span class="admin-badge-pill">EDIT</span>
            </button>
          </li>
          <li>
            <a href="admin-product-edit.html" class="sidebar-admin-link">
              <i data-lucide="plus-circle"></i>
              <span>Add New Product & Photos</span>
            </a>
          </li>
          <li>
            <a href="admin-products.html" class="sidebar-admin-link">
              <i data-lucide="hanger"></i>
              <span>Manage Products Catalog</span>
            </a>
          </li>
          <li>
            <a href="admin-inventory.html" class="sidebar-admin-link">
              <i data-lucide="boxes"></i>
              <span>Live Inventory & Stock</span>
            </a>
          </li>
          <li>
            <a href="admin-orders.html" class="sidebar-admin-link">
              <i data-lucide="truck"></i>
              <span>Order Logistics (6 Stages)</span>
            </a>
          </li>
          <li>
            <a href="admin-customers.html" class="sidebar-admin-link">
              <i data-lucide="users"></i>
              <span>Client Dossiers & Directory</span>
            </a>
          </li>
          <li>
            <a href="admin-offers.html" class="sidebar-admin-link">
              <i data-lucide="sparkles"></i>
              <span>Update Offer</span>
            </a>
          </li>
        </ul>
      `;
      sidebarNav.appendChild(adminSec);

      document.getElementById('sidebar-admin-details-btn').addEventListener('click', () => {
        closeLeftSidebar();
        openAdminDetailsModal();
      });
    }

    if (window.lucide) lucide.createIcons();
  }

  function injectAdminDetailsModal() {
    if (document.getElementById('admin-details-inpage-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.id = 'admin-details-inpage-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal-backdrop" id="admin-details-inpage-backdrop"></div>
      <div class="modal-card" style="max-width: 620px; padding: 2.2rem 2rem; background: #FAF7F2; max-height: 90vh; overflow-y: auto;">
        <button class="modal-close-btn" id="admin-details-inpage-close" aria-label="Close modal">
          <i data-lucide="x"></i>
        </button>

        <div style="text-align: center; margin-bottom: 1.25rem;">
          <span style="font-size: 0.72rem; letter-spacing: 0.16em; text-transform: uppercase; color: #B38A55; font-weight: 700;">ATELIER ADMIN SETTINGS</span>
          <h3 style="font-family: var(--font-serif); font-size: 1.85rem; color: #3E0F15; margin: 0.35rem 0 0.35rem;">Boutique & Footer Details</h3>
          <p style="font-size: 0.82rem; color: #735D60; margin: 0;">Change the official email, boutique name, phone, logo, and Instagram visible in the website footer.</p>
        </div>

        <form id="inpage-admin-details-form" style="display: flex; flex-direction: column; gap: 0.9rem;">
          <!-- 1. Boutique Name -->
          <div>
            <label style="font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #3E0F15; display: block; margin-bottom: 0.3rem;">Boutique Name *</label>
            <input type="text" id="inpage-boutique-name" required placeholder="Nutiyala Couture" style="width: 100%; padding: 0.7rem 0.9rem; border: 1px solid rgba(179,138,85,0.45); border-radius: 4px; font-family: inherit; font-size: 0.88rem; box-sizing: border-box; background: #fff;">
          </div>

          <!-- 2. Official Email -->
          <div>
            <label style="font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #3E0F15; display: block; margin-bottom: 0.3rem;">Official Email (Visible in Website Footer) *</label>
            <input type="email" id="inpage-boutique-email" required placeholder="contact@nutiyala.com" style="width: 100%; padding: 0.7rem 0.9rem; border: 1px solid rgba(179,138,85,0.45); border-radius: 4px; font-family: inherit; font-size: 0.88rem; box-sizing: border-box; background: #fff;">
            <span style="font-size: 0.7rem; color: #8C6D46; display: block; margin-top: 0.25rem;">Visitors clicking this email in the footer will automatically open their mail client.</span>
          </div>

          <!-- 3. Phone & Instagram -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div>
              <label style="font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #3E0F15; display: block; margin-bottom: 0.3rem;">Contact Number *</label>
              <input type="text" id="inpage-boutique-phone" required placeholder="+91 98765 43210" style="width: 100%; padding: 0.7rem 0.9rem; border: 1px solid rgba(179,138,85,0.45); border-radius: 4px; font-family: inherit; font-size: 0.88rem; box-sizing: border-box; background: #fff;">
            </div>
            <div>
              <label style="font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #3E0F15; display: block; margin-bottom: 0.3rem;">Instagram Account *</label>
              <input type="text" id="inpage-boutique-instagram" required placeholder="@nutiyala_couture" style="width: 100%; padding: 0.7rem 0.9rem; border: 1px solid rgba(179,138,85,0.45); border-radius: 4px; font-family: inherit; font-size: 0.88rem; box-sizing: border-box; background: #fff;">
            </div>
          </div>

          <!-- 4. Logo & Image Upload -->
          <div>
            <label style="font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #3E0F15; display: block; margin-bottom: 0.3rem;">Boutique Logo Emblem</label>
            <div style="display: flex; gap: 0.85rem; align-items: center; background: #F3ECE2; padding: 0.65rem 0.85rem; border-radius: 4px; border: 1px dashed #C59A45; margin-bottom: 0.45rem;">
              <img id="inpage-logo-thumb" src="assets/nutiyala-emblem-gold.png" alt="Logo Thumb" style="width: 38px; height: 38px; object-fit: contain; background: #2E0B10; border-radius: 4px; padding: 3px;">
              <div style="flex: 1;">
                <input type="file" id="inpage-logo-file-input" accept="image/*" style="display: none;">
                <button type="button" id="inpage-btn-upload-logo" style="background: #fff; border: 1px solid #B38A55; color: #3E0F15; padding: 0.35rem 0.75rem; border-radius: 3px; font-size: 0.74rem; font-weight: 600; cursor: pointer;">
                  Upload Logo File
                </button>
                <span style="font-size: 0.7rem; color: #735D60; margin-left: 0.5rem;">PNG, SVG, or JPG</span>
              </div>
            </div>
            <input type="text" id="inpage-boutique-logo" placeholder="assets/nutiyala-emblem-gold.png" style="width: 100%; padding: 0.65rem 0.85rem; border: 1px solid rgba(179,138,85,0.45); border-radius: 4px; font-family: inherit; font-size: 0.82rem; box-sizing: border-box; background: #fff;">
          </div>

          <!-- Submit Button -->
          <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem;">
            <button type="submit" id="inpage-btn-save-details" style="flex: 1; padding: 0.85rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; background: #5A161E; color: #FAF6F0; border: none; border-radius: 4px; cursor: pointer; transition: background 0.2s;">
              Save & Update Website Footer
            </button>
            <button type="button" id="inpage-btn-cancel" style="padding: 0.85rem 1.25rem; font-weight: 600; background: transparent; border: 1px solid #CBD5E0; color: #4A5568; border-radius: 4px; cursor: pointer;">
              Cancel
            </button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    const backdrop = document.getElementById('admin-details-inpage-backdrop');
    const closeBtn = document.getElementById('admin-details-inpage-close');
    const cancelBtn = document.getElementById('inpage-btn-cancel');
    const fileInput = document.getElementById('inpage-logo-file-input');
    const uploadBtn = document.getElementById('inpage-btn-upload-logo');
    const logoInput = document.getElementById('inpage-boutique-logo');
    const logoThumb = document.getElementById('inpage-logo-thumb');
    const form = document.getElementById('inpage-admin-details-form');
    const saveBtn = document.getElementById('inpage-btn-save-details');

    const closeModal = () => modal.classList.remove('open');
    if (backdrop) backdrop.onclick = closeModal;
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;

    logoInput.addEventListener('input', () => {
      logoThumb.src = logoInput.value.trim() || 'assets/nutiyala-emblem-gold.png';
    });

    uploadBtn.onclick = () => fileInput.click();
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Uploading...';
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = reader.result;
          logoInput.value = base64Data;
          logoThumb.src = base64Data;

          // Attempt server upload if accessible
          try {
            const token = localStorage.getItem('nutiyala_token');
            if (!token) {
              console.warn('Backend upload skipped (no authentication token)');
              return;
            }
            const res = await fetch(getApiUrl('/api/admin/upload'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ filename: file.name, data: base64Data })
            });
            if (res.ok) {
              const data = await res.json();
              if (data && data.url) {
                logoInput.value = data.url;
                logoThumb.src = data.url;
              }
            }
          } catch (uploadErr) {
            console.warn('Backend upload skipped (offline or file protocol), saved locally');
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.warn('Logo file read failed:', err);
      } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload Logo File';
      }
    };

    form.onsubmit = async (e) => {
      e.preventDefault();
      const payload = {
        boutique_name: document.getElementById('inpage-boutique-name').value.trim() || 'NUTIYALA',
        email: document.getElementById('inpage-boutique-email').value.trim(),
        contact_number: document.getElementById('inpage-boutique-phone').value.trim(),
        instagram: document.getElementById('inpage-boutique-instagram').value.trim(),
        logo_url: document.getElementById('inpage-boutique-logo').value.trim() || 'assets/nutiyala-emblem-gold.png'
      };

      if (!payload.email) {
        alert('Please enter an official boutique email address.');
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving & Syncing...';

      // 1. Immediately persist to localStorage and update page DOM so there is zero loss
      try {
        localStorage.setItem('nutiyala_boutique_details', JSON.stringify(payload));
      } catch (err) {}
      applyBoutiqueDetails(payload);

      // 2. Persist to server (gracefully catch errors if on file:// or offline)
      try {
        const token = localStorage.getItem('nutiyala_token');
        if (!token) {
          console.warn('Server sync skipped (no authentication token)');
          return;
        }
        const res = await fetch(getApiUrl('/api/admin/details'), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.details) {
            localStorage.setItem('nutiyala_boutique_details', JSON.stringify(data.details));
            applyBoutiqueDetails(data.details);
          }
        }
      } catch (err) {
        console.warn('Server sync skipped (file protocol or offline), stored in browser local storage:', err);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save & Update Website Footer';
      }

      closeModal();
      showAdminToast('Boutique details saved! The website footer has been updated live.');
    };

    if (window.lucide) lucide.createIcons();
  }

  async function openAdminDetailsModal() {
    injectAdminDetailsModal();
    const modal = document.getElementById('admin-details-inpage-modal');
    if (!modal) return;

    const populateInputs = (d) => {
      if (!d) return;
      if (document.getElementById('inpage-boutique-name')) document.getElementById('inpage-boutique-name').value = d.boutique_name || 'NUTIYALA';
      if (document.getElementById('inpage-boutique-email')) document.getElementById('inpage-boutique-email').value = d.email || 'contact@nutiyala.com';
      if (document.getElementById('inpage-boutique-phone')) document.getElementById('inpage-boutique-phone').value = d.contact_number || '+91 98765 43210';
      if (document.getElementById('inpage-boutique-instagram')) document.getElementById('inpage-boutique-instagram').value = d.instagram || 'https://instagram.com/nutiyala_couture';
      if (document.getElementById('inpage-boutique-logo')) document.getElementById('inpage-boutique-logo').value = d.logo_url || 'assets/nutiyala-emblem-gold.png';
      if (document.getElementById('inpage-logo-thumb')) document.getElementById('inpage-logo-thumb').src = d.logo_url || 'assets/nutiyala-emblem-gold.png';
    };

    // 1. Initial populate from localStorage or current footer DOM
    try {
      const cached = localStorage.getItem('nutiyala_boutique_details');
      if (cached) {
        populateInputs(JSON.parse(cached));
      } else {
        const currEmail = document.getElementById('footer-email')?.textContent?.trim();
        const currPhone = document.getElementById('footer-phone')?.textContent?.trim();
        const currInsta = document.getElementById('footer-instagram')?.textContent?.trim();
        const currLogo = document.getElementById('footer-logo')?.src;
        populateInputs({
          boutique_name: 'NUTIYALA',
          email: currEmail || 'contact@nutiyala.com',
          contact_number: currPhone || '+91 98765 43210',
          instagram: currInsta || 'https://instagram.com/nutiyala_couture',
          logo_url: currLogo || 'assets/nutiyala-emblem-gold.png'
        });
      }
    } catch (e) {}

    // 2. Fetch fresh from backend server if reachable
    try {
      const res = await fetch(getApiUrl('/api/settings'));
      if (res.ok) {
        const data = await res.json();
        const d = data.details || {};
        populateInputs(d);
        try {
          localStorage.setItem('nutiyala_boutique_details', JSON.stringify(d));
        } catch (e) {}
      }
    } catch (e) {}

    modal.classList.add('open');
    if (window.lucide) lucide.createIcons();
  }

  function showAdminToast(msg) {
    let toast = document.getElementById('inpage-admin-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'inpage-admin-toast';
      toast.style.cssText = 'position:fixed;bottom:2rem;right:2rem;background:#1E2024;color:#FAF6F0;padding:1rem 1.4rem;border-radius:6px;box-shadow:0 6px 20px rgba(0,0,0,0.3);border-left:4px solid #C59A45;z-index:99999;font-size:0.86rem;font-weight:500;display:flex;align-items:center;gap:0.6rem;transform:translateY(100px);opacity:0;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i data-lucide="check-circle" style="width:18px;height:18px;color:#2E7D32;"></i><span>${msg}</span>`;
    if (window.lucide) lucide.createIcons();
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.transform = 'translateY(100px)';
      toast.style.opacity = '0';
    }, 4000);
  }

  function injectFlyoutMarkup() {
    if (document.getElementById('my-account-flyout')) return;

    const flyout = document.createElement('div');
    flyout.className = 'my-account-flyout';
    flyout.id = 'my-account-flyout';
    flyout.setAttribute('aria-hidden', 'true');

    const name = currentUser ? currentUser.name : 'Esteemed Client';
    const email = currentUser ? currentUser.email : 'client@nutiyala.com';
    const avatar = name[0] ? name[0].toUpperCase() : 'C';

    flyout.innerHTML = `
      <div class="account-flyout-backdrop" id="account-flyout-backdrop"></div>
      <div class="account-flyout-card">
        <div class="account-flyout-header">
          <div class="account-user-badge">
            <div class="account-avatar-circle" id="flyout-avatar">${avatar}</div>
            <div>
              <h4 class="flyout-user-name" id="flyout-name">${name}</h4>
              <span class="flyout-user-email" id="flyout-email">${email}</span>
            </div>
          </div>
          <button class="flyout-close-btn" id="flyout-close-btn" aria-label="Close Account Menu">
            <i data-lucide="x"></i>
          </button>
        </div>

        <div class="account-flyout-body">
          <div class="flyout-title">MY ACCOUNT</div>
          <ul class="flyout-nav-list">
            <li>
              <a href="account.html#profile" class="flyout-nav-link">
                <i data-lucide="user"></i>
                <span>Profile</span>
              </a>
            </li>
            <li>
              <a href="account.html#orders" class="flyout-nav-link">
                <i data-lucide="package"></i>
                <span>My Orders</span>
              </a>
            </li>
            <li>
              <a href="account.html#wishlist" class="flyout-nav-link">
                <i data-lucide="heart"></i>
                <span>Wishlist</span>
              </a>
            </li>
            <li>
              <a href="account.html#addresses" class="flyout-nav-link">
                <i data-lucide="map-pin"></i>
                <span>Saved Addresses</span>
              </a>
            </li>
            <li class="flyout-divider"></li>
            <li>
              <button class="flyout-logout-btn" id="flyout-logout-btn">
                <i data-lucide="log-out"></i>
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    `;

    document.body.appendChild(flyout);
    if (window.lucide) lucide.createIcons();

    // Bind Close & Backdrop
    document.getElementById('flyout-close-btn').addEventListener('click', closeAccountFlyout);
    document.getElementById('account-flyout-backdrop').addEventListener('click', closeAccountFlyout);

    // Bind Logout
    document.getElementById('flyout-logout-btn').addEventListener('click', async () => {
      try { await fetch('/api/auth/logout', { method: 'POST' }); } catch(e){}
      localStorage.removeItem('nutiyala_token');
      localStorage.removeItem('nutiyala_user');
      window.location.href = homeUrl;
    });
  }

  function openAccountFlyout() {
    const flyout = document.getElementById('my-account-flyout');
    if (flyout) {
      if (currentUser) {
        document.getElementById('flyout-name').textContent = currentUser.name;
        document.getElementById('flyout-email').textContent = currentUser.email;
        document.getElementById('flyout-avatar').textContent = currentUser.name[0].toUpperCase();
      }
      flyout.classList.add('open');
      flyout.setAttribute('aria-hidden', 'false');
      if (window.lucide) lucide.createIcons();
    }
  }

  function closeAccountFlyout() {
    const flyout = document.getElementById('my-account-flyout');
    if (flyout) {
      flyout.classList.remove('open');
      flyout.setAttribute('aria-hidden', 'true');
    }
  }

  async function syncBadgeCounts() {
    try {
      const cartRes = await fetch('/api/cart');
      const cartData = await cartRes.json();
      const cartCountEl = document.getElementById('cart-count');
      if (cartCountEl && cartData.item_count !== undefined) {
        cartCountEl.textContent = cartData.item_count;
      }
    } catch (e) {}

    try {
      const wishRes = await fetch('/api/wishlist');
      const wishData = await wishRes.json();
      const wishCountEl = document.getElementById('wishlist-count');
      if (wishCountEl && wishData.items) {
        wishCountEl.textContent = wishData.items.length;
      }
    } catch (e) {}
  }

  // ==========================================================================
  // WISHLIST LOGIN POPUP WIZARD
  // ==========================================================================
  let pendingWishlistProduct = null;
  let pendingWishlistCallback = null;

  function injectWishlistModal() {
    if (document.getElementById('nc-wl-modal-backdrop')) return;

    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
      .nc-wl-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(18, 10, 8, 0.72);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
      }
      .nc-wl-modal-backdrop.active {
        opacity: 1;
        visibility: visible;
      }
      .nc-wl-modal-box {
        background: #FAF6F0;
        border: 1px solid rgba(179, 138, 85, 0.4);
        border-radius: 4px;
        max-width: 400px;
        width: 100%;
        padding: 2.2rem 2rem;
        position: relative;
        box-shadow: 0 15px 40px rgba(42, 10, 14, 0.35);
        transform: translateY(20px) scale(0.97);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Montserrat', sans-serif;
        box-sizing: border-box;
      }
      .nc-wl-modal-backdrop.active .nc-wl-modal-box {
        transform: translateY(0) scale(1);
      }
      .nc-wl-modal-close {
        position: absolute;
        top: 14px;
        right: 14px;
        background: none;
        border: none;
        font-size: 1.35rem;
        color: #735D60;
        cursor: pointer;
        line-height: 1;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
      }
      .nc-wl-modal-close:hover {
        background: rgba(62, 15, 21, 0.08);
        color: #3E0F15;
      }
      .nc-wl-modal-head {
        text-align: center;
        margin-bottom: 1.4rem;
      }
      .nc-wl-emblem {
        width: 38px;
        height: 38px;
        margin-bottom: 0.65rem;
      }
      .nc-wl-title {
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-size: 1.7rem;
        color: #3E0F15;
        margin: 0 0 0.35rem;
        font-weight: 600;
      }
      .nc-wl-subtitle {
        font-size: 0.78rem;
        color: #735D60;
        margin: 0;
        line-height: 1.45;
      }
      .nc-wl-error {
        background: #FEE2E2;
        border: 1px solid #F87171;
        color: #991B1B;
        font-size: 0.76rem;
        padding: 0.5rem 0.75rem;
        border-radius: 3px;
        margin-bottom: 1rem;
        text-align: center;
      }
      .nc-wl-field {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        margin-bottom: 0.95rem;
      }
      .nc-wl-field label {
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #3E0F15;
      }
      .nc-wl-field input {
        padding: 0.7rem 0.85rem;
        border: 1px solid rgba(179, 138, 85, 0.35);
        border-radius: 2px;
        background: #FFFFFF;
        font-size: 0.85rem;
        outline: none;
        transition: border-color 0.2s;
        box-sizing: border-box;
        width: 100%;
      }
      .nc-wl-field input:focus {
        border-color: #3E0F15;
      }
      .nc-wl-submit-btn {
        width: 100%;
        padding: 0.85rem;
        background: #3E0F15;
        color: #FAF6F0;
        border: 1px solid #3E0F15;
        border-radius: 2px;
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.2s;
        margin-top: 0.4rem;
      }
      .nc-wl-submit-btn:hover {
        background: #5A1827;
      }
      .nc-wl-foot {
        margin-top: 1.25rem;
        text-align: center;
        font-size: 0.75rem;
        color: #735D60;
      }
      .nc-wl-foot a {
        color: #B38A55;
        font-weight: 700;
        text-decoration: none;
        margin-left: 0.3rem;
      }
      .nc-wl-foot a:hover {
        text-decoration: underline;
        color: #3E0F15;
      }
    `;
    document.head.appendChild(modalStyle);

    const modal = document.createElement('div');
    modal.className = 'nc-wl-modal-backdrop';
    modal.id = 'nc-wl-modal-backdrop';
    modal.innerHTML = `
      <div class="nc-wl-modal-box">
        <button class="nc-wl-modal-close" id="nc-wl-modal-close" aria-label="Close modal">&times;</button>
        <div class="nc-wl-modal-head">
          <img src="assets/nutiyala-emblem-gold.png" alt="Nutiyala Emblem" class="nc-wl-emblem">
          <h3 class="nc-wl-title">Save to Your Wishlist</h3>
          <p class="nc-wl-subtitle">Sign in to curate your bespoke wardrobe and access your saved pieces across all devices.</p>
        </div>

        <div class="nc-wl-error" id="nc-wl-error" style="display: none;"></div>

        <form id="nc-wl-form" onsubmit="return false;">
          <div class="nc-wl-field">
            <label for="nc-wl-email">Email Address</label>
            <input type="email" id="nc-wl-email" placeholder="client@luxury.com" required autocomplete="email">
          </div>
          <div class="nc-wl-field">
            <label for="nc-wl-password">Password</label>
            <input type="password" id="nc-wl-password" placeholder="••••••••" required autocomplete="current-password">
          </div>
          <button type="submit" class="nc-wl-submit-btn" id="nc-wl-submit-btn">
            <span>SIGN IN & SAVE CREATION</span>
          </button>
        </form>

        <div class="nc-wl-foot">
          <span>New to Nutiyala Couture?</span>
          <a href="register.html" id="nc-wl-register-link">Create an Account</a>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const backdrop = document.getElementById('nc-wl-modal-backdrop');
    const closeBtn = document.getElementById('nc-wl-modal-close');
    const form = document.getElementById('nc-wl-form');

    const closeModal = () => {
      backdrop.classList.remove('active');
      pendingWishlistProduct = null;
      pendingWishlistCallback = null;
    };

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
    closeBtn.addEventListener('click', closeModal);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('nc-wl-email').value.trim();
      const password = document.getElementById('nc-wl-password').value;
      const errBox = document.getElementById('nc-wl-error');
      const submitBtn = document.getElementById('nc-wl-submit-btn');

      errBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>VERIFYING CREDENTIALS...</span>`;

      try {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          throw new Error(loginData.error || 'Invalid credentials');
        }

        // Successfully logged in!
        currentUser = loginData.user;
        initAuthHeader();

        // Now save the pending wishlist item
        if (pendingWishlistProduct) {
          const wishRes = await fetch('/api/wishlist/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id: pendingWishlistProduct })
          });
          const wishData = await wishRes.json();
          if (pendingWishlistCallback) {
            pendingWishlistCallback(wishData.wishlisted);
          }
          syncBadgeCounts();
        }

        closeModal();
      } catch (err) {
        errBox.textContent = err.message;
        errBox.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>SIGN IN & SAVE CREATION</span>`;
      }
    });
  }

  function promptWishlistLogin(productId, onWishlisted) {
    injectWishlistModal();
    pendingWishlistProduct = productId;
    pendingWishlistCallback = onWishlisted;

    const backdrop = document.getElementById('nc-wl-modal-backdrop');
    const errBox = document.getElementById('nc-wl-error');
    if (errBox) errBox.style.display = 'none';
    if (backdrop) backdrop.classList.add('active');
    const emailInput = document.getElementById('nc-wl-email');
    if (emailInput) setTimeout(() => emailInput.focus(), 150);
  }

  // Synchronously update boutique details across DOM elements
  function applyBoutiqueDetails(d) {
    if (!d) return;

    // 1. Logo
    document.querySelectorAll('#footer-logo, .footer-simple-logo').forEach(el => {
      if (d.logo_url) el.src = d.logo_url;
      if (d.boutique_name) el.alt = d.boutique_name;
    });

    // 2. Boutique Name
    document.querySelectorAll('#footer-boutique-name, .footer-simple-name, .footer-copy-name').forEach(el => {
      if (d.boutique_name) el.textContent = d.boutique_name;
    });

    // 3. Email
    document.querySelectorAll('#footer-email').forEach(el => {
      if (d.email) el.textContent = d.email;
    });
    document.querySelectorAll('#footer-email-link').forEach(el => {
      if (d.email) el.href = `mailto:${d.email}`;
    });

    // 4. Contact Number / Phone
    document.querySelectorAll('#footer-phone').forEach(el => {
      if (d.contact_number) el.textContent = d.contact_number;
    });
    document.querySelectorAll('#footer-phone-link').forEach(el => {
      if (d.contact_number) {
        const rawNum = d.contact_number.replace(/[^0-9+]/g, '');
        el.href = `tel:${rawNum}`;
      }
    });

    // 5. Instagram
    document.querySelectorAll('#footer-instagram').forEach(el => {
      if (d.instagram) {
        let handle = d.instagram.trim();
        if (handle.includes('instagram.com/')) {
          const parts = handle.split('instagram.com/');
          const sub = parts[1].replace(/\/$/, '').split(/[?#]/)[0];
          handle = '@' + sub;
        } else if (!handle.startsWith('@') && !handle.startsWith('http')) {
          handle = '@' + handle;
        }
        el.textContent = handle;
      }
    });
    document.querySelectorAll('#footer-insta-link').forEach(el => {
      if (d.instagram) {
        let url = d.instagram.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = `https://instagram.com/${url.replace(/^@/, '')}`;
        }
        el.href = url;
      }
    });

    ensureInstagramIcons();
  }

  const INSTAGRAM_SVG_HTML = '<svg class="instagram-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>';

  function ensureInstagramIcons() {
    // 1. Replace any i[data-lucide="instagram"] with crisp SVG
    document.querySelectorAll('i[data-lucide="instagram"]').forEach(el => {
      const span = document.createElement('span');
      span.innerHTML = INSTAGRAM_SVG_HTML;
      const svg = span.firstElementChild;
      el.replaceWith(svg);
    });

    // 2. Ensure every #footer-insta-link has the SVG if missing
    document.querySelectorAll('#footer-insta-link, .footer-insta-link, #live-preview-insta-link').forEach(link => {
      if (!link.querySelector('svg.instagram-icon') && !link.querySelector('svg')) {
        link.insertAdjacentHTML('afterbegin', INSTAGRAM_SVG_HTML);
      }
    });
  }

  // Sync Boutique Details to Footer (Logo, Boutique Name, Email, Phone, Instagram)
  async function syncBoutiqueFooter() {
    ensureInstagramIcons();

    // 1. First apply cached details from localStorage immediately
    try {
      const cached = localStorage.getItem('nutiyala_boutique_details');
      if (cached) {
        applyBoutiqueDetails(JSON.parse(cached));
      }
    } catch (e) {}

    // 2. Fetch latest settings from server
    try {
      const res = await fetch(getApiUrl('/api/settings'));
      if (!res.ok) return;
      const data = await res.json();
      const d = data ? data.details : null;
      if (d) {
        try {
          localStorage.setItem('nutiyala_boutique_details', JSON.stringify(d));
        } catch (e) {}
        applyBoutiqueDetails(d);
      }
    } catch (err) {
      // Graceful fallback to cached or initial values
    }

    ensureInstagramIcons();
  }

  // Expose globally
  window.NutiyalaAuth = {
    getUser: () => currentUser,
    syncBadgeCounts,
    openAccountFlyout,
    closeAccountFlyout,
    promptWishlistLogin,
    syncBoutiqueFooter,
    ensureInstagramIcons
  };

  const startup = () => {
    initAuthHeader();
    syncBoutiqueFooter();
    ensureInstagramIcons();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startup);
  } else {
    startup();
  }
})();
