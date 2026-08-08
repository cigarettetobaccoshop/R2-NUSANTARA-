/* ============================================
   R2 NUSANTARA — MAIN APP (FINAL UPGRADE)
   ============================================ */

// ===== 1. DARK MODE =====
(function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  updateDarkIcon(theme);
})();

function updateDarkIcon(theme) {
  const icon = document.getElementById('darkModeIcon');
  if (!icon) return;
  icon.className = theme === 'dark' 
    ? 'fa-solid fa-sun text-[13px] sm:text-sm text-[var(--text-primary)]' 
    : 'fa-solid fa-moon text-[13px] sm:text-sm text-[var(--text-primary)]';
}

window.toggleDarkMode = function() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateDarkIcon(next);
};

// ===== 2. GLOBAL STATE =====
let cart = JSON.parse(localStorage.getItem('r2_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('r2_wishlist') || '[]');
let activeCatalog = 'r2';
let currentPage = 1;
const itemsPerPage = 12;
let activeFilter = 'all';
let activeSort = 'name-asc';
let searchTerm = '';
let viewMode = 'grid';

window.__cart = cart;

// ===== 3. UTILITIES =====
function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

function getR2Tier(price) {
  if (price <= 76000) return 'hemat';
  if (price >= 90000) return 'premium';
  return 'populer';
}

function getCartQty(id) {
  const item = cart.find(x => x.id === id);
  return item ? item.qty : 0;
}

function isWishlisted(id) { return wishlist.includes(id); }

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  const iconClass = type === 'success' ? 'fa-check-circle text-gold' : type === 'error' ? 'fa-circle-exclamation text-red-400' : 'fa-circle-info text-brand-400';
  el.className = 'bg-[var(--bg-card)] text-[var(--text-primary)] px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 transform translate-x-full transition-transform duration-300 border border-[var(--border-color)]';
  el.innerHTML = `<i class="fa-solid ${iconClass}"></i><span class="font-bold text-xs">${msg}</span>`;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.remove('translate-x-full'));
  setTimeout(() => {
    el.classList.add('translate-x-full');
    setTimeout(() => el.remove(), 300);
  }, 2500);
}

function saveCart() { localStorage.setItem('r2_cart', JSON.stringify(cart)); }
function saveWishlist() { localStorage.setItem('r2_wishlist', JSON.stringify(wishlist)); }

