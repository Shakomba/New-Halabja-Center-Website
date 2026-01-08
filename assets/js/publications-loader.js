(function() {
  'use strict';

  // Get current language
  function getCurrentLanguage() {
    return document.documentElement.lang || 'en';
  }

  // Get translation
  function t(key) {
    const lang = getCurrentLanguage();
    return window.I18N?.[lang]?.[key] || key;
  }

  // Publications data with Kurdish content
  // NOTE: Replace cover paths with actual book cover images when available
  // For now, colors are used as placeholders
  const PUBLICATIONS = [
    {
      id: 'featured',
      title: 'ڕێنمایی فێربوونی قورئان',
      description: 'کتێبێکی گشتگیر بۆ فێربوونی خوێندنەوەی قورئانی پیرۆز بە ڕێبازی دروست و تەجوید. ئەم کتێبە گونجاوە بۆ سەرەتاییەکان و ناوەندییەکان.',
      cover: 'assets/img/book-cover-1.png',
      color: '#ff924a',
      pages: '١٢٠',
      size: '4.5 MB',
      file: 'assets/pdfs/publication-sample-1.pdf',
      featured: true
    },
    {
      id: 'pub-2',
      title: 'ئەحکامی تەجوید',
      description: 'باسکردن لە هەموو یاساکانی تەجوید بۆ خوێندنەوەی ڕاست و دروستی قورئان.',
      cover: 'assets/img/book-cover-2.png',
      color: '#222',
      pages: '٨٥',
      size: '3.2 MB',
      file: 'assets/pdfs/publication-sample-2.pdf',
      featured: false
    },
    {
      id: 'pub-3',
      title: 'دوعا و ئەزکار',
      description: 'کۆکراوەیەکی دوعا و ئەزکاری ڕۆژانە بۆ موسڵمانان.',
      cover: 'assets/img/book-cover-3.png',
      color: '#FE9007',
      pages: '٦٤',
      size: '2.1 MB',
      file: 'assets/pdfs/publication-sample-1.pdf',
      featured: false
    }
  ];

  // Icons
  const ICONS = {
    eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    pages: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    size: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`
  };

  // Generate 3D book HTML
  function generateBookHTML(pub) {
    const coverStyle = pub.cover 
      ? `background-image: url('${pub.cover}'); background-color: ${pub.color || '#147E49'};`
      : `background-color: ${pub.color || '#147E49'};`;
    
    const bgColor = pub.color || '#147E49';
    
    return `
      <div class="book-3d bk-bookdefault">
        <div class="book-front">
          <div class="book-cover-back" style="background-color: #000;"></div>
          <div class="book-cover" style="${coverStyle}"></div>
        </div>
        <div class="book-pages"></div>
        <div class="book-back" style="background-color: ${bgColor};"></div>
        <div class="book-right" style="background-color: ${bgColor};"></div>
        <div class="book-left" style="background-color: ${bgColor};"></div>
        <div class="book-top"></div>
        <div class="book-bottom"></div>
      </div>
    `;
  }

  // Generate meta pills HTML
  function generateMetaHTML(pages, size) {
    return `
      <div class="pub-meta">
        <span class="pub-meta-pill">
          ${ICONS.pages}
          <span>${pages} ${t('pub.meta.pages')}</span>
        </span>
        <span class="pub-meta-pill">
          ${ICONS.size}
          <span>${size}</span>
        </span>
      </div>
    `;
  }

  // Generate buttons HTML
  function generateButtonsHTML(file) {
    return `
      <div class="pub-buttons">
        <button class="pub-btn pub-btn-ghost" onclick="openPreview('${file}')">
          ${ICONS.eye}
          <span data-i18n="pub.btn.preview">${t('pub.btn.preview')}</span>
        </button>
        <a href="${file}" download class="pub-btn pub-btn-solid">
          ${ICONS.download}
          <span data-i18n="pub.btn.download">${t('pub.btn.download')}</span>
        </a>
      </div>
    `;
  }

  // Render featured publication
  function renderFeatured() {
    const container = document.getElementById('featuredPublication');
    if (!container) return;

    const featured = PUBLICATIONS.find(p => p.featured);
    if (!featured) {
      container.style.display = 'none';
      return;
    }

    container.innerHTML = `
      <div class="pub-featured-badge" data-i18n="pub.featured.badge">${t('pub.featured.badge')}</div>
      <div class="pub-featured-book">
        ${generateBookHTML(featured)}
      </div>
      <div class="pub-featured-content">
        <h2 class="pub-featured-title">${featured.title}</h2>
        ${generateMetaHTML(featured.pages, featured.size)}
        <p class="pub-featured-desc">${featured.description}</p>
        ${generateButtonsHTML(featured.file)}
      </div>
    `;
  }

  // Render publications grid
  function renderGrid() {
    const container = document.getElementById('publicationsGrid');
    if (!container) return;

    const nonFeatured = PUBLICATIONS.filter(p => !p.featured);
    
    if (nonFeatured.length === 0) {
      container.innerHTML = '<p class="pub-empty">هیچ بڵاوکراوەیەک نییە</p>';
      return;
    }

    container.innerHTML = nonFeatured.map(pub => `
      <article class="pub-card reveal">
        ${generateBookHTML(pub)}
        <h3 class="pub-card-title">${pub.title}</h3>
        ${generateMetaHTML(pub.pages, pub.size)}
        <p class="pub-card-desc">${pub.description}</p>
        ${generateButtonsHTML(pub.file)}
      </article>
    `).join('');

    // Trigger reveal animations
    setTimeout(() => {
      if (typeof window.setupReveal === 'function') {
        window.setupReveal();
      }
    }, 100);
  }

  // Preview modal
  window.openPreview = function(file) {
    let modal = document.getElementById('pubPreviewModal');
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'pubPreviewModal';
      modal.className = 'pub-preview-modal';
      modal.innerHTML = `
        <div class="pub-preview-content">
          <button class="pub-preview-close" onclick="closePreview()">&times;</button>
          <iframe id="pubPreviewFrame" src=""></iframe>
        </div>
      `;
      document.body.appendChild(modal);

      // Close on background click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closePreview();
      });

      // Close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePreview();
      });
    }

    const iframe = document.getElementById('pubPreviewFrame');
    iframe.src = file;
    
    setTimeout(() => {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }, 10);
  };

  window.closePreview = function() {
    const modal = document.getElementById('pubPreviewModal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
      setTimeout(() => {
        const iframe = document.getElementById('pubPreviewFrame');
        if (iframe) iframe.src = '';
      }, 300);
    }
  };

  // Attach flip functionality to books
  function attachBookFlip() {
    const books = document.querySelectorAll('.book-3d');
    
    books.forEach(book => {
      // Remove existing listener if any
      const newBook = book.cloneNode(true);
      book.parentNode.replaceChild(newBook, book);
      
      newBook.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (this.classList.contains('bk-viewback')) {
          // Flip back to front
          this.classList.remove('bk-viewback');
          this.classList.add('bk-bookdefault');
        } else {
          // Flip to back
          this.classList.remove('bk-bookdefault');
          this.classList.add('bk-viewback');
        }
      });
    });
  }

  // Initialize
  function init() {
    renderFeatured();
    renderGrid();
    
    // Attach flip functionality
    setTimeout(() => {
      attachBookFlip();
    }, 100);
    
    // Listen for language changes
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
      langSelect.addEventListener('change', () => {
        setTimeout(() => {
          renderFeatured();
          renderGrid();
          attachBookFlip();
        }, 100);
      });
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
