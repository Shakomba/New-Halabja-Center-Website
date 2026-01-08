(function() {
  'use strict';
  
  console.log('=== ACTIVITIES LOADER SCRIPT LOADED ===');

  let activitiesData = [];
  let selectedCategories = [];
  let currentSearch = '';
  let currentLang = 'en';

  const elements = {
    grid: null,
    searchInput: null,
    filterSelect: null,
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
      console.log('Activities data loaded and stored:', activitiesData.length, 'items');
      console.log('activitiesData is now:', activitiesData);
      return activitiesData;
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function generateCardHTML(activity, index) {
    const lang = getCurrentLanguage();
    const mediaClass = activity.image ? '' : ' is-empty';
    const mediaStyle = activity.image ? ` style="background-image: url('${activity.image}')"` : '';
    
    const title = getTranslatedValue(activity.title, lang);
    const summary = getTranslatedValue(activity.summary, lang);

    return `
      <article class="news-card reveal" data-id="${activity.id}">
        <div class="news-media${mediaClass}"${mediaStyle}>
        </div>
        <div class="news-body">
          <div class="news-top">
            <time class="news-date" datetime="${activity.date}">${formatDate(activity.date)}</time>
          </div>
          <h3>${escapeHtml(title)}</h3>
          <p class="small">${escapeHtml(summary)}</p>
          <div class="news-actions">
            <button class="btn ghost" data-open="${activity.id}" type="button">Read more</button>
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
    
    // Update counter
    if (elements.countDisplay) {
      const count = filteredData.length;
      elements.countDisplay.textContent = `${count} ${count === 1 ? 'activity' : 'activities'}`;
    }
    
    if (filteredData.length === 0) {
      elements.grid.innerHTML = `
        <div class="news-empty">
          No activities found matching your criteria.
        </div>
      `;
      triggerRevealAnimations();
      return;
    }

    elements.grid.innerHTML = filteredData
      .map((activity, index) => generateCardHTML(activity, index))
      .join('');

    // Attach event listeners immediately after DOM update
    attachCardEventListeners();
    
    // Trigger scroll-based reveal animations
    setTimeout(() => {
      triggerRevealAnimations();
    }, 50);
  }

  function attachCardEventListeners() {
    const openButtons = document.querySelectorAll('[data-open]');
    
    openButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-open');
        const activity = activitiesData.find(a => a.id === id);
        if (activity) {
          openActivityModal(activity);
        }
      });
    });
  }

  function openActivityModal(activity) {
    const lang = getCurrentLanguage();
    const title = getTranslatedValue(activity.title, lang);
    const category = getFirstCategory(activity, lang);
    const content = getTranslatedValue(activity.content, lang);
    
    const mainImage = activity.image ? `
      <div class="modal-main-image" style="background-image: url('${activity.image}')" data-image="${activity.image}"></div>
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
            <div class="modal-gallery-item" style="background-image: url('${img}')" data-index="${index}" data-images='${JSON.stringify(activity.gallery)}'></div>
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
      
      if (mainImage) {
        mainImage.addEventListener('click', () => {
          openLightbox(mainImage.dataset.image, null, null);
        });
      }
      
      galleryItems.forEach(item => {
        item.addEventListener('click', () => {
          const images = JSON.parse(item.dataset.images);
          const index = parseInt(item.dataset.index);
          openLightbox(images[index], images, index);
        });
      });
    }, 100);
  }

  function openLightbox(imageSrc, images, currentIndex) {
    let lightbox = document.getElementById('imageLightbox');
    
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'imageLightbox';
      lightbox.className = 'image-lightbox';
      lightbox.innerHTML = `
        <button class="lightbox-close" aria-label="Close">&times;</button>
        <button class="lightbox-prev" aria-label="Previous image">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <button class="lightbox-next" aria-label="Next image">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
        <img class="lightbox-image" src="" alt="Activity image">
      `;
      document.body.appendChild(lightbox);
    }
    
    const img = lightbox.querySelector('.lightbox-image');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    
    img.src = imageSrc;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    if (images && images.length > 1) {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
      
      let index = currentIndex;
      
      prevBtn.onclick = () => {
        index = (index - 1 + images.length) % images.length;
        img.src = images[index];
      };
      
      nextBtn.onclick = () => {
        index = (index + 1) % images.length;
        img.src = images[index];
      };
    } else {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    }
    
    const closeLightbox = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    };
    
    closeBtn.onclick = closeLightbox;
    lightbox.onclick = (e) => {
      if (e.target === lightbox) closeLightbox();
    };
    
    document.addEventListener('keydown', function escapeHandler(e) {
      if (e.key === 'Escape') {
        closeLightbox();
        document.removeEventListener('keydown', escapeHandler);
      }
    });
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.error('Clipboard write failed:', err);
      }
    }
    
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch (err) {
      console.error('Copy command failed:', err);
    }
    
    document.body.removeChild(textarea);
    return success;
  }

  function showShareFeedback(button, success) {
    const originalTitle = button.getAttribute('title') || 'Copy link';
    const message = success ? 'Link copied!' : 'Copy failed';
    
    button.setAttribute('title', message);
    button.setAttribute('aria-label', message);
    
    setTimeout(() => {
      button.setAttribute('title', originalTitle);
      button.setAttribute('aria-label', originalTitle);
    }, 2000);
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
    const optionsHTML = sortedCategories.map(cat => {
      const id = `cat-${cat.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
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
    
    updateMultiselectLabel();
    renderCards();
  }

  function updateMultiselectLabel() {
    if (!elements.multiselectLabel) return;
    
    if (selectedCategories.length === 0) {
      elements.multiselectLabel.textContent = 'All Categories';
    } else if (selectedCategories.length === 1) {
      elements.multiselectLabel.textContent = selectedCategories[0];
    } else {
      elements.multiselectLabel.textContent = `${selectedCategories.length} Categories`;
    }
  }

  function handleSearch(event) {
    currentSearch = event.target.value.trim().toLowerCase();
    renderCards();
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
    elements.filterSelect = document.getElementById('newsTag');
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
    currentLang = getCurrentLanguage();
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
          Unable to load activities. Please try again later.
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