// ===== 4. PRODUCT RENDERING (dengan placeholder SVG) =====
function generateProductPlaceholder(name, size) {
  const w = size === 'small' ? 40 : 120;
  const h = size === 'small' ? 40 : 90;
  const fs = size === 'small' ? 10 : 16;
  const gradient = size === 'small' 
    ? 'linear-gradient(135deg, #eff6ff 0%, #bfdbfe 100%)'
    : 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 100%)';
  const textColor = size === 'small' ? '#1e40af' : '#1e3a5f';
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" fill="url(#grad)" rx="6"/>
    <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#eff6ff"/>
      <stop offset="100%" stop-color="#bfdbfe"/>
    </linearGradient></defs>
    <text x="${w/2}" y="${h/2}" font-family="Inter, sans-serif" font-size="${fs}" font-weight="700" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(name)}</text>
  </svg>`;
}

function buildCardActions(p) {
  const q = getCartQty(p.id);
  return q > 0
    ? `<div class="flex items-center justify-between border-2 border-gold rounded-xl bg-gold/5 p-1 mt-4 stepper-enter">
        <button onclick="window.__updateQty('${p.id}',-1)" class="w-9 h-9 rounded-lg bg-[var(--bg-body)] text-[var(--text-primary)] font-bold shadow-sm hover:bg-[var(--bg-card)] active:scale-95 transition-transform">-</button>
        <span class="font-bold text-[var(--text-primary)]">${q}</span>
        <button onclick="window.__updateQty('${p.id}',1)" class="w-9 h-9 rounded-lg bg-gold text-white font-bold shadow-sm hover:bg-gold/80 active:scale-95 transition-transform">+</button>
      </div>`
    : `<button onclick="window.__addCart('${p.id}')" class="w-full mt-4 py-3 bg-[var(--bg-card)] text-[var(--text-primary)] font-bold rounded-xl hover:bg-[var(--color-primary)] hover:text-white transition-colors text-sm flex items-center justify-center gap-2 border border-[var(--border-color)]">
        <i class="fa-solid fa-plus text-xs"></i> Tambah
      </button>`;
}

function buildProductCardHTML(p, idx) {
  const isResmi = p.category === 'resmi';
  let badge = '';
  if (isResmi) {
    const seg = p.segment;
    const segLabels = { A: 'PREMIUM', B: 'REGULER', C: 'MILD', D: 'INTERNATIONAL', E: 'LEGACY' };
    const segIcons = { A: 'gem', B: 'star', C: 'leaf', D: 'globe', E: 'hand-holding-heart' };
    badge = `<span class="segment-badge segment-${seg}"><i class="fa-solid fa-${segIcons[seg]}"></i> SEG ${seg} · ${segLabels[seg]}</span>`;
  } else {
    const tier = getR2Tier(p.price);
    badge = `<span class="segment-badge tier-${tier}"><i class="fa-solid fa-${tier === 'hemat' ? 'piggy-bank' : tier === 'premium' ? 'crown' : 'fire'}"></i> ${tier.toUpperCase()}</span>`;
  }
  const catIndicator = isResmi
    ? `<span class="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800"><i class="fa-solid fa-certificate text-[8px]"></i> RESMI</span>`
    : `<span class="inline-flex items-center gap-1 text-[9px] font-bold text-[var(--text-primary)] bg-[var(--bg-card)] px-2 py-0.5 rounded-md border border-[var(--border-color)]"><i class="fa-solid fa-fire-flame-curved text-[8px]"></i> R2</span>`;
  const wl = isWishlisted(p.id);
  const actions = `<div class="absolute top-4 right-4 z-20 flex flex-col gap-2">
    <button onclick="toggleWishlistItem('${p.id}', event)" class="wishlist-heart-btn${wl ? ' is-active' : ''}" aria-label="Wishlist"><i class="fa-${wl ? 'solid' : 'regular'} fa-heart text-xs"></i></button>
    <button onclick="openQuickView('${p.id}')" class="quickview-btn" aria-label="Lihat Cepat"><i class="fa-solid fa-eye text-xs"></i></button>
  </div>`;
  const placeholder = `<div class="product-image-placeholder mb-4 rounded-xl overflow-hidden w-full aspect-[4/3]">${generateProductPlaceholder(p.name, 'medium')}</div>`;
  return `<div class="bg-[var(--bg-body)] rounded-3xl p-6 border border-[var(--border-color)] card-premium relative overflow-hidden flex flex-col justify-between group card-enter${isResmi ? ' product-card-resmi' : ''}" style="animation-delay:${idx * 40}ms" data-pid="${p.id}">
    ${actions}
    ${placeholder}
    <div class="relative z-10"><div class="flex justify-between items-start mb-4 gap-2">${badge}<div class="flex flex-col items-end gap-1 shrink-0">${catIndicator}<span class="text-slate-300 dark:text-slate-600 text-[10px] font-mono font-bold">${p.id.toUpperCase()}</span></div></div>
    <h3 class="text-lg font-serif font-bold text-[var(--text-primary)] leading-tight mb-1 group-hover:text-gold transition-colors">${escapeHtml(p.name)}</h3>
    ${isResmi ? `<p class="text-[10px] text-[var(--text-secondary)] font-medium mb-2 italic">${escapeHtml(p.segmentName)}</p>` : ''}
    <p class="text-2xl font-black text-[var(--text-primary)] font-mono tracking-tighter">${formatRupiah(p.price)}<span class="text-[10px] text-slate-400 font-sans font-medium ml-1">/slop</span></p></div>
    <div class="relative z-10">${buildCardActions(p)}</div>
  </div>`;
}

function buildProductRowHTML(p, idx) {
  const isResmi = p.category === 'resmi';
  const wl = isWishlisted(p.id);
  const catBadge = isResmi
    ? `<span class="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800"><i class="fa-solid fa-certificate text-[8px]"></i> RESMI ${p.segment ? '· SEG '+p.segment : ''}</span>`
    : `<span class="inline-flex items-center gap-1 text-[9px] font-bold text-[var(--text-primary)] bg-[var(--bg-card)] px-2 py-0.5 rounded-md border border-[var(--border-color)]"><i class="fa-solid fa-fire-flame-curved text-[8px]"></i> R2 · ${getR2Tier(p.price).toUpperCase()}</span>`;
  const thumbnail = `<div class="product-thumbnail mr-3 shrink-0 rounded-lg overflow-hidden">${generateProductPlaceholder(p.name, 'small')}</div>`;
  return `<div class="product-table-row${isResmi ? ' is-resmi' : ''}" style="animation-delay:${idx * 25}ms" data-pid="${p.id}">
    <div class="flex items-center gap-3 min-w-0">${thumbnail}<div class="min-w-0"><div class="pt-name truncate">${escapeHtml(p.name)}</div><div class="mt-1">${catBadge}</div></div></div>
    <div class="pt-price">${formatRupiah(p.price)}</div>
    <div class="text-[11px] font-bold text-slate-400 hidden md:block">${p.id.toUpperCase()}</div>
    <div class="pt-actions flex items-center justify-end gap-2">
      <button onclick="toggleWishlistItem('${p.id}', event)" class="wishlist-heart-btn${wl ? ' is-active' : ''}" aria-label="Wishlist"><i class="fa-${wl ? 'solid' : 'regular'} fa-heart text-xs"></i></button>
      ${buildCardActions(p).replace('mt-4', '').replace('w-full', 'w-auto')}
    </div>
  </div>`;
}

// ===== 5. CATALOG CORE =====
function getProcessedProducts() {
  const source = activeCatalog === 'r2' ? productsR2 : productsResmi;
  let result = [...source];
  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(q));
  }
  if (activeFilter !== 'all') {
    if (activeCatalog === 'r2') {
      result = result.filter(p => getR2Tier(p.price) === activeFilter);
    } else {
      const seg = activeFilter.replace('seg', '');
      result = result.filter(p => p.segment === seg);
    }
  }
  result.sort((a, b) => {
    if (activeSort === 'price-asc') return a.price - b.price;
    if (activeSort === 'price-desc') return b.price - a.price;
    return a.name.localeCompare(b.name);
  });
  return result;
}

function renderProductDisplay() {
  const processed = getProcessedProducts();
  const totalPages = Math.ceil(processed.length / itemsPerPage) || 1;
  if (currentPage > totalPages) currentPage = totalPages;
  const pageItems = processed.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const gridEl = document.getElementById('productGrid');
  const tableWrap = document.getElementById('productTableWrap');
  const tableBody = document.getElementById('productTableBody');
  const noProduct = document.getElementById('noProductFound');

  if (!pageItems.length) {
    if (gridEl) gridEl.innerHTML = '';
    if (tableBody) tableBody.innerHTML = '';
    if (noProduct) noProduct.classList.remove('hidden');
    renderPagination(totalPages);
    return;
  }
  if (noProduct) noProduct.classList.add('hidden');

  if (viewMode === 'table') {
    if (gridEl) gridEl.classList.add('hidden');
    if (tableWrap) tableWrap.classList.remove('hidden');
    if (tableBody) tableBody.innerHTML = pageItems.map((p, i) => buildProductRowHTML(p, i)).join('');
  } else {
    if (tableWrap) tableWrap.classList.add('hidden');
    if (gridEl) {
      gridEl.classList.remove('hidden');
      gridEl.innerHTML = pageItems.map((p, i) => buildProductCardHTML(p, i)).join('');
    }
  }
  renderPagination(totalPages);
  updateActiveFilterIndicator();
  updateResultCount(processed.length);
}

function renderPagination(totalPages) {
  const c = document.getElementById('paginationContainer');
  if (!c) return;
  if (totalPages <= 1) { c.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button onclick="window.__goToPage(${i})" class="w-10 h-10 rounded-xl text-sm font-bold transition-all ${i === currentPage ? 'bg-[var(--color-accent)] text-white shadow-md' : 'bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-gold'}">${i}</button>`;
  }
  c.innerHTML = html;
}

