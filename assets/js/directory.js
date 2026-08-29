/* ============================================================
   directory.js — Achievements V2: sidebar + cards + global search
   ============================================================ */
const directoryInit = () => {
  let categoriesData = [];
  let activeCategory = null;
  let isSearching = false;

  const getEl = (id) => document.getElementById(id);
  const searchInput = getEl('dirSearchInput');
  const cardGrid = getEl('dirCardGrid');
  const sidebarNav = getEl('dirSidebarNav');
  const sidebar = getEl('dirSidebar');
  const fab = getEl('dirFab');
  const overlay = getEl('dirDrawerOverlay');
  const emptyState = getEl('dirEmptyState');
  const loadingState = getEl('dirLoading');

  const getCurrentLang = () => document.documentElement.lang || 'ku';

  /* ── Bio modal elements ────────────────────────────── */
  const bioModal      = getEl('dirBioModal');
  const bioPhotoWrap  = getEl('dirBioPhotoWrap');
  const bioPhoto      = getEl('dirBioPhoto');
  const bioName       = getEl('dirBioName');
  const bioInfo       = getEl('dirBioInfo');
  const bioCerts      = getEl('dirBioCerts');
  const bioClose      = getEl('dirBioClose');

  /* ── Fullscreen modal elements ──────────────────────── */
  const fsModal       = getEl('dirFullscreenModal');
  const fsPhoto       = getEl('dirFsPhoto');
  const fsClose       = getEl('dirFsClose');

  /* ── Bio modal label lookup ────────────────────────── */
  const bioLabels = {
    ku: { birthDate: 'بەرواری لەدایکبوون', job: 'پیشە', degree: 'بروانامە', certs: 'بروانامەکان' },
    ar: { birthDate: 'تاريخ الميلاد',       job: 'المهنة', degree: 'الشهادة',    certs: 'الشهادات' },
    en: { birthDate: 'Date of Birth',        job: 'Profession', degree: 'Degree', certs: 'Certificates' }
  };

  /* ── i18n helpers ──────────────────────────────────── */
  const t = (field, lang) => {
    lang = lang || getCurrentLang();
    if (!field) return '';
    if (typeof field === 'string' || typeof field === 'number') return String(field);
    if (typeof field !== 'object') return '';
    return field[lang] || field.en || Object.values(field).find(v => typeof v === 'string') || '';
  };

  const i18n = (key) => {
    const lang = getCurrentLang();
    return (window.I18N && window.I18N[lang] && window.I18N[lang][key]) || '';
  };

  const translatePlaceholder = () => {
    if (!searchInput) return;
    const key = searchInput.getAttribute('data-i18n-placeholder');
    if (key) {
      const text = i18n(key);
      if (text) searchInput.placeholder = text;
    }
  };

  /* ── Search normalizer ─────────────────────────────── */
  const normalize = (value) => {
    return String(value || '')
      // Normalize Eastern Arabic (٠-٩) and Persian/Kurdish (۰-۹) digits to ASCII
      .replace(/[٠-٩]/g, d => d.charCodeAt(0) - 0x0660)
      .replace(/[۰-۹]/g, d => d.charCodeAt(0) - 0x06F0)
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
      .replace(/[\u0640]/g, '')
      .replace(/[آأإٱ]/g, 'ا')
      .replace(/[ؤ]/g, 'و')
      .replace(/[ئ]/g, 'ي')
      .replace(/[ىیۍێ]/g, 'ي')
      .replace(/[كک]/g, 'ك')
      .replace(/[ةۀ]/g, 'ه')
      .replace(/[\u200c\u200d\u200e\u200f]/g, '')
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, ' ')
      .trim();
  };

  /* ── Render sidebar (desktop) ──────────────────────── */
  const renderSidebar = () => {
    if (!sidebarNav) return;
    const lang = getCurrentLang();
    sidebarNav.innerHTML = '';

    categoriesData.forEach(cat => {
      const link = document.createElement('button');
      link.className = 'dir-sidebar-link' +
        (!isSearching && cat.id === activeCategory ? ' active' : '') +
        (isSearching ? ' searching' : '');
      link.setAttribute('data-cat', cat.id);
      link.type = 'button';

      const name = t(cat.name, lang);
      const count = (cat.members || []).length;

      link.innerHTML = `<span class="dir-sidebar-name">${name}</span><span class="dir-sidebar-count">${count}</span>`;

      link.addEventListener('click', () => {
        activeCategory = cat.id;
        isSearching = false;
        if (searchInput) searchInput.value = '';
        if (sidebar && sidebar.classList.contains('drawer-open')) {
          sidebar.classList.remove('drawer-open');
          if (overlay) overlay.classList.remove('show');
        }
        render();
      });

      sidebarNav.appendChild(link);
    });
  };

  /* ── Find bio by name ──────────────────────────────── */
  const getBioByName = (nameStr, lang) => {
    for (const cat of categoriesData) {
      for (const m of (cat.members || [])) {
        if (t(m.name, lang) === nameStr && m.bio) {
          return m.bio;
        }
      }
    }
    return null;
  };

  /* ── Build card HTML ───────────────────────────────── */
  const buildCard = (member, categoryName, categoryId, showCategory) => {
    const lang = getCurrentLang();
    const name = t(member.name, lang);
    const dateStr = member.date || '—';

    const certNumHTML = categoryId === 'ten-qiraat' ? '' : `<div class="dir-card-certnum">${member.certNumber || '؟'}</div>`;

    let displayedCategoryName = categoryName;
    if (categoryId === 'ten-qiraat' && member.certNumber) {
      displayedCategoryName += ` #${member.certNumber}`;
    }

    const categoryBadge = showCategory
      ? `<span class="dir-card-category" data-cat-id="${categoryId}">${displayedCategoryName}</span>`
      : '';

    const hasBio = !!(member.bio || getBioByName(name, lang));
    return `<article class="dir-card${hasBio ? ' dir-card-bio' : ''}"${hasBio ? ` data-bio="1" data-cat-id="${categoryId}"` : ''}>
      ${certNumHTML}
      <div class="dir-card-name">${name}</div>
      <div class="dir-card-date">${dateStr}</div>
      ${categoryBadge}
    </article>`;
  };

  const buildGroupedCard = (member, certificates) => {
    const lang = getCurrentLang();
    const name = t(member.name, lang);
    
    let certsHtml = '<div class="dir-card-certs-list">';
    certificates.forEach(c => {
       let label = c.categoryName || '';
       label = label.replace(/(?:مۆڵەتی?|بڕوانامەی?|إجازة|شهادة|License|Certificate)\s*/ig, '').trim();
       if (c.certNumber) {
         label += ` #${c.certNumber}`;
       }
       certsHtml += `<span class="dir-card-category" data-cat-id="${c.categoryId}">${label}</span>`;
    });
    certsHtml += '</div>';

    const multiClass = certificates.length > 1 ? ' dir-card-multi' : '';
    const hasBio = !!(member.bio || getBioByName(name, lang));
    const bioAttr = hasBio ? ' data-bio="1"' : '';
    return `<article class="dir-card dir-card-grouped${multiClass}${hasBio ? ' dir-card-bio' : ''}"${bioAttr}>
      <div class="dir-card-name">${name}</div>
      ${certsHtml}
    </article>`;
  };

  /* ── Get cards to display ──────────────────────────── */
  const getDisplayCards = () => {
    const lang = getCurrentLang();
    const term = searchInput ? searchInput.value.trim() : '';
    const normalizedTerm = normalize(term);

    if (normalizedTerm) {
      // Global search across all categories — check ALL language variants
      isSearching = true;
      const tokens = normalizedTerm.split(/\s+/).filter(Boolean);
      const groupedResults = {};

      categoriesData.forEach(cat => {
        const catName = t(cat.name, lang);
        (cat.members || []).forEach(m => {
          // Build haystack from ALL languages of the name + cert + date
          const nameVariants = typeof m.name === 'object'
            ? Object.values(m.name).join(' ')
            : String(m.name || '');
          const searchableCert = m.certNumber || '';
          const haystack = normalize(
            [nameVariants, searchableCert, m.date || ''].join(' ')
          );
          if (tokens.every(tok => haystack.includes(tok))) {
            const studentKey = typeof m.name === 'object' ? (m.name.ku || m.name.en || m.name.ar || String(m.name)) : String(m.name);
            
            if (!groupedResults[studentKey]) {
                groupedResults[studentKey] = {
                    member: m,
                    certificates: []
                };
            }
            
let cName = m.customLabel ? t(m.customLabel, lang) : catName;
        // let cName alone, certNumber will render normally
            
            groupedResults[studentKey].certificates.push({
                categoryName: cName,
                categoryId: cat.id,
                certNumber: m.certNumber,
                date: m.date
            });
          }
        });
      });

      return { cards: Object.values(groupedResults), showCategory: true };
    } else {
      // Show active category
      isSearching = false;
      const cat = categoriesData.find(c => c.id === activeCategory);
      if (!cat) return { cards: [], showCategory: false };
      const catName = t(cat.name, lang);
      return {
        cards: (cat.members || []).map(m => {
          let cName = m.customLabel ? t(m.customLabel, lang) : catName;
          return {
            member: m,
            categoryName: cName,
            categoryId: cat.id
          };
        }),
        showCategory: cat.id === 'ten-qiraat' || (cat.members || []).some(m => !!m.customLabel)
      };
    }
  };

  /* ── Open Bio Modal ────────────────────────────────── */
  const openBioModal = (member, allCertsForMember) => {
    if (!bioModal) return;
    const lang = getCurrentLang();
    const labels = bioLabels[lang] || bioLabels.en;

    // Name
    bioName.textContent = t(member.name, lang);

    // Photo — show only if present
    const photo = member.bio && member.bio.photo;

    // Always clear the previous image immediately so the old photo is never
    // visible while the new one is downloading. We never move bioPhoto out of
    // the DOM (innerHTML = '' would detach it and kill the onload handler).
    bioPhoto.onload = null;
    bioPhoto.onerror = null;
    bioPhoto.style.transition = 'none';
    bioPhoto.style.opacity = '0';
    bioPhoto.removeAttribute('src');

    if (photo) {
      bioPhotoWrap.hidden = false;
      bioPhoto.alt = t(member.name, lang);

      if (photo.includes('placeholder-')) {
        bioPhotoWrap.classList.remove('dir-is-clickable');
      } else {
        bioPhotoWrap.classList.add('dir-is-clickable');
      }

      // Set handlers before src so they fire even for cached images
      bioPhoto.onload  = () => {
        bioPhoto.style.transition = 'opacity 0.2s ease';
        bioPhoto.style.opacity = '1';
      };
      bioPhoto.onerror = () => {
        bioPhoto.style.transition = 'none';
        bioPhoto.style.opacity = '1';
      };

      // Setting src last triggers the actual load
      bioPhoto.src = photo;
    } else {
      bioPhotoWrap.hidden = true;
    }

    // Info rows
    const infoFields = ['birthDate', 'job', 'degree'];
    const icons = {
      birthDate: `<svg class="dir-bio-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
      job:       `<svg class="dir-bio-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`,
      degree:    `<svg class="dir-bio-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>`
    };
    let infoHtml = '';
    if (member.bio) {
      infoFields.forEach(field => {
        const val = t(member.bio[field], lang);
        if (val) {
          infoHtml += `<div class="dir-bio-row">
            ${icons[field]}
            <span class="dir-bio-row-label">${labels[field]}</span>
            <span>${val}</span>
          </div>`;
        }
      });
    }
    bioInfo.innerHTML = infoHtml;

    // Certificates
    let certsHtml = '';
    if (allCertsForMember.length > 0) {
      certsHtml += `<div class="dir-bio-certs-title">${labels.certs}</div>`;
      allCertsForMember.forEach(cert => {
        const catName = (cert.categoryName || '').replace(/(?:مۆڵەتی?|بڕوانامەی?|إجازة|شهادة|License|Certificate)\s*/ig, '').trim();
        certsHtml += `<div class="dir-bio-cert-row">
          <span class="dir-bio-cert-name">${catName}</span>
          <span class="dir-bio-cert-date">${cert.date || ''}</span>
          ${cert.certNumber ? `<span class="dir-bio-cert-num">#${cert.certNumber}</span>` : ''}
        </div>`;
      });
    }
    bioCerts.innerHTML = certsHtml;

    bioModal.showModal();
    document.body.style.overflow = 'hidden';
  };

  /* ── Bio modal close ───────────────────────────────── */
  if (bioClose) {
    bioClose.addEventListener('click', () => bioModal.close());
  }
  if (bioModal) {
    bioModal.addEventListener('click', e => {
      if (e.target === bioModal) bioModal.close();
    });
    bioModal.addEventListener('close', () => {
      document.body.style.overflow = '';
    });
  }

  /* ── Fullscreen modal open/close ───────────────────── */
  if (bioPhotoWrap) {
    bioPhotoWrap.addEventListener('click', (e) => {
      // Only open if the exact clicked element is the profile picture itself
      if (e.target !== bioPhoto) return;
      if (bioPhoto.src && bioPhotoWrap.classList.contains('dir-is-clickable')) {
        if (fsModal) {
          fsPhoto.src = bioPhoto.src;
          fsModal.showModal();
        } else if (typeof window.openNativeLightbox === 'function') {
          window.openNativeLightbox(bioPhoto.src, [bioPhoto.src], 0);
        }
      }
    });
  }
  if (fsClose) {
    fsClose.addEventListener('click', () => fsModal.close());
  }
  if (fsModal) {
    fsModal.addEventListener('click', e => {
      if (e.target === fsModal) fsModal.close();
    });
  }

  const render = () => {
    renderSidebar();

    const { cards, showCategory } = getDisplayCards();

    // Show/hide empty state
    if (cards.length === 0) {
      emptyState.style.display = '';
      cardGrid.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      cardGrid.style.display = '';
    }

    if (isSearching) {
      cardGrid.classList.add('dir-card-grid-search');
    } else {
      cardGrid.classList.remove('dir-card-grid-search');
      // Reset inline styles left by JS masonry
      cardGrid.style.position = '';
      cardGrid.style.height = '';
    }

    // Render cards
    let html = '';
    cards.forEach(cardItem => {
      // If we're searching, cards are grouped with a certificates array
      if (isSearching && cardItem.certificates) {
        html += buildGroupedCard(cardItem.member, cardItem.certificates);
      } else {
        html += buildCard(cardItem.member, cardItem.categoryName, cardItem.categoryId, showCategory);
      }
    });

    cardGrid.innerHTML = html;

    // Animate cards + apply masonry for search
    requestAnimationFrame(() => {
      const cardEls = cardGrid.querySelectorAll('.dir-card');
      cardEls.forEach((card, i) => {
        card.style.animationDelay = `${Math.min(i * 0.04, 0.6)}s`;
        card.classList.add('visible');
      });
      if (isSearching) applyMasonry();
    });
  };

  /* ── Delegated bio-modal click (attached once, outside render) ─────── */
  cardGrid.addEventListener('click', e => {
    const card = e.target.closest('[data-bio="1"]');
    if (!card) return;
    const lang = getCurrentLang();
    const nameEl = card.querySelector('.dir-card-name');
    const cardName = nameEl ? nameEl.textContent.trim() : '';

    let memberObj = null;
    const allCerts = [];
    for (const cat of categoriesData) {
      for (const m of (cat.members || [])) {
        if (t(m.name, lang) === cardName) {
          if (!memberObj || m.bio) memberObj = m;
          let cName = m.customLabel ? t(m.customLabel, lang) : t(cat.name, lang);
          allCerts.push({ ...m, categoryName: cName, categoryId: cat.id });
        }
      }
    }
    if (memberObj) openBioModal(memberObj, allCerts);
  });

  const applyMasonry = () => {
    if (!cardGrid) return;
    const cardEls = [...cardGrid.querySelectorAll('.dir-card')];
    if (!cardEls.length) return;

    // On narrow screens, skip masonry and let CSS grid handle layout
    if (window.innerWidth <= 560) {
      cardGrid.style.position = '';
      cardGrid.style.height = '';
      cardEls.forEach(card => {
        card.style.position = '';
        card.style.top = '';
        card.style.left = '';
        card.style.right = '';
        card.style.width = '';
      });
      return;
    }

    const gap = 16;
    const isEn = getCurrentLang() === 'en';
    const baseCol = isEn ? 220 : 180; // wider columns for English to fit longer text
    const containerW = cardGrid.offsetWidth;
    const cols = Math.max(1, Math.floor((containerW + gap) / (baseCol + gap)));

    const colHeights = Array(cols).fill(0);
    cardGrid.style.position = 'relative';

    cardEls.forEach(card => {
      const isMulti = card.classList.contains('dir-card-multi');
      // multi-cert spans 2 base columns; capped to available columns
      const span = isMulti && cols >= 2 ? 2 : 1;
      const cardW = span * baseCol + (span - 1) * gap;

      // Find lowest-height column group that fits `span` cols side by side
      let bestCol = 0;
      let bestH = Infinity;
      for (let i = 0; i <= cols - span; i++) {
        const h = Math.max(...colHeights.slice(i, i + span));
        if (h < bestH) { bestH = h; bestCol = i; }
      }

      const x = bestCol * (baseCol + gap);
      card.style.position = 'absolute';
      card.style.top  = bestH + 'px';
      
      const isRTL = document.documentElement.dir === 'rtl' || !isEn;
      if (isRTL) {
        card.style.right = x + 'px';
        card.style.left = 'auto';
      } else {
        card.style.left = x + 'px';
        card.style.right = 'auto';
      }
      
      card.style.width = cardW + 'px';

      // Update heights for spanned columns
      const cardH = card.offsetHeight;
      for (let i = bestCol; i < bestCol + span; i++) {
        colHeights[i] = bestH + cardH + gap;
      }
    });

    cardGrid.style.height = Math.max(...colHeights) + 'px';
  };


  /* ── Drawer Handlers ───────────────────────────────── */
  if (fab && sidebar && overlay) {
    fab.addEventListener('click', () => {
      sidebar.classList.add('drawer-open');
      overlay.classList.add('show');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('drawer-open');
      overlay.classList.remove('show');
    });
  }

  /* ── Search handler ────────────────────────────────── */
  let _searchDebounceTimer = null;
  const searchIcon = document.querySelector('.dir-search-icon');

  const setSearchLoading = (loading) => {
    const box = document.querySelector('.dir-search-box');
    if (!box) return;
    if (loading) {
      box.classList.add('dir-search-loading');
    } else {
      box.classList.remove('dir-search-loading');
    }
  };

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.trim();
      // Show spinner immediately so the user gets instant feedback
      if (term.length > 0) setSearchLoading(true);
      else setSearchLoading(false);

      clearTimeout(_searchDebounceTimer);
      _searchDebounceTimer = setTimeout(() => {
        // Set isSearching BEFORE render so sidebar state is correct immediately
        isSearching = term.length > 0;
        render();
        setSearchLoading(false);
      }, 220);
    });
  }

  /* ── Re-run masonry on resize ───────────────────────── */
  let _masonryResizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(_masonryResizeTimer);
    _masonryResizeTimer = setTimeout(() => {
      if (isSearching) applyMasonry();
    }, 120);
  });

  /* ── Language change ───────────────────────────────── */
  translatePlaceholder();
  document.addEventListener('languageChanged', () => {
    translatePlaceholder();
    render();
  });

  /* ── Load data ─────────────────────────────────────── */
  var loadData = function() {
    var base = 'https://bnkayhalabjaytaza.org';
    var cacheBust = '?v=20260829';
    var path = '/assets/data/students.json' + cacheBust;
    var origin = (window.__nhcOrigin || '');
    var urls = [];
    if (urls.indexOf(origin + path) === -1) urls.push(origin + path);
    if (urls.indexOf(base + path) === -1) urls.push(base + path);
    if (urls.indexOf(path) === -1) urls.push(path);

    function tryUrl(index) {
      if (index >= urls.length) return Promise.resolve(null);
      return fetch(urls[index]).then(function(res) {
        if (!res.ok) return tryUrl(index + 1);
        return res.json();
      }).catch(function() { return tryUrl(index + 1); });
    }

    tryUrl(0).then(function(data) {
      if (!data) {
        console.error('Failed to load achievements data');
        if (loadingState) {
          loadingState.innerHTML = '<p style="color:#b91c1c;text-align:center;">Error loading data.</p>';
        }
        return;
      }
      categoriesData = data.categories || [];
      if (loadingState) loadingState.style.display = 'none';
      var firstWithMembers = categoriesData.find(function(c) { return (c.members || []).length > 0; });
      activeCategory = firstWithMembers ? firstWithMembers.id : ((categoriesData[0] ? categoriesData[0].id : null) || null);
      render();
      if (typeof window.setupReveal === 'function') {
        window.setupReveal();
      }
    });
  };

  loadData();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', directoryInit);
} else {
  directoryInit();
}
