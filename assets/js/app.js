document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const { getAllProducts, formatRupiah } = window.R2Data;
    
    // Initialize Cart
    window.CartModule.init();

    // 1. Dark Mode Setup
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');
    
    const applyTheme = (isDark) => {
        if (isDark) {
            document.body.classList.add('dark-mode');
            icon.classList.replace('fa-moon', 'fa-sun');
        } else {
            document.body.classList.remove('dark-mode');
            icon.classList.replace('fa-sun', 'fa-moon');
        }
    };

    // Cek preference di localStorage atau system preference
    const savedTheme = localStorage.getItem('r2_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        applyTheme(true);
    }

    themeToggle.addEventListener('click', () => {
        const isCurrentlyDark = document.body.classList.contains('dark-mode');
        applyTheme(!isCurrentlyDark);
        localStorage.setItem('r2_theme', !isCurrentlyDark ? 'dark' : 'light');
    });

    // 2. Render Products (With Live Stock Indicator)
    const renderProducts = (searchTerm = '') => {
        const container = document.getElementById('productGrid');
        let products = getAllProducts();

        if (searchTerm) {
            products = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (products.length === 0) {
            container.innerHTML = `<div class="col-span-full py-10 text-center text-slate-400">Produk tidak ditemukan.</div>`;
            return;
        }

        container.innerHTML = products.map(p => {
            // Live Stock Indicator Logic
            let stockBadge = '';
            if (p.stock <= 10) {
                stockBadge = `<span class="absolute top-3 right-3 bg-red-100 text-red-600 text-[9px] font-extrabold px-2 py-1 rounded-md border border-red-200 shadow-sm animate-pulse">Sisa ${p.stock}</span>`;
            }

            return `
                <div class="product-card group">
                    ${stockBadge}
                    <div class="mb-3">
                        <span class="text-[9px] font-bold text-slate-400 tracking-widest uppercase">${p.category === 'resmi' ? 'Resmi' : 'R2'}</span>
                        <h3 class="font-extrabold text-sm md:text-base text-slate-900 dark:text-white leading-tight mt-1 truncate">${p.name}</h3>
                    </div>
                    
                    <div class="mb-4">
                        <span class="text-lg font-black text-brand-primary font-mono">${formatRupiah(p.price)}</span>
                        <span class="text-[10px] text-slate-500 font-medium">/slop</span>
                    </div>

                    <button onclick="CartModule.addToCart('${p.id}')" class="btn-add-cart">
                        <i class="fa-solid fa-plus text-xs"></i> Tambah
                    </button>
                </div>
            `;
        }).join('');
    };

    // 3. Search Autocomplete / Filter
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                renderProducts(e.target.value);
            }, 300); // 300ms delay for performance
        });
    }

    // Initial Render
    renderProducts();
});
