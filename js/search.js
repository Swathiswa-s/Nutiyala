/**
 * Aaradhya Clothing - Luxury Search Overlay Module
 * Instant real-time search across product names, categories, fabrics, crafts, and colors.
 */

export class SearchOverlay {
  constructor(options = {}) {
    this.products = options.products || [];
    this.onSelectProduct = options.onSelectProduct || null;

    this.overlay = document.getElementById('searchOverlay');
    this.input = document.getElementById('searchInput');
    this.closeBtn = document.getElementById('searchCloseBtn');
    this.resultsContainer = document.getElementById('searchResultsList');
    this.resultsCount = document.getElementById('searchResultsCount');
    this.suggestions = document.getElementById('searchSuggestions');

    this.init();
  }

  init() {
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.input) {
      this.input.addEventListener('input', (e) => {
        this.performSearch(e.target.value.trim());
      });
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
      });
    }

    // Attach suggested query chips
    if (this.suggestions) {
      this.suggestions.querySelectorAll('.search-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          const query = chip.dataset.query || chip.textContent.trim();
          if (this.input) {
            this.input.value = query;
            this.performSearch(query);
          }
        });
      });
    }

    // Backdrop click outside modal
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) {
          this.close();
        }
      });
    }
  }

  open() {
    if (this.overlay) {
      this.overlay.classList.add('open');
      document.body.classList.add('search-open');
      setTimeout(() => {
        if (this.input) {
          this.input.focus();
        }
      }, 150);
      if (this.input && this.input.value.trim()) {
        this.performSearch(this.input.value.trim());
      } else {
        this.renderSuggested();
      }
    }
  }

  close() {
    if (this.overlay) {
      this.overlay.classList.remove('open');
      document.body.classList.remove('search-open');
      if (this.input) {
        this.input.blur();
      }
    }
  }

  performSearch(query) {
    if (!query) {
      this.renderSuggested();
      return;
    }

    const q = query.toLowerCase();
    const matches = this.products.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = (p.categoryName || '').toLowerCase().includes(q);
      const matchFabric = (p.fabric || '').toLowerCase().includes(q);
      const matchCraft = (p.craft || '').toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const matchColor = p.colors && p.colors.some((c) => c.name.toLowerCase().includes(q));
      return matchName || matchCat || matchFabric || matchCraft || matchDesc || matchColor;
    });

    this.renderResults(matches, query);
  }

  renderSuggested() {
    if (this.resultsCount) {
      this.resultsCount.textContent = 'Curated Recommendations';
    }
    const featured = this.products.slice(0, 4);
    this.renderProductCards(featured);
  }

  renderResults(results, query) {
    if (this.resultsCount) {
      if (results.length === 0) {
        this.resultsCount.innerHTML = `No results found for “<strong>${escapeHtml(query)}</strong>”. Explore our suggestions below:`;
      } else {
        this.resultsCount.innerHTML = `Showing <strong>${results.length}</strong> masterwork${results.length > 1 ? 's' : ''} for “<strong>${escapeHtml(query)}</strong>”`;
      }
    }

    if (results.length === 0) {
      this.renderProductCards(this.products.slice(0, 3));
    } else {
      this.renderProductCards(results);
    }
  }

  renderProductCards(items) {
    if (!this.resultsContainer) return;

    this.resultsContainer.innerHTML = items.map((item) => `
      <div class="search-result-card" data-product-id="${item.id}">
        <div class="search-result-thumb">
          <img src="${item.primaryImage}" alt="${item.name}" loading="lazy" />
        </div>
        <div class="search-result-meta">
          <span class="search-result-category">${item.categoryName}</span>
          <h4 class="search-result-name">${item.name}</h4>
          <span class="search-result-fabric">${item.fabric}</span>
          <span class="search-result-price">${item.formattedPrice}</span>
        </div>
      </div>
    `).join('');

    this.resultsContainer.querySelectorAll('.search-result-card').forEach((card) => {
      card.addEventListener('click', () => {
        const id = card.dataset.productId;
        const prod = this.products.find((p) => p.id === id);
        if (prod && this.onSelectProduct) {
          this.close();
          this.onSelectProduct(prod);
        }
      });
    });
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    (tag) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
