/* ============================================
   R2 NUSANTARA — ENTERPRISE APPLICATION LOGIC
   ============================================ */
(function () {
  'use strict';

  // --- 🛠️ PERBAIKAN SISTEM LOADER ---
  function hideLoader() {
    var loader = document.getElementById('loader');
    if (loader && loader.style.opacity !== '0') {
      loader.style.opacity = '0';
      setTimeout(function() { loader.style.display = 'none'; }, 700);
    }
  }

  // Lapis 1: Hilangkan loader segera setelah struktur HTML siap (Sangat Cepat)
  document.addEventListener('DOMContentLoaded', hideLoader);
  
  // Lapis 2: Hilangkan loader saat seluruh halaman & gambar selesai dimuat (Standar)
  window.addEventListener('load', hideLoader);
  
  // Lapis 3: Paksa loader hilang setelah 2.5 detik apapun yang terjadi (Failsafe)
  setTimeout(hideLoader, 2500);
  // -----------------------------------

  // State global
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

  // ... (Sisa kode app.js di bawahnya biarkan sama persis seperti sebelumnya) ...