window.__goToPage = function(p) {
  currentPage = p;
  renderProductDisplay();
  document.getElementById('produk')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

function updateActiveFilterIndicator() {
  const ind = document.getElementById('activeFilterIndicator');
  const txt = document.getElementById('activeFilterText');
  if (!ind || !txt) return;
  if (activeFilter === 'all') { ind.classList.add('hidden'); return; }
  ind.classList.remove('hidden');
  const labels = {
    hemat: 'Hemat (≤ Rp 76.000)', populer: 'Populer (Rp 77.000 - 89.000)', premium: 'Premium (≥ Rp 90.000)',
    segA: 'Segmen A — Kretek Filter Premium', segB: 'Segmen B — Kretek Filter Reguler', segC: 'Segmen C — Mild/ Rendah Tar',
    segD: 'Segmen D — SPM Internasional', segE: 'Segmen E — Kretek Tangan/ Legacy'
  };
  txt.textContent = 'Filter: ' + (labels[activeFilter] || activeFilter);
}

function updateResultCount(count) {
  const el = document.getElementById('resultCount');
  if (el) el.textContent = `Menampilkan ${count} merek`;
}

// ===== 6. CATALOG CONTROLS =====
window.switchCatalog = function(cat) {
  activeCatalog = cat;
  activeFilter = 'all';
  currentPage = 1;
  searchTerm = '';
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.catalog-tab').forEach(tab => {
    const isActive = tab.dataset.tab === cat;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  updateCatalogInfoBanner();
  buildFilterChips();
  document.getElementById('activeFilterIndicator')?.classList.add('hidden');
  renderProductDisplay();
};

function updateCatalogInfoBanner() {
  const banner = document.getElementById('catalogInfoBanner');
  const icon = document.getElementById('catalogInfoIcon');
  const title = document.getElementById('catalogInfoTitle');
  const desc = document.getElementById('catalogInfoDesc');
  if (!banner) return;
  if (activeCatalog === 'r2') {
    banner.classList.remove('resmi');
    if (icon) icon.className = 'fa-solid fa-fire-flame-curved text-lg';
    if (title) title.textContent = 'Katalog R2 Nusantara';
    if (desc) desc.textContent = '167 merek lokal pilihan dengan harga kompetitif untuk margin maksimal.';
  } else {
    banner.classList.add('resmi');
    if (icon) icon.className = 'fa-solid fa-certificate text-lg';
    if (title) title.textContent = 'Katalog Resmi — Brand Nasional & Internasional';
    if (desc) desc.textContent = '66 merek resmi terbagi dalam 5 segmen. Harga grosir per slop.';
  }
}

function buildFilterChips() {
  const container = document.getElementById('filterChipsContainer');
  if (!container) return;
  if (activeCatalog === 'r2') {
    container.innerHTML = `
      <button onclick="applyFilter('all')" id="chip-all" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-[var(--color-accent)] text-white shadow-md">Semua</button>
      <button onclick="applyFilter('hemat')" id="chip-hemat" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-[var(--bg-body)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-gold hover:text-gold"><i class="fa-solid fa-piggy-bank text-[10px]"></i> Hemat</button>
      <button onclick="applyFilter('populer')" id="chip-populer" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-[var(--bg-body)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-gold hover:text-gold"><i class="fa-solid fa-fire text-[10px]"></i> Populer</button>
      <button onclick="applyFilter('premium')" id="chip-premium" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-[var(--bg-body)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-gold hover:text-gold"><i class="fa-solid fa-crown text-[10px]"></i> Premium</button>
    `;
  } else {
    container.innerHTML = `
      <button onclick="applyFilter('all')" id="chip-all" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-[var(--color-accent)] text-white shadow-md">Semua</button>
      <button onclick="applyFilter('segA')" id="chip-segA" class="filter-chip filter-chip-resmi px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-[var(--bg-body)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-gold hover:text-gold"><i class="fa-solid fa-gem text-[10px]"></i> Segmen A</button>
      <button onclick="applyFilter('segB')" id="chip-segB" class="filter-chip filter-chip-resmi px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-[var(--bg-body)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-gold hover:text-gold"><i class="fa-solid fa-star text-[10px]"></i> Segmen B</button>
      <button onclick="applyFilter('segC')" id="chip-segC" class="filter-chip filter-chip-resmi px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-[var(--bg-body)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-gold hover:text-gold"><i class="fa-solid fa-leaf text-[10px]"></i> Segmen C</button>
      <button onclick="applyFilter('segD')" id="chip-segD" class="filter-chip filter-chip-resmi px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-[var(--bg-body)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-gold hover:text-gold"><i class="fa-solid fa-globe text-[10px]"></i> Segmen D</button>
      <button onclick="applyFilter('segE')" id="chip-segE" class="filter-chip filter-chip-resmi px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-[var(--bg-body)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-gold hover:text-gold"><i class="fa-solid fa-hand-holding-heart text-[10px]"></i> Segmen E</button>
    `;
  }
}

window.applyFilter = function(f) {
  activeFilter = f;
  currentPage = 1;
  document.querySelectorAll('.filter-chip').forEach(c => {
    if (c.classList.contains('filter-chip-resmi')) {
      c.classList.remove('segment-active');
      c.className = 'filter-chip filter-chip-resmi px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-[var(--bg-body)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-gold hover:text-gold';
    } else {
      c.className = 'filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-[var(--bg-body)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-gold hover:text-gold';
    }
  });
  const active = document.getElementById('chip-' + f);
  if (active) {
    if (active.classList.contains('filter-chip-resmi') || f.startsWith('seg')) {
      active.classList.add('segment-active');
    } else {
      active.className = 'filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-[var(--color-accent)] text-white shadow-md';
    }
  }
  renderProductDisplay();
};

window.applySort = function(s) {
  activeSort = s;
  currentPage = 1;
  renderProductDisplay();
};

window.setViewMode = function(mode) {
  viewMode = mode;
  document.getElementById('viewGridBtn')?.classList.toggle('active', mode === 'grid');
  document.getElementById('viewTableBtn')?.classList.toggle('active', mode === 'table');
  renderProductDisplay();
};

// ===== 7. WISHLIST =====
window.toggleWishlistItem = function(id, event) {
  event?.stopPropagation();
  const idx = wishlist.indexOf(id);
  if (idx > -1) { wishlist.splice(idx, 1); showToast('Dihapus dari Wishlist', 'info'); }
  else { wishlist.push(id); showToast('Ditambahkan ke Wishlist', 'success'); }
  saveWishlist();
  updateWishlistUI();
  renderProductDisplay();
};

function updateWishlistUI() {
  const badge = document.getElementById('wishlistBadge');
  if (badge) { badge.innerText = wishlist.length; badge.classList.toggle('scale-0', wishlist.length === 0); }
  const container = document.getElementById('wishlistItemsContainer');
  if (!container) return;
  if (!wishlist.length) {
    container.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-center opacity-50"><i class="fa-regular fa-heart text-6xl text-slate-300 mb-4"></i><p class="font-bold text-[var(--text-secondary)]">Wishlist Kosong</p></div>`;
    return;
  }
  container.innerHTML = wishlist.map(id => {
    const p = allProducts.find(x => x.id === id);
    if (!p) return '';
    return `<div class="flex items-center gap-3 bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border-color)]">
      <div class="flex-1 min-w-0"><div class="font-bold text-sm text-[var(--text-primary)] truncate">${escapeHtml(p.name)}</div><div class="text-gold font-mono text-xs font-bold">${formatRupiah(p.price)}</div></div>
      <button onclick="window.__addCart('${p.id}'); toggleWishlistItem('${p.id}');" class="w-8 h-8 rounded-lg bg-[var(--color-accent)] text-white flex items-center justify-center hover:bg-brand-700 transition-colors" title="Pindah ke Keranjang"><i class="fa-solid fa-cart-plus text-xs"></i></button>
      <button onclick="toggleWishlistItem('${p.id}')" class="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"><i class="fa-solid fa-trash text-xs"></i></button>
    </div>`;
  }).join('');
}

window.toggleWishlistSidebar = function() {
  const overlay = document.getElementById('wishlistOverlay');
  const sidebar = document.getElementById('wishlistSidebar');
  if (!overlay || !sidebar) return;
  if (sidebar.classList.contains('translate-x-full')) {
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => overlay.classList.remove('opacity-0'));
    sidebar.classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
  } else {
    overlay.classList.add('opacity-0');
    sidebar.classList.add('translate-x-full');
    setTimeout(() => overlay.classList.add('hidden'), 300);
    document.body.style.overflow = '';
  }
};

