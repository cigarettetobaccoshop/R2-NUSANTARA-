window.CartModule = (function(Data) {
    'use strict';

    let cart = []; // Array of {id, name, price, qty}

    const saveCart = () => localStorage.setItem('r2_cart', JSON.stringify(cart));
    
    const loadCart = () => {
        const saved = localStorage.getItem('r2_cart');
        if (saved) cart = JSON.parse(saved);
        updateCartUI();
    };

    const addToCart = (id) => {
        const product = Data.getAllProducts().find(p => p.id === id);
        if (!product) return;

        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.qty += 1;
        } else {
            cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
        }
        
        saveCart();
        updateCartUI();
        
        // Trigger small vibration on mobile (Haptic Feedback)
        if (navigator.vibrate) navigator.vibrate(50);
    };

    const updateQty = (id, change) => {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.qty += change;
            if (item.qty <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
            saveCart();
            updateCartUI();
        }
    };

    const toggleCart = () => {
        const overlay = document.getElementById('cartOverlay');
        const sidebar = document.getElementById('cartSidebar');
        
        if (sidebar.classList.contains('translate-x-full')) {
            // Open
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.remove('opacity-0'), 10);
            sidebar.classList.remove('translate-x-full');
            document.body.style.overflow = 'hidden'; // Prevent background scroll
        } else {
            // Close
            overlay.classList.add('opacity-0');
            sidebar.classList.add('translate-x-full');
            setTimeout(() => overlay.classList.add('hidden'), 300);
            document.body.style.overflow = '';
        }
    };

    const updateCartUI = () => {
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

        // Update Badges
        document.getElementById('cartBadgeDesktop').textContent = totalItems;
        document.getElementById('cartBadgeMobile').textContent = totalItems;

        // Update Total Price
        document.getElementById('cartTotal').textContent = Data.formatRupiah(totalPrice);

        // Render Items
        const container = document.getElementById('cartItemsContainer');
        if (cart.length === 0) {
            container.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-slate-400"><i class="fa-solid fa-box-open text-4xl mb-2"></i><p class="text-sm font-bold">Keranjang Kosong</p></div>`;
            return;
        }

        container.innerHTML = cart.map(item => `
            <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                <div class="flex-1">
                    <h4 class="font-bold text-sm text-slate-900 dark:text-white">${item.name}</h4>
                    <p class="text-brand-primary font-mono text-xs font-bold">${Data.formatRupiah(item.price)}</p>
                </div>
                <div class="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1">
                    <button onclick="CartModule.updateQty('${item.id}', -1)" class="text-slate-500 font-bold px-1 active:scale-90">-</button>
                    <span class="text-xs font-bold font-mono w-4 text-center">${item.qty}</span>
                    <button onclick="CartModule.updateQty('${item.id}', 1)" class="text-brand-primary font-bold px-1 active:scale-90">+</button>
                </div>
            </div>
        `).join('');
    };

    return {
        init: loadCart,
        addToCart,
        updateQty,
        toggleCart,
        getCart: () => cart
    };
})(window.R2Data);
