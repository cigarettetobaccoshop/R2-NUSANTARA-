/* ============================================
   R2 NUSANTARA — ENTERPRISE APPLICATION LOGIC
   (Zero-Downgrade Integration)
   ============================================ */
(function () {
  'use strict';

  // 1. STATE & INITIALIZATION
  let cart = JSON.parse(localStorage.getItem('r2_cart')) || [];
  let wishlist = JSON.parse(localStorage.getItem('r2_wishlist')) || [];
  let activeCatalog = 'r2';
  let activeSort = 'name-asc';
  let searchTerm = '';
  let viewMode = 'grid';

  const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
  const getR2Tier = (price) => price <= 76000 ? 'hemat' : price >= 90000 ? 'premium' : 'populer';
  const getCartQty = (id) => { const i = cart.find(x => x.id === id); return i ? i.qty : 0; };
  const isWishlisted = (id) => wishlist.includes(id);

  // Menyimpan ke LocalStorage
  const saveCart = () => localStorage.setItem('r2_cart', JSON.stringify(cart));
  const saveWishlist = () => localStorage.setItem('r2_wishlist', JSON.stringify(wishlist));

  // 2. UI ANIMATIONS & EFFECTS
  const initObservers = () => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) en.target.classList.add('is-visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));

    const counterObs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { animateCounter(en.target); counterObs.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.stat-counter').forEach(el => counterObs.observe(el));
  };

  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-count-to'), 10);
    const suffix = el.getAttribute('data-count-suffix') || '';
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / 1500, 1);
      el.textContent = Math.floor(progress * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Magnetic Button Micro-interaction
  const initMagnetic = () => {
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => btn.style.transform = `translate(0px, 0px)`);
    });
  };

  // 3. CATALOG & PRODUCT RENDERING (Logika Bisnis Dipertahankan 100%)
  window.switchCatalog = (cat) => {
    activeCatalog = cat;
    searchTerm = '';
    document.getElementById('searchInput').value = '';
    
    document.querySelectorAll('.catalog-tab').forEach(t => {
      if(t.dataset.tab === cat) {
          t.classList.replace('text-muted', 'text-primary');
          t.classList.add('bg-surface', 'shadow-sm');
      } else {
          t.classList.replace('text-primary', 'text-muted');
          t.classList.remove('bg-surface', 'shadow-sm');
      }
    });
    renderProducts();
  };

  window.applySort = (val) => { activeSort = val; renderProducts(); };
  window.setViewMode = (mode) => {
    viewMode = mode;
    document.getElementById('viewGridBtn').className = mode === 'grid' ? 'w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-primary shadow-sm' : 'w-10 h-10 rounded-xl bg-surfaceSoft border border-border flex items-center justify-center text-muted';
    document.getElementById('viewTableBtn').className = mode === 'table' ? 'w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-primary shadow-sm' : 'w-10 h-10 rounded-xl bg-surfaceSoft border border-border flex items-center justify-center text-muted';
    renderProducts();
  };

  const getProcessedData = () => {
    // Memanggil allProducts dari data.js
    let data = window.allProducts.filter(p => p.category === activeCatalog);
    if (searchTerm) data = data.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return data.sort((a, b) => {
      if (activeSort === 'price-asc') return a.price - b.price;
      if (activeSort === 'price-desc') return b.price - a.price;
      if (activeSort === 'name-desc') return b.name.localeCompare(a.name);
      return a.name.localeCompare(b.name);
    });
  };

  // Placeholder SVG Generator untuk kesan elegan
  const getGlassyPlaceholder = (name) => `
    <svg width="100%" height="100%" viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg">
        <text x="50%" y="50%" font-family="Manrope, sans-serif" font-size="12" font-weight="800" fill="#0B1120" text-anchor="middle" dominant-baseline="middle" opacity="0.3">${name}</text>
    </svg>`;

  const getBadges = (p) => {
    if (p.category === 'resmi') return `<span class="segment-badge segment-${p.segment}">SEG ${p.segment}</span>`;
    const tier = getR2Tier(p.price);
    return `<span class="segment-badge tier-${tier}">${tier}</span>`;
  };

  const getActionButtons = (p) => {
    const q = getCartQty(p.id);
    if (q > 0) {
      return `<div class="flex items-center justify-between border-2 border-accent rounded-xl bg-accent/5 p-1">
                <button onclick="updateQty('${p.id}', -1)" class="w-8 h-8 rounded-lg bg-surface text-primary font-bold shadow-sm">-</button>
                <span class="font-bold text-primary font-mono text-sm">${q}</span>
                <button onclick="updateQty('${p.id}', 1)" class="w-8 h-8 rounded-lg bg-primary text-surface font-bold shadow-sm">+</button>
              </div>`;
    }
    return `<button onclick="addToCart('${p.id}')" class="w-full py-3 bg-surface border border-border text-primary font-bold rounded-xl hover:bg-primary hover:text-surface transition-colors text-xs uppercase tracking-widest">Tambah</button>`;
  };

  const renderProducts = () => {
    const data = getProcessedData();
    const grid = document.getElementById('productGrid');
    const tableWrap = document.getElementById('productTableWrap');
    const tableBody = document.getElementById('productTableBody');
    const noData = document.getElementById('noProductFound');

    if (!data.length) {
      grid.innerHTML = ''; tableBody.innerHTML = '';
      noData.classList.remove('hidden'); tableWrap.classList.add('hidden');
      return;
    }
    noData.classList.add('hidden');

    if (viewMode === 'table') {
      grid.classList.add('hidden'); tableWrap.classList.remove('hidden');
      tableBody.innerHTML = data.map(p => `
        <div class="grid grid-cols-12 gap-4 p-5 items-center hover:bg-surfaceSoft/30 transition-colors">
            <div class="col-span-6 md:col-span-5 flex items-center gap-4">
                <div class="w-12 h-12 rounded-lg bg-surfaceSoft border border-border overflow-hidden shrink-0 hidden sm:flex">${getGlassyPlaceholder(p.id.toUpperCase())}</div>
                <div><div class="font-bold text-primary text-sm">${p.name}</div><div class="text-[10px] text-muted font-mono mt-0.5">${p.id.toUpperCase()}</div></div>
            </div>
            <div class="col-span-3 md:col-span-3 font-mono font-bold text-primary text-right md:text-left">${formatRupiah(p.price)}</div>
            <div class="hidden md:block col-span-2">${getBadges(p)}</div>
            <div class="col-span-3 md:col-span-2 flex justify-end gap-2">
                <button onclick="toggleWishlist('${p.id}')" class="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center ${isWishlisted(p.id) ? 'text-accent' : 'text-muted'}"><i class="fa-solid fa-heart"></i></button>
                <button onclick="addToCart('${p.id}')" class="w-10 h-10 rounded-xl bg-primary text-surface flex items-center justify-center"><i class="fa-solid fa-plus"></i></button>
            </div>
        </div>
      `).join('');
    } else {
      tableWrap.classList.add('hidden'); grid.classList.remove('hidden');
      grid.innerHTML = data.map((p, i) => `
        <div class="card-premium p-5 rounded-[1.5rem] flex flex-col justify-between group fade-up is-visible" style="animation-delay: ${Math.min(i*50, 500)}ms">
            <div class="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surfaceSoft mb-5 border border-border">
                <div class="absolute top-3 left-3 z-10">${getBadges(p)}</div>
                <button onclick="toggleWishlist('${p.id}')" class="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface/80 backdrop-blur border border-border flex items-center justify-center z-10 transition-colors ${isWishlisted(p.id) ? 'text-accent' : 'text-muted'} hover:text-accent">
                    <i class="fa-solid fa-heart"></i>
                </button>
                <div class="product-image-placeholder group-hover:scale-105 transition-transform duration-500">${getGlassyPlaceholder(p.name)}</div>
            </div>
            <div>
                <div class="text-[10px] font-mono text-muted mb-1">${p.id.toUpperCase()}</div>
                <h3 class="font-heading font-bold text-lg text-primary leading-tight mb-4 group-hover:text-accent transition-colors">${p.name}</h3>
                <div class="text-xl font-bold font-mono text-primary tracking-tight mb-5">${formatRupiah(p.price)}</div>
                ${getActionButtons(p)}
            </div>
        </div>
      `).join('');
    }
    initObservers(); // re-init observer untuk elemen baru
  };

  // 4. CART & CHECKOUT LOGIC (0% Downgrade: Pertahankan 20 slop rule & WA format)
  window.addToCart = (id) => {
    const p = window.allProducts.find(x => x.id === id);
    if(!p) return;
    const item = cart.find(x => x.id === id);
    item ? item.qty++ : cart.push({...p, qty: 1});
    saveCart(); updateCartUI(); showToast(`Menambahkan ${p.name} ke pesanan`);
  };

  window.updateQty = (id, ch) => {
    const item = cart.find(x => x.id === id);
    if(item) {
        item.qty += ch;
        if(item.qty <= 0) cart = cart.filter(x => x.id !== id);
    }
    saveCart(); updateCartUI();
  };

  const updateCartUI = () => {
    const totalQty = cart.reduce((s, i) => s + i.qty, 0);
    const totalPrice = cart.reduce((s, i) => s + (i.price * i.qty), 0);
    
    // Update Badges
    ['cartBadge', 'wishlistBadge'].forEach(id => {
      const el = document.getElementById(id);
      if(el) {
          const val = id === 'cartBadge' ? totalQty : wishlist.length;
          el.innerText = val;
          val > 0 ? el.classList.remove('scale-0') : el.classList.add('scale-0');
      }
    });

    // Update Banner 20 Slop (Logika subsidi ongkir asli dipertahankan)
    const progFill = document.getElementById('progressFill');
    if(progFill) {
        document.getElementById('bannerQty').innerText = totalQty;
        progFill.style.width = `${Math.min((totalQty / 20) * 100, 100)}%`;
        if(totalQty >= 20) {
            document.getElementById('bannerTitle').innerText = '🎉 Subsidi Ongkir Aktif';
            document.getElementById('bannerSubtitle').innerHTML = 'Pesanan ini memenuhi syarat pengiriman <b class="text-accent">GRATIS</b>.';
            progFill.classList.add('bg-success');
        } else {
            document.getElementById('bannerTitle').innerText = 'Target Subsidi Ongkir';
            document.getElementById('bannerSubtitle').innerHTML = `Tambahkan <b class="text-accent">${20 - totalQty} slop</b> lagi untuk pengiriman gratis.`;
            progFill.classList.remove('bg-success');
        }
    }

    // Render Side Cart
    const cc = document.getElementById('cartItemsContainer');
    if(!cart.length) {
        cc.innerHTML = '<div class="h-full flex flex-col items-center justify-center text-muted"><i class="fa-solid fa-basket-shopping text-4xl mb-4 opacity-50"></i><p class="font-bold">Keranjang Masih Kosong</p></div>';
        document.getElementById('cartSummary').classList.add('hidden');
    } else {
        document.getElementById('cartSummary').classList.remove('hidden');
        document.getElementById('totalItemsDisplay').innerText = totalQty;
        document.getElementById('totalPriceDisplay').innerText = formatRupiah(totalPrice);
        document.getElementById('modalTotalPrice').innerText = formatRupiah(totalPrice);
        
        cc.innerHTML = cart.map(i => `
            <div class="flex gap-4 bg-surface p-4 rounded-2xl border border-border">
                <div class="flex-1">
                    <h4 class="font-bold text-primary text-sm">${i.name}</h4>
                    <div class="font-mono text-accent font-bold text-sm mt-1">${formatRupiah(i.price)}</div>
                </div>
                <div class="flex items-center border border-border rounded-lg h-8">
                    <button onclick="updateQty('${i.id}', -1)" class="w-8 font-bold text-muted hover:bg-surfaceSoft">-</button>
                    <span class="w-8 text-center text-xs font-bold font-mono text-primary">${i.qty}</span>
                    <button onclick="updateQty('${i.id}', 1)" class="w-8 font-bold text-primary hover:bg-surfaceSoft">+</button>
                </div>
            </div>
        `).join('');
    }
    renderProducts(); // Sync state in grids
  };

  // Modals & Sidebars
  window.toggleCart = () => {
    const s = document.getElementById('cartSidebar'), o = document.getElementById('cartOverlay');
    s.classList.toggle('translate-x-full'); o.classList.toggle('hidden');
    setTimeout(() => o.classList.toggle('opacity-0'), 10);
    document.body.style.overflow = s.classList.contains('translate-x-full') ? '' : 'hidden';
  };

  window.openCheckoutModal = () => {
    toggleCart();
    setTimeout(() => {
        const m = document.getElementById('checkoutModal'), o = document.getElementById('checkoutModalOverlay');
        o.classList.remove('opacity-0', 'pointer-events-none');
        m.classList.add('modal-enter');
        document.body.style.overflow = 'hidden';
    }, 300);
  };

  window.closeCheckoutModal = () => {
    document.getElementById('checkoutModalOverlay').classList.add('opacity-0', 'pointer-events-none');
    document.getElementById('checkoutModal').classList.remove('modal-enter');
    document.body.style.overflow = '';
  };

  // 5. SUBMIT TO WHATSAPP (LOGIKA INTI DARI SISTEM LAMA DIPERTAHANKAN)
  window.submitOrder = () => {
    const req = ['newCustName', 'newCustPhone', 'newAlamat', 'newProvinsi', 'newKota', 'newKecamatan', 'newKelurahan', 'newKodePos', 'newEkspedisi', 'newMetode'];
    let valid = true;
    req.forEach(id => { if(!document.getElementById(id).value.trim()) valid = false; });
    
    if(!valid) { showToast('Mohon lengkapi seluruh form wajib'); return; }

    const btnText = document.getElementById('finalBtnText');
    const btnIcon = document.getElementById('finalBtnIcon');
    btnText.textContent = 'Enkripsi Data...'; btnIcon.className = 'fa-solid fa-spinner fa-spin text-lg';

    setTimeout(() => {
        const total = cart.reduce((s, i) => s + i.qty, 0);
        const waNumber = document.getElementById('newAdmin').value;
        const addr = `${document.getElementById('newAlamat').value} (Patokan: ${document.getElementById('newPatokan').value || '-'})
Kel: ${document.getElementById('newKelurahan').value}, Kec: ${document.getElementById('newKecamatan').value}
${document.getElementById('newKota').value}, ${document.getElementById('newProvinsi').value} - ${document.getElementById('newKodePos').value}`;

        let text = `📝 *ORDER R2 NUSANTARA (ENTERPRISE)*\n\n`;
        text += `👤 *Kemitraan:* ${document.getElementById('newCustName').value}\n`;
        text += `📱 *WhatsApp:* ${document.getElementById('newCustPhone').value}\n`;
        text += `📍 *Alamat Distribusi:*\n${addr}\n\n`;
        text += `🚚 *Ekspedisi:* ${document.getElementById('newEkspedisi').value}\n`;
        text += `💳 *Pembayaran:* ${document.getElementById('newMetode').value}\n\n`;
        text += `*📦 RINCIAN SKU:*\n`;
        
        cart.forEach(i => text += `• ${i.name} — ${i.qty} slop\n`);
        
        text += `\n*Total Order:* ${total} Slop\n`;
        text += `*Status Ongkir:* ${total >= 20 ? '✅ Subsidi/Gratis Ongkir' : 'Reguler (Non-Subsidi)'}`;

        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, '_blank');
        
        cart = []; saveCart(); updateCartUI(); closeCheckoutModal();
        document.getElementById('checkoutFormFull').reset();
        btnText.textContent = 'Proses Pesanan'; btnIcon.className = 'fa-brands fa-whatsapp text-lg';
    }, 1500);
  };

  const showToast = (msg) => {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'bg-primary text-surface px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transform translate-y-10 opacity-0 transition-all duration-300 font-bold text-sm border border-surface/10';
    t.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> ${msg}`;
    c.appendChild(t);
    setTimeout(() => t.classList.remove('translate-y-10', 'opacity-0'), 10);
    setTimeout(() => { t.classList.add('translate-y-10', 'opacity-0'); setTimeout(() => t.remove(), 300); }, 3000);
  };

  // Run Initialization
  document.addEventListener('DOMContentLoaded', () => {
      initObservers();
      initMagnetic();
      
      const search = document.getElementById('searchInput');
      if(search) {
          search.addEventListener('input', (e) => {
              searchTerm = e.target.value;
              renderProducts();
          });
      }

      // Pastikan data lama terbaca
      if(window.allProducts) {
          document.getElementById('countR2').innerText = window.allProducts.filter(p => p.category === 'r2').length;
          document.getElementById('countResmi').innerText = window.allProducts.filter(p => p.category === 'resmi').length;
      }
      
      renderProducts();
      updateCartUI();
  });

})();