// ===== 8. QUICK VIEW =====
window.openQuickView = function(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  document.getElementById('qvTitle').textContent = p.name;
  document.getElementById('qvPrice').textContent = formatRupiah(p.price);
  document.getElementById('qvId').textContent = p.id.toUpperCase();
  document.getElementById('qvDesc').textContent = p.category === 'resmi' ? (p.segmentName || '') : 'Katalog R2 Nusantara — harga kompetitif.';
  const badge = document.getElementById('qvBadge');
  if (p.category === 'resmi') {
    badge.className = `inline-block px-3 py-1 rounded-lg text-xs font-bold segment-badge segment-${p.segment}`;
    badge.innerHTML = `<i class="fa-solid fa-certificate mr-1"></i> RESMI · SEG ${p.segment}`;
  } else {
    const tier = getR2Tier(p.price);
    badge.className = `inline-block px-3 py-1 rounded-lg text-xs font-bold segment-badge tier-${tier}`;
    badge.innerHTML = `<i class="fa-solid fa-fire mr-1"></i> ${tier.toUpperCase()}`;
  }
  document.getElementById('qvAddToCartBtn').onclick = () => { window.__addCart(p.id); closeQuickView(); };
  const wlBtn = document.getElementById('qvWishlistBtn');
  const wl = isWishlisted(p.id);
  wlBtn.classList.toggle('is-active', wl);
  wlBtn.innerHTML = `<i class="fa-${wl ? 'solid' : 'regular'} fa-heart"></i>`;
  wlBtn.onclick = () => { toggleWishlistItem(p.id); const nowWl = isWishlisted(p.id); wlBtn.innerHTML = `<i class="fa-${nowWl ? 'solid' : 'regular'} fa-heart"></i>`; };
  const overlay = document.getElementById('quickViewOverlay');
  const modal = document.getElementById('quickViewModal');
  overlay.classList.remove('hidden');
  requestAnimationFrame(() => { overlay.classList.add('overlay-enter'); modal.classList.add('modal-enter'); });
  document.body.style.overflow = 'hidden';
};

window.closeQuickView = function() {
  const overlay = document.getElementById('quickViewOverlay');
  const modal = document.getElementById('quickViewModal');
  overlay.classList.remove('overlay-enter');
  modal.classList.remove('modal-enter');
  setTimeout(() => overlay.classList.add('hidden'), 300);
  document.body.style.overflow = '';
};

