(function() {
  'use strict';

  let activitiesData = [];
  let selectedCategories = [];
  let currentSearch = '';
  let currentPage = 1;
  const ITEMS_PER_PAGE = 9;

  const elements = {
    grid: null,
    searchInput: null,
    countDisplay: null,
    multiselect: null,
    multiselectTrigger: null,
    multiselectLabel: null,
    categoryOptions: null
  };

  function getCurrentLanguage() {
    const langSelect = document.getElementById('langSelect');
    return langSelect ? langSelect.value : 'en';
  }

  function getTranslatedValue(field, lang) {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[lang] || field['en'] || '';
  }

  function getI18n(key) {
    const lang = getCurrentLanguage();
    const dict = (window.I18N && window.I18N[lang]) ? window.I18N[lang] : window.I18N?.en || {};
    return dict[key] || '';
  }

  function getFirstCategory(activity, lang) {
    if (!activity.categories || !Array.isArray(activity.categories) || activity.categories.length === 0) {
      return activity.category ? getTranslatedValue(activity.category, lang) : '';
    }
    return getTranslatedValue(activity.categories[0], lang);
  }

  function getAllCategories(activity, lang) {
    if (!activity.categories || !Array.isArray(activity.categories)) {
      return activity.category ? [getTranslatedValue(activity.category, lang)] : [];
    }
    return activity.categories.map(cat => getTranslatedValue(cat, lang)).filter(c => c);
  }

  async function fetchActivities() {
    try {
      const response = await fetch('assets/data/activities.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      activitiesData = await response.json();
      return activitiesData;
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const lang = getCurrentLanguage();
    const ymdMatch = typeof dateStr === 'string' ? dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
    if ((lang === 'ar' || lang === 'ku') && ymdMatch) {
      return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1]}`;
    }
    const date = ymdMatch
      ? new Date(Number(ymdMatch[1]), Number(ymdMatch[2]) - 1, Number(ymdMatch[3]))
      : new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    if (lang === 'ar' || lang === 'ku') {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}/${date.getFullYear()}`;
    }
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function generateCardHTML(activity) {
    const lang = getCurrentLanguage();
    const mediaClass = activity.image ? '' : ' is-empty';
    const mediaStyle = activity.image ? ` style="background-image: url('${activity.image}')"` : '';

    const title = getTranslatedValue(activity.title, lang);
    const summary = getTranslatedValue(activity.summary, lang);

    // Make thumbnail clickable if image exists
    const thumbnailClickable = activity.image ? ` data-gallery-trigger="${activity.id}"` : '';

    return `
      <article class="news-card reveal" data-id="${activity.id}">
        <div class="news-media${mediaClass}"${mediaStyle}${thumbnailClickable}>
        </div>
        <div class="news-body">
          <div class="news-top">
            <time class="news-date" datetime="${activity.date}">${formatDate(activity.date)}</time>
          </div>
          <h3>${escapeHtml(title)}</h3>
          <p class="small">${escapeHtml(summary)}</p>
          <div class="news-actions">
            <button class="btn ghost" data-open="${activity.id}" type="button">${getI18n('news.readmore') || 'Read more'}</button>
          </div>
        </div>
      </article>
    `;
  }

  function filterActivities(data) {
    const lang = getCurrentLanguage();
    return data.filter(activity => {
      const title = getTranslatedValue(activity.title, lang).toLowerCase();
      const summary = getTranslatedValue(activity.summary, lang).toLowerCase();
      const content = getTranslatedValue(activity.content, lang).toLowerCase();
      const tags = getTranslatedValue(activity.tags, lang);
      const tagsArray = Array.isArray(tags) ? tags : [];
      
      const matchesSearch = !currentSearch || 
        title.includes(currentSearch) ||
        summary.includes(currentSearch) ||
        content.includes(currentSearch) ||
        tagsArray.some(tag => tag.toLowerCase().includes(currentSearch));

      const activityCategories = getAllCategories(activity, lang);
      const matchesCategories = selectedCategories.length === 0 || 
        activityCategories.some(cat => selectedCategories.includes(cat));

      return matchesSearch && matchesCategories;
    });
  }

  function renderCards() {
    if (!elements.grid) return;

    const sortedData = [...activitiesData].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    const filteredData = filterActivities(sortedData);

    // Calculate pagination
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Update counter
    if (elements.countDisplay) {
      const unitText = totalItems === 1 ? (getI18n('news.activity') || 'activity') : (getI18n('news.activities') || 'activities');
      elements.countDisplay.textContent = `${totalItems} ${unitText}`;
    }

    if (filteredData.length === 0) {
      elements.grid.innerHTML = `
        <div class="news-empty">
          ${getI18n('news.empty') || 'No activities found matching your criteria.'}
        </div>
      `;
      triggerRevealAnimations();
      return;
    }

    // Render cards
    elements.grid.innerHTML = paginatedData
      .map((activity, index) => generateCardHTML(activity, index))
      .join('');

    // Render pagination if needed
    renderPagination(totalPages);

    // Attach event listeners immediately after DOM update
    attachCardEventListeners();

    // Trigger scroll-based reveal animations
    setTimeout(() => {
      triggerRevealAnimations();
    }, 50);
  }

  function scrollToFirstActivity(behavior = 'smooth') {
    const header = document.querySelector('.header');
    const toolbar = document.querySelector('.news-toolbar');
    const offset = (header?.offsetHeight || 0) + (toolbar?.offsetHeight || 0) + 20;
    const firstCard = elements.grid?.querySelector('.news-card');
    const anchor = firstCard || elements.grid;
    if (!anchor) return;

    const targetY = Math.max(0, window.scrollY + anchor.getBoundingClientRect().top - offset);
    window.scrollTo({ top: targetY, behavior });
  }

  function renderPagination(totalPages) {
    let paginationContainer = document.querySelector('.activities-pagination');

    if (!paginationContainer) {
      paginationContainer = document.createElement('div');
      paginationContainer.className = 'activities-pagination';
      elements.grid.parentElement.appendChild(paginationContainer);
    }

    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    let paginationHTML = '<div class="pagination-buttons">';

    // Previous button
    paginationHTML += `
      <button class="pagination-btn pagination-prev" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
    `;

    // First page
    if (startPage > 1) {
      paginationHTML += `<button class="pagination-btn" data-page="1">1</button>`;
      if (startPage > 2) {
        paginationHTML += `<span class="pagination-ellipsis">...</span>`;
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>
      `;
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += `<span class="pagination-ellipsis">...</span>`;
      }
      paginationHTML += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Next button
    paginationHTML += `
      <button class="pagination-btn pagination-next" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    `;

    paginationHTML += '</div>';
    paginationContainer.innerHTML = paginationHTML;

    // Attach pagination event listeners
    const paginationButtons = paginationContainer.querySelectorAll('.pagination-btn:not([disabled])');
    paginationButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.getAttribute('data-page'));
        if (page !== currentPage && page >= 1 && page <= totalPages) {
          currentPage = page;
          renderCards();
          scrollToFirstActivity('smooth');
        }
      });
    });
  }

  function attachCardEventListeners() {
    const openButtons = document.querySelectorAll('[data-open]');
    const galleryTriggers = document.querySelectorAll('[data-gallery-trigger]');

    openButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-open');
        const activity = activitiesData.find(a => a.id === id);
        if (activity) {
          openActivityModal(activity);
        }
      });
    });

    // Gallery lightbox triggers for thumbnails
    galleryTriggers.forEach(trigger => {
      trigger.style.cursor = 'pointer';
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = trigger.getAttribute('data-gallery-trigger');
        const activity = activitiesData.find(a => a.id === id);
        if (activity) {
          openGridGallery(activity);
        }
      });
    });
  }

  function openGridGallery(activity) {
    // Collect all images for the gallery
    const images = [];
    if (activity.image) {
      images.push(activity.image);
    }
    if (activity.gallery && activity.gallery.length > 0) {
      images.push(...activity.gallery);
    }

    if (images.length === 0) return;

    // Use native lightbox with sliding track
    if (typeof window.openNativeLightbox === 'function') {
      window.openNativeLightbox(images[0], images, 0);
    }
  }

  function openActivityModal(activity) {
    const lang = getCurrentLanguage();
    const title = getTranslatedValue(activity.title, lang);
    const category = getFirstCategory(activity, lang);
    const content = getTranslatedValue(activity.content, lang);
    
    const mainImage = activity.image ? `
      <div class="modal-main-image" data-image="${activity.image}">
        <img src="${activity.image}" alt="${escapeHtml(title)}" />
      </div>
    ` : '';
    
    const gallery = (activity.gallery && activity.gallery.length > 0) ? `
      <div class="modal-gallery">
        <div class="modal-gallery-divider">
          <svg viewBox="0 0 640 640" fill="#DEB86D">
            <path d="M512 144C520.8 144 528 151.2 528 160L528 416C528 424.8 520.8 432 512 432L192 432C183.2 432 176 424.8 176 416L176 160C176 151.2 183.2 144 192 144L512 144zM192 96C156.7 96 128 124.7 128 160L128 416C128 451.3 156.7 480 192 480L512 480C547.3 480 576 451.3 576 416L576 160C576 124.7 547.3 96 512 96L192 96zM272 208C272 190.3 257.7 176 240 176C222.3 176 208 190.3 208 208C208 225.7 222.3 240 240 240C257.7 240 272 225.7 272 208zM412.7 211.8C408.4 204.5 400.5 200 392 200C383.5 200 375.6 204.5 371.3 211.8L324.8 290.8L307.6 266.2C303.1 259.8 295.8 256 287.9 256C280 256 272.7 259.8 268.2 266.2L212.2 346.2C207.1 353.5 206.4 363.1 210.6 371C214.8 378.9 223.1 384 232 384L472 384C480.6 384 488.6 379.4 492.8 371.9C497 364.4 497 355.2 492.7 347.8L412.7 211.8zM80 216C80 202.7 69.3 192 56 192C42.7 192 32 202.7 32 216L32 512C32 547.3 60.7 576 96 576L456 576C469.3 576 480 565.3 480 552C480 538.7 469.3 528 456 528L96 528C87.2 528 80 520.8 80 512L80 216z"></path>
          </svg>
        </div>
        <div class="modal-gallery-grid">
          ${activity.gallery.map((img, index) => `
            <div class="modal-gallery-item" data-index="${index}" data-images='${JSON.stringify(activity.gallery)}'>
              <img src="${img}" alt="Gallery image ${index + 1}" loading="lazy" />
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';
    
    const modalContent = `
      ${mainImage}
      <div class="modal-meta-inline">
        <span class="modal-category">${escapeHtml(category)}</span>
        <time class="modal-date" datetime="${activity.date}">${formatDate(activity.date)}</time>
      </div>
      ${content}
      ${gallery}
    `;

    if (window.NHC_MODAL && typeof window.NHC_MODAL.open === 'function') {
      window.NHC_MODAL.open(title, modalContent);
      history.replaceState(null, '', `#${activity.id}`);
      attachImageLightboxListeners();
    } else if (typeof window.openModal === 'function') {
      window.openModal(title, modalContent);
      history.replaceState(null, '', `#${activity.id}`);
      attachImageLightboxListeners();
    }
  }

  function attachImageLightboxListeners() {
    setTimeout(() => {
      const mainImage = document.querySelector('.modal-main-image');
      const galleryItems = document.querySelectorAll('.modal-gallery-item');

      if (mainImage && typeof window.openNativeLightbox === 'function') {
        mainImage.addEventListener('click', () => {
          window.openNativeLightbox(mainImage.dataset.image, [mainImage.dataset.image], 0);
        });
      }

      galleryItems.forEach(item => {
        item.addEventListener('click', () => {
          if (typeof window.openNativeLightbox === 'function') {
            const images = JSON.parse(item.dataset.images);
            const index = parseInt(item.dataset.index);
            window.openNativeLightbox(images[index], images, index);
          }
        });
      });
    }, 100);
  }

  function triggerRevealAnimations() {
    if (typeof window.setupReveal === 'function') {
      window.setupReveal();
    }
  }

  function populateFilterOptions() {
    if (!elements.categoryOptions) return;

    const lang = getCurrentLanguage();
    const allCategories = new Set();
    activitiesData.forEach(activity => {
      const categories = getAllCategories(activity, lang);
      categories.forEach(cat => allCategories.add(cat));
    });

    const sortedCategories = Array.from(allCategories).sort();
    const optionsHTML = sortedCategories.map((cat, index) => {
      // Keep ids stable and valid regardless of localized category text.
      const id = `cat-option-${index}`;
      return `
        <div class="multiselect-option" data-category="${escapeHtml(cat)}">
          <input type="checkbox" id="${id}" value="${escapeHtml(cat)}">
          <label for="${id}">${escapeHtml(cat)}</label>
        </div>
      `;
    }).join('');

    elements.categoryOptions.innerHTML = optionsHTML;
    
    // Add event listeners to checkboxes
    const checkboxes = elements.categoryOptions.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', handleCategoryChange);
    });

    // Make the whole row clickable while preserving native label behavior.
    const options = elements.categoryOptions.querySelectorAll('.multiselect-option');
    options.forEach(option => {
      option.addEventListener('click', event => {
        if (event.target.closest('input, label')) return;
        const checkbox = option.querySelector('input[type="checkbox"]');
        if (!checkbox) return;
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  function handleCategoryChange(event) {
    const category = event.target.value;
    const option = event.target.closest('.multiselect-option');

    if (event.target.checked) {
      selectedCategories.push(category);
      option.classList.add('checked');
    } else {
      selectedCategories = selectedCategories.filter(c => c !== category);
      option.classList.remove('checked');
    }

    currentPage = 1; // Reset to first page when filter changes
    updateMultiselectLabel();
    renderCards();
    scrollToFirstActivity('smooth');
  }

  function updateMultiselectLabel() {
    if (!elements.multiselectLabel) return;

    if (selectedCategories.length === 0) {
      elements.multiselectLabel.textContent = getI18n('news.allcategories') || 'All Categories';
    } else if (selectedCategories.length === 1) {
      elements.multiselectLabel.textContent = selectedCategories[0];
    } else {
      elements.multiselectLabel.textContent = `${selectedCategories.length} ${getI18n('news.categories') || 'Categories'}`;
    }
  }

  function handleSearch(event) {
    currentSearch = event.target.value.trim().toLowerCase();
    currentPage = 1; // Reset to first page when searching
    renderCards();
    scrollToFirstActivity('smooth');
  }

  function toggleMultiselect() {
    if (!elements.multiselect) return;
    elements.multiselect.classList.toggle('active');
  }

  function closeMultiselect(event) {
    if (!elements.multiselect) return;
    if (!elements.multiselect.contains(event.target)) {
      elements.multiselect.classList.remove('active');
    }
  }

  function handleHashChange() {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const activity = activitiesData.find(a => a.id === hash);
      if (activity) {
        openActivityModal(activity);
      }
    }
  }

  function initializeElements() {
    elements.grid = document.getElementById('newsList');
    elements.searchInput = document.getElementById('newsSearch');
    elements.countDisplay = document.getElementById('newsCount');
    elements.multiselect = document.getElementById('categoryFilter');
    elements.multiselectTrigger = elements.multiselect?.querySelector('.multiselect-trigger');
    elements.multiselectLabel = elements.multiselect?.querySelector('.multiselect-label');
    elements.categoryOptions = document.getElementById('categoryOptions');
  }

  function attachEventListeners() {
    if (elements.searchInput) {
      elements.searchInput.addEventListener('input', handleSearch);
    }

    if (elements.multiselectTrigger) {
      elements.multiselectTrigger.addEventListener('click', toggleMultiselect);
    }

    // Listen for language changes
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
      langSelect.addEventListener('change', handleLanguageChange);
    }

    document.addEventListener('click', closeMultiselect);
    window.addEventListener('hashchange', handleHashChange);
  }

  function handleLanguageChange() {
    selectedCategories = []; // Reset selected categories on language change
    populateFilterOptions();
    updateMultiselectLabel();
    renderCards();
  }

  async function init() {
    initializeElements();

    if (!elements.grid) {
      console.error('Activities grid element #newsList not found');
      return;
    }

    const data = await fetchActivities();
    
    if (data.length === 0) {
      elements.grid.innerHTML = `
        <div class="news-empty">
          ${getI18n('news.loaderror') || 'Unable to load activities. Please try again later.'}
        </div>
      `;
      return;
    }

    populateFilterOptions();
    renderCards();
    attachEventListeners();
    handleHashChange();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.activitiesLoader = {
    refresh: renderCards,
    getData: () => activitiesData
  };

})();
