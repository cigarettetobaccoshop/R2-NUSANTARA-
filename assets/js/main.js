(function() {
    // ========== DATA PRODUK ==========
    const products = [
        { id: 1, name: "Sampoerna A Mild 16", price: 315000, category: "r2 slop", img: "https://placehold.co/300x200/0a1628/white?text=A+Mild", unit: "slop" },
        { id: 2, name: "Gudang Garam Surya 12", price: 225000, category: "resmi slop", img: "https://placehold.co/300x200/162544/white?text=Surya+12", unit: "slop" },
        { id: 3, name: "Djarum Super 16", price: 295000, category: "r2 slop", img: "https://placehold.co/300x200/1e3a5f/white?text=Djarum+Super", unit: "slop" },
        { id: 4, name: "Marlboro Merah 20", price: 480000, category: "resmi bal", img: "https://placehold.co/300x200/3d4250/white?text=Marlboro", unit: "bal" },
        { id: 5, name: "LA Lights Menthol 16", price: 275000, category: "r2 slop", img: "https://placehold.co/300x200/0a1628/white?text=LA+Lights", unit: "slop" },
        { id: 6, name: "U Bold 12", price: 198000, category: "r2 slop", img: "https://placehold.co/300x200/162544/white?text=U+Bold", unit: "slop" },
        { id: 7, name: "Camel Yellow 20", price: 450000, category: "resmi bal", img: "https://placehold.co/300x200/1e3a5f/white?text=Camel", unit: "bal" },
        { id: 8, name: "Esse Change 20", price: 310000, category: "r2 slop", img: "https://placehold.co/300x200/3d4250/white?text=Esse", unit: "slop" }
    ];

    // ========== KERANJANG ==========
    let cart = JSON.parse(localStorage.getItem('r2_cart')) || [];

    const cartToggle = document.getElementById('cart-toggle');
    const cartBadge = document.getElementById('cart-badge');
    const cartPanel = document.getElementById('cart-panel');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartClose = document.getElementById('cart-close');
    const cartItems = document.getElementById('cart-items');
    const cartTotalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutOverlay = document.getElementById('checkout-overlay');
    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutClose = document.getElementById('checkout-close');

    function saveCart() { localStorage.setItem('r2_cart', JSON.stringify(cart)); }
    function updateCartUI() {
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
        cartBadge.textContent = totalItems;
        cartBadge.classList.toggle('hidden', totalItems === 0);
        cartTotalEl.textContent = 'Rp ' + totalPrice.toLocaleString('id-ID');
        checkoutBtn.disabled = totalItems === 0;

        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="text-center text-silver-400 text-sm py-20">Keranjang masih kosong.</p>';
        } else {
            cartItems.innerHTML = cart.map(item => `
                <div class="flex items-center gap-3 border-b pb-3">
                    <img src="${item.img}" alt="${item.name}" class="w-16 h-16 object-cover rounded-lg" loading="lazy">
                    <div class="flex-1">
                        <p class="font-semibold text-sm">${item.name}</p>
                        <p class="text-xs text-silver-500">Rp ${item.price.toLocaleString('id-ID')} / ${item.unit}</p>
                        <div class="flex items-center gap-2 mt-2">
                            <button onclick="updateQty(${item.id}, -1)" class="min-h-[36px] min-w-[36px] rounded-full border text-xs font-bold hover:bg-silver-100" aria-label="Kurangi jumlah">−</button>
                            <span class="font-mono text-sm">${item.qty}</span>
                            <button onclick="updateQty(${item.id}, 1)" class="min-h-[36px] min-w-[36px] rounded-full border text-xs font-bold hover:bg-silver-100" aria-label="Tambah jumlah">+</button>
                        </div>
                    </div>
                    <button onclick="removeFromCart(${item.id})" class="text-red-400 hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full" aria-label="Hapus item"><i class="fa-solid fa-trash"></i></button>
                </div>
            `).join('');
        }
    }

    window.addToCart = function(productId) {
        const product = products.find(p => p.id === productId);
        const existing = cart.find(item => item.id === productId);
        if (existing) { existing.qty += 1; }
        else { cart.push({ ...product, qty: 1 }); }
        saveCart();
        updateCartUI();
        openCart();
    };

    window.updateQty = function(productId, delta) {
        const item = cart.find(i => i.id === productId);
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) cart = cart.filter(i => i.id !== productId);
        saveCart();
        updateCartUI();
    };

    window.removeFromCart = function(productId) {
        cart = cart.filter(i => i.id !== productId);
        saveCart();
        updateCartUI();
    };

    function openCart() {
        cartPanel.classList.remove('translate-x-full');
        cartOverlay.classList.add('overlay-enter');
        cartToggle.setAttribute('aria-expanded', 'true');
    }
    function closeCart() {
        cartPanel.classList.add('translate-x-full');
        cartOverlay.classList.remove('overlay-enter');
        cartToggle.setAttribute('aria-expanded', 'false');
    }

    cartToggle.addEventListener('click', () => { cartPanel.classList.contains('translate-x-full') ? openCart() : closeCart(); });
    cartOverlay.addEventListener('click', closeCart);
    cartClose.addEventListener('click', closeCart);

    // ========== CHECKOUT MODAL ==========
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const stepIndicators = document.querySelectorAll('.step-indicator');
    const stepLines = document.querySelectorAll('.step-line');
    const nextStep2 = document.getElementById('next-step-2');
    const nextStep3 = document.getElementById('next-step-3');
    const waLink = document.getElementById('wa-link');
    const checkoutDone = document.getElementById('checkout-done');
    const reviewItems = document.getElementById('review-items');
    const reviewTotal = document.getElementById('review-total');
    const namaInput = document.getElementById('nama');
    const telpInput = document.getElementById('telp');
    const alamatInput = document.getElementById('alamat');

    function resetSteps(activeIdx) {
        step1.classList.add('hidden'); step2.classList.add('hidden'); step3.classList.add('hidden');
        if (activeIdx === 1) step1.classList.remove('hidden');
        if (activeIdx === 2) step2.classList.remove('hidden');
        if (activeIdx === 3) step3.classList.remove('hidden');
        stepIndicators.forEach((el, idx) => {
            el.classList.remove('active', 'completed');
            if (idx < activeIdx-1) el.classList.add('completed');
            if (idx === activeIdx-1) el.classList.add('active');
        });
        stepLines.forEach((line, idx) => {
            line.classList.toggle('active', idx < activeIdx-1);
        });
    }

    function openCheckoutModal() {
        closeCart();
        if (cart.length === 0) return;
        resetSteps(1);
        checkoutOverlay.classList.add('overlay-enter');
        checkoutModal.classList.add('modal-enter');
        namaInput.value = ''; telpInput.value = ''; alamatInput.value = '';
        document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
        document.querySelectorAll('input, textarea').forEach(el => el.classList.remove('form-field-error'));
    }

    function closeCheckoutModal() {
        checkoutOverlay.classList.remove('overlay-enter');
        checkoutModal.classList.remove('modal-enter');
    }

    checkoutBtn.addEventListener('click', openCheckoutModal);
    checkoutOverlay.addEventListener('click', (e) => { if (e.target === checkoutOverlay) closeCheckoutModal(); });
    checkoutClose.addEventListener('click', closeCheckoutModal);
    checkoutDone.addEventListener('click', closeCheckoutModal);

    nextStep2.addEventListener('click', () => {
        let valid = true;
        document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
        document.querySelectorAll('input, textarea').forEach(el => el.classList.remove('form-field-error'));
        if (!namaInput.value.trim()) { valid = false; namaInput.classList.add('form-field-error'); document.querySelector('[data-for="nama"]').classList.add('show'); }
        if (!telpInput.value.trim() || !/^08\d{8,}$/.test(telpInput.value.trim())) { valid = false; telpInput.classList.add('form-field-error'); document.querySelector('[data-for="telp"]').classList.add('show'); }
        if (!alamatInput.value.trim()) { valid = false; alamatInput.classList.add('form-field-error'); document.querySelector('[data-for="alamat"]').classList.add('show'); }
        if (!valid) return;
        reviewItems.innerHTML = cart.map(item => `<div class="flex justify-between"><span>${item.name} x${item.qty}</span><span>Rp ${(item.price*item.qty).toLocaleString('id-ID')}</span></div>`).join('');
        reviewTotal.textContent = 'Rp ' + cart.reduce((s,i)=>s+i.price*i.qty,0).toLocaleString('id-ID');
        resetSteps(2);
    });

    nextStep3.addEventListener('click', () => {
        resetSteps(3);
        const msg = `Halo R2 Nusantara, saya ingin pesan:%0A%0A${cart.map(i=>`- ${i.name} x${i.qty} (Rp ${(i.price*i.qty).toLocaleString('id-ID')})`).join('%0A')}%0A%0ATotal: Rp ${cart.reduce((s,i)=>s+i.price*i.qty,0).toLocaleString('id-ID')}%0A%0ANama: ${namaInput.value}%0ANo WA: ${telpInput.value}%0AAlamat: ${alamatInput.value}`;
        waLink.href = `https://wa.me/6285715905079?text=${msg}`;
    });

    // ========== KATALOG & FILTER ==========
    const productGrid = document.getElementById('product-grid');
    function renderProducts(filter = 'all') {
        const filtered = filter === 'all' ? products : products.filter(p => p.category.includes(filter));
        productGrid.innerHTML = filtered.map(p => `
            <article class="card-premium card-glow bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col" data-category="${p.category}">
                <div class="relative overflow-hidden h-48">
                    <img src="${p.img}" alt="${p.name}" class="w-full h-full object-cover" loading="lazy" decoding="async">
                    <span class="absolute top-2 right-2 bg-white/80 text-xs font-bold px-2 py-1 rounded-full backdrop-blur">${p.unit}</span>
                </div>
                <div class="p-4 flex flex-col flex-1">
                    <h3 class="font-bold text-brand-800 mb-1 text-lg">${p.name}</h3>
                    <p class="text-brand-500 font-extrabold text-xl mb-4">Rp ${p.price.toLocaleString('id-ID')}</p>
                    <button onclick="addToCart(${p.id})" class="mt-auto w-full bg-brand-800 text-white font-bold py-3 rounded-full hover:bg-brand-700 transition ripple min-h-[44px] flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-brand-400">
                        <i class="fa-solid fa-cart-plus"></i> Tambah ke Keranjang
                    </button>
                </div>
            </article>
        `).join('');
    }
    renderProducts();

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => { b.classList.remove('active','bg-brand-800','text-white'); b.classList.add('text-silver-700','border-silver-300'); b.setAttribute('aria-selected','false'); });
            btn.classList.add('active','bg-brand-800','text-white'); btn.classList.remove('text-silver-700','border-silver-300');
            btn.setAttribute('aria-selected','true');
            renderProducts(btn.dataset.filter);
        });
    });

    // ========== LOADER & SCROLL ==========
    window.addEventListener('load', () => {
        const loader = document.getElementById('loader');
        if (loader) { loader.style.opacity = '0'; setTimeout(() => loader.style.display = 'none', 500); }
        updateCartUI();
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('is-visible'); });
    }, { threshold: 0.15 });
    document.querySelectorAll('.fade-on-scroll').forEach(el => observer.observe(el));

    const backToTop = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        backToTop.classList.toggle('visible', window.scrollY > 500);
    });
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Card glow mouse tracking
    document.querySelectorAll('.card-glow').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
            card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
        });
    });
})();