// ===== 9. CART =====
window.__addCart = function(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  const existing = cart.find(x => x.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id: p.id, name: p.name, price: p.price, qty: 1, category: p.category });
  saveCart();
  updateCartUI();
  showToast('Berhasil ditambahkan');
};

window.__updateQty = function(id, delta) {
  const item = cart.find(x => x.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty < 1) cart = cart.filter(x => x.id !== id);
  }
  saveCart();
  updateCartUI();
};

function updateCartUI() {
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + (i.price * i.qty), 0);
  const badge = document.getElementById('cartBadge');
  if (badge) { badge.innerText = totalQty; badge.classList.toggle('scale-0', totalQty === 0); }
  const mobileBadge = document.getElementById('mobileCartBadge');
  if (mobileBadge) { mobileBadge.innerText = totalQty; mobileBadge.classList.toggle('scale-0', totalQty === 0); }

  // Progress banner
  const bannerQty = document.getElementById('bannerQty');
  const progressFill = document.getElementById('progressFill');
  const bannerTitle = document.getElementById('bannerTitle');
  const bannerSubtitle = document.getElementById('bannerSubtitle');
  const banner = document.getElementById('shippingProgressBanner');
  if (bannerQty) bannerQty.innerText = totalQty;
  if (progressFill) progressFill.style.width = Math.min((totalQty / 20) * 100, 100) + '%';
  if (totalQty >= 20) {
    if (bannerTitle) bannerTitle.innerText = '🎉 Target Tercapai';
    if (bannerSubtitle) bannerSubtitle.innerHTML = 'Anda mendapat <b class="text-gold">GRATIS ONGKIR</b>';
    if (banner) { banner.classList.add('bg-emerald-600'); banner.classList.remove('bg-amazon-accent'); }
  } else {
    if (bannerTitle) bannerTitle.innerText = 'Target Gratis Ongkir';
    if (bannerSubtitle) bannerSubtitle.innerHTML = `Pilih <b class="text-gold">${20 - totalQty} slop</b> lagi untuk subsidi.`;
    if (banner) { banner.classList.remove('bg-emerald-600'); banner.classList.add('bg-amazon-accent'); }
  }

  const container = document.getElementById('cartItemsContainer');
  const summary = document.getElementById('cartSummary');
  if (!cart.length) {
    if (container) container.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-center opacity-50"><i class="fa-solid fa-cart-shopping text-6xl text-slate-300 mb-4"></i><p class="font-bold text-[var(--text-secondary)]">Keranjang Kosong</p></div>`;
    if (summary) summary.classList.add('hidden');
  } else {
    if (summary) summary.classList.remove('hidden');
    document.getElementById('totalItemsDisplay').innerText = totalQty;
    document.getElementById('totalPriceDisplay').innerText = formatRupiah(totalPrice);
    if (container) {
      container.innerHTML = cart.map(i => {
        const catBadge = i.category === 'resmi'
          ? `<span class="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800"><i class="fa-solid fa-certificate text-[8px]"></i> RESMI</span>`
          : `<span class="inline-flex items-center gap-1 text-[9px] font-bold text-[var(--text-primary)] bg-[var(--bg-card)] px-1.5 py-0.5 rounded border border-[var(--border-color)]"><i class="fa-solid fa-fire-flame-curved text-[8px]"></i> R2</span>`;
        return `<div class="bg-[var(--bg-body)] p-4 rounded-2xl border border-[var(--border-color)] shadow-sm flex gap-4">
          <div class="flex-1 min-w-0"><div class="flex items-center gap-2 mb-1"><span class="font-bold text-sm text-[var(--text-primary)] truncate">${escapeHtml(i.name)}</span>${catBadge}</div><div class="text-gold font-bold font-mono text-sm">${formatRupiah(i.price)}</div></div>
          <div class="flex items-center border border-[var(--border-color)] rounded-lg h-9 shrink-0">
            <button onclick="window.__updateQty('${i.id}',-1)" class="w-9 h-full font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-card)] transition-colors">-</button>
            <span class="w-8 text-center text-xs font-bold font-mono text-[var(--text-primary)]">${i.qty}</span>
            <button onclick="window.__updateQty('${i.id}',1)" class="w-9 h-full font-bold text-gold hover:bg-[var(--bg-card)] transition-colors">+</button>
          </div>
        </div>`;
      }).join('');
    }
  }
  document.getElementById('modalTotalPrice').innerText = formatRupiah(totalPrice);
  renderProductDisplay();
}

window.toggleCart = function() {
  const overlay = document.getElementById('cartOverlay');
  const sidebar = document.getElementById('cartSidebar');
  if (!overlay || !sidebar) return;
  if (sidebar.classList.contains('translate-x-full')) {
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => overlay.classList.remove('opacity-0'));
    sidebar.classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
  } else {
    overlay.classList.add('opacity-0');
    sidebar.classList.add('translate-x-full');
    setTimeout(() => overlay.classList.add('hidden'), 300);
    document.body.style.overflow = '';
  }
};

// ===== 10. CHECKOUT =====
window.openCheckoutModal = function() {
  toggleCart();
  setTimeout(() => {
    document.getElementById('checkoutModalOverlay').classList.add('overlay-enter');
    document.getElementById('checkoutModal').classList.add('modal-enter');
    document.body.style.overflow = 'hidden';
    updateProgressStep(1);
    setTimeout(validateCheckoutForm, 300);
  }, 300);
};

window.closeCheckoutModal = function() {
  document.getElementById('checkoutModalOverlay').classList.remove('overlay-enter');
  document.getElementById('checkoutModal').classList.remove('modal-enter');
  document.body.style.overflow = '';
};

