/**
 * Native-style Lightbox Gallery
 * Features: Real-time sliding, eager loading, perfect vertical tracking, smooth physics
 */

window.openNativeLightbox = function(imageSrc, images, currentIndex) {
  const imageArray = Array.isArray(images) ? images : [imageSrc];
  let index = currentIndex !== null && currentIndex >= 0 ? currentIndex : 0;

  // Eager loading - preload ALL images immediately
  imageArray.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  // Create or get lightbox
  let lightbox = document.getElementById('nativeLightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.id = 'nativeLightbox';
    lightbox.className = 'native-lightbox';
    lightbox.innerHTML = `
      <button class="lightbox-close" aria-label="Close">&times;</button>
      <div class="lightbox-counter"></div>
      <button class="lightbox-prev" aria-label="Previous">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <button class="lightbox-next" aria-label="Next">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
      <div class="lightbox-slides-wrapper">
        <div class="lightbox-slides-track"></div>
      </div>
    `;
    document.body.appendChild(lightbox);
  }

  const slidesWrapper = lightbox.querySelector('.lightbox-slides-wrapper');
  const slidesTrack = lightbox.querySelector('.lightbox-slides-track');
  const counter = lightbox.querySelector('.lightbox-counter');
  const closeBtn = lightbox.querySelector('.lightbox-close');
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');

  // Build slides
  slidesTrack.innerHTML = imageArray.map((src, i) => `
    <div class="lightbox-slide" data-index="${i}">
      <div class="lightbox-slide-content">
        <img src="${src}" alt="Image ${i + 1}" />
      </div>
    </div>
  `).join('');

  const slides = slidesTrack.querySelectorAll('.lightbox-slide');
  const slideWidth = window.innerWidth;

  // State
  let currentTranslateX = -index * slideWidth;
  let startX = 0, startY = 0;
  let currentX = 0, currentY = 0;
  let isDragging = false;
  let isVerticalDrag = false;
  let isHorizontalDrag = false;
  let scale = 1;
  const CLOSE_THRESHOLD = 80;
  const SWIPE_THRESHOLD = 40;

  const updateSlidePosition = (animated = true) => {
    if (animated) {
      slidesTrack.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
    } else {
      slidesTrack.style.transition = 'none';
    }
    slidesTrack.style.transform = `translateX(${currentTranslateX}px)`;
  };

  const updateCounter = () => {
    if (imageArray.length > 1) {
      counter.textContent = `${index + 1}/${imageArray.length}`;
      counter.style.display = 'block';
    } else {
      counter.style.display = 'none';
    }
  };

  const goToSlide = (newIndex) => {
    index = Math.max(0, Math.min(imageArray.length - 1, newIndex));
    currentTranslateX = -index * slideWidth;
    updateSlidePosition(true);
    updateCounter();
  };

  // Arrow buttons
  const isMobile = window.innerWidth <= 768;
  if (imageArray.length > 1 && !isMobile) {
    prevBtn.style.display = 'flex';
    nextBtn.style.display = 'flex';
    prevBtn.onclick = () => goToSlide(index - 1);
    nextBtn.onclick = () => goToSlide(index + 1);
  } else {
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';
  }

  // Touch gestures
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;

    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
    isVerticalDrag = false;
    isHorizontalDrag = false;

    slidesTrack.style.transition = 'none';
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;

    currentX = e.touches[0].clientX;
    currentY = e.touches[0].clientY;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    // Determine drag direction (lower threshold for lighter feel)
    if (!isVerticalDrag && !isHorizontalDrag) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 3) {
        isVerticalDrag = true;
      } else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 3) {
        isHorizontalDrag = true;
      }
    }

    // Vertical drag - close gesture with 1:1 tracking
    if (isVerticalDrag && scale === 1) {
      e.preventDefault();
      const progress = deltaY;
      const opacity = 1 - (Math.abs(progress) / 400);

      slidesWrapper.style.transform = `translateY(${progress}px)`;
      lightbox.style.backgroundColor = `rgba(0,0,0,${0.92 * opacity})`;
      slidesWrapper.style.opacity = Math.max(0.5, opacity);
    }

    // Horizontal drag - slide between images with real-time tracking
    else if (isHorizontalDrag && imageArray.length > 1 && scale === 1) {
      e.preventDefault();
      const newTranslateX = currentTranslateX + deltaX;
      slidesTrack.style.transform = `translateX(${newTranslateX}px)`;
    }
  };

  const handleTouchEnd = (e) => {
    if (!isDragging) return;
    isDragging = false;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    // Vertical release - close if past threshold
    if (isVerticalDrag) {
      if (Math.abs(deltaY) > CLOSE_THRESHOLD) {
        closeLightbox();
      } else {
        // Snap back to center with spring animation
        slidesWrapper.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';
        slidesWrapper.style.transform = 'translateY(0)';
        slidesWrapper.style.opacity = '1';
        lightbox.style.backgroundColor = '';

        setTimeout(() => {
          slidesWrapper.style.transition = '';
        }, 300);
      }
    }

    // Horizontal release - snap to nearest slide
    else if (isHorizontalDrag && imageArray.length > 1) {
      if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
        // Swipe detected
        if (deltaX > 0 && index > 0) {
          goToSlide(index - 1);
        } else if (deltaX < 0 && index < imageArray.length - 1) {
          goToSlide(index + 1);
        } else {
          // Bounce back - can't go further
          updateSlidePosition(true);
        }
      } else {
        // Didn't swipe far enough - snap back
        updateSlidePosition(true);
      }
    }

    isVerticalDrag = false;
    isHorizontalDrag = false;
  };

  slidesWrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
  slidesWrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
  slidesWrapper.addEventListener('touchend', handleTouchEnd);

  // Close lightbox
  const closeLightbox = () => {
    lightbox.style.transition = 'opacity 0.25s ease';
    lightbox.style.opacity = '0';

    setTimeout(() => {
      lightbox.classList.remove('active');
      lightbox.style.transition = '';
      lightbox.style.opacity = '';
    }, 250);

    document.body.style.overflow = '';

    // Clean URL
    const url = new URL(window.location.href);
    url.searchParams.delete('lightbox');
    history.replaceState(null, '', url.pathname + (url.search || ''));

    // Cleanup
    slidesWrapper.removeEventListener('touchstart', handleTouchStart);
    slidesWrapper.removeEventListener('touchmove', handleTouchMove);
    slidesWrapper.removeEventListener('touchend', handleTouchEnd);
    window.removeEventListener('popstate', handlePopState);
    document.removeEventListener('keydown', handleKeydown);
  };

  closeBtn.onclick = closeLightbox;
  lightbox.onclick = (e) => {
    if (e.target === lightbox) closeLightbox();
  };

  // Back button support
  const handlePopState = () => {
    if (lightbox.classList.contains('active')) {
      closeLightbox();
    }
  };
  window.addEventListener('popstate', handlePopState);

  // Keyboard
  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      goToSlide(index - 1);
    } else if (e.key === 'ArrowRight' && index < imageArray.length - 1) {
      goToSlide(index + 1);
    }
  };
  document.addEventListener('keydown', handleKeydown);

  // Initialize
  updateSlidePosition(false);
  updateCounter();

  // Reset wrapper position to center (fixes issue where it opens at top/bottom)
  slidesWrapper.style.transform = 'translateY(0)';
  slidesWrapper.style.opacity = '1';
  slidesWrapper.style.transition = '';
  lightbox.style.backgroundColor = '';

  // Fade in
  lightbox.style.opacity = '0';
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';

  requestAnimationFrame(() => {
    lightbox.style.transition = 'opacity 0.3s ease';
    lightbox.style.opacity = '1';
  });

  // Push state
  const currentUrl = window.location.href;
  history.pushState({ lightboxOpen: true }, '', currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'lightbox=open');
};
