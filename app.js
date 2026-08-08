/* ============================================
   R2 NUSANTARA — ENTERPRISE APPLICATION LOGIC
   ============================================ */
(function () {
  'use strict';

  var cart = JSON.parse(localStorage.getItem('r2_cart')) || [];
  window.__cart = cart;
  var wishlist = JSON.parse(localStorage.getItem('r2_wishlist')) || [];
  
  var activeCatalog = 'r2';
  var currentPage = 1;
  var itemsPerPage = 12;
  var activeFilter = 'all';
  var activeSort = 'name-asc';
  var searchTerm = '';
  var viewMode = 'grid';

  function formatRupiah(n) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
  }
  
  function getR2Tier(price) {
    if (price <= 76000) return 'hemat';
    if (price >= 90000) return 'premium';
    return 'populer';
  }
  
  function getCartQty(id) {
    var i = cart.find(x => x.id === id);
    return i ? i.qty : 0;
  }
  
  function isWishlisted(id) { return wishlist.indexOf(id) > -1; }
  
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(m, type = 'success') {
    var c = document.getElementById('toast-container');
    if (!c) return;
    var to = document.createElement('div');
    var iconClass = type === 'success' ? 'fa-check-circle text-green-500' : 'fa-circle-exclamation text-red-500';
    to.className = 'bg-white text-ent-black px-6 py-4 rounded-2xl shadow-premium flex items-center gap-3 transform translate-x-full transition-transform duration-300 border border-slate-100';
    to.innerHTML = `<i class="fa-solid ${iconClass} text-lg"></i><span class="font-bold text-sm">${m}</span>`;
    c.appendChild(to);
    setTimeout(() => to.classList.remove('translate-x-full'), 10);
    setTimeout(() => {
      to.classList.add('translate-x-full');
      setTimeout(() => to.remove(), 300);
    }, 2500);
  }

  window.switchCatalog = function (cat) {
    activeCatalog = cat;
    activeFilter = 'all';
    currentPage = 1;
    searchTerm = '';
    var searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    
    document.querySelectorAll('.catalog-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === cat);
      tab.classList.toggle('bg-white', tab.dataset.tab === cat);
      tab.classList.toggle('shadow-sm', tab.dataset.tab === cat);
    });
    
    updateCatalogInfoBanner();
    buildFilterChips();
    document.getElementById('activeFilterIndicator')?.classList.add('hidden');
    renderProductDisplay();
  };

  function updateCatalogInfoBanner() {
    var banner = document.getElementById('catalogInfoBanner');
    var icon = document.getElementById('catalogInfoIcon');
    var title = document.getElementById('catalogInfoTitle');
    var desc = document.getElementById('catalogInfoDesc');
    if (!banner) return;
    if (activeCatalog === 'r2') {
      if (icon) icon.className = 'fa-solid fa-fire-flame-curved text-ent-black';
      if (title) title.textContent = 'Katalog R2 Nusantara';
      if (desc) desc.textContent = '167 merek lokal premium.';
    } else {
      if (icon) icon.className = 'fa-solid fa-certificate text-ent-gold';
      if (title) title.textContent = 'Katalog Resmi Nasional';
      if (desc) desc.textContent = '66 merek resmi (Segmen A-E).';
    }
  }

  function buildFilterChips() {
    var container = document.getElementById('filterChipsContainer');
    if (!container) return;
    if (activeCatalog === 'r2') {
      container.innerHTML = `
        <button onclick="applyFilter('all')" id="chip-all" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-ent-black text-white shadow-sm">Semua</button>
        <button onclick="applyFilter('hemat')" id="chip-hemat" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:border-ent-black hover:text-ent-black">Hemat</button>
        <button onclick="applyFilter('populer')" id="chip-populer" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:border-ent-black hover:text-ent-black">Populer</button>
        <button onclick="applyFilter('premium')" id="chip-premium" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:border-ent-black hover:text-ent-black">Premium</button>`;
    } else {
      container.innerHTML = `
        <button onclick="applyFilter('all')" id="chip-all" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-ent-black text-white shadow-sm">Semua</button>
        <button onclick="applyFilter('segA')" id="chip-segA" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:border-ent-gold hover:text-ent-gold">Segmen A</button>
        <button onclick="applyFilter('segB')" id="chip-segB" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:border-ent-gold hover:text-ent-gold">Segmen B</button>
        <button onclick="applyFilter('segC')" id="chip-segC" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:border-ent-gold hover:text-ent-gold">Segmen C</button>
        <button onclick="applyFilter('segD')" id="chip-segD" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:border-ent-gold hover:text-ent-gold">Segmen D</button>
        <button onclick="applyFilter('segE')" id="chip-segE" class="filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:border-ent-gold hover:text-ent-gold">Segmen E</button>`;
    }
  }

  function generateProductPlaceholder(name) {
    return `<div class="w-full h-full bg-slate-50 flex items-center justify-center p-4">
              <span class="font-serif text-slate-300 font-bold text-center leading-tight tracking-tight">${escapeHtml(name)}</span>
            </div>`;
  }

  function buildCardActions(p) {
    var q = getCartQty(p.id);
    return q > 0
      ? `<div class="flex items-center justify-between border-2 border-ent-black rounded-xl bg-slate-50 p-1 mt-4">
           <button onclick="window.__updateQty('${p.id}',-1)" class="w-10 h-10 rounded-lg bg-white text-ent-black font-bold shadow-sm hover:bg-slate-100 transition-colors">-</button>
           <span class="font-bold text-ent-black text-sm">${q}</span>
           <button onclick="window.__updateQty('${p.id}',1)" class="w-10 h-10 rounded-lg bg-ent-black text-white font-bold shadow-sm hover:bg-slate-800 transition-colors">+</button>
         </div>`
      : `<button onclick="window.__addCart('${p.id}')" class="w-full mt-4 py-3.5 bg-slate-50 text-ent-black font-bold rounded-xl hover:bg-ent-black hover:text-white transition-colors text-sm flex items-center justify-center gap-2 border border-slate-200"><i class="fa-solid fa-plus text-xs"></i> Tambah</button>`;
  }

  function buildProductCardHTML(p, idx) {
    var isResmi = p.category === 'resmi';
    var badge = isResmi 
      ? `<span class="segment-badge segment-${p.segment}">SEG ${p.segment}</span>` 
      : `<span class="segment-badge tier-${getR2Tier(p.price)}">${getR2Tier(p.price).toUpperCase()}</span>`;
    
    var wl = isWishlisted(p.id);
    var placeholder = `<div class="mb-4 rounded-xl overflow-hidden w-full aspect-[4/3] border border-slate-100">${generateProductPlaceholder(p.name)}</div>`;

    return `<div class="bg-white rounded-[2rem] p-6 border border-ent-border card-premium relative overflow-hidden flex flex-col justify-between group card-enter" style="animation-delay:${idx * 40}ms" data-pid="${p.id}">
      <div class="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <button onclick="toggleWishlistItem('${p.id}', event)" class="w-8 h-8 rounded-full bg-white/90 backdrop-blur border border-slate-200 flex items-center justify-center ${wl ? 'text-red-500' : 'text-slate-400'} hover:scale-105 transition-transform"><i class="fa-${wl ? 'solid' : 'regular'} fa-heart text-xs"></i></button>
          <button onclick="openQuickView('${p.id}')" class="w-8 h-8 rounded-full bg-white/90 backdrop-blur border border-slate-200 flex items-center justify-center text-slate-500 hover:scale-105 transition-transform"><i class="fa-solid fa-eye text-xs"></i></button>
      </div>
      ${placeholder}
      <div class="relative z-10">
          <div class="flex justify-between items-start mb-3">${badge}<span class="text-slate-300 text-[10px] font-mono font-bold">${p.id.toUpperCase()}</span></div>
          <h3 class="text-xl font-serif text-ent-black leading-tight mb-1 group-hover:text-ent-gold transition-colors">${escapeHtml(p.name)}</h3>
          ${isResmi ? `<p class="text-[10px] text-slate-500 font-medium mb-2">${escapeHtml(p.segmentName)}</p>` : ''}
          <p class="text-2xl font-bold text-ent-black font-mono tracking-tighter">${formatRupiah(p.price)}<span class="text-[10px] text-slate-400 font-sans ml-1">/slop</span></p>
      </div>
      <div class="relative z-10">${buildCardActions(p)}</div>
    </div>`;
  }

  function getProcessedProducts() {
    var source = activeCatalog === 'r2' ? productsR2 : productsResmi;
    var r = source.slice();
    if (searchTerm) r = r.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (activeCatalog === 'r2' && activeFilter !== 'all') r = r.filter(p => getR2Tier(p.price) === activeFilter);
    else if (activeCatalog === 'resmi' && activeFilter !== 'all') r = r.filter(p => p.segment === activeFilter.replace('seg', ''));
    
    r.sort((a, b) => {
      if (activeSort === 'price-asc') return a.price - b.price;
      if (activeSort === 'price-desc') return b.price - a.price;
      return activeSort === 'name-desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
    });
    return r;
  }

  function renderProductDisplay() {
    var processed = getProcessedProducts();
    var tp = Math.ceil(processed.length / itemsPerPage) || 1;
    if (currentPage > tp) currentPage = tp;
    var pp = processed.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    var gridEl = document.getElementById('productGrid');
    var noProduct = document.getElementById('noProductFound');

    if (!pp.length) {
      if (gridEl) gridEl.innerHTML = '';
      if (noProduct) noProduct.classList.remove('hidden');
      renderPagination(tp);
      return;
    }
    if (noProduct) noProduct.classList.add('hidden');
    
    if (gridEl) {
      gridEl.innerHTML = pp.map((p, idx) => buildProductCardHTML(p, idx)).join('');
    }
    renderPagination(tp);
  }

  function renderPagination(tp) {
    var c = document.getElementById('paginationContainer');
    if (!c) return;
    if (tp <= 1) { c.innerHTML = ''; return; }
    var h = '';
    for (var i = 1; i <= tp; i++) {
      h += `<button onclick="window.__goToPage(${i})" class="w-10 h-10 rounded-xl text-sm font-bold transition-all ${i === currentPage ? 'bg-ent-black text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:border-ent-black'}">${i}</button>`;
    }
    c.innerHTML = h;
  }

  window.__goToPage = function(p) {
    currentPage = p;
    renderProductDisplay();
    document.getElementById('produk')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.applyFilter = function(f) {
    activeFilter = f;
    currentPage = 1;
    document.querySelectorAll('.filter-chip').forEach(c => {
      c.className = "filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-white text-slate-600 border border-slate-200 hover:border-ent-black hover:text-ent-black";
    });
    var active = document.getElementById('chip-' + f);
    if (active) active.className = "filter-chip px-5 py-2.5 rounded-xl text-xs font-bold transition-all bg-ent-black text-white shadow-sm";
    
    var ind = document.getElementById('activeFilterIndicator');
    if (f !== 'all' && ind) {
      ind.classList.remove('hidden');
      document.getElementById('activeFilterText').textContent = 'Filter: ' + f.toUpperCase();
    } else if (ind) {
      ind.classList.add('hidden');
    }
    renderProductDisplay();
  };

  window.applySort = function(s) { activeSort = s; currentPage = 1; renderProductDisplay(); };

  window.__addCart = function(id) {
    var p = allProducts.find(x => x.id === id);
    if (!p) return;
    var existing = cart.find(x => x.id === id);
    if (existing) existing.qty += 1;
    else cart.push({ ...p, qty: 1 });
    localStorage.setItem('r2_cart', JSON.stringify(cart));
    updateCartUI();
    showToast("Berhasil ditambahkan ke draft order");
  };

  window.__updateQty = function(id, ch) {
    var i = cart.find(x => x.id === id);
    if (i) {
      i.qty += ch;
      if (i.qty < 1) cart = cart.filter(x => x.id !== id);
    }
    localStorage.setItem('r2_cart', JSON.stringify(cart));
    updateCartUI();
  };

  function updateCartUI() {
    var t = cart.reduce((s, i) => s + i.qty, 0);
    var tp = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    
    document.getElementById('cartBadge')?.innerText = t;
    document.getElementById('cartBadge')?.classList.toggle('scale-0', t === 0);
    
    var cc = document.getElementById('cartItemsContainer');
    var cs = document.getElementById('cartSummary');
    
    if (t === 0) {
      if (cc) cc.innerHTML = '<div class="h-full flex flex-col items-center justify-center opacity-50"><i class="fa-solid fa-box-open text-5xl mb-4"></i><p class="font-bold">Draft Kosong</p></div>';
      if (cs) cs.classList.add('hidden');
    } else {
      if (cs) cs.classList.remove('hidden');
      document.getElementById('totalItemsDisplay').innerText = t;
      document.getElementById('totalPriceDisplay').innerText = formatRupiah(tp);
      document.getElementById('modalTotalPrice').innerText = formatRupiah(tp);
      
      if (cc) cc.innerHTML = cart.map(i => `
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex gap-4">
          <div class="flex-1 min-w-0">
            <div class="font-bold text-ent-black truncate mb-1">${escapeHtml(i.name)}</div>
            <div class="text-ent-black font-mono text-sm">${formatRupiah(i.price)}</div>
          </div>
          <div class="flex items-center bg-slate-50 border border-slate-200 rounded-xl h-10 shrink-0 p-1">
            <button onclick="window.__updateQty('${i.id}',-1)" class="w-8 h-full font-bold text-slate-500 hover:bg-white rounded transition-colors">-</button>
            <span class="w-8 text-center text-xs font-bold font-mono">${i.qty}</span>
            <button onclick="window.__updateQty('${i.id}',1)" class="w-8 h-full font-bold text-ent-black hover:bg-white rounded transition-colors">+</button>
          </div>
        </div>`).join('');
    }

    // Banner Target
    var bannerQty = document.getElementById('bannerQty');
    var progressFill = document.getElementById('progressFill');
    if (bannerQty) bannerQty.innerText = t;
    if (progressFill) progressFill.style.width = Math.min((t / 20) * 100, 100) + '%';
    
    renderProductDisplay();
  }

  window.toggleCart = function() {
    var o = document.getElementById('cartOverlay');
    var s = document.getElementById('cartSidebar');
    if (s.classList.contains('translate-x-full')) {
      o.classList.remove('hidden');
      setTimeout(() => o.classList.remove('opacity-0'), 10);
      s.classList.remove('translate-x-full');
      document.body.style.overflow = 'hidden';
    } else {
      o.classList.add('opacity-0');
      s.classList.add('translate-x-full');
      setTimeout(() => o.classList.add('hidden'), 300);
      document.body.style.overflow = '';
    }
  };

  window.openCheckoutModal = function() {
    toggleCart();
    setTimeout(() => {
      document.getElementById('checkoutModalOverlay')?.classList.add('overlay-enter');
      document.getElementById('checkoutModal')?.classList.add('modal-enter');
      document.body.style.overflow = 'hidden';
      document.getElementById('newCustName')?.focus();
    }, 300);
  };
  
  window.closeCheckoutModal = function() {
    document.getElementById('checkoutModalOverlay')?.classList.remove('overlay-enter');
    document.getElementById('checkoutModal')?.classList.remove('modal-enter');
    document.body.style.overflow = '';
  };

  window.submitOrder = function() {
    var btn = document.getElementById('finalCheckoutBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
    
    setTimeout(() => {
      var waNumber = document.getElementById('newAdmin').value;
      var t = cart.reduce((s, i) => s + i.qty, 0);
      var text = `📝 *ORDER B2B ENTERPRISE*\n\n` +
                 `👤 Klien: ${document.getElementById('newCustName').value}\n` +
                 `📱 HP: ${document.getElementById('newCustPhone').value}\n` +
                 `📍 Alamat: ${document.getElementById('newAlamat').value}\n` +
                 `🚚 Ekspedisi: ${document.getElementById('newEkspedisi').value}\n\n` +
                 `*Total Order:* ${t} Slop\n` +
                 `*Status:* ${t >= 20 ? '✅ GRATIS ONGKIR SUBSIDI' : 'Reguler'}`;
      
      window.open('https://wa.me/' + waNumber + '?text=' + encodeURIComponent(text), '_blank');
      
      cart = [];
      localStorage.setItem('r2_cart', JSON.stringify(cart));
      updateCartUI();
      closeCheckoutModal();
      document.getElementById('checkoutFormFull').reset();
      btn.innerHTML = `Konfirmasi Order <i class="fa-brands fa-whatsapp text-lg"></i>`;
      showToast('Draft order telah disalurkan ke sistem admin operasional.');
    }, 1500);
  };

  document.addEventListener('DOMContentLoaded', function() {
    buildFilterChips();
    updateCatalogInfoBanner();
    renderProductDisplay();
    updateCartUI();
  });
})();