function updateProgressStep(step) {
  const indicators = [
    document.getElementById('step1Indicator'),
    document.getElementById('step2Indicator'),
    document.getElementById('step3Indicator')
  ];
  const line = document.getElementById('stepProgressLine');
  indicators.forEach((ind, idx) => {
    if (!ind) return;
    const num = ind.querySelector('div');
    const txt = ind.querySelector('span');
    const isActive = idx + 1 === step;
    const isCompleted = idx + 1 < step;
    num.className = `w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors duration-300 border-2 border-[var(--bg-body)] ring-2 ring-slate-100 step-indicator ${isActive ? 'active shadow-sm' : isCompleted ? 'completed shadow-sm' : 'bg-slate-100 text-slate-400'}`;
    txt.className = `text-[9px] font-bold uppercase tracking-widest ${isActive ? 'text-[var(--text-primary)]' : isCompleted ? 'text-gold' : 'text-slate-400'}`;
  });
  if (line) line.style.width = step === 1 ? '0%' : step === 2 ? '50%' : '100%';
}

function showError(fieldId, errorId, msg) {
  const f = document.getElementById(fieldId);
  const e = document.getElementById(errorId);
  if (f) { f.classList.add('form-field-error'); f.classList.remove('field-valid'); }
  if (e) { const s = e.querySelector('span'); if (s && msg) s.textContent = msg; e.classList.add('show'); }
}

function clearError(fieldId, errorId) {
  const f = document.getElementById(fieldId);
  const e = document.getElementById(errorId);
  if (f) { f.classList.remove('form-field-error'); f.classList.add('field-valid'); }
  if (e) e.classList.remove('show');
}

function validateCheckoutForm() {
  let valid = true;
  const name = document.getElementById('newCustName');
  if (name && name.value.trim().length >= 2) clearError('newCustName', 'newErrName');
  else { if (name && name.value.trim().length > 0) showError('newCustName', 'newErrName', 'Minimal 2 karakter'); valid = false; }

  const phone = document.getElementById('newCustPhone');
  const clean = phone ? phone.value.replace(/\D/g, '') : '';
  if (clean && /^8[1-9]\d{6,11}$/.test(clean)) clearError('newCustPhone', 'newErrPhone');
  else { if (clean) showError('newCustPhone', 'newErrPhone', 'Nomor tidak valid'); valid = false; }

  const alamat = document.getElementById('newAlamat');
  if (alamat && alamat.value.trim().length >= 20) clearError('newAlamat', 'newErrAlamat');
  else { if (alamat && alamat.value.trim().length > 0) showError('newAlamat', 'newErrAlamat', 'Minimal 20 karakter'); valid = false; }

  ['newProvinsi','newKota','newKecamatan','newKelurahan','newKodePos','newEkspedisi','newMetode','newAdmin'].forEach(id => {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) valid = false;
  });

  const btn = document.getElementById('finalCheckoutBtn');
  if (btn) btn.disabled = !valid;
  return valid;
}

window.submitOrder = function() {
  if (!validateCheckoutForm()) { showToast('Lengkapi formulir dengan benar', 'error'); return; }
  const btn = document.getElementById('finalCheckoutBtn');
  const btnText = document.getElementById('finalBtnText');
  const btnIcon = document.getElementById('finalBtnIcon');
  btn.classList.add('checkout-btn-loading');
  btnText.textContent = 'Memproses...';
  btnIcon.style.display = 'none';

  setTimeout(() => {
    const admin = document.getElementById('newAdmin').value;
    const total = cart.reduce((s, i) => s + i.qty, 0);
    const r2Items = cart.filter(i => i.category === 'r2');
    const resmiItems = cart.filter(i => i.category === 'resmi');
    const addr = document.getElementById('newAlamat').value.trim() + ' (Patokan: ' + (document.getElementById('newPatokan').value.trim() || '-') + ')\n' +
      'Kel: ' + document.getElementById('newKelurahan').value.trim() + ', Kec: ' + document.getElementById('newKecamatan').value.trim() + '\n' +
      document.getElementById('newKota').value.trim() + ', ' + document.getElementById('newProvinsi').value.trim() + ' - ' + document.getElementById('newKodePos').value.trim();

    let msg = '📝 *ORDER R2 NUSANTARA (ENTERPRISE)*\n\n';
    msg += '👤 *Nama:* ' + document.getElementById('newCustName').value.trim() + '\n';
    msg += '📱 *No. HP:* +62 ' + document.getElementById('newCustPhone').value.trim() + '\n';
    msg += '📍 *Alamat Pengiriman:*\n' + addr + '\n\n';
    msg += '🚚 *Ekspedisi:* ' + document.getElementById('newEkspedisi').value + '\n';
    msg += '💳 *Pembayaran:* ' + document.getElementById('newMetode').value + '\n\n';
    if (r2Items.length) {
      msg += '*🔥 KATALOG R2:*\n' + r2Items.map(i => `• ${i.name} — ${i.qty} slop`).join('\n') + '\n\n';
    }
    if (resmiItems.length) {
      msg += '*🏅 KATALOG RESMI:*\n' + resmiItems.map(i => `• ${i.name} — ${i.qty} slop`).join('\n') + '\n\n';
    }
    msg += '*Total Order:* ' + total + ' Slop\n';
    msg += '*Status Ongkir:* ' + (total >= 20 ? '✅ Gratis Ongkir' : 'Reguler');

    window.open('https://wa.me/' + admin + '?text=' + encodeURIComponent(msg), '_blank');
    cart = [];
    saveCart();
    updateCartUI();
    closeCheckoutModal();
    document.getElementById('checkoutFormFull').reset();
    btn.classList.remove('checkout-btn-loading');
    btnText.textContent = 'Konfirmasi Pesanan';
    btnIcon.style.display = '';
    showToast('Pesanan berhasil dilanjutkan! 🎉');
  }, 1500);
};

