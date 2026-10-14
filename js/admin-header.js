/**
 * Nutiyala Couture • Universal Admin Header & Session Management
 * Provides mobile-responsive topbar controls, active profile display,
 * and reliable logout options across all admin views.
 */
(function () {
  'use strict';

  function initAdminHeader() {
    const topbar = document.querySelector('.admin-topbar');
    if (!topbar) return;

    // Check if dropdown is already initialized
    if (document.getElementById('admin-profile-container')) return;

    // 1. Resolve User Information
    let user = null;
    try {
      const stored = localStorage.getItem('nutiyala_user');
      if (stored) user = JSON.parse(stored);
    } catch (e) {}

    const adminName = user?.full_name || user?.name || user?.username || 'Admin';
    const adminEmail = user?.email || 'admin@nutiyala.com';
    const adminRole = (user?.role || 'SUPER ADMINISTRATOR').toUpperCase();
    const initialChar = adminName.charAt(0).toUpperCase() || 'A';

    // 2. Build Profile Container HTML
    const profileHtml = `
      <div class="admin-profile-container" id="admin-profile-container" style="position: relative; display: inline-flex; align-items: center; z-index: 10002;">
        <button type="button" class="admin-profile-btn" id="admin-profile-toggle-btn" aria-haspopup="true" aria-expanded="false" title="Account Menu">
          <span class="admin-profile-avatar" id="admin-profile-avatar-char">${initialChar}</span>
          <span class="admin-profile-label">
            <span id="admin-profile-name-text">${adminName}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:2px;"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </span>
        </button>

        <div class="admin-profile-dropdown" id="admin-profile-menu" role="menu">
          <div class="admin-profile-dropdown-header">
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <div class="admin-profile-avatar" style="width: 34px; height: 34px; font-size: 0.95rem;">${initialChar}</div>
              <div style="min-width: 0;">
                <div class="admin-dropdown-name" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${adminName}</div>
                <div style="font-size: 0.72rem; color: #D8B982; opacity: 0.85; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${adminEmail}</div>
                <span class="admin-dropdown-badge">${adminRole}</span>
              </div>
            </div>
          </div>

          <ul class="admin-profile-dropdown-links">
            <li>
              <a href="/" target="_blank" class="admin-dropdown-link" role="menuitem">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                <span>View Boutique Website</span>
              </a>
            </li>
            <li>
              <a href="/admin.html" class="admin-dropdown-link" role="menuitem">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                <span>Executive Dashboard</span>
              </a>
            </li>
            <li>
              <a href="/admin-products.html" class="admin-dropdown-link" role="menuitem">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                <span>Products Catalog</span>
              </a>
            </li>
            <li>
              <a href="/admin-product-edit.html" class="admin-dropdown-link" role="menuitem">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                <span>Add New Product</span>
              </a>
            </li>
            <li>
              <a href="/admin-orders.html" class="admin-dropdown-link" role="menuitem">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
                <span>Orders & Shipments</span>
              </a>
            </li>
            <li>
              <a href="/admin-details.html" class="admin-dropdown-link" role="menuitem">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                <span>Boutique & Footer Branding</span>
              </a>
            </li>
            <li>
              <button type="button" class="admin-dropdown-link logout-link" id="admin-header-logout-btn" role="menuitem">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                <span>Log Out of Admin Session</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    `;

    // 3. Mount Into Topbar
    const existingUser = topbar.querySelector('.topbar-user');
    const existingActions = topbar.querySelector('.topbar-right, .topbar-actions');

    if (existingUser) {
      existingUser.outerHTML = profileHtml;
    } else if (existingActions) {
      existingActions.insertAdjacentHTML('beforeend', profileHtml);
    } else {
      topbar.insertAdjacentHTML('beforeend', profileHtml);
    }

    // 4. Attach Toggle Interactions
    const toggleBtn = document.getElementById('admin-profile-toggle-btn');
    const menu = document.getElementById('admin-profile-menu');
    const logoutBtn = document.getElementById('admin-header-logout-btn');

    if (toggleBtn && menu) {
      toggleBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const isOpen = menu.classList.contains('show');
        if (isOpen) {
          menu.classList.remove('show');
          toggleBtn.setAttribute('aria-expanded', 'false');
        } else {
          menu.classList.add('show');
          toggleBtn.setAttribute('aria-expanded', 'true');
        }
      });

      document.addEventListener('click', function (e) {
        if (!menu.contains(e.target) && !toggleBtn.contains(e.target)) {
          menu.classList.remove('show');
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('show')) {
          menu.classList.remove('show');
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // 5. Unified Logout Execution
    async function executeAdminLogout() {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (err) {}
      try {
        localStorage.removeItem('nutiyala_token');
        localStorage.removeItem('nutiyala_user');
        sessionStorage.clear();
      } catch (err) {}
      window.location.href = '/login.html';
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', executeAdminLogout);
    }

    // Also bind any existing logout buttons in sidebar or headers
    document.querySelectorAll('#admin-logout-btn, .logout-admin-btn').forEach(btn => {
      btn.addEventListener('click', executeAdminLogout);
    });

    // 6. Optional: fetch current user from /api/auth/me if not cached
    if (!user) {
      fetch('/api/auth/me')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && (data.user || data.email)) {
            const u = data.user || data;
            try { localStorage.setItem('nutiyala_user', JSON.stringify(u)); } catch(e){}
            const n = u.full_name || u.name || u.username || 'Admin';
            const c = n.charAt(0).toUpperCase();
            const avatarChar = document.getElementById('admin-profile-avatar-char');
            const nameText = document.getElementById('admin-profile-name-text');
            const dropdownName = document.querySelector('.admin-dropdown-name');
            if (avatarChar) avatarChar.textContent = c;
            if (nameText) nameText.textContent = n;
            if (dropdownName) dropdownName.textContent = n;
          }
        })
        .catch(() => {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminHeader);
  } else {
    initAdminHeader();
  }
})();
