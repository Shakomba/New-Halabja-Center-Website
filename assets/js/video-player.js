(function () {
  'use strict';

  function buildPlayer(videoEl) {
    const src = videoEl.getAttribute('src') || videoEl.src || '';
    const poster = videoEl.getAttribute('poster') || '';

    const container = document.createElement('div');
    container.className = 'nhc-video-player';
    container.setAttribute('dir', 'ltr');

    const video = document.createElement('video');
    video.className = 'nhc-video-el';
    video.src = src;
    if (poster) video.poster = poster;
    video.preload = 'metadata';
    video.playsInline = true;

    const overlay = document.createElement('div');
    overlay.className = 'nhc-video-overlay';
    overlay.innerHTML = `
      <button class="nhc-big-play" aria-label="Play">
        <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
      </button>`;

    const controls = document.createElement('div');
    controls.className = 'nhc-video-controls';
    controls.innerHTML = `
      <div class="nhc-progress">
        <div class="nhc-progress-fill"></div>
      </div>
      <div class="nhc-ctrl-row">
        <div class="nhc-ctrl-left">
          <button class="nhc-btn nhc-play" aria-label="Play/Pause">
            <svg class="nhc-ico-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
            <svg class="nhc-ico-pause" viewBox="0 0 24 24" style="display:none"><path d="M6 4h4v16H6zm8 0h4v16h-4z" fill="currentColor"/></svg>
          </button>
          <span class="nhc-time">0:00 / 0:00</span>
        </div>
        <div class="nhc-ctrl-right">
          <button class="nhc-btn nhc-mute" aria-label="Mute">
            <svg class="nhc-ico-vol" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.04v8.05c1.48-.75 2.5-2.27 2.5-4.01z" fill="currentColor"/></svg>
            <svg class="nhc-ico-muted" viewBox="0 0 24 24" style="display:none"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.04v2.81l2.48 2.48c.02-.13.02-.26.02-.25zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73L19.73 21 21 19.73l-9-9L4.27 3z" fill="currentColor"/></svg>
          </button>
          <input class="nhc-volume" type="range" min="0" max="100" value="100" aria-label="Volume">
          <button class="nhc-btn nhc-fs" aria-label="Fullscreen">
            <svg class="nhc-ico-fs" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor"/></svg>
            <svg class="nhc-ico-exit-fs" viewBox="0 0 24 24" style="display:none"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" fill="currentColor"/></svg>
          </button>
        </div>
      </div>`;

    container.appendChild(video);
    container.appendChild(overlay);
    container.appendChild(controls);

    // Replace original element
    videoEl.parentNode.replaceChild(container, videoEl);

    wirePlayer(container, video, overlay, controls);
  }

  function wirePlayer(container, video, overlay, controls) {
    const bigPlay  = overlay.querySelector('.nhc-big-play');
    const playBtn  = controls.querySelector('.nhc-play');
    const icoPlay  = controls.querySelector('.nhc-ico-play');
    const icoPause = controls.querySelector('.nhc-ico-pause');
    const timeSpan = controls.querySelector('.nhc-time');
    const progress = controls.querySelector('.nhc-progress');
    const fill     = controls.querySelector('.nhc-progress-fill');
    const muteBtn  = controls.querySelector('.nhc-mute');
    const icoVol   = controls.querySelector('.nhc-ico-vol');
    const icoMuted = controls.querySelector('.nhc-ico-muted');
    const volSlider= controls.querySelector('.nhc-volume');
    const fsBtn    = controls.querySelector('.nhc-fs');
    const icoFs    = controls.querySelector('.nhc-ico-fs');
    const icoExitFs= controls.querySelector('.nhc-ico-exit-fs');

    let dragging = false;
    let lastVol = 1;
    let hideTimer = null;

    function fmt(s) {
      if (!isFinite(s)) return '0:00';
      const m = Math.floor(s / 60), ss = Math.floor(s % 60);
      return m + ':' + String(ss).padStart(2, '0');
    }

    function syncPlay() {
      const paused = video.paused;
      overlay.style.opacity = paused ? '1' : '0';
      overlay.style.pointerEvents = paused ? 'auto' : 'none';
      icoPlay.style.display  = paused ? '' : 'none';
      icoPause.style.display = paused ? 'none' : '';
      if (paused) {
        clearTimeout(hideTimer);
        controls.style.opacity = '0';
      }
    }

    function syncTime() {
      if (!dragging) {
        const pct = video.duration ? video.currentTime / video.duration * 100 : 0;
        fill.style.width = pct + '%';
      }
      timeSpan.textContent = fmt(video.currentTime) + ' / ' + fmt(video.duration);
    }

    function syncVol() {
      const muted = video.volume === 0;
      icoVol.style.display   = muted ? 'none' : '';
      icoMuted.style.display = muted ? '' : 'none';
      volSlider.value = video.volume * 100;
      const pct = Math.round(video.volume * 100);
      volSlider.style.background = `linear-gradient(to right, rgba(255,255,255,0.85) ${pct}%, rgba(255,255,255,0.2) ${pct}%)`;
    }

    function showControls() {
      if (video.paused) return;
      controls.style.opacity = '1';
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => { controls.style.opacity = '0'; }, 2500);
    }

    function seekAt(e) {
      const r = progress.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      const pct = Math.max(0, Math.min(1, (x - r.left) / r.width));
      video.currentTime = pct * (video.duration || 0);
      fill.style.width = pct * 100 + '%';
    }

    bigPlay.addEventListener('click', () => video.play());
    playBtn.addEventListener('click', () => video.paused ? video.play() : video.pause());
    video.addEventListener('click', () => video.paused ? video.play() : video.pause());
    video.addEventListener('play',  syncPlay);
    video.addEventListener('pause', syncPlay);
    video.addEventListener('ended', () => { video.pause(); video.currentTime = 0; });
    video.addEventListener('timeupdate', syncTime);
    video.addEventListener('loadedmetadata', syncTime);

    progress.addEventListener('mousedown',  e => { dragging = true; seekAt(e); });
    progress.addEventListener('touchstart', e => { dragging = true; seekAt(e); }, { passive: true });
    document.addEventListener('mousemove',  e => { if (dragging) seekAt(e); });
    document.addEventListener('touchmove',  e => { if (dragging) seekAt(e); }, { passive: true });
    document.addEventListener('mouseup',  () => { dragging = false; });
    document.addEventListener('touchend', () => { dragging = false; });

    muteBtn.addEventListener('click', () => {
      if (video.volume > 0) { lastVol = video.volume; video.volume = 0; }
      else { video.volume = lastVol || 1; }
      syncVol();
    });
    volSlider.addEventListener('input', e => { video.volume = e.target.value / 100; syncVol(); });

    fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) { if (container.requestFullscreen) container.requestFullscreen(); }
      else { if (document.exitFullscreen) document.exitFullscreen(); }
    });

    document.addEventListener('fullscreenchange', () => {
      const fs = document.fullscreenElement === container;
      container.classList.toggle('nhc-fullscreen', fs);
      icoFs.style.display    = fs ? 'none' : '';
      icoExitFs.style.display= fs ? '' : 'none';
    });

    container.addEventListener('mousemove', showControls);
    container.addEventListener('mouseenter', showControls);
    container.addEventListener('mouseleave', () => {
      if (!video.paused) controls.style.opacity = '0';
    });

    syncPlay();
    syncVol();
  }

  function initIn(root) {
    (root || document).querySelectorAll('video:not(.nhc-video-el)').forEach(buildPlayer);
  }

  // Observe dynamic modal content
  new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === 1) {
          if (node.tagName === 'VIDEO' && !node.classList.contains('nhc-video-el')) buildPlayer(node);
          else if (node.querySelectorAll) node.querySelectorAll('video:not(.nhc-video-el)').forEach(buildPlayer);
        }
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initIn());
  else initIn();

  window.nhcInitVideos = initIn;
})();
