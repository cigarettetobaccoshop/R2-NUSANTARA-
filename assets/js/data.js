// Memanfaatkan IIFE & Global Object untuk Modularitas tanpa bundler
window.R2Data = (function() {
    'use strict';

    // Mockup Data
    const products = [
        { id: 'r2-1', name: "Absolute Bold", price: 118000, category: 'r2', stock: 150 },
        { id: 'r2-2', name: "Age Pro", price: 65000, category: 'r2', stock: 8 }, // < 10 (Stok Menipis indicator test)
        { id: 'resmi-1', name: "A Mild 16", price: 245000, category: 'resmi', stock: 500 },
        { id: 'resmi-2', name: "Surya 16", price: 230000, category: 'resmi', stock: 200 }
    ];

    // Utilities Data
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(number);
    };

    return {
        getAllProducts: () => products,
        formatRupiah: formatRupiah
    };
})();
