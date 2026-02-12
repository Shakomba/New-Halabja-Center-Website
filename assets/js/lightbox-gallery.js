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
  let dragAxis = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  const HORIZONTAL_SWIPE_THRESHOLD = 45;
  const VERTICAL_CLOSE_THRESHOLD = 70;
  const TOUCH_AXIS_LOCK_THRESHOLD = 8;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function safeSrc(src) {
    if (!src) return '';
    return String(src).replace(/"/g, '&quot;');
  }

  function normalizeSrc(src) {
    if (!src) return '';
    return String(src).trim().replace(/\\/g, '/');
  }

  function getSlideWidth() {
    if (slidesWrapper && slidesWrapper.clientWidth > 0) return slidesWrapper.clientWidth;
    return Math.max(window.innerWidth || 1, 1);
  }

  function applySlideMetrics() {
    if (!track) return;
    const slideWidth = getSlideWidth();
    const slides = track.querySelectorAll('.lightbox-slide');
    slides.forEach(function (slide) {
      slide.style.width = slideWidth + 'px';
      slide.style.flexBasis = slideWidth + 'px';
    });
    track.style.width = (slideWidth * Math.max(images.length, 1)) + 'px';
  }

  function setTrackTransform(offsetPx, animate) {
    if (!track) return;
    if (animate) track.classList.remove('no-transition');
    else track.classList.add('no-transition');
    track.style.transform = 'translate3d(' + offsetPx + 'px, 0, 0)';
  }

  function resetDragVisuals(animate) {
    if (!slidesWrapper || !lightbox) return;
    if (animate) {
      slidesWrapper.style.transition = 'transform 0.22s ease';
      lightbox.style.transition = 'opacity 0.22s ease';
    } else {
      slidesWrapper.style.transition = '';
      lightbox.style.transition = '';
    }
    slidesWrapper.style.transform = 'translate3d(0, 0, 0)';
    lightbox.style.opacity = '1';
    if (animate) {
      setTimeout(function () {
        if (!slidesWrapper || !lightbox) return;
        slidesWrapper.style.transition = '';
        lightbox.style.transition = '';
      }, 230);
    }
  }

  function ensureLightbox() {
    if (lightbox) return;

    lightbox = document.createElement('div');
    lightbox.id = 'nativeLightbox';
    lightbox.className = 'native-lightbox';
    // Keep slider math consistent across site languages by isolating from page RTL direction.
    lightbox.setAttribute('dir', 'ltr');
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
    if (slidesWrapper) slidesWrapper.style.direction = 'ltr';
    if (track) track.style.direction = 'ltr';

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
    window.addEventListener('resize', function () {
      if (!lightbox || !lightbox.classList.contains('active')) return;
      updateUi();
    });

    slidesWrapper.addEventListener('touchstart', function (e) {
      if (!lightbox.classList.contains('active')) return;
      if (!e.touches || e.touches.length !== 1) return;
      hasTouchStart = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      dragAxis = null;
      dragOffsetX = 0;
      dragOffsetY = 0;
      setTrackTransform(-index * getSlideWidth(), false);
    }, { passive: true });

    slidesWrapper.addEventListener('touchmove', function (e) {
      if (!hasTouchStart || !e.touches || e.touches.length !== 1) return;

      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;

      if (!dragAxis) {
        if (Math.abs(dx) < TOUCH_AXIS_LOCK_THRESHOLD && Math.abs(dy) < TOUCH_AXIS_LOCK_THRESHOLD) return;
        dragAxis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
      }

      if (dragAxis === 'x') {
        e.preventDefault();
        dragOffsetX = dx;
        if ((index === 0 && dragOffsetX > 0) || (index === images.length - 1 && dragOffsetX < 0)) {
          dragOffsetX *= 0.35;
        }
        setTrackTransform((-index * getSlideWidth()) + dragOffsetX, false);
        return;
      }

      e.preventDefault();
      dragOffsetY = dy;
      const fade = clamp(1 - (Math.abs(dragOffsetY) / (window.innerHeight * 0.9)), 0.55, 1);
      slidesWrapper.style.transform = 'translate3d(0, ' + dragOffsetY + 'px, 0)';
      lightbox.style.opacity = String(fade);
    }, { passive: false });

    slidesWrapper.addEventListener('touchend', function (e) {
      if (!hasTouchStart || !e.changedTouches || e.changedTouches.length !== 1) return;
      hasTouchStart = false;

      if (dragAxis === 'x') {
        const target = Math.abs(dragOffsetX) >= HORIZONTAL_SWIPE_THRESHOLD
          ? (dragOffsetX > 0 ? index - 1 : index + 1)
          : index;
        dragAxis = null;
        dragOffsetX = 0;
        goTo(target);
        return;
      }

      if (dragAxis === 'y') {
        const shouldClose = Math.abs(dragOffsetY) >= VERTICAL_CLOSE_THRESHOLD;
        if (shouldClose) {
          closeLightbox({ preserveSwipeState: true });
          return;
        }
        dragAxis = null;
        dragOffsetY = 0;
        resetDragVisuals(true);
      }
    }, { passive: true });

    slidesWrapper.addEventListener('touchcancel', function () {
      hasTouchStart = false;
      dragAxis = null;
      dragOffsetX = 0;
      dragOffsetY = 0;
      resetDragVisuals(true);
      updateUi(true);
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

    const slideImages = track.querySelectorAll('img');
    slideImages.forEach(function (img) {
      img.addEventListener('error', function () {
        const current = normalizeSrc(img.getAttribute('src'));
        if (!current) return;
        if (img.dataset.retryDone === '1') return;
        img.dataset.retryDone = '1';
        const encoded = encodeURI(current).replace(/%2F/g, '/');
        if (encoded && encoded !== current) {
          img.src = encoded;
          return;
        }
        if (!/^https?:\/\//i.test(current) && !/^data:/i.test(current) && !current.startsWith('/')) {
          img.src = './' + current;
        }
      }, { once: true });
    });

    applySlideMetrics();
  }

  function updateUi(animate) {
    if (!track) return;

    const total = images.length;
    const clamped = clamp(index, 0, Math.max(0, total - 1));
    if (clamped !== index) index = clamped;
    applySlideMetrics();

    const shouldAnimate = animate !== false;
    setTrackTransform(-index * getSlideWidth(), shouldAnimate);

    if (counter) {
      if (total > 1) {
        counter.style.display = 'block';
        counter.textContent = (index + 1) + ' / ' + total;
      } else {
        counter.style.display = 'none';
      }
    }

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const showNav = total > 1 && !isMobile;
    const atStart = index <= 0;
    const atEnd = index >= Math.max(0, total - 1);

    if (prevBtn) {
      prevBtn.style.display = showNav ? 'flex' : 'none';
      prevBtn.disabled = !showNav || atStart;
      prevBtn.setAttribute('aria-disabled', prevBtn.disabled ? 'true' : 'false');
    }

    if (nextBtn) {
      nextBtn.style.display = showNav ? 'flex' : 'none';
      nextBtn.disabled = !showNav || atEnd;
      nextBtn.setAttribute('aria-disabled', nextBtn.disabled ? 'true' : 'false');
    }
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
    lightbox.style.opacity = '0';
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(function () {
      resetDragVisuals(false);
      updateUi(false);
      lightbox.style.transition = 'opacity 0.25s ease';
      lightbox.style.opacity = '1';
    });
  }

  function closeLightbox(options) {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    const preserveSwipeState = Boolean(options && options.preserveSwipeState);
    hasTouchStart = false;
    if (!preserveSwipeState) {
      dragAxis = null;
      dragOffsetX = 0;
      dragOffsetY = 0;
      resetDragVisuals(false);
    }
    lightbox.style.opacity = '0';
    setTimeout(function () {
      if (!lightbox) return;
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
      dragAxis = null;
      dragOffsetX = 0;
      dragOffsetY = 0;
      resetDragVisuals(false);
      lightbox.style.transition = '';
      lightbox.style.opacity = '';
      document.body.style.overflow = '';
    }, 220);
  }

  window.openNativeLightbox = function (imageSrc, allImages, currentIndex) {
    try {
      const list = Array.isArray(allImages) && allImages.length
        ? allImages.map(normalizeSrc).filter(Boolean)
        : [normalizeSrc(imageSrc)].filter(Boolean);

      if (!list.length) return;

      ensureLightbox();
      images = list;

      const requestedRaw = Number(currentIndex);
      const requested = Number.isFinite(requestedRaw) ? Math.trunc(requestedRaw) : 0;
      openLightbox(requested);
    } catch (error) {
      console.error('Failed to open native lightbox:', error);
      if (imageSrc) window.open(imageSrc, '_blank', 'noopener');
    }
  };
})();
