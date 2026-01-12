/**
 * Tadabburi Quran (تەدەبوری قورئان)
 * Specialized media hub for Juz 30 Tafsir lectures
 * Features: Surah grid, modal lectures, persistent audio player
 */
(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // DOM REFERENCES
  // ═══════════════════════════════════════════════════════════════════════════
  const grid = document.getElementById('tadabburGrid');
  const modal = document.getElementById('tadabburModal');
  if (!grid || !modal) return;

  const modalTitle = document.getElementById('tadabburModalTitle');
  const modalNumber = document.getElementById('tadabburModalNumber');
  const lectureList = document.getElementById('tadabburLectureList');
  const videoWrap = document.getElementById('tadabburVideoWrap');
  const videoFrame = document.getElementById('tadabburVideoFrame');
  const modalClose = document.getElementById('tadabburModalClose');

  const player = document.getElementById('tadabburPlayer');
  const audio = document.getElementById('tadabburAudio');
  const playBtn = document.getElementById('tadabburPlay');
  const backBtn = document.getElementById('tadabburBack');
  const forwardBtn = document.getElementById('tadabburForward');
  const seek = document.getElementById('tadabburSeek');
  const timeCurrent = document.getElementById('tadabburTimeCurrent');
  const timeDuration = document.getElementById('tadabburTimeDuration');
  const speedSelect = document.getElementById('tadabburSpeed');
  const trackTitle = document.getElementById('tadabburTrackTitle');
  const trackSurah = document.getElementById('tadabburTrackSurah');
  const minimizeBtn = document.getElementById('tadabburMinimize');
  const bubbleBtn = document.getElementById('tadabburBubble');

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════
  let surahs = [];
  let currentSurah = null;
  let lastFocusedElement = null;

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Normalize language code (e.g., "en-US" -> "en")
   */
  function normalizeLang(value) {
    return (value || '').toLowerCase().split('-')[0];
  }

  /**
   * Get current language from selector or document
   */
  function getCurrentLanguage() {
    const langSelect = document.getElementById('langSelect');
    const selectLang = normalizeLang(langSelect && langSelect.value);
    const docLang = normalizeLang(document.documentElement.lang);
    return selectLang || docLang || 'en';
  }

  /**
   * Get translation from I18N object
   */
  function t(key) {
    const lang = getCurrentLanguage();
    return window.I18N?.[lang]?.[key] || window.I18N?.['en']?.[key] || key;
  }

  /**
   * Convert Western numerals to Arabic numerals
   */
  function toArabicNumerals(num) {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, (digit) => arabicNumerals[digit]);
  }

  /**
   * Format number based on language (Arabic numerals for AR/KU)
   */
  function formatNumber(num, lang) {
    if (lang === 'ar' || lang === 'ku') {
      return toArabicNumerals(num);
    }
    return String(num);
  }

  /**
   * Format seconds to MM:SS
   */
  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GRID RENDERING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Render the Surah grid with cards
   */
  function renderGrid() {
    const lang = getCurrentLanguage();
    grid.innerHTML = surahs.map((surah, index) => `
      <button class="tadabbur-card" type="button" data-surah-index="${index}" style="--i:${index}">
        <span class="tadabbur-card-number">${formatNumber(surah.surahNumber, lang)}</span>
        <span class="tadabbur-card-name" lang="ar">${surah.name}</span>
      </button>
    `).join('');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Render lecture list in modal
   */
  function renderLectures(surah) {
    const lang = getCurrentLanguage();
    modalTitle.textContent = surah.name;
    modalNumber.textContent = formatNumber(surah.surahNumber, lang);

    lectureList.innerHTML = surah.lectures.map((lecture, index) => `
      <div class="tadabbur-lecture" data-lecture-index="${index}">
        <div class="tadabbur-lecture-title">${lecture.title}</div>
        <div class="tadabbur-lecture-actions">
          <button class="tadabbur-btn tadabbur-btn-outline" type="button" data-action="video" ${!lecture.videoUrl ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
            <span aria-hidden="true">📹</span>
            <span>${t('tadabbur.btn.video')}</span>
          </button>
          <button class="tadabbur-btn tadabbur-btn-solid" type="button" data-action="audio" ${!lecture.audioUrl ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
            <span aria-hidden="true">🎧</span>
            <span>${t('tadabbur.btn.audio')}</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Open the modal for a Surah
   */
  function openModal(surah) {
    lastFocusedElement = document.activeElement;
    currentSurah = surah;
    renderLectures(surah);

    // Hide video section
    videoWrap.classList.remove('is-visible');
    videoFrame.src = '';

    // Show modal
    modal.classList.add('is-open');
    document.body.classList.add('tadabbur-modal-open');

    // Focus close button
    setTimeout(() => {
      modalClose.focus();
    }, 100);

    // Add keyboard listener
    document.addEventListener('keydown', handleModalKeydown);
  }

  /**
   * Close the modal
   */
  function closeModal() {
    modal.classList.remove('is-open');
    document.body.classList.remove('tadabbur-modal-open');

    // Stop video
    videoWrap.classList.remove('is-visible');
    videoFrame.src = '';

    // Remove keyboard listener
    document.removeEventListener('keydown', handleModalKeydown);

    // Restore focus
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  }

  /**
   * Handle keyboard events in modal
   */
  function handleModalKeydown(e) {
    if (e.key === 'Escape') {
      closeModal();
    }

    // Focus trap
    if (e.key === 'Tab') {
      const focusable = modal.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  /**
   * Show embedded video in modal
   */
  function showVideo(lecture) {
    if (!lecture.videoUrl) return;
    videoFrame.src = lecture.videoUrl;
    videoWrap.classList.add('is-visible');

    // Scroll video into view
    setTimeout(() => {
      videoWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIO PLAYER
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Update play/pause button state
   */
  function setPlayState(isPlaying) {
    if (!playBtn) return;
    playBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
    playBtn.innerHTML = isPlaying
      ? '<span aria-hidden="true">⏸</span>'
      : '<span aria-hidden="true">▶</span>';

    // Update bubble icon too
    if (bubbleBtn) {
      bubbleBtn.innerHTML = isPlaying
        ? '<span aria-hidden="true">⏸</span>'
        : '<span aria-hidden="true">▶</span>';
    }
  }

  /**
   * Start playing audio for a lecture
   */
  function startAudio(lecture, surah) {
    if (!audio || !lecture.audioUrl) return;

    audio.src = lecture.audioUrl;
    audio.playbackRate = parseFloat(speedSelect?.value || '1');
    audio.play().catch(() => {});

    // Update track info
    trackTitle.textContent = lecture.title;
    trackSurah.textContent = `${t('tadabbur.surah.label')} ${surah.name}`;

    // Show player
    player.classList.add('is-active');
    player.classList.remove('is-minimized');
    document.body.classList.add('tadabbur-player-active');

    setPlayState(true);

    // Close modal when starting audio
    closeModal();
  }

  /**
   * Update seek bar and time displays
   */
  function updateSeek() {
    if (!audio || !seek) return;

    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const currentTime = audio.currentTime || 0;

    seek.max = duration;
    seek.value = currentTime;

    // Update background fill for seek bar
    const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
    seek.style.background = `linear-gradient(to right, var(--tadabbur-gold) ${percent}%, rgba(255,255,255,0.2) ${percent}%)`;

    timeCurrent.textContent = formatTime(currentTime);
    timeDuration.textContent = formatTime(duration);
  }

  /**
   * Toggle play/pause
   */
  function togglePlay() {
    if (!audio || !audio.src) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }

  /**
   * Skip backward 10 seconds
   */
  function skipBack() {
    if (!audio) return;
    audio.currentTime = Math.max(0, (audio.currentTime || 0) - 10);
  }

  /**
   * Skip forward 10 seconds
   */
  function skipForward() {
    if (!audio) return;
    audio.currentTime = Math.min(audio.duration || 0, (audio.currentTime || 0) + 10);
  }

  /**
   * Minimize player to bubble
   */
  function minimizePlayer() {
    player.classList.add('is-minimized');
  }

  /**
   * Expand player from bubble
   */
  function expandPlayer() {
    player.classList.remove('is-minimized');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════════════════

  // Grid card clicks
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.tadabbur-card');
    if (!card) return;
    const index = Number(card.getAttribute('data-surah-index'));
    const surah = surahs[index];
    if (surah) openModal(surah);
  });

  // Lecture action buttons
  lectureList.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('[data-action]');
    if (!actionBtn || actionBtn.disabled || !currentSurah) return;

    const lectureEl = actionBtn.closest('.tadabbur-lecture');
    if (!lectureEl) return;

    const lectureIndex = Number(lectureEl.getAttribute('data-lecture-index'));
    const lecture = currentSurah.lectures[lectureIndex];
    if (!lecture) return;

    const action = actionBtn.getAttribute('data-action');
    if (action === 'video') {
      showVideo(lecture);
    } else if (action === 'audio') {
      startAudio(lecture, currentSurah);
    }
  });

  // Modal close button
  modalClose?.addEventListener('click', closeModal);

  // Modal backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Player controls
  playBtn?.addEventListener('click', togglePlay);
  backBtn?.addEventListener('click', skipBack);
  forwardBtn?.addEventListener('click', skipForward);

  // Seek bar
  seek?.addEventListener('input', () => {
    if (!audio) return;
    audio.currentTime = parseFloat(seek.value);
  });

  // Speed selector
  speedSelect?.addEventListener('change', () => {
    if (!audio) return;
    audio.playbackRate = parseFloat(speedSelect.value || '1');
  });

  // Minimize/expand player
  minimizeBtn?.addEventListener('click', minimizePlayer);
  bubbleBtn?.addEventListener('click', expandPlayer);

  // Audio element events
  audio?.addEventListener('timeupdate', updateSeek);
  audio?.addEventListener('loadedmetadata', updateSeek);
  audio?.addEventListener('play', () => setPlayState(true));
  audio?.addEventListener('pause', () => setPlayState(false));
  audio?.addEventListener('ended', () => setPlayState(false));

  // Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Only handle if player is active and no input is focused
    if (!player.classList.contains('is-active')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (modal.classList.contains('is-open')) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        skipBack();
        break;
      case 'ArrowRight':
        e.preventDefault();
        skipForward();
        break;
      case 'm':
      case 'M':
        if (player.classList.contains('is-minimized')) {
          expandPlayer();
        } else {
          minimizePlayer();
        }
        break;
    }
  });

  // Language change - re-render UI
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.addEventListener('change', () => {
      renderGrid();
      if (currentSurah && modal.classList.contains('is-open')) {
        renderLectures(currentSurah);
      }
      // Update track surah label if player is active
      if (player.classList.contains('is-active') && currentSurah) {
        trackSurah.textContent = `${t('tadabbur.surah.label')} ${currentSurah.name}`;
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════

  fetch('assets/data/tadabbur.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to load Tadabbur data');
      }
      return response.json();
    })
    .then((data) => {
      surahs = Array.isArray(data) ? data : [];
      renderGrid();
    })
    .catch((error) => {
      console.error('Tadabbur:', error);
      grid.innerHTML = `<p class="tadabbur-empty">${t('tadabbur.empty')}</p>`;
    });

})();
