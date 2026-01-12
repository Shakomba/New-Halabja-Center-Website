(function() {
  'use strict';

  let DATA = null;
  let currentSurah = null;
  let audioElement = null;
  let currentLecture = null;
  let isPlaying = false;

  // Helper: Get current language
  function normalizeLang(value) {
    return (value || '').toLowerCase().split('-')[0];
  }

  function getCurrentLanguage() {
    const langSelect = document.getElementById('langSelect');
    if (langSelect && langSelect.value) {
      return normalizeLang(langSelect.value);
    }

    const docLang = normalizeLang(document.documentElement.lang);
    if (docLang) return docLang;

    try {
      const stored = normalizeLang(localStorage.getItem('nhc_lang'));
      if (stored) return stored;
    } catch (error) {
      // Ignore storage access issues
    }
    return 'en';
  }

  // Helper: Get translated value
  function getTranslatedValue(field, lang) {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[lang] || field['en'] || '';
  }

  // Helper: Get translation key
  function t(key) {
    const lang = getCurrentLanguage();
    return window.I18N?.[lang]?.[key] || key;
  }

  // Helper: Extract YouTube video ID from URL
  function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  }

  // Helper: Format time (seconds to MM:SS)
  function formatTime(seconds) {
    if (isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Load data from JSON
  async function loadData() {
    try {
      const response = await fetch('assets/data/tadabburi.json');
      DATA = await response.json();
      return true;
    } catch (error) {
      console.error('Error loading Tadabburi data:', error);
      return false;
    }
  }

  // Render Surah Grid
  function renderSurahGrid() {
    const container = document.getElementById('surahGrid');
    if (!container || !DATA) return;

    const lang = getCurrentLanguage();
    const juz = DATA.juzList[0]; // Only Juz 30
    const surahs = juz.surahs || [];

    if (surahs.length === 0) {
      container.innerHTML = `<p class="tadabburi-empty">${t('tadabburi.error')}</p>`;
      return;
    }

    container.innerHTML = surahs.map(surah => {
      // Surah names always in Arabic
      const name = getTranslatedValue(surah.name, 'ar');
      return `
        <article class="surah-card reveal" data-surah-id="${surah.surahNumber}">
          <div class="surah-number">${surah.surahNumber}</div>
          <h3 class="surah-name" lang="ar" dir="rtl">${name}</h3>
        </article>
      `;
    }).join('');

    // Attach click events
    container.querySelectorAll('.surah-card').forEach(card => {
      card.addEventListener('click', () => {
        const surahId = parseInt(card.dataset.surahId);
        const surah = surahs.find(s => s.surahNumber === surahId);
        if (surah) openSurahModal(surah);
      });

      // Keyboard support
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });

    // Trigger reveal animations
    setTimeout(() => {
      if (typeof window.setupReveal === 'function') {
        window.setupReveal();
      }
    }, 100);
  }

  // Open Surah Modal with lecture list
  function openSurahModal(surah) {
    const modal = document.getElementById('tadabburiModal');
    const title = document.getElementById('tadabburiModalTitle');
    const body = document.getElementById('tadabburiModalBody');

    if (!modal || !title || !body) return;

    currentSurah = surah;
    const lang = getCurrentLanguage();
    const surahName = getTranslatedValue(surah.name, 'ar');
    const lectures = surah.lectures || [];

    title.textContent = `${t('tadabburi.surah')} ${surah.surahNumber}: ${surahName}`;

    if (lectures.length === 0) {
      body.innerHTML = `<p class="tadabburi-no-lectures">${t('tadabburi.no_lectures')}</p>`;
    } else {
      body.innerHTML = `
        <div class="lecture-list">
          ${lectures.map(lecture => {
            const lectureTitle = getTranslatedValue(lecture.title, lang);
            return `
              <div class="lecture-item">
                <div class="lecture-title">${lectureTitle}</div>
                <div class="lecture-buttons">
                  <button class="lecture-btn watch-btn" data-lecture-id="${lecture.id}" data-video-url="${lecture.videoUrl}">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    ${t('tadabburi.modal.watch')}
                  </button>
                  <button class="lecture-btn listen-btn" data-lecture-id="${lecture.id}" data-audio-url="${lecture.audioUrl}" data-lecture-title="${lectureTitle}">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3v10.6l6 3.4-6-14zM12 3v10.6l-6 3.4 6-14z"/>
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    ${t('tadabburi.modal.listen')}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;

      // Attach event listeners
      body.querySelectorAll('.watch-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const videoUrl = btn.dataset.videoUrl;
          showVideoInModal(videoUrl);
        });
      });

      body.querySelectorAll('.listen-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const audioUrl = btn.dataset.audioUrl;
          const lectureTitle = btn.dataset.lectureTitle;
          const lecture = lectures.find(l => l.id === btn.dataset.lectureId);
          if (lecture) {
            loadAudio(lecture, lectureTitle);
          }
        });
      });
    }

    // Show modal
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus management
    const closeBtn = document.getElementById('tadabburiModalClose');
    if (closeBtn) closeBtn.focus();
  }

  // Show video embed in modal
  function showVideoInModal(videoUrl) {
    const body = document.getElementById('tadabburiModalBody');
    if (!body) return;

    const embedUrl = getYouTubeEmbedUrl(videoUrl);
    if (!embedUrl) {
      body.innerHTML = `<p class="tadabburi-error">${t('tadabburi.error')}</p>`;
      return;
    }

    body.innerHTML = `
      <div class="video-embed-container">
        <iframe
          src="${embedUrl}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
      </div>
      <button class="back-to-lectures-btn" id="backToLectures">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        ${t('tadabburi.modal.close')}
      </button>
    `;

    // Back button
    const backBtn = document.getElementById('backToLectures');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (currentSurah) openSurahModal(currentSurah);
      });
    }
  }

  // Close modal
  function closeSurahModal() {
    const modal = document.getElementById('tadabburiModal');
    if (!modal) return;

    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentSurah = null;
  }

  // Initialize Audio Player
  function initAudioPlayer() {
    audioElement = new Audio();

    audioElement.addEventListener('timeupdate', updateAudioProgress);
    audioElement.addEventListener('ended', onAudioEnded);
    audioElement.addEventListener('loadedmetadata', () => {
      updateAudioMeta();
    });

    // Play/Pause button
    const playPauseBtn = document.getElementById('audioPlayPause');
    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', togglePlayPause);
    }

    // Forward/Backward buttons
    const backwardBtn = document.getElementById('audioBackward');
    if (backwardBtn) {
      backwardBtn.addEventListener('click', () => seekBackward());
    }

    const forwardBtn = document.getElementById('audioForward');
    if (forwardBtn) {
      forwardBtn.addEventListener('click', () => seekForward());
    }

    // Speed selector
    const speedSelect = document.getElementById('audioSpeed');
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        if (audioElement) {
          audioElement.playbackRate = parseFloat(e.target.value);
        }
      });
    }

    // Progress bar click
    const progressBar = document.getElementById('audioProgressBar');
    if (progressBar) {
      progressBar.addEventListener('click', (e) => {
        if (!audioElement || !audioElement.duration) return;
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioElement.currentTime = percent * audioElement.duration;
      });
    }

    // Minimize button
    const minimizeBtn = document.getElementById('audioMinimize');
    if (minimizeBtn) {
      minimizeBtn.addEventListener('click', minimizePlayer);
    }

    // Close button
    const closeBtn = document.getElementById('audioClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', closePlayer);
    }
  }

  // Load and play audio
  function loadAudio(lecture, titleText) {
    if (!audioElement) return;

    currentLecture = lecture;
    audioElement.src = lecture.audioUrl;
    audioElement.load();

    const player = document.getElementById('audioPlayer');
    const titleEl = document.getElementById('audioPlayerTitle');

    if (player) {
      player.classList.remove('minimized');
      player.setAttribute('aria-hidden', 'false');
    }

    if (titleEl) {
      titleEl.textContent = titleText;
    }

    // Auto-play
    audioElement.play().then(() => {
      isPlaying = true;
      updatePlayPauseButton();
    }).catch(err => {
      console.error('Error playing audio:', err);
    });
  }

  // Toggle play/pause
  function togglePlayPause() {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
      isPlaying = false;
    } else {
      audioElement.play().then(() => {
        isPlaying = true;
      }).catch(err => {
        console.error('Error playing audio:', err);
      });
    }
    updatePlayPauseButton();
  }

  // Update play/pause button icon
  function updatePlayPauseButton() {
    const btn = document.getElementById('audioPlayPause');
    if (!btn) return;

    const playIcon = btn.querySelector('.play-icon');
    const pauseIcon = btn.querySelector('.pause-icon');

    if (isPlaying) {
      if (playIcon) playIcon.style.display = 'none';
      if (pauseIcon) pauseIcon.style.display = 'block';
      btn.setAttribute('aria-label', t('tadabburi.player.pause'));
    } else {
      if (playIcon) playIcon.style.display = 'block';
      if (pauseIcon) pauseIcon.style.display = 'none';
      btn.setAttribute('aria-label', t('tadabburi.player.play'));
    }
  }

  // Seek backward 10s
  function seekBackward() {
    if (!audioElement) return;
    audioElement.currentTime = Math.max(0, audioElement.currentTime - 10);
  }

  // Seek forward 10s
  function seekForward() {
    if (!audioElement) return;
    audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + 10);
  }

  // Update progress bar
  function updateAudioProgress() {
    if (!audioElement) return;

    const fill = document.getElementById('audioProgressFill');
    if (fill && audioElement.duration) {
      const percent = (audioElement.currentTime / audioElement.duration) * 100;
      fill.style.width = `${percent}%`;
    }

    updateAudioMeta();
  }

  // Update time meta
  function updateAudioMeta() {
    const meta = document.getElementById('audioPlayerMeta');
    if (!meta || !audioElement) return;

    const current = formatTime(audioElement.currentTime);
    const duration = formatTime(audioElement.duration);
    meta.textContent = `${current} / ${duration}`;
  }

  // Audio ended callback
  function onAudioEnded() {
    isPlaying = false;
    updatePlayPauseButton();
  }

  // Minimize player
  function minimizePlayer() {
    const player = document.getElementById('audioPlayer');
    if (player) {
      player.classList.add('minimized');
    }
  }

  // Expand minimized player
  function expandPlayer() {
    const player = document.getElementById('audioPlayer');
    if (player) {
      player.classList.remove('minimized');
    }
  }

  // Close player
  function closePlayer() {
    const player = document.getElementById('audioPlayer');
    if (player) {
      player.setAttribute('aria-hidden', 'true');
      player.classList.remove('minimized');
    }

    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }

    isPlaying = false;
    currentLecture = null;
    updatePlayPauseButton();
  }

  // Re-render on language change
  function reRender() {
    renderSurahGrid();

    // Update modal if open
    if (currentSurah) {
      openSurahModal(currentSurah);
    }
  }

  // Initialize
  async function init() {
    const loaded = await loadData();
    if (!loaded) {
      const container = document.getElementById('surahGrid');
      if (container) {
        container.innerHTML = `<p class="tadabburi-error">${t('tadabburi.error')}</p>`;
      }
      return;
    }

    // Set Telegram URL
    const telegramBtn = document.getElementById('telegramBtn');
    if (telegramBtn && DATA.telegramUrl) {
      telegramBtn.href = DATA.telegramUrl;
    }

    // Render grid
    renderSurahGrid();

    // Initialize audio player
    initAudioPlayer();

    // Modal close button
    const modalCloseBtn = document.getElementById('tadabburiModalClose');
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeSurahModal);
    }

    // Modal overlay click
    const modal = document.getElementById('tadabburiModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('tadabburi-modal-overlay')) {
          closeSurahModal();
        }
      });
    }

    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('tadabburiModal');
        if (modal && modal.classList.contains('open')) {
          closeSurahModal();
        }
      }
    });

    // Click minimized player to expand
    const player = document.getElementById('audioPlayer');
    if (player) {
      player.addEventListener('click', (e) => {
        if (player.classList.contains('minimized') && e.target === player) {
          expandPlayer();
        }
      });
    }

    // Language change listener
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
      langSelect.addEventListener('change', () => {
        localStorage.setItem('nhc_lang', langSelect.value);
        reRender();
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