// ===== 11. REVIEW =====
window.openReviewModal = function() {
  document.getElementById('reviewModalOverlay').classList.add('overlay-enter');
  document.getElementById('reviewModal').classList.add('modal-enter');
  document.body.style.overflow = 'hidden';
};
window.closeReviewModal = function() {
  document.getElementById('reviewModalOverlay').classList.remove('overlay-enter');
  document.getElementById('reviewModal').classList.remove('modal-enter');
  document.body.style.overflow = '';
  setTimeout(() => { document.getElementById('reviewForm').reset(); setRating(5); }, 300);
};
window.setRating = function(val) {
  document.getElementById('reviewRating').value = val;
  document.querySelectorAll('#starRatingSelector i').forEach(s => {
    s.classList.toggle('text-gold', parseInt(s.dataset.rating) <= val);
    s.classList.toggle('text-slate-200', parseInt(s.dataset.rating) > val);
  });
};
window.submitReview = function() {
  const btn = document.getElementById('submitReviewBtn');
  const name = document.getElementById('reviewName').value;
  const store = document.getElementById('reviewStore').value;
  const text = document.getElementById('reviewText').value;
  const rating = document.getElementById('reviewRating').value;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
  btn.classList.add('opacity-80', 'pointer-events-none');
  setTimeout(() => {
    const starsHtml = Array.from({length:5}, (_,i) => i < rating ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-solid fa-star text-slate-200"></i>').join('');
    const initial = name.charAt(0).toUpperCase();
    const card = document.createElement('div');
    card.className = 'testimonial-card-slide';
    card.innerHTML = `<div><div class="flex items-center gap-4 mb-5"><div class="w-14 h-14 rounded-full avatar-gradient-9 shrink-0"><span class="avatar-initial">${initial}</span></div><div><h4 class="font-serif font-bold text-[var(--text-primary)] text-base">${escapeHtml(name)}</h4><p class="text-xs text-[var(--text-secondary)] font-medium">${escapeHtml(store)}</p></div></div><div class="flex gap-0.5 mb-4 text-gold text-sm">${starsHtml}</div><p class="text-[var(--text-secondary)] text-sm leading-relaxed">"${escapeHtml(text)}"</p></div><div class="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-slate-400"><span><i class="fa-solid fa-calendar-days mr-1"></i> Baru saja</span><span class="text-slate-400 font-bold"><i class="fa-solid fa-clock"></i> Pending Review</span></div>`;
    const slider = document.getElementById('testimonialSlider');
    if (slider) { slider.insertBefore(card, slider.firstChild); slider.scrollTo({ left: 0, behavior: 'smooth' }); }
    showToast('Terima kasih! Ulasan Anda berhasil dikirim.');
    closeReviewModal();
    btn.innerHTML = 'Kirim Ulasan';
    btn.classList.remove('opacity-80', 'pointer-events-none');
  }, 1000);
};

// ===== 12. NEWSLETTER =====
window.handleNewsletterSubmit = function(form) {
  const input = form.querySelector('input[type="email"]');
  if (input && input.value) { showToast('Terima kasih! Anda telah berlangganan newsletter.'); input.value = ''; }
};

// ===== 13. SEARCH =====
window.clearSearch = function() {
  const input = document.getElementById('searchInput');
  if (input) { input.value = ''; searchTerm = ''; currentPage = 1; renderProductDisplay(); input.focus(); }
  document.getElementById('clearSearchBtn')?.classList.add('hidden');
};

// ===== 14. VISITOR COUNTER =====
function initVisitorCounter() {
  const el = document.getElementById('visitorCount');
  if (!el) return;
  let count = Math.floor(Math.random() * 45) + 18;
  el.textContent = count;
  setInterval(() => {
    const change = Math.floor(Math.random() * 5) - 2;
    count = Math.max(15, Math.min(60, count + change));
    el.textContent = count;
  }, 4000);
}

// ===== 15. ANIMATE STAT COUNTERS =====
function animateCounter(el) {
  const target = parseInt(el.dataset.countTo, 10);
  if (isNaN(target)) return;
  const suffix = el.dataset.countSuffix || '';
  const duration = 1400;
  let startTime = null;
  function step(ts) {
    if (!startTime) startTime = ts;
    const progress = Math.min((ts - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(step);
}

// ===== 16. INIT =====
document.addEventListener('DOMContentLoaded', function() {
  // Hide loader
  const loader = document.getElementById('loader');
  if (loader) { loader.style.opacity = '0'; setTimeout(() => loader.style.display = 'none', 700); }

  // Init counters
  initVisitorCounter();
  updateWishlistUI();
  buildFilterChips();
  updateCatalogInfoBanner();
  renderProductDisplay();
  updateCartUI();

  // Set counts
  document.getElementById('countR2').textContent = productsR2.length;
  document.getElementById('countResmi').textContent = productsResmi.length;
  document.getElementById('totalBrandCount').textContent = allProducts.length;

  // Scroll reveal
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting && e.target.classList.add('is-visible'));
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-on-scroll').forEach(el => obs.observe(el));

  // Stat counters
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); counterObs.unobserve(e.target); } });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-counter').forEach(el => counterObs.observe(el));

  // Year
  document.getElementById('copyrightYear').textContent = new Date().getFullYear();

  // Scroll progress
  const circle = document.getElementById('scrollCircle');
  const pctLabel = document.getElementById('scrollPercent');
  const progressWrap = document.getElementById('scrollProgress');
  const circumference = 113.1;
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const pct = h > 0 ? Math.min(Math.max(window.scrollY / h, 0), 1) : 0;
    if (circle) circle.style.strokeDashoffset = circumference * (1 - pct);
    if (pctLabel) pctLabel.textContent = Math.round(pct * 100) + '%';
    if (progressWrap) progressWrap.style.opacity = window.scrollY > 400 ? '1' : '0';
    // Back to top
    const btt = document.getElementById('backToTop');
    if (btt) btt.classList.toggle('visible', window.scrollY > 500);
  });

  // Search with debounce
  const searchInput = document.getElementById('searchInput');
  const suggestions = document.getElementById('searchSuggestions');
  let searchTimer;
  searchInput?.addEventListener('input', function(e) {
    const val = e.target.value;
    document.getElementById('clearSearchBtn')?.classList.toggle('hidden', val.length === 0);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchTerm = val.trim().toLowerCase();
      currentPage = 1;
      renderProductDisplay();
      if (!suggestions || val.length < 2) { suggestions.classList.add('hidden'); return; }
      const matches = allProducts.filter(p => p.name.toLowerCase().includes(searchTerm)).slice(0, 6);
      if (matches.length) {
        const q = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        suggestions.innerHTML = matches.map(p => {
          const highlighted = p.name.replace(new RegExp(q, 'gi'), m => `<span class="text-gold bg-gold/10 px-0.5 rounded">${m}</span>`);
          return `<div class="px-4 py-3 hover:bg-[var(--bg-card)] cursor-pointer border-b border-[var(--border-color)] last:border-0 flex items-center gap-3 transition-colors" data-suggest-id="${p.id}">
            <i class="fa-solid fa-magnifying-glass text-slate-400 text-xs"></i>
            <div><div class="text-sm font-bold text-[var(--text-primary)]">${highlighted}</div><div class="text-xs text-slate-500 font-mono">${formatRupiah(p.price)}</div></div>
          </div>`;
        }).join('');
        suggestions.classList.remove('hidden');
      } else suggestions.classList.add('hidden');
    }, 220);
  });
  suggestions?.addEventListener('click', function(e) {
    const row = e.target.closest('[data-suggest-id]');
    if (!row) return;
    const p = allProducts.find(x => x.id === row.dataset.suggestId);
    if (p) {
      searchInput.value = p.name;
      searchTerm = p.name.toLowerCase();
      if (p.category !== activeCatalog) window.switchCatalog(p.category);
      currentPage = 1;
      renderProductDisplay();
    }
    suggestions.classList.add('hidden');
  });
  document.addEventListener('click', e => {
    if (!searchInput?.contains(e.target) && !suggestions?.contains(e.target)) suggestions?.classList.add('hidden');
  });

  // Checkout form validation
  document.querySelectorAll('#checkoutFormFull input, #checkoutFormFull textarea, #checkoutFormFull select').forEach((input, idx) => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && input.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const inputs = document.querySelectorAll('#checkoutFormFull input, #checkoutFormFull textarea, #checkoutFormFull select');
        const next = inputs[idx + 1];
        if (next) next.focus();
      }
    });
    input.addEventListener('focus', function() {
      const step = this.closest('[data-step]');
      if (step) updateProgressStep(parseInt(step.dataset.step, 10));
    });
    input.addEventListener('input', validateCheckoutForm);
    input.addEventListener('change', validateCheckoutForm);
  });
  // Phone formatting
  const phoneInput = document.getElementById('newCustPhone');
  phoneInput?.addEventListener('input', function(e) {
    let v = e.target.value.replace(/\D/g, '');
    if (v.startsWith('62')) v = v.substring(2);
    if (v.startsWith('0')) v = v.substring(1);
    const match = v.match(/(\d{0,3})(\d{0,4})(\d{0,5})/);
    if (match) {
      let formatted = !match[2] ? match[1] : match[1] + ' ' + match[2] + (match[3] ? ' ' + match[3] : '');
      e.target.value = formatted.substring(0, 15);
    } else e.target.value = v;
  });
  validateCheckoutForm();

  // Escape key
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('checkoutModal')?.classList.contains('modal-enter')) closeCheckoutModal();
    if (document.getElementById('reviewModal')?.classList.contains('modal-enter')) closeReviewModal();
    if (document.getElementById('quickViewModal')?.classList.contains('modal-enter')) closeQuickView();
  });

  // Testimonial slider
  const slider = document.getElementById('testimonialSlider');
  if (slider) {
    let isDown = false, startX, scrollLeft;
    slider.addEventListener('mousedown', e => { isDown = true; slider.style.scrollSnapType = 'none'; startX = e.pageX - slider.offsetLeft; scrollLeft = slider.scrollLeft; });
    slider.addEventListener('mouseleave', () => { isDown = false; slider.style.scrollSnapType = 'x mandatory'; });
    slider.addEventListener('mouseup', () => { isDown = false; slider.style.scrollSnapType = 'x mandatory'; });
    slider.addEventListener('mousemove', e => { if (!isDown) return; e.preventDefault(); const x = e.pageX - slider.offsetLeft; slider.scrollLeft = scrollLeft - (x - startX) * 2; });
    const getAmount = () => slider.querySelector('.testimonial-card-slide')?.offsetWidth + 24 || 350;
    document.getElementById('sliderPrevBtn')?.addEventListener('click', () => slider.scrollBy({ left: -getAmount(), behavior: 'smooth' }));
    document.getElementById('sliderNextBtn')?.addEventListener('click', () => slider.scrollBy({ left: getAmount(), behavior: 'smooth' }));
    let autoSlide = setInterval(() => {
      if (!isDown) {
        if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 10) slider.scrollTo({ left: 0, behavior: 'smooth' });
        else slider.scrollBy({ left: getAmount(), behavior: 'smooth' });
      }
    }, 4000);
    slider.addEventListener('mouseenter', () => clearInterval(autoSlide));
  }

  // Schema.org enrichment (tambahkan Product data)
  try {
    const schemaScript = document.getElementById('schemaOrg');
    if (schemaScript) {
      const base = JSON.parse(schemaScript.textContent);
      // Tambahkan produk unggulan sebagai sample
      const sampleProducts = allProducts.slice(0, 5).map(p => ({
        "@type": "Product",
        "name": p.name,
        "offers": { "@type": "Offer", "price": p.price, "priceCurrency": "IDR" }
      }));
      base.hasOfferCatalog = { "@type": "OfferCatalog", "name": "Katalog Rokok", "itemListElement": sampleProducts };
      schemaScript.textContent = JSON.stringify(base);
    }
  } catch(e) { /* ignore */ }
});