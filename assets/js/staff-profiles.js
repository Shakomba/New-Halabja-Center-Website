/* ============================================================
   staff-profiles.js — Staff profiles section for about.html
   Loads students.json, filters isStaff:true entries, renders
   paginated profile cards, and opens the same #dirBioModal
   used in directory.html.
   ============================================================ */
(function () {
  const PER_PAGE = 12;
  let staffList = []; // [{member, allCerts}]
  let currentPage = 0;

  const getEl = (id) => document.getElementById(id);

  const grid = getEl('staffProfilesGrid');
  const pagination = getEl('staffPagination');
  const section = getEl('staffProfilesSection');

  if (!grid || !section) return; // not on about page

  /* ── Language helpers ─────────────────────────────── */
  const getCurrentLang = () => {
    const sel = getEl('langSelect');
    return sel ? sel.value : (document.documentElement.lang || 'ku');
  };

  const t = (field, lang) => {
    lang = lang || getCurrentLang();
    if (!field) return '';
    if (typeof field === 'string' || typeof field === 'number') return String(field);
    if (typeof field !== 'object') return '';
    return field[lang] || field.en || Object.values(field).find(v => typeof v === 'string') || '';
  };

  const i18n = (key) => {
    const lang = getCurrentLang();
    return (window.I18N && window.I18N[lang] && window.I18N[lang][key]) || key;
  };

  /* ── Bio modal elements ───────────────────────────── */
  const bioModal = getEl('dirBioModal');
  const bioPhotoWrap = getEl('dirBioPhotoWrap');
  const bioPhoto = getEl('dirBioPhoto');
  const bioName = getEl('dirBioName');
  const bioInfo = getEl('dirBioInfo');
  const bioCerts = getEl('dirBioCerts');
  const bioClose = getEl('dirBioClose');
  const fsModal = getEl('dirFullscreenModal');
  const fsPhoto = getEl('dirFsPhoto');
  const fsClose = getEl('dirFsClose');

  /* ── Bio modal label lookup ───────────────────────── */
  const bioLabels = {
    ku: { birthDate: 'بەرواری لەدایکبوون', job: 'پیشە', degree: 'بروانامە', certs: 'بروانامەکان' },
    ar: { birthDate: 'تاريخ الميلاد', job: 'المهنة', degree: 'الشهادة', certs: 'الشهادات' },
    en: { birthDate: 'Date of Birth', job: 'Profession', degree: 'Degree', certs: 'Certificates' }
  };

  /* ── Open Bio Modal (mirrors directory.js) ────────── */
  const openBioModal = (member, allCertsForMember) => {
    if (!bioModal) return;
    const lang = getCurrentLang();
    const labels = bioLabels[lang] || bioLabels.en;

    bioName.textContent = t(member.name, lang);

    const photo = member.bio && member.bio.photo;
    if (photo) {
      bioPhoto.src = photo;
      bioPhoto.alt = t(member.name, lang);
      bioPhotoWrap.hidden = false;
      bioPhotoWrap.innerHTML = '';
      bioPhotoWrap.appendChild(bioPhoto);
      if (photo.includes('placeholder-')) {
        bioPhotoWrap.classList.remove('dir-is-clickable');
      } else {
        bioPhotoWrap.classList.add('dir-is-clickable');
      }
    } else {
      bioPhotoWrap.hidden = true;
    }

    const icons = {
      birthDate: `<svg class="dir-bio-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
      job: `<svg class="dir-bio-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`,
      degree: `<svg class="dir-bio-row-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>`
    };
    let infoHtml = '';
    if (member.bio) {
      ['birthDate', 'job', 'degree'].forEach(field => {
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

    let certsHtml = '';
    if (allCertsForMember.length > 0) {
      certsHtml += `<div class="dir-bio-certs-title">${labels.certs}</div>`;
      allCertsForMember.forEach(cert => {
        const catName = (cert.categoryName || '').replace(/(?:مۆڵەتی?|بڕوانامەی?|إجازة|شهادة|License|Certificate)\s*/ig, '').trim();
        certsHtml += `<div class="dir-bio-cert-row">
          <span class="dir-bio-cert-name">${catName}</span>
          <span class="dir-bio-cert-date">${cert.date || ''}</span>
          ${cert.certNumber && cert.categoryId !== 'ten-qiraat' ? `<span class="dir-bio-cert-num">#${cert.certNumber}</span>` : ''}
        </div>`;
      });
    }
    bioCerts.innerHTML = certsHtml;

    bioModal.showModal();
    document.body.style.overflow = 'hidden';
  };

  /* ── Modal close handlers ─────────────────────────── */
  if (bioClose) bioClose.addEventListener('click', () => bioModal.close());
  if (bioModal) {
    bioModal.addEventListener('click', e => { if (e.target === bioModal) bioModal.close(); });
    bioModal.addEventListener('close', () => { document.body.style.overflow = ''; });
  }
  if (bioPhotoWrap) {
    bioPhotoWrap.addEventListener('click', e => {
      if (e.target !== bioPhoto) return;
      if (bioPhoto.src && bioPhotoWrap.classList.contains('dir-is-clickable')) {
        if (typeof window.openNativeLightbox === 'function') {
          window.openNativeLightbox(bioPhoto.src, [bioPhoto.src], 0);
        } else if (fsModal) {
          fsPhoto.src = bioPhoto.src;
          fsModal.showModal();
        }
      }
    });
  }
  if (fsClose) fsClose.addEventListener('click', () => fsModal.close());
  if (fsModal) fsModal.addEventListener('click', e => { if (e.target === fsModal) fsModal.close(); });

  /* ── Build people map from categories data ────────── */
  const buildStaffList = (categories) => {
    const peopleMap = {};

    // Pass 1: identify every staff member (any entry with isStaff:true),
    // storing their primary data (bio, staffRole, etc.)
    categories.forEach(cat => {
      (cat.members || []).forEach(member => {
        if (!member.isStaff) return;

        const nameKey = (typeof member.name === 'object')
          ? (member.name.ku || member.name.en || member.name.ar || '')
          : String(member.name || '');

        if (!peopleMap[nameKey]) {
          peopleMap[nameKey] = { member, allCerts: [] };
        } else if (member.bio && !peopleMap[nameKey].member.bio) {
          // Prefer the entry that carries bio data
          peopleMap[nameKey].member = member;
        }
      });
    });

    // Pass 2: for every identified staff member, collect ALL certificates
    // across ALL categories by name — same logic directory.js uses when
    // opening the bio modal, so the data always stays in sync.
    Object.keys(peopleMap).forEach(nameKey => {
      categories.forEach(cat => {
        (cat.members || []).forEach(member => {
          const memberKey = (typeof member.name === 'object')
            ? (member.name.ku || member.name.en || member.name.ar || '')
            : String(member.name || '');

          if (memberKey !== nameKey) return;

          peopleMap[nameKey].allCerts.push({
            categoryName: member.customLabel ? (t(member.customLabel, 'ku') || t(member.customLabel, 'en')) : (t(cat.name, 'ku') || t(cat.name, 'en')),
            categoryNameObj: member.customLabel || cat.name,
            categoryId: cat.id,
            certNumber: member.certNumber,
            date: member.date
          });
        });
      });
    });

    return Object.values(peopleMap);
  };

  /* ── Delegated click: open bio modal ─────────────── */
  grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-staff-idx]');
    if (!btn) return;
    const idx = parseInt(btn.dataset.staffIdx, 10);
    const item = staffList[idx];
    if (!item) return;
    const lang = getCurrentLang();
    const certsI18n = item.allCerts.map(c => {
      let cName = t(c.categoryNameObj, lang);
      if (c.categoryId === 'ten-qiraat' && c.certNumber) cName += ` #${c.certNumber}`;
      return {
        ...c,
        categoryName: cName
      };
    });
    openBioModal(item.member, certsI18n);
  });

  /* ── Render staff cards for current page ──────────── */
  const renderGrid = () => {
    const lang = getCurrentLang();
    const start = currentPage * PER_PAGE;
    const pageItems = staffList.slice(start, start + PER_PAGE);

    grid.innerHTML = pageItems.map((item, idx) => {
      const member = item.member;
      const photo = (member.bio && member.bio.photo) || 'assets/img/students/placeholder-male.svg';
      const name = t(member.name, lang);
      const role = member.staffRole || 'tajweed';
      const roleLabel = i18n(`staff.role.${role}`);
      const globalIdx = start + idx;

      const isLong = name.length > 20;
      return `<article class="staff-card" role="listitem">
        <div class="staff-card-photo-wrap">
          <img class="staff-card-photo" src="${photo}" alt="${name}" loading="lazy">
        </div>
        <div class="staff-card-body">
          <div class="staff-card-info">
            <h4 class="staff-card-name${isLong ? ' is-long' : ''}">${name}</h4>
            <span class="staff-role-badge staff-role-${role}">${roleLabel}</span>
          </div>
          <button class="staff-card-btn" data-staff-idx="${globalIdx}" type="button" aria-label="${i18n('staff.viewprofile')}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </button>
        </div>
      </article>`;
    }).join('');
  };

  /* ── Render pagination ────────────────────────────── */
  const renderPagination = () => {
    const totalPages = Math.ceil(staffList.length / PER_PAGE);
    if (totalPages <= 1) {
      pagination.innerHTML = '';
      pagination.hidden = true;
      return;
    }
    pagination.hidden = false;
    const lang = getCurrentLang();
    const isRtl = (lang === 'ku' || lang === 'ar');

    const prevLabel = isRtl ? '→' : '←';
    const nextLabel = isRtl ? '←' : '→';

    pagination.innerHTML = `
      <button class="staff-page-btn" id="staffPrev" type="button" aria-label="Previous page"
        ${currentPage === 0 ? 'disabled' : ''}>${prevLabel}</button>
      <span class="staff-page-info">${currentPage + 1} / ${totalPages}</span>
      <button class="staff-page-btn" id="staffNext" type="button" aria-label="Next page"
        ${currentPage >= totalPages - 1 ? 'disabled' : ''}>${nextLabel}</button>
    `;

    const prevBtn = getEl('staffPrev');
    const nextBtn = getEl('staffNext');
    if (prevBtn) prevBtn.addEventListener('click', () => { currentPage--; render(); section.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    if (nextBtn) nextBtn.addEventListener('click', () => { currentPage++; render(); section.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  };

  /* ── Full render pass ─────────────────────────────── */
  const render = () => {
    renderGrid();
    renderPagination();
  };

  /* ── Static staff entries (not in students.json) ─── */
  const STATIC_STAFF = {
    first: [
      {
        member: {
          name: { ku: 'سیروان حامید ڕەحیم', ar: 'سيروان حامد رحيم', en: 'Sirwan Hamid Rahim' },
          staffRole: 'director',
          isStaff: true,
          bio: {
            birthDate: '13/02/1975',
            job: { ku: 'مامۆستای زمانی عەرەبی', ar: 'مدرس اللغة العربية', en: 'Arabic Language Teacher' },
            degree: { ku: 'بەکالۆریۆس لە زمانی عەرەبی', ar: 'بكالوريوس في اللغة العربية', en: "Bachelor's in Arabic Language" },
            photo: 'assets/img/students/SirwanHamid.jpg'
          }
        },
        allCerts: []
      },
      {
        member: {
          name: { ku: 'خێڵان ئەحمەد فەتاح', ar: 'خيلان أحمد فتاح', en: 'Khelan Ahmed Fattah' },
          staffRole: 'studies',
          isStaff: true,
          bio: {
            birthDate: '03/04/1988',
            job: { ku: 'مامۆستا', ar: 'مدرس', en: 'Teacher' },
            degree: { ku: 'دبلۆم', ar: 'دبلوم', en: 'Diploma' },
            photo: 'assets/img/students/placeholder-female.svg'
          }
        },
        allCerts: []
      },
      {
        member: {
          name: { ku: 'دێرین محێدین', ar: 'ديرين محي الدين', en: 'Derin Muhedin' },
          staffRole: 'qaida',
          isStaff: true,
          bio: {
            birthDate: '1998',
            job: { ku: 'مامۆستا', ar: 'مدرس', en: 'Teacher' },
            degree: { ku: 'بەکالۆریۆس', ar: 'بكالوريوس', en: "Bachelor's" },
            photo: 'assets/img/students/placeholder-female.svg'
          }
        },
        allCerts: []
      }
    ],
    last: [
      {
        member: {
          name: { ku: 'سەردار عەبدوڕەحیم مەحموود', ar: 'سردار عبدالرحيم محمود', en: 'Sardar Abdulrahim Mahmoud' },
          staffRole: 'admin',
          isStaff: true,
          bio: {
            birthDate: '01/03/1987',
            job: { ku: 'مامۆستا', ar: 'مدرس', en: 'Teacher' },
            degree: { ku: 'ماستەر لە جوگرافیا', ar: 'ماجستير في الجغرافيا', en: "Master's in Geography" },
            photo: 'assets/img/students/placeholder-male.svg'
          }
        },
        allCerts: []
      },
      {
        member: {
          name: { ku: 'بورهان عەلی ڕۆغزاد', ar: 'برهان علي روغزاد', en: 'Burhan Ali Roghzad' },
          staffRole: 'studies',
          isStaff: true,
          bio: {
            birthDate: '1984',
            job: { ku: 'مامۆستا', ar: 'مدرس', en: 'Teacher' },
            degree: { ku: 'بەکالۆریۆس', ar: 'بكالوريوس', en: "Bachelor's" },
            photo: 'assets/img/students/placeholder-male.svg'
          }
        },
        allCerts: []
      }
    ]
  };

  /* ── Fetch and initialise ─────────────────────────── */
  fetch('assets/data/students.json')
    .then(r => r.json())
    .then(data => {
      const allCerts = (data.categories || []).map(cat => ({
        categoryName: t(cat.name, getCurrentLang()),
        categoryNameObj: cat.name,
        categoryId: cat.id,
        certNumber: '',
        date: ''
      }));
      if (STATIC_STAFF.first[0]) {
        STATIC_STAFF.first[0].allCerts = allCerts;
      }

      const roleOrder = { director: 0, huffaz: 1, qaida: 2, tajweed: 3, studies: 4, admin: 5 };
      
      const getStaffRank = (item) => {
        const n = String(item.member.name.en || '').toLowerCase();
        if (n.includes('sirwan hamid')) return 10;
        if (n.includes('farooq')) return 20;
        if (n.includes('ahmed ainaddin') || n.includes('ahmed ainadin')) return 30;
        if (n.includes('sardar abdulrahim')) return 40;
        if (n.includes('fakhir')) return 45;
        
        const photo = item.member.bio?.photo || '';
        if (photo && !photo.includes('placeholder-')) return 50; // Real picture
        if (photo.includes('placeholder-male')) return 60;       // Men without picture
        if (photo.includes('placeholder-female')) return 70;     // Women
        return 80;
      };

      const fromJson = buildStaffList(data.categories || []);
      staffList = [...STATIC_STAFF.first, ...fromJson, ...STATIC_STAFF.last]
        .sort((a, b) => {
          const rankA = getStaffRank(a);
          const rankB = getStaffRank(b);
          if (rankA !== rankB) return rankA - rankB;
          
          return (roleOrder[a.member.staffRole] ?? 99) - (roleOrder[b.member.staffRole] ?? 99);
        });
      
      if (staffList.length === 0) return; // no staff marked yet
      section.hidden = false;
      render();
      if (typeof window.setupReveal === 'function') window.setupReveal();
    })
    .catch(err => console.warn('staff-profiles: failed to load students.json', err));

  /* ── Re-render on language change ─────────────────── */
  document.addEventListener('languageChanged', () => {
    currentPage = 0;
    render();
  });
})();
