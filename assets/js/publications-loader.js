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

  // Get translated value from multilingual field
  function getTranslatedValue(field, lang) {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[lang] || field['en'] || '';
  }

  // Convert numbers to Arabic-Indic numerals
  function toArabicNumerals(num) {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, (digit) => arabicNumerals[digit]);
  }

  // Convert numbers to Persian/Kurdish numerals (same as Arabic-Indic)
  function toKurdishNumerals(num) {
    return toArabicNumerals(num);
  }

  // Format number based on language
  function formatNumber(num, lang) {
    if (lang === 'ar') {
      return toArabicNumerals(num);
    } else if (lang === 'ku') {
      return toKurdishNumerals(num);
    }
    return String(num);
  }

  // Publications data - loaded from JSON
  let PUBLICATIONS = [];

  // Icons
  const ICONS = {
    eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    pages: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    size: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`
  };

  // Generate 3D book HTML
  function generateBookHTML(pub) {
    // Use new coverFront/coverBack/coverSpine if available, else fallback to old cover
    const frontCover = pub.coverFront || pub.cover;
    const backCover = pub.coverBack;
    const spineCover = pub.coverSpine;

    const coverStyle = frontCover
      ? `background-image: url('${frontCover}'); background-size: cover; background-position: center;`
      : `background-color: ${pub.color || '#147E49'};`;

    const backStyle = backCover
      ? `background-image: url('${backCover}'); background-size: cover; background-position: center;`
      : `background-color: ${pub.color || '#147E49'};`;

    const spineStyle = spineCover
      ? `background-image: url('${spineCover}'); background-size: cover; background-position: center;`
      : `background-color: ${pub.color || '#147E49'};`;

    return `
      <div class="book-3d bk-bookdefault">
        <div class="book-front">
          <div class="book-cover" style="${coverStyle}"></div>
        </div>
        <div class="book-pages"></div>
        <div class="book-back" style="${backStyle}"></div>
        <div class="book-right" style="${spineStyle}"></div>
        <div class="book-left" style="${spineStyle}"></div>
        <div class="book-top"></div>
        <div class="book-bottom"></div>
      </div>
    `;
  }

  // Generate meta pills HTML
  function generateMetaHTML(pages, size) {
    const lang = getCurrentLanguage();
    const formattedPages = formatNumber(pages, lang);

    return `
      <div class="pub-meta">
        <span class="pub-meta-pill">
          ${ICONS.pages}
          <span>${formattedPages} ${t('pub.meta.pages')}</span>
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

  // Render hero carousel
  function renderHeroCarousel() {
    const track = document.getElementById('pubHeroTrack');
    const dotsContainer = document.querySelector('.pub-hero-dots');
    if (!track) return;

    // Get featured and newest publications
    const heroBooks = PUBLICATIONS.filter(p => p.featured || p.newest);
    if (heroBooks.length === 0) return;

    const lang = getCurrentLanguage();

    // Generate slide HTML with inner wrapper for centered content
    const generateSlide = (pub, index, isClone = false) => {
      const description = getTranslatedValue(pub.description, lang);
      const badgeKey = pub.newest ? 'pub.badge.newest' : 'pub.featured.badge';
      const badgeText = t(badgeKey);

      // Set dir and lang attributes based on current language
      const isRTL = lang === 'ar' || lang === 'ku';
      const dirAttr = isRTL ? 'rtl' : 'ltr';

      return `
        <div class="pub-hero-slide${isClone ? ' clone' : ''}" ${isClone ? '' : `role="listitem" aria-roledescription="slide" aria-label="${index + 1} of ${heroBooks.length}"`}>
          <div class="pub-hero-badge">${badgeText}</div>
          <div class="pub-hero-slide-inner">
            <div class="pub-hero-content">
              <h2 class="pub-hero-title" dir="rtl" lang="ku">${pub.title}</h2>
              ${generateMetaHTML(pub.pages, pub.size)}
              <p class="pub-hero-desc" dir="${dirAttr}" lang="${lang}">${description}</p>
              ${generateButtonsHTML(pub.file)}
            </div>
            <div class="pub-hero-book">
              ${generateBookHTML(pub)}
            </div>
          </div>
        </div>
      `;
    };

    // Build infinite loop structure: [lastClone, ...originals, firstClone]
    const slides = [];

    // Add last slide clone at the beginning (for prev wrap)
    slides.push(generateSlide(heroBooks[heroBooks.length - 1], heroBooks.length - 1, true));

    // Add all original slides
    heroBooks.forEach((pub, i) => slides.push(generateSlide(pub, i, false)));

    // Add first slide clone at the end (for next wrap)
    slides.push(generateSlide(heroBooks[0], 0, true));

    track.innerHTML = slides.join('');

    // Generate dots
    if (dotsContainer && heroBooks.length > 1) {
      dotsContainer.innerHTML = heroBooks.map((_, i) =>
        `<button class="pub-hero-dot" type="button" aria-label="Go to slide ${i + 1}" data-index="${i}"></button>`
      ).join('');
    }

    // Setup carousel behavior
    setupHeroCarousel(heroBooks.length);
  }

  // Carousel control logic with infinite loop
  function setupHeroCarousel(totalSlides) {
    const track = document.getElementById('pubHeroTrack');
    const slider = document.querySelector('.pub-hero-slider');
    const carousel = document.querySelector('.pub-hero-carousel');
    const prevBtn = document.querySelector('.pub-hero-arrow.prev');
    const nextBtn = document.querySelector('.pub-hero-arrow.next');
    const dots = document.querySelectorAll('.pub-hero-dot');

    if (!track || totalSlides <= 1) return;

    // currentIndex: 0=lastClone, 1=first real, 2=second real, ..., totalSlides=firstClone
    let currentIndex = 1; // Start at first real slide
    let isTransitioning = false;
    let autoSlideInterval = null;

    // Touch swipe state
    let touchStartX = 0;
    let touchStartY = 0;
    let touchCurrentX = 0;
    let touchCurrentY = 0;
    let isDragging = false;
    let isHorizontalSwipe = false;
    let isVerticalSwipe = false;
    const SWIPE_THRESHOLD = 50;

    // Reset book flip state - disabled in hero carousel to prevent animation refresh
    // Books stay in constant 3D state via CSS
    function resetHiddenBookFlips() {
      // No-op: CSS handles the constant state with !important rules
    }

    // Update carousel position
    function updateCarousel(animate = true) {
      if (!animate) {
        track.classList.add('no-transition');
      }

      const offset = -currentIndex * 100;
      track.style.transform = `translateX(${offset}%)`;

      // Update dots (map real index)
      const realIndex = currentIndex - 1; // Offset by 1 because of leading clone
      dots.forEach((dot, i) => {
        dot.setAttribute('aria-current', i === realIndex ? 'true' : 'false');
      });

      if (!animate) {
        // Force reflow to apply no-transition immediately
        track.offsetHeight;
        track.classList.remove('no-transition');
      }

      // Reset flipped books in background
      setTimeout(() => resetHiddenBookFlips(), animate ? 600 : 0);
    }

    // Handle transition end for clone wrapping - seamless infinite loop
    function handleTransitionEnd(e) {
      // Only handle transition on transform property and ensure it's from the track itself
      if (!e || e.propertyName !== 'transform' || e.target !== track) return;

      // If on last clone (first real slide clone), jump to first real slide
      if (currentIndex === totalSlides + 1) {
        // Use double requestAnimationFrame for smoother visual transition
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            currentIndex = 1;
            updateCarousel(false); // Jump without animation
            isTransitioning = false;
          });
        });
      }
      // If on first clone (last real slide clone), jump to last real slide
      else if (currentIndex === 0) {
        // Use double requestAnimationFrame for smoother visual transition
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            currentIndex = totalSlides;
            updateCarousel(false); // Jump without animation
            isTransitioning = false;
          });
        });
      } else {
        isTransitioning = false;
      }
    }

    // Only listen for transitionend on the track itself, not bubbled events
    track.addEventListener('transitionend', handleTransitionEnd, false);

    // Move forward
    function goNext() {
      if (isTransitioning) return;
      isTransitioning = true;
      currentIndex++;
      updateCarousel(true);
    }

    // Move backward
    function goPrev() {
      if (isTransitioning) return;
      isTransitioning = true;
      currentIndex--;
      updateCarousel(true);
    }

    // Auto-slide every 5 seconds - always forward
    function startAutoSlide() {
      stopAutoSlide();
      autoSlideInterval = setInterval(goNext, 5000);
    }

    function stopAutoSlide() {
      if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
        autoSlideInterval = null;
      }
    }

    // Show/hide arrow buttons based on screen size
    const isMobile = window.innerWidth <= 768;
    if (prevBtn && nextBtn) {
      if (isMobile) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
      } else {
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
      }
    }

    // Arrow navigation
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        stopAutoSlide();
        goPrev();
        startAutoSlide();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        stopAutoSlide();
        goNext();
        startAutoSlide();
      });
    }

    // Dot navigation
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        if (isTransitioning) return;
        stopAutoSlide();
        const targetIndex = parseInt(dot.getAttribute('data-index'));
        currentIndex = targetIndex + 1; // Offset by 1 for leading clone
        isTransitioning = true;
        updateCarousel(true);
        setTimeout(() => {
          isTransitioning = false;
          startAutoSlide();
        }, 800);
      });
    });

    // Touch swipe handlers - Responsive from edges
    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return;

      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isDragging = true;
      isHorizontalSwipe = false;
      isVerticalSwipe = false;
      stopAutoSlide();
    };

    const handleTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return;

      touchCurrentX = e.touches[0].clientX;
      touchCurrentY = e.touches[0].clientY;

      const deltaX = touchCurrentX - touchStartX;
      const deltaY = touchCurrentY - touchStartY;

      // Determine swipe direction with lower threshold for edge responsiveness
      if (!isHorizontalSwipe && !isVerticalSwipe) {
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
          isHorizontalSwipe = true;
        } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 5) {
          isVerticalSwipe = true;
        }
      }

      // Prevent default only for horizontal swipes
      if (isHorizontalSwipe) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e) => {
      if (!isDragging) return;
      isDragging = false;

      const deltaX = touchCurrentX - touchStartX;

      // Only handle horizontal swipes
      if (isHorizontalSwipe && Math.abs(deltaX) > SWIPE_THRESHOLD) {
        if (deltaX > 0) {
          // Swipe right - go to previous
          goPrev();
        } else {
          // Swipe left - go to next
          goNext();
        }
      }

      startAutoSlide();
      isHorizontalSwipe = false;
      isVerticalSwipe = false;
    };

    // Add touch listeners to carousel for true edge-to-edge detection
    const touchTarget = carousel || slider || track;
    touchTarget.addEventListener('touchstart', handleTouchStart, { passive: true });
    touchTarget.addEventListener('touchmove', handleTouchMove, { passive: false });
    touchTarget.addEventListener('touchend', handleTouchEnd);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        stopAutoSlide();
        goPrev();
        startAutoSlide();
      } else if (e.key === 'ArrowRight') {
        stopAutoSlide();
        goNext();
        startAutoSlide();
      }
    });

    // Pause on hover
    track.addEventListener('mouseenter', stopAutoSlide);
    track.addEventListener('mouseleave', startAutoSlide);

    // Initial state
    updateCarousel(false); // Set initial position without animation
    startAutoSlide();
  }

  // Render publications grid
  function renderGrid() {
    const container = document.getElementById('publicationsGrid');
    if (!container) return;

    // Exclude featured and newest (they're in hero carousel)
    const gridBooks = PUBLICATIONS.filter(p => !p.featured && !p.newest);
    const lang = getCurrentLanguage();

    const emptyMessages = {
      en: 'No publications available',
      ku: 'هیچ بڵاوکراوەیەک نییە',
      ar: 'لا توجد منشورات'
    };

    if (gridBooks.length === 0) {
      container.innerHTML = `<p class="pub-empty">${emptyMessages[lang] || emptyMessages.en}</p>`;
      return;
    }

    // Set dir and lang attributes based on current language
    const isRTL = lang === 'ar' || lang === 'ku';
    const dirAttr = isRTL ? 'rtl' : 'ltr';

    container.innerHTML = gridBooks.map(pub => {
      const description = getTranslatedValue(pub.description, lang);

      return `
        <article class="pub-card reveal">
          ${generateBookHTML(pub)}
          <h3 class="pub-card-title" dir="rtl" lang="ku">${pub.title}</h3>
          ${generateMetaHTML(pub.pages, pub.size)}
          <p class="pub-card-desc" dir="${dirAttr}" lang="${lang}">${description}</p>
          ${generateButtonsHTML(pub.file)}
        </article>
      `;
    }).join('');

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

  // Attach flip functionality to ALL books (hero and grid)
  function attachBookFlip() {
    const allBooks = document.querySelectorAll('.book-3d');

    allBooks.forEach(book => {
      // Skip if already has listener attached
      if (book.dataset.flipAttached) return;
      book.dataset.flipAttached = 'true';

      book.addEventListener('click', function(e) {
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

  // Load publications from JSON
  async function loadPublications() {
    try {
      const response = await fetch('assets/data/publications.json');
      if (!response.ok) {
        throw new Error('Failed to load publications');
      }
      PUBLICATIONS = await response.json();
      return true;
    } catch (error) {
      console.error('Error loading publications:', error);
      return false;
    }
  }

  // Re-render function for language changes
  function reRender() {
    renderHeroCarousel();
    renderGrid();
    setTimeout(() => {
      attachBookFlip();
    }, 100);
  }

  // Expose re-render globally
  window.reRenderPublications = reRender;

  // Initialize
  async function init() {
    // Load publications from JSON first
    const loaded = await loadPublications();
    if (!loaded) {
      console.error('Failed to initialize publications');
      return;
    }

    renderHeroCarousel();
    renderGrid();

    // Attach flip functionality
    setTimeout(() => {
      attachBookFlip();
    }, 100);

    // Listen for language changes
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
      langSelect.addEventListener('change', () => {
        setTimeout(reRender, 100);
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
