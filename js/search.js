/**
 * search.js — Instant live autocomplete search & recent searches dropdown for R.N Readymade
 */
window.RN = window.RN || {};

(function () {
    const RECENT_SEARCHES_KEY = 'rn_recent_searches';
    const DEFAULT_SEARCHES = ['Denim Jacket', 'Summer Dress', 'Chino Pants', 'Cotton Tee'];

    function getRecentSearches() {
        try {
            if (typeof RN !== 'undefined' && RN.parseJSON) {
                const stored = RN.parseJSON(RN.storage.getItem(RECENT_SEARCHES_KEY), DEFAULT_SEARCHES);
                return Array.isArray(stored) ? stored : DEFAULT_SEARCHES;
            }
            return DEFAULT_SEARCHES;
        } catch {
            return DEFAULT_SEARCHES;
        }
    }

    function saveRecentSearch(query) {
        if (!query || typeof query !== 'string' || query.trim().length < 2) return;
        const clean = query.trim();
        let list = getRecentSearches();
        if (!Array.isArray(list)) list = DEFAULT_SEARCHES;
        list = list.filter(q => q && q.toLowerCase() !== clean.toLowerCase());
        list.unshift(clean);
        list = list.slice(0, 6);
        try {
            if (typeof RN !== 'undefined') RN.storage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
        } catch {}
    }

    RN.initSearch = function () {
        const searchInput = document.querySelector('.search-input');
        const navSearch = document.querySelector('.nav-search');
        if (!searchInput || !navSearch) return;

        // Create autocomplete container if not present
        let dropdown = document.querySelector('.search-autocomplete');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'search-autocomplete is-hidden';
            dropdown.id = 'searchAutocomplete';
            navSearch.appendChild(dropdown);
        }

        let selectedIndex = -1;

        function closeDropdown() {
            dropdown.classList.add('is-hidden');
            selectedIndex = -1;
        }

        function renderDropdown(query) {
            const q = (query || '').trim().toLowerCase();
            const products = (typeof getProducts === 'function') ? getProducts() : [];

            if (!q) {
                const recents = getRecentSearches();
                if (!recents || !recents.length) {
                    closeDropdown();
                    return;
                }
                dropdown.innerHTML = `
                    <div class="search-auto-header">
                        <span><i class="fa-solid fa-clock-rotate-left"></i> Recent &amp; Trending Searches</span>
                    </div>
                    <div class="search-auto-tags">
                        ${recents.map(r => `<button type="button" class="search-tag-chip" data-search-term="${RN.escapeHtml ? RN.escapeHtml(r) : r}">${RN.escapeHtml ? RN.escapeHtml(r) : r}</button>`).join('')}
                    </div>
                `;
                dropdown.classList.remove('is-hidden');
                return;
            }

            const matches = (Array.isArray(products) ? products : []).filter(p => {
                if (!p) return false;
                const name = (p.name || '').toLowerCase();
                const cat = (p.category || '').toLowerCase();
                const col = (p.collection || []).join(' ').toLowerCase();
                const desc = (p.description || '').toLowerCase();
                return name.includes(q) || cat.includes(q) || col.includes(q) || desc.includes(q);
            }).slice(0, 5);

            if (!matches.length) {
                dropdown.innerHTML = `
                    <div class="search-auto-empty">
                        <i class="fa-solid fa-magnifying-glass"></i>
                        <p>No matches for "<strong>${RN.escapeHtml ? RN.escapeHtml(query) : query}</strong>"</p>
                        <span>Try searching for "Denim", "Shirt", "Dress", "Kids"</span>
                    </div>
                `;
                dropdown.classList.remove('is-hidden');
                return;
            }

            const resultsHtml = matches.map((p, idx) => {
                const img = (p.images && p.images[0]) || p.image || '';
                const price = (typeof formatPrice === 'function') ? formatPrice(p.price) : `Rs. ${p.price}`;
                const outOfStock = (p.stock || 0) <= 0;
                return `
                    <div class="search-auto-item" data-product-id="${p.id}" data-index="${idx}">
                        <img src="${img}" alt="${RN.escapeHtml ? RN.escapeHtml(p.name) : p.name}" class="search-auto-thumb" onerror="this.style.display='none'">
                        <div class="search-auto-info">
                            <div class="search-auto-name">${RN.escapeHtml ? RN.escapeHtml(p.name) : p.name}</div>
                            <div class="search-auto-meta">
                                <span class="search-auto-cat">${p.category ? p.category.toUpperCase() : ''}</span>
                                <span class="search-auto-price">${price}</span>
                                ${p.discount ? `<span class="search-auto-discount">${p.discount}% OFF</span>` : ''}
                                ${outOfStock ? `<span class="search-auto-stock out">Out of stock</span>` : ''}
                            </div>
                        </div>
                        <i class="fa-solid fa-arrow-right search-auto-arrow"></i>
                    </div>
                `;
            }).join('');

            dropdown.innerHTML = `
                <div class="search-auto-header">
                    <span>Products (${matches.length})</span>
                    <span style="font-size:0.72rem;color:var(--color-muted)">Press Enter to view results</span>
                </div>
                <div class="search-auto-list">${resultsHtml}</div>
            `;
            dropdown.classList.remove('is-hidden');
            selectedIndex = -1;
        }

        // Live input typing
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value;
            if (typeof applySearchFilter === 'function') {
                applySearchFilter(val);
            }
            renderDropdown(val);
        });

        searchInput.addEventListener('focus', () => {
            renderDropdown(searchInput.value);
        });

        // Search submit button
        const searchBtn = navSearch.querySelector('.search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const term = searchInput.value.trim();
                if (term) {
                    saveRecentSearch(term);
                    if (typeof applySearchFilter === 'function') applySearchFilter(term);
                    closeDropdown();
                    document.querySelector('.products')?.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Search clear button
        const clearBtn = navSearch.querySelector('.search-clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                searchInput.value = '';
                if (typeof applySearchFilter === 'function') applySearchFilter('');
                closeDropdown();
            });
        }

        // Filter button
        const filterBtn = navSearch.querySelector('.filter-btn');
        if (filterBtn) {
            filterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof openFilterPanel === 'function') {
                    openFilterPanel();
                } else {
                    document.querySelector('.filters-section')?.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Click on dropdown items
        dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.search-auto-item');
            if (item) {
                const id = item.dataset.productId;
                saveRecentSearch(searchInput.value || item.querySelector('.search-auto-name')?.textContent);
                closeDropdown();
                if (typeof openProductDetail === 'function') {
                    openProductDetail(id);
                } else if (typeof openProductModal === 'function') {
                    openProductModal(id);
                }
                return;
            }

            const tagChip = e.target.closest('.search-tag-chip');
            if (tagChip) {
                const term = tagChip.dataset.searchTerm;
                searchInput.value = term;
                if (typeof applySearchFilter === 'function') {
                    applySearchFilter(term);
                }
                closeDropdown();
                document.querySelector('.products')?.scrollIntoView({ behavior: 'smooth' });
            }
        });

        // Keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            const items = dropdown.querySelectorAll('.search-auto-item');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
                updateItemSelection(items, selectedIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                updateItemSelection(items, selectedIndex);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    items[selectedIndex].click();
                } else {
                    const term = searchInput.value.trim();
                    if (term) {
                        saveRecentSearch(term);
                        if (typeof applySearchFilter === 'function') applySearchFilter(term);
                    }
                    closeDropdown();
                    document.querySelector('.products')?.scrollIntoView({ behavior: 'smooth' });
                }
            } else if (e.key === 'Escape') {
                closeDropdown();
            }
        });

        function updateItemSelection(items, idx) {
            items.forEach((it, i) => it.classList.toggle('selected', i === idx));
            if (items[idx]) items[idx].scrollIntoView({ block: 'nearest' });
        }

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!navSearch.contains(e.target)) {
                closeDropdown();
            }
        });
    };
})();
