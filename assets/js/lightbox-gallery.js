(function () {
  'use strict';

  let lightbox = null;
  let track = null;
  let counter = null;
  let prevBtn = null;
  let nextBtn = null;
  let closeBtn = null;
  let slidesWrapper = null;

  let images = [];
  let index = 0;

  let touchStartX = 0;
  let touchStartY = 0;
  let hasTouchStart = false;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function safeSrc(src) {
    if (!src) return '';
    return String(src).replace(/"/g, '&quot;');
  }

  function ensureLightbox() {
    if (lightbox) return;

    lightbox = document.createElement('div');
    lightbox.id = 'nativeLightbox';
    lightbox.className = 'native-lightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = [
      '<button class="lightbox-close" aria-label="Close">&times;</button>',
      '<div class="lightbox-counter"></div>',
      '<button class="lightbox-prev" aria-label="Previous">',
      '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">',
      '    <path d="M15 18l-6-6 6-6"/>',
      '  </svg>',
      '</button>',
      '<button class="lightbox-next" aria-label="Next">',
      '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">',
      '    <path d="M9 18l6-6-6-6"/>',
      '  </svg>',
      '</button>',
      '<div class="lightbox-slides-wrapper">',
      '  <div class="lightbox-slides-track"></div>',
      '</div>'
    ].join('');

    document.body.appendChild(lightbox);

    track = lightbox.querySelector('.lightbox-slides-track');
    counter = lightbox.querySelector('.lightbox-counter');
    prevBtn = lightbox.querySelector('.lightbox-prev');
    nextBtn = lightbox.querySelector('.lightbox-next');
    closeBtn = lightbox.querySelector('.lightbox-close');
    slidesWrapper = lightbox.querySelector('.lightbox-slides-wrapper');

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', function () { goTo(index - 1); });
    nextBtn.addEventListener('click', function () { goTo(index + 1); });

    lightbox.addEventListener('click', function (e) {
      if (e.target.closest('.lightbox-close, .lightbox-prev, .lightbox-next')) return;
      if (e.target.closest('.lightbox-slide-content, .lightbox-slide img')) return;
      closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goTo(index - 1);
      if (e.key === 'ArrowRight') goTo(index + 1);
    });

    slidesWrapper.addEventListener('touchstart', function (e) {
      if (!e.touches || e.touches.length !== 1) return;
      hasTouchStart = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    slidesWrapper.addEventListener('touchend', function (e) {
      if (!hasTouchStart || !e.changedTouches || e.changedTouches.length !== 1) return;
      hasTouchStart = false;

      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;

      // Horizontal swipe only
      if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 45) return;
      if (dx > 0) goTo(index - 1);
      else goTo(index + 1);
    }, { passive: true });
  }

  function renderSlides() {
    if (!track) return;
    track.innerHTML = images.map(function (src, i) {
      return [
        '<div class="lightbox-slide" data-index="' + i + '">',
        '  <div class="lightbox-slide-content">',
        '    <img src="' + safeSrc(src) + '" alt="Image ' + (i + 1) + '" />',
        '  </div>',
        '</div>'
      ].join('');
    }).join('');
  }

  function updateUi() {
    if (!track) return;

    const total = images.length;
    const clamped = clamp(index, 0, Math.max(0, total - 1));
    if (clamped !== index) index = clamped;

    track.style.transition = 'transform 0.25s ease';
    track.style.transform = 'translateX(' + (-index * 100) + 'vw)';

    if (counter) {
      if (total > 1) {
        counter.style.display = 'block';
        counter.textContent = (index + 1) + '/' + total;
      } else {
        counter.style.display = 'none';
      }
    }

    const showNav = total > 1;
    if (prevBtn) prevBtn.style.display = showNav ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = showNav ? 'flex' : 'none';
  }

  function goTo(newIndex) {
    if (!images.length || !lightbox || !lightbox.classList.contains('active')) return;
    index = clamp(newIndex, 0, images.length - 1);
    updateUi();
  }

  function openLightbox(startIndex) {
    if (!lightbox) return;

    index = clamp(startIndex, 0, images.length - 1);
    renderSlides();
    updateUi();

    lightbox.style.opacity = '0';
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(function () {
      lightbox.style.transition = 'opacity 0.25s ease';
      lightbox.style.opacity = '1';
    });
  }

  function closeLightbox() {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    lightbox.style.opacity = '0';
    setTimeout(function () {
      if (!lightbox) return;
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
      lightbox.style.transition = '';
      lightbox.style.opacity = '';
      document.body.style.overflow = '';
    }, 220);
  }

  window.openNativeLightbox = function (imageSrc, allImages, currentIndex) {
    try {
      const list = Array.isArray(allImages) && allImages.length
        ? allImages.filter(Boolean)
        : [imageSrc].filter(Boolean);

      if (!list.length) return;

      ensureLightbox();
      images = list;

      const requested = Number.isInteger(currentIndex) ? currentIndex : 0;
      openLightbox(requested);
    } catch (error) {
      console.error('Failed to open native lightbox:', error);
      if (imageSrc) window.open(imageSrc, '_blank', 'noopener');
    }
  };
})();
