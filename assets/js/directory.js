const directoryInit = () => {
  const ITEMS_PER_PAGE = 24;
  let allStudents = [];
  let filteredStudents = [];
  let currentPage = 1;

  const getEl = (id) => document.getElementById(id);
  const searchInput = getEl('dirSearchInput');
  const grid = getEl('dirGrid');
  const pagination = getEl('dirPagination');
  const emptyState = getEl('dirEmptyState');
  const loadingState = getEl('dirLoading');
  const getCurrentLang = () => document.documentElement.lang || 'ku';
  const scrollToNamesTop = () => {
    const target = grid || searchInput;
    if (!target) return;
    const header = document.querySelector('.header');
    const stickySearchWrap = searchInput?.closest('.sticky');
    const headerOffset = header?.offsetHeight || 0;
    const searchOffset = stickySearchWrap?.getBoundingClientRect().height || 0;
    const safetyGap = 48;
    const totalOffset = headerOffset + searchOffset + safetyGap;
    const targetTop = Math.max(0, window.scrollY + target.getBoundingClientRect().top - totalOffset);
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
  };

  const getTranslatedText = (field, lang = getCurrentLang()) => {
    if (!field) return '';
    if (typeof field === 'string' || typeof field === 'number') return String(field);
    if (typeof field !== 'object') return '';
    return field[lang] || field.en || Object.values(field).find(v => typeof v === 'string') || '';
  };

  const collectTextVariants = (value, acc = []) => {
    if (value == null) return acc;
    if (typeof value === 'string' || typeof value === 'number') {
      acc.push(String(value));
      return acc;
    }
    if (Array.isArray(value)) {
      value.forEach(item => collectTextVariants(item, acc));
      return acc;
    }
    if (typeof value === 'object') {
      Object.values(value).forEach(item => collectTextVariants(item, acc));
    }
    return acc;
  };

  const normalizeSearchText = (value) => {
    return String(value || '')
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

  const buildStudentSearchIndex = (student) => {
    const parts = [];
    collectTextVariants(student?.name, parts);
    collectTextVariants(student?.certs, parts);
    return normalizeSearchText(parts.join(' '));
  };

  // Utility to map translated strings in dynamic placeholder attribute
  const translatePlaceholder = () => {
    if (!searchInput) return;
    const key = searchInput.getAttribute('data-i18n-placeholder');
    if (key && window.I18N) {
      const currentLang = getCurrentLang();
      const text = window.I18N[currentLang]?.[key];
      if (text) {
        searchInput.placeholder = text;
      }
    }
  };

  translatePlaceholder();
  document.addEventListener('languageChanged', () => {
    translatePlaceholder();
    // Re-sort since alphabetical order is language-dependent
    allStudents = sortStudents(allStudents);
    if (searchInput && searchInput.value.trim()) {
      handleSearch(searchInput.value);
    } else {
      filteredStudents = [...allStudents];
      renderPage();
    }
  });

  // Sort: most certs first, then alphabetically by translated name in active language
  const sortStudents = (arr) => {
    const lang = getCurrentLang();
    const locale = lang === 'ku' ? 'ar' : lang === 'ar' ? 'ar' : 'en';
    return [...arr].sort((a, b) => {
      const certDiff = (b.certs?.length || 0) - (a.certs?.length || 0);
      if (certDiff !== 0) return certDiff;
      const nameA = getTranslatedText(a.name, lang);
      const nameB = getTranslatedText(b.name, lang);
      return String(nameA).localeCompare(String(nameB), locale, { sensitivity: 'base' });
    });
  };

  // Fetch data
  const loadData = async () => {
    try {
      const res = await fetch('assets/data/students.json');
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      const indexedData = data.map(student => ({
        ...student,
        _searchIndex: buildStudentSearchIndex(student)
      }));
      allStudents = sortStudents(indexedData);
      filteredStudents = [...allStudents];

      loadingState.classList.add('hidden');
      loadingState.classList.remove('flex');

      renderPage();
    } catch (err) {
      console.error('Failed to load students directory:', err);
      loadingState.innerHTML = '<p class="text-red-500">Error loading data. Please try again later.</p>';
    }
  };

  // Render cards
  const renderCards = (students) => {
    grid.innerHTML = '';

    if (students.length === 0) {
      grid.classList.add('hidden');
      grid.classList.remove('grid');
      pagination.classList.add('hidden');
      pagination.classList.remove('flex');
      emptyState.classList.remove('hidden');
      emptyState.classList.add('block');
      return;
    }

    grid.classList.remove('hidden');
    grid.classList.add('grid');
    emptyState.classList.add('hidden');
    emptyState.classList.remove('block');

    students.forEach((student, index) => {
      const card = document.createElement('article');
      card.className = 'bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-start h-full';

      const currentLang = getCurrentLang();
      const nameObj = getTranslatedText(student.name, currentLang);
      const certs = student.certs || [];
      const translatedCerts = certs.map(c => getTranslatedText(c, currentLang));

      // Sort by length: shortest first, longest last
      translatedCerts.sort((a, b) => a.length - b.length);

      const certsHtml = translatedCerts.map((certName, i) => {
        const isLastAndOdd = (i === translatedCerts.length - 1) && (translatedCerts.length % 2 !== 0);
        const spanClass = isLastAndOdd ? 'col-span-2' : '';
        return `<span class="whitespace-nowrap truncate flex items-center justify-center text-center rounded-xl bg-nhc-green/10 px-2 py-1.5 text-xs sm:text-sm font-medium text-nhc-dark ring-1 ring-inset ring-nhc-green/20 ${spanClass}" title="${certName}">${certName}</span>`;
      }).join('');

      card.innerHTML = `
        <h3 class="text-xl font-bold text-gray-900 mb-4 leading-tight">${nameObj}</h3>
        <div class="grid grid-cols-2 gap-2 mt-auto pt-2">${certsHtml}</div>
      `;

      if (index < 12) {
        card.style.animation = `hero-fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards ${index * 0.05}s`;
        card.style.opacity = '0';
      }

      grid.appendChild(card);
    });
  };

  // Render Pagination
  const renderPagination = () => {
    const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);

    if (totalPages <= 1) {
      pagination.classList.add('hidden');
      pagination.classList.remove('flex');
      return;
    }

    pagination.classList.remove('hidden');
    pagination.classList.add('flex');
    pagination.innerHTML = '';

    // Create a container that mocks .pagination-buttons 
    const btnContainer = document.createElement('div');
    btnContainer.className = 'pagination-buttons';
    pagination.appendChild(btnContainer);

    // Prev Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn pagination-prev';
    prevBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
    if (currentPage === 1) prevBtn.setAttribute('disabled', 'true');
    prevBtn.setAttribute('aria-label', 'Previous Page');
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) { currentPage--; renderPage(); scrollToNamesTop(); }
    });
    btnContainer.appendChild(prevBtn);

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    if (startPage > 1) {
      const p = document.createElement('button');
      p.className = 'pagination-btn';
      p.innerText = '1';
      p.addEventListener('click', () => { currentPage = 1; renderPage(); scrollToNamesTop(); });
      btnContainer.appendChild(p);
      if (startPage > 2) {
        const dots = document.createElement('span');
        dots.innerText = '...';
        dots.className = 'pagination-ellipsis';
        btnContainer.appendChild(dots);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const p = document.createElement('button');
      p.className = i === currentPage ? 'pagination-btn active' : 'pagination-btn';
      p.innerText = i;
      p.addEventListener('click', () => { currentPage = i; renderPage(); scrollToNamesTop(); });
      btnContainer.appendChild(p);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const dots = document.createElement('span');
        dots.innerText = '...';
        dots.className = 'pagination-ellipsis';
        btnContainer.appendChild(dots);
      }
      const p = document.createElement('button');
      p.className = 'pagination-btn';
      p.innerText = totalPages;
      p.addEventListener('click', () => { currentPage = totalPages; renderPage(); scrollToNamesTop(); });
      btnContainer.appendChild(p);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn pagination-next';
    nextBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    if (currentPage === totalPages) nextBtn.setAttribute('disabled', 'true');
    nextBtn.setAttribute('aria-label', 'Next Page');
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) { currentPage++; renderPage(); scrollToNamesTop(); }
    });
    btnContainer.appendChild(nextBtn);
  };

  const renderPage = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    renderCards(paginated);
    renderPagination();
  };

  function handleSearch(term) {
    currentPage = 1;
    const normalizedTerm = normalizeSearchText(term);
    if (!normalizedTerm) {
      filteredStudents = [...allStudents]; // already sorted
    } else {
      const termTokens = normalizedTerm.split(/\s+/).filter(Boolean);
      const matched = allStudents.filter(student => {
        const searchIndex = student._searchIndex || buildStudentSearchIndex(student);
        return termTokens.every(token => searchIndex.includes(token));
      });
      filteredStudents = sortStudents(matched);
    }
    renderPage();
  };

  // Search Logic
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });
  }

  loadData();
};

// Run immediately if DOM is already ready, otherwise wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', directoryInit);
} else {
  directoryInit();
}
