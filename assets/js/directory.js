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

  /* ── Build card HTML ───────────────────────────────── */
  const buildCard = (member, categoryName, categoryId, showCategory) => {
    const lang = getCurrentLang();
    const name = t(member.name, lang);
    const certNum = member.certNumber || '—';
    const dateStr = member.date || '—';

    const categoryBadge = showCategory
      ? `<span class="dir-card-category" data-cat-id="${categoryId}">${categoryName}</span>`
      : '';

    return `<article class="dir-card">
      <div class="dir-card-certnum">${certNum}</div>
      <div class="dir-card-name">${name}</div>
      <div class="dir-card-date">${dateStr}</div>
      ${categoryBadge}
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
      const results = [];

      categoriesData.forEach(cat => {
        const catName = t(cat.name, lang);
        (cat.members || []).forEach(m => {
          // Build haystack from ALL languages of the name + cert + date
          const nameVariants = typeof m.name === 'object'
            ? Object.values(m.name).join(' ')
            : String(m.name || '');
          const haystack = normalize(
            [nameVariants, m.certNumber || '', m.date || ''].join(' ')
          );
          if (tokens.every(tok => haystack.includes(tok))) {
            results.push({ member: m, categoryName: catName, categoryId: cat.id });
          }
        });
      });

      return { cards: results, showCategory: true };
    } else {
      // Show active category
      isSearching = false;
      const cat = categoriesData.find(c => c.id === activeCategory);
      if (!cat) return { cards: [], showCategory: false };
      const catName = t(cat.name, lang);
      return {
        cards: (cat.members || []).map(m => ({ member: m, categoryName: catName })),
        showCategory: false
      };
    }
  };

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

    // Render cards
    let html = '';
    cards.forEach(({ member, categoryName, categoryId }) => {
      html += buildCard(member, categoryName, categoryId, showCategory);
    });

    cardGrid.innerHTML = html;

    // Animate cards
    requestAnimationFrame(() => {
      const cardEls = cardGrid.querySelectorAll('.dir-card');
      cardEls.forEach((card, i) => {
        card.style.animationDelay = `${Math.min(i * 0.04, 0.6)}s`;
        card.classList.add('visible');
      });
    });
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
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.trim();
      // Set isSearching BEFORE render so sidebar state is correct immediately
      isSearching = term.length > 0;
      render();
    });
  }

  /* ── Language change ───────────────────────────────── */
  translatePlaceholder();
  document.addEventListener('languageChanged', () => {
    translatePlaceholder();
    render();
  });

  /* ── Load data ─────────────────────────────────────── */
  const loadData = async () => {
    try {
      const res = await fetch('assets/data/students.json');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      categoriesData = data.categories || [];

      // Hide loading
      if (loadingState) loadingState.style.display = 'none';

      // Default to first category with members, or just first
      const firstWithMembers = categoriesData.find(c => (c.members || []).length > 0);
      activeCategory = firstWithMembers ? firstWithMembers.id : (categoriesData[0]?.id || null);

      render();

      if (typeof window.setupReveal === 'function') {
        window.setupReveal();
      }
    } catch (err) {
      console.error('Failed to load achievements data:', err);
      if (loadingState) {
        loadingState.innerHTML = '<p style="color:#b91c1c;text-align:center;">Error loading data.</p>';
      }
    }
  };

  loadData();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', directoryInit);
} else {
  directoryInit();
}
