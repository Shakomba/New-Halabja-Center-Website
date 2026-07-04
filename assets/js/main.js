(function () {
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));

  // Capture origin before history.replaceState can change location.*
  window.__nhcOrigin = (location.origin === "null" || location.origin === "file://") ? "" : location.origin;

  // Disable automatic scroll restoration and force scroll to top
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
  
  // Clear activities slider position on page load
  try {
    localStorage.removeItem("nhc_activities_slide");
  } catch (e) {}

  let skipHeroIntro = false;
  try {
    skipHeroIntro = sessionStorage.getItem("nhc_skip_intro") === "1";
    if (skipHeroIntro) sessionStorage.removeItem("nhc_skip_intro");
  } catch (_) { }

  if (!skipHeroIntro) {
    document.documentElement.classList.add("nhc-hero-intro");
    window.setTimeout(() => {
      document.documentElement.classList.remove("nhc-hero-intro");
    }, 900);
  }

  // Mobile menu
  const menuBtn = $("#menuBtn");
  const mobileDrawer = $("#mobileDrawer");
  const drawerPanel = $(".drawer-panel", mobileDrawer || undefined);
  let setDrawer = null;
  if (menuBtn && mobileDrawer) {
    setDrawer = (open) => {
      mobileDrawer.classList.toggle("open", open);
      document.body.classList.toggle("drawer-open", open);
      menuBtn.classList.toggle("is-active", open);
    };
    menuBtn.addEventListener("click", () => {
      const isOpen = mobileDrawer.classList.contains("open");
      setDrawer(!isOpen);
    });
    mobileDrawer.addEventListener("click", (e) => {
      if (e.target === mobileDrawer) setDrawer(false);
    });
    $$("a", drawerPanel || mobileDrawer).forEach(link => {
      link.addEventListener("click", () => setDrawer(false));
    });
  }

  function isHomePath(pathname) {
    const p = String(pathname || "").replace(/\/+$/, "");
    return p === "" || p === "/" || p.endsWith("/index.html");
  }

  function setupHomeTabScrollToTop() {
    if (isHomePath(window.location.pathname) && !document.getElementById("top")) {
      if (!document.body.id) document.body.id = "top";
    }

    const homeLinks = $$("a[href='index.html'], a[href='./index.html'], a[href='/index.html'], a[href='/'], a[href='/#top']");
    homeLinks.forEach(link => {
      const rawHref = link.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#")) return;

      if (rawHref === "/#top") link.setAttribute("href", "/");

      let url;
      try {
        url = new URL(link.getAttribute("href"), window.location.href);
      } catch (_) {
        return;
      }
      if (!isHomePath(url.pathname)) return;

      link.addEventListener("click", (e) => {
        if (!isHomePath(window.location.pathname)) return;
        e.preventDefault();
        if (typeof setDrawer === "function") setDrawer(false);
        (document.getElementById("top") || document.body).scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }
  setupHomeTabScrollToTop();

  // i18n
  function applyLanguage(lang) {
    const dict = (window.I18N && window.I18N[lang]) ? window.I18N[lang] : window.I18N.en;
    // Direction rules
    const rtl = (lang === "ar" || lang === "ku");
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.body.setAttribute("dir", rtl ? "rtl" : "ltr");

    // Dynamic years calculation
    const estYear = (window.SITE_CONFIG && window.SITE_CONFIG.establishedYear) || 2012;
    const yearsCount = new Date().getFullYear() - estYear;
    let yearsLocal = yearsCount.toString();
    if (rtl) {
      const easternDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
      yearsLocal = yearsLocal.replace(/[0-9]/g, w => easternDigits[w]);
    }

    $$("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        let text = dict[key];
        if (text.includes("{years}")) text = text.replace("{years}", yearsLocal);
        el.textContent = text;
      }
    });
    $$("[data-i18n-placeholder]").forEach(el => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key]) el.placeholder = dict[key];
    });

    // SEO meta update on language switch
    const page = document.body.getAttribute("data-page") || "home";
    const metaTitle = dict["meta.title." + page] || document.title;
    const metaDesc = dict["meta.desc." + page] || "";
    const ogTitle = dict["meta.og.title." + page] || metaTitle;
    const ogDesc = dict["meta.og.desc." + page] || metaDesc;
    document.title = metaTitle;
    const setMeta = (sel, val) => { const el = document.querySelector(sel); if (el && val) el.setAttribute("content", val); };
    setMeta('meta[name="description"]', metaDesc);
    setMeta('meta[property="og:title"]', ogTitle);
    setMeta('meta[property="og:description"]', ogDesc);
    setMeta('meta[name="twitter:title"]', ogTitle);
    setMeta('meta[name="twitter:description"]', ogDesc);
    const localeMap = { ku: "ckb_IQ", ar: "ar_IQ", en: "en_US" };
    setMeta('meta[property="og:locale"]', localeMap[lang] || "ckb_IQ");
    document.querySelectorAll('meta[property="og:locale:alternate"]').forEach(el => el.remove());
    const ogUrl = document.querySelector('meta[property="og:url"]');
    Object.entries(localeMap).filter(([l]) => l !== lang).forEach(([, loc]) => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:locale:alternate");
      m.setAttribute("content", loc);
      if (ogUrl) ogUrl.after(m); else document.head.appendChild(m);
    });

    // Update address from SITE_CONFIG
    if (window.SITE_CONFIG && window.SITE_CONFIG.address && typeof window.SITE_CONFIG.address === 'object') {
      const addr = window.SITE_CONFIG.address[lang] || window.SITE_CONFIG.address['en'] || "";
      const addrEls = [document.getElementById("contactAddress"), document.getElementById("contactAddress2")];
      addrEls.forEach(el => { if (el) el.textContent = addr; });
    }

    // Notify other scripts that the language has changed
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  // Site config (contact/social)
  function applySiteConfig() {
    const cfg = window.SITE_CONFIG || {};
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ""; };
    const forceLtr = (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.setAttribute("dir", "ltr");
      el.style.unicodeBidi = "isolate";
    };
    const setLink = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.dataset.url = val || "";
      if (el.dataset.bound === "true") return;
      el.addEventListener("click", (e) => {
        const targetUrl = el.dataset.url;
        if (!targetUrl) return;
        e.preventDefault();
        window.open(targetUrl, "_blank", "noopener");
      });
      el.dataset.bound = "true";
    };
    const currentLang = (document.getElementById("langSelect") ? document.getElementById("langSelect").value : undefined)
      || localStorage.getItem("nhc_lang")
      || document.documentElement.lang
      || "ku";

    setText("contactPhone", cfg.phone);
    forceLtr("contactPhone");
    setText("contactEmail", cfg.email);

    // Address (handle multilingual object or string)
    let addr = cfg.address;
    if (addr && typeof addr === "object") addr = addr[currentLang] || addr.en || "";
    setText("contactAddress", addr);

    setText("contactPhone2", cfg.phone);
    forceLtr("contactPhone2");
    setText("contactEmail2", cfg.email);
    setText("contactAddress2", addr);

    setLink("footerLinkA", cfg.facebookUrl);
    setLink("footerLinkB", cfg.instagramUrl);
    setLink("footerLinkC", cfg.whatsappUrl);
    setLink("drawerLinkA", cfg.facebookUrl);
    setLink("drawerLinkB", cfg.instagramUrl);
    setLink("drawerLinkC", cfg.whatsappUrl);

    // mailto links
    const mailLinks = Array.from(document.querySelectorAll("[data-mailto]"));
    mailLinks.forEach(a => {
      const email = cfg.email || a.getAttribute("data-mailto");
      if (email) a.setAttribute("href", "mailto:" + email);
    });
  }

  const LANG_SHORT = { en: "EN", ku: "\u06a9\u0648", ar: "\u0639\u0631" };
  const isRtlLang = (lang) => lang === "ar" || lang === "ku";

  function setupLanguageDropdown(langSelect) {
    const langWrap = (langSelect ? langSelect.closest(".lang") : null);
    if (!langWrap || langWrap.querySelector(".lang-trigger")) return null;

    langWrap.classList.add("lang--custom");
    const icon = langWrap.querySelector("span[aria-hidden='true']");

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "lang-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    if (icon) {
      icon.classList.add("lang-icon");
      trigger.appendChild(icon);
    }

    const label = document.createElement("span");
    label.className = "lang-label lang-label-full";
    trigger.appendChild(label);

    const labelShort = document.createElement("span");
    labelShort.className = "lang-label lang-label-short";
    trigger.appendChild(labelShort);

    const caret = document.createElement("span");
    caret.className = "lang-caret";
    caret.setAttribute("aria-hidden", "true");
    trigger.appendChild(caret);

    const menu = document.createElement("div");
    menu.className = "lang-menu";
    menu.setAttribute("role", "listbox");
    menu.setAttribute("aria-label", "Language");

    const options = Array.from(langSelect.options).map(opt => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lang-option";
      btn.setAttribute("role", "option");
      btn.setAttribute("data-value", opt.value);
      btn.setAttribute("lang", opt.value);
      btn.setAttribute("dir", isRtlLang(opt.value) ? "rtl" : "ltr");
      const fullSpan = document.createElement("span");
      fullSpan.className = "lang-option-full";
      fullSpan.textContent = opt.textContent;
      fullSpan.setAttribute("lang", opt.value);
      fullSpan.setAttribute("dir", isRtlLang(opt.value) ? "rtl" : "ltr");
      const shortSpan = document.createElement("span");
      shortSpan.className = "lang-option-short";
      shortSpan.textContent = LANG_SHORT[opt.value] || opt.value.toUpperCase();
      shortSpan.setAttribute("lang", opt.value);
      shortSpan.setAttribute("dir", isRtlLang(opt.value) ? "rtl" : "ltr");
      btn.appendChild(fullSpan);
      btn.appendChild(shortSpan);
      btn.addEventListener("click", () => {
        langSelect.value = opt.value;
        langSelect.dispatchEvent(new Event("change", { bubbles: true }));
        setOpen(false);
        trigger.focus();
      });
      menu.appendChild(btn);
      return btn;
    });

    langWrap.insertBefore(trigger, langSelect);
    langWrap.appendChild(menu);

    function setOpen(open) {
      langWrap.classList.toggle("open", open);
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        const current = menu.querySelector("[aria-selected='true']") || options[0];
        if (current) current.focus();
      }
    }

    function sync() {
      const current = langSelect.value;
      const selectedOpt = langSelect.selectedOptions[0];
      label.textContent = selectedOpt ? selectedOpt.textContent : current.toUpperCase();
      labelShort.textContent = LANG_SHORT[current] || current.toUpperCase();
      label.setAttribute("lang", current);
      label.setAttribute("dir", isRtlLang(current) ? "rtl" : "ltr");
      labelShort.setAttribute("lang", current);
      labelShort.setAttribute("dir", isRtlLang(current) ? "rtl" : "ltr");
      options.forEach(btn => {
        const selected = btn.getAttribute("data-value") === current;
        btn.setAttribute("aria-selected", selected ? "true" : "false");
        btn.tabIndex = selected ? 0 : -1;
      });
    }

    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      setOpen(!langWrap.classList.contains("open"));
    });
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    });

    menu.addEventListener("keydown", (e) => {
      const currentIndex = options.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        var nxt = options[Math.min(options.length - 1, currentIndex + 1)]; if (nxt) nxt.focus();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        var prv = options[Math.max(0, currentIndex - 1)]; if (prv) prv.focus();
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (document.activeElement) document.activeElement.click();
      }
    });

    document.addEventListener("click", (e) => {
      if (!langWrap.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });

    sync();
    return { sync };
  }

  function setupDrawerLangSwitcher(langSelect) {
    const panel = $(".drawer-panel");
    const socials = $(".drawer-socials");
    if (!panel || !socials || !langSelect) return null;

    const LANG_LABELS = { en: "English", ku: "\u06a9\u0648\u0631\u062f\u06cc", ar: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" };
    const wrap = document.createElement("div");
    wrap.className = "drawer-lang";
    wrap.setAttribute("role", "radiogroup");
    wrap.setAttribute("aria-label", "Language");

    const buttons = Object.entries(LANG_LABELS).map(([val, label]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "drawer-lang-btn";
      btn.setAttribute("role", "radio");
      btn.setAttribute("data-value", val);
      btn.setAttribute("lang", val);
      btn.setAttribute("dir", isRtlLang(val) ? "rtl" : "ltr");
      btn.textContent = label;
      btn.addEventListener("click", () => {
        langSelect.value = val;
        langSelect.dispatchEvent(new Event("change", { bubbles: true }));
        if (typeof setDrawer === "function") setDrawer(false);
      });
      wrap.appendChild(btn);
      return btn;
    });

    panel.insertBefore(wrap, socials);

    function sync() {
      const current = langSelect.value;
      buttons.forEach(btn => {
        const active = btn.getAttribute("data-value") === current;
        btn.classList.toggle("active", active);
        btn.setAttribute("aria-checked", active ? "true" : "false");
      });
    }

    sync();
    return { sync };
  }

  const langSelect = $("#langSelect");
  const urlLang = new URLSearchParams(location.search).get("lang");
  const stored = (urlLang && window.I18N && window.I18N[urlLang]) ? urlLang : (localStorage.getItem("nhc_lang") || "ku");

  // Converts the current pathname to a /lang/page canonical URL
  function toCanonicalLangPath(lang) {
    const page = location.pathname
      .replace(/^\//, "")
      .replace(/\.html$/, "")
      .replace(/^(en|ku|ar)(\/|$)/, ""); // strip any existing lang prefix
    return "/" + lang + (page ? "/" + page : "") + (location.hash || "");
  }

  if (langSelect) {
    langSelect.value = stored;
    applyLanguage(stored);
    applySiteConfig();
    const isLocalDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isLocalDev) history.replaceState(null, "", toCanonicalLangPath(stored));
    const langUI = setupLanguageDropdown(langSelect);
    if (langUI) langUI.sync();
    const drawerLangUI = setupDrawerLangSwitcher(langSelect);
    if (drawerLangUI) drawerLangUI.sync();
    langSelect.addEventListener("change", () => {
      const shouldPreserveScroll = isHomePath(window.location.pathname);
      const pageTopBeforeLangChange = shouldPreserveScroll
        ? (window.scrollY || window.pageYOffset || 0)
        : 0;
      const newLang = langSelect.value;
      localStorage.setItem("nhc_lang", newLang);
      history.replaceState(null, "", toCanonicalLangPath(newLang));
      applyLanguage(newLang);
      applySiteConfig();
      if (langUI) langUI.sync();
      if (drawerLangUI) drawerLangUI.sync();
      if (shouldPreserveScroll) {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const pageTopAfterLangChange = window.scrollY || window.pageYOffset || 0;
          if (Math.abs(pageTopAfterLangChange - pageTopBeforeLangChange) > 1) {
            window.scrollTo({ top: pageTopBeforeLangChange, behavior: "auto" });
          }
        }));
      }
    });
  } else {
    applyLanguage(stored);
    applySiteConfig();
  }

  // Carry lang when navigating between pages (uses ?lang= for the actual request,
  // which gets replaceState'd to /lang/page on load)
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented) return;
    const a = e.target.closest("a[href]");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || /^(https?:|\/\/|mailto:|tel:|#)/.test(href)) return;
    const currentLang = (langSelect && langSelect.value) || localStorage.getItem("nhc_lang") || "ku";
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return;
      url.searchParams.set("lang", currentLang);
      e.preventDefault();
      location.href = url.toString();
    } catch (_) {}
  });

  // Count-up animation (home only)
  function animateCounters() {
    // Dynamically set years of experience target before starting
    const yearsCounter = document.getElementById("yearsCountOdometer");
    if (yearsCounter) {
      const estYear = (window.SITE_CONFIG && window.SITE_CONFIG.establishedYear) || 2012;
      yearsCounter.setAttribute("data-target", Math.max(0, new Date().getFullYear() - estYear));
    }

    const counters = $$(".num[data-target]");
    if (!counters.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        io.unobserve(el);
        const target = parseInt(el.getAttribute("data-target"), 10);
        const suffix = el.getAttribute("data-suffix") || "";
        const duration = 900;
        const start = performance.now();
        function tick(now) {
          const t = Math.min(1, (now - start) / duration);
          const val = Math.floor(target * (0.15 + 0.85 * t));
          el.textContent = val.toLocaleString() + suffix;
          if (t < 1) requestAnimationFrame(tick);
          else el.textContent = target.toLocaleString() + suffix;
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: .35 });
    counters.forEach(c => io.observe(c));
  }
  animateCounters();

  // Scroll reveal animations
  function setupReveal() {
    const nodes = $$(".reveal");
    if (!nodes.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("in-view");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.18 });
    nodes.forEach(n => io.observe(n));
  }
  setupReveal();
  window.setupReveal = setupReveal;


  // Scroll indicator (home)
  const scrollIndicator = $(".scroll-indicator");
  if (scrollIndicator) {
    let ticking = false;
    const updateIndicator = () => {
      const hide = window.scrollY > 10;
      scrollIndicator.classList.toggle("hidden", hide);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateIndicator();
        ticking = false;
      });
    };
    updateIndicator();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // Header scroll effect (compact + shadow on scroll)
  const header = $(".header");
  if (header) {
    let headerTicking = false;
    const syncHeaderOffset = () => {
      document.documentElement.style.setProperty("--header-sticky-offset", `${header.offsetHeight}px`);
    };
    const updateHeader = () => {
      const y = window.scrollY;
      const isScrolled = header.classList.contains("scrolled");
      // Hysteresis: add class at 50px, remove only once back below 30px.
      // Prevents the class from flickering when header height change nudges scrollY
      // back and forth across a single threshold.
      if (!isScrolled && y > 50) header.classList.add("scrolled");
      else if (isScrolled && y < 30) header.classList.remove("scrolled");
      syncHeaderOffset();
    };
    const onHeaderScroll = () => {
      if (headerTicking) return;
      headerTicking = true;
      requestAnimationFrame(() => {
        updateHeader();
        headerTicking = false;
      });
    };
    updateHeader();
    window.addEventListener("scroll", onHeaderScroll, { passive: true });
    window.addEventListener("resize", syncHeaderOffset, { passive: true });
    header.addEventListener("transitionend", syncHeaderOffset);
  }


  // Modal helpers
  const modal = $("#modal");
  const modalTitle = $("#modalTitle");
  const modalContent = $("#modalContent");
  const modalClose = $("#modalClose");
  const modalBox = (modal ? modal.querySelector(".box") : null);
  let lastFocusedElement = null;

  if (modal) modal.setAttribute("aria-hidden", "true");

  const getFocusable = () => {
    if (!modalBox) return [];
    return Array.from(modalBox.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((el) => !el.hasAttribute("aria-hidden"));
  };

  const onModalKeydown = (e) => {
    if (!modal || !modal.classList.contains("open")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = getFocusable();
    if (!focusable.length) {
      e.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (modalBox && !modalBox.contains(active)) {
      e.preventDefault();
      first.focus({ preventScroll: true });
      return;
    }
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus({ preventScroll: true });
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus({ preventScroll: true });
    }
  };

  function openModal(title, html) {
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    const lang = ($("#langSelect") ? $("#langSelect").value : null) || "ku";
    const modalDict = (window.I18N && window.I18N[lang]) ? window.I18N[lang] : (window.I18N ? window.I18N.en : null) || {};
    modalTitle.textContent = title || modalDict["modal.details"] || "Details";
    modalContent.innerHTML = html || "";
    modalContent.scrollTop = 0;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onModalKeydown);
    requestAnimationFrame(() => {
      modalContent.scrollTop = 0;
      const focusable = getFocusable();
      const target = focusable[0] || modalClose;
      if (target) target.focus({ preventScroll: true });
    });
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    modalContent.scrollTop = 0;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onModalKeydown);

    // Clear URL hash when closing modal
    if (window.location.hash) {
      history.replaceState(null, null, window.location.pathname + window.location.search);
    }

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus({ preventScroll: true });
    }
  }
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  window.NHC_MODAL = { open: openModal, close: closeModal };

  // Page-specific renderers
  const page = document.body.getAttribute("data-page");

  function fmtDate(iso, langOverride) {
    const lang = langOverride || "ku";
    const ymdMatch = typeof iso === "string" ? iso.match(/^(\d{4})-(\d{2})-(\d{2})/) : null;
    if ((lang === "ar" || lang === "ku") && ymdMatch) {
      return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1]}`;
    }
    try {
      const d = ymdMatch
        ? new Date(Number(ymdMatch[1]), Number(ymdMatch[2]) - 1, Number(ymdMatch[3]))
        : new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      if (lang === "ar" || lang === "ku") {
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        return `${dd}/${mm}/${d.getFullYear()}`;
      }
      return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
    } catch (_) { return iso; }
  }

  // NEWS
  function renderNews(targetSelector, limit) {
    const host = $(targetSelector);
    if (!host || !window.NEWS_DATA) return;
    const data = [...window.NEWS_DATA].sort((a, b) => (a.date < b.date ? 1 : -1));
    const items = limit ? data.slice(0, limit) : data;
    const total = items.length + 1;

    const lang = ($("#langSelect") ? $("#langSelect").value : null) || "ku";
    const dict = (window.I18N && window.I18N[lang]) ? window.I18N[lang] : (window.I18N ? window.I18N.en : null) || {};
    const seeAllText = dict["section.latestnews.seeall"] || "See All Activities";
    const readMoreText = dict["news.readmore"] || "Read more";

    const cards = items.map((p, index) => {
      const image = p.image || "/assets/img/heroBackground-optimized.jpg";
      const position = index + 1;
      return `
        <article class="news-mini" data-id="${p.id}" role="listitem" aria-roledescription="slide" aria-label="${position} of ${total}">
          <div class="news-mini-media" style="background-image:url('${image}')" aria-hidden="true"></div>
          <div class="news-mini-meta">
            <div class="news-mini-date">${fmtDate(p.date, lang)}</div>
            <a class="news-mini-title" href="news.html#${p.id}">${p.title}</a>
          </div>
          <p class="news-mini-excerpt">${p.excerpt || ""}</p>
          <a class="btn ghost" href="news.html#${p.id}">${readMoreText}</a>
        </article>
      `;
    }).join("");

    const seeAllCard = `
      <a class="news-mini news-see-all" href="news.html" role="listitem" aria-roledescription="slide" aria-label="${total} of ${total}">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>${seeAllText}</span>
      </a>
    `;

    host.innerHTML = cards + seeAllCard;
  }

  function setupActivitiesSlider() {
    const track = $("#homeNews");
    const prevBtn = $(".activities-arrow.prev");
    const nextBtn = $(".activities-arrow.next");
    const slider = (track ? track.closest(".activities-slider") : null);
    const statusEl = (slider ? slider.querySelector(".activities-status") : null);
    const dotsContainer = (slider ? slider.querySelector(".activities-dots") : null);

    if (!track || !prevBtn || !nextBtn || !slider) return;
    if (slider.dataset.activitiesSliderInit === "true") return;

    const isRTL = () => document.documentElement.getAttribute("dir") === "rtl";
    const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let slideIndex = 0;

    // Guard flag for the scroll listener — prevents it from interfering
    // when arrows / dots / keyboard drive the scroll programmatically.
    let programmaticScroll = false;
    let programmaticScrollTimer = null;

    // Get all slides
    const getSlides = () => Array.from(track.querySelectorAll(".news-mini"));

    // Get how many slides are visible in viewport
    const getVisibleCount = () => {
      const slides = getSlides();
      if (!slides.length) return 1;
      const card = slides[0];
      const cardRect = card.getBoundingClientRect();
      const cardWidth = cardRect.width;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 16;
      const availableWidth = track.clientWidth;
      return Math.max(1, Math.floor((availableWidth + gap) / (cardWidth + gap)));
    };

    // Navigate to specific slide
    const goToSlide = (index) => {
      const slides = getSlides();
      if (!slides.length) return;

      const visibleCount = getVisibleCount();
      const maxIndex = Math.max(0, slides.length - visibleCount);
      slideIndex = Math.max(0, Math.min(index, maxIndex));

      const targetSlide = slides[slideIndex];
      if (targetSlide) {
        // Suppress the scroll listener so it doesn't fight this programmatic scroll
        programmaticScroll = true;
        if (programmaticScrollTimer) clearTimeout(programmaticScrollTimer);
        const behavior = prefersReducedMotion() ? "auto" : "smooth";
        targetSlide.scrollIntoView({ behavior, inline: "start", block: "nearest" });
        // Clear the guard after the animation is done (~400ms is safe for smooth scroll)
        programmaticScrollTimer = setTimeout(() => { programmaticScroll = false; }, 400);
        try {
          localStorage.setItem("nhc_activities_slide", slideIndex.toString());
        } catch (e) {}
      }

      updateUI();
    };

    // Update UI state
    const updateUI = () => {
      const slides = getSlides();
      if (!slides.length) {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        if (statusEl) statusEl.textContent = "0 / 0";
        return;
      }

      const visibleCount = getVisibleCount();
      const maxIndex = Math.max(0, slides.length - visibleCount);

      // Update buttons
      prevBtn.disabled = slideIndex === 0;
      nextBtn.disabled = slideIndex >= maxIndex;
      prevBtn.setAttribute("aria-disabled", prevBtn.disabled ? "true" : "false");
      nextBtn.setAttribute("aria-disabled", nextBtn.disabled ? "true" : "false");

      // Update status
      if (statusEl) {
        statusEl.textContent = `${slideIndex + 1} / ${slides.length}`;
      }

      // Update dots
      if ((dotsContainer ? dotsContainer.children.length : 0)) {
        const dotCount = dotsContainer.children.length;
        const activeDot = Math.round((slideIndex / maxIndex) * (dotCount - 1)) || 0;
        Array.from(dotsContainer.children).forEach((dot, idx) => {
          dot.setAttribute("aria-current", idx === activeDot ? "true" : "false");
        });
      }

      // Update slides aria-current
      slides.forEach((slide, idx) => {
        slide.setAttribute("aria-current", idx === slideIndex ? "true" : "false");
      });
    };

    // Build dots
    const buildDots = () => {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = "";

      const slides = getSlides();
      if (!slides.length) return;

      const visibleCount = getVisibleCount();
      const maxIndex = Math.max(0, slides.length - visibleCount);
      const dotLimit = window.matchMedia("(max-width: 768px)").matches ? 6 : 4;
      const dotCount = Math.max(1, Math.min(dotLimit, maxIndex + 1));

      for (let i = 0; i < dotCount; i++) {
        const targetIndex = Math.round((i / (dotCount - 1)) * maxIndex) || 0;
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "activities-dot";
        dot.setAttribute("data-slide", targetIndex.toString());
        dot.addEventListener("click", () => goToSlide(targetIndex));
        dot.addEventListener("keydown", (e) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
          e.preventDefault();
          const current = Array.from(dotsContainer.children).indexOf(dot);
          let next = current;
          if (e.key === "Home") next = 0;
          else if (e.key === "End") next = dotsContainer.children.length - 1;
          else if (e.key === "ArrowLeft") next = current === 0 ? dotsContainer.children.length - 1 : current - 1;
          else if (e.key === "ArrowRight") next = current === dotsContainer.children.length - 1 ? 0 : current + 1;
          const nextDot = dotsContainer.children[next];
          if (nextDot) {
            nextDot.focus();
            goToSlide(parseInt(nextDot.getAttribute("data-slide")) || 0);
          }
        });
        dotsContainer.appendChild(dot);
      }
    };

    // Arrow buttons
    prevBtn.addEventListener("click", () => goToSlide(slideIndex - 1));
    nextBtn.addEventListener("click", () => goToSlide(slideIndex + 1));

    // Keyboard on slider
    slider.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      e.preventDefault();
      const direction = (isRTL() && e.key === "ArrowLeft") || (!isRTL() && e.key === "ArrowRight") ? 1 : -1;
      goToSlide(slideIndex + direction);
    });

    // Language change — reset to first slide without scrollIntoView (which drags the page down)
    const langSelect = document.getElementById("langSelect");
    if (langSelect) {
      langSelect.addEventListener("change", () => {
        slideIndex = 0;
        track.scrollLeft = 0;
        buildDots();
        updateUI();
      });
    }

    // Resize
    window.addEventListener("resize", () => {
      buildDots();
      updateUI();
    });

    // ── Native scroll sync (mobile swipe only) ──────────
    // The programmaticScroll guard (declared above) prevents this listener
    // from interfering when arrows / dots / keyboard drive the scroll.
    const onTrackScroll = () => {
      // Ignore scroll events caused by JS-driven navigation (arrows, dots, keyboard)
      if (programmaticScroll) return;

      const slides = getSlides();
      if (!slides.length) return;
      
      const trackRect = track.getBoundingClientRect();
      const rtl = isRTL();
      let closest = 0;
      let closestDist = Infinity;
      
      slides.forEach((slide, i) => {
        const rect = slide.getBoundingClientRect();
        const dist = Math.abs(rtl ? (rect.right - trackRect.right) : (rect.left - trackRect.left));
        if (dist < closestDist) { closestDist = dist; closest = i; }
      });
      
      if (closest !== slideIndex) {
        slideIndex = closest;
        updateUI();
      }
    };
    track.addEventListener("scroll", onTrackScroll, { passive: true });

    // Disable PC touchpad/mousewheel horizontal scrolling
    track.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
      }
    }, { passive: false });

    // Initialize
    buildDots();
    updateUI();

    // Restore saved position
    setTimeout(() => {
      try {
        const saved = localStorage.getItem("nhc_activities_slide");
        if (saved) {
          const index = parseInt(saved, 10);
          if (!isNaN(index) && index > 0) goToSlide(index);
        }
      } catch (e) {}
    }, 100);

    slider.dataset.activitiesSliderInit = "true";
  }

  // setupNewsPage() was replaced by activities-loader.js
  function setupNewsPage() {
    // No-op: activities page is handled by activities-loader.js
    const list = $("#newsList"); // kept only to silence "unused" warnings
    if (!list) return;

    const q = $("#newsSearch");
    const tagSel = $("#newsTag");
    const tagChips = $("#newsTagChips");
    const count = $("#newsCount");

    const getShareUrl = (id) => {
      const base = window.location.href.split("#")[0];
      return `${base}#${id}`;
    };

    const copyToClipboard = async (text) => {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (_) {
          // fall through
        }
      }
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "absolute";
      field.style.left = "-9999px";
      document.body.appendChild(field);
      field.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (_) {
        ok = false;
      }
      document.body.removeChild(field);
      return ok;
    };

    const flashShareHint = (btn, message) => {
      const original = btn.getAttribute("title") || "Copy link";
      btn.setAttribute("title", message);
      btn.setAttribute("aria-label", message);
      window.setTimeout(() => {
        btn.setAttribute("title", original);
        btn.setAttribute("aria-label", original);
      }, 1500);
    };

    const buildAnnouncementModal = (post) => {
      const date = (post ? post.date : null) || "";
      return `
        <div class="modal-meta">
          <span class="meta-label">Date</span>
          <time datetime="${date}">${fmtDate(date)}</time>
        </div>
        <hr class="sep"/>
        ${post.contentHtml}
      `;
    };

    const allTags = new Set();
    window.NEWS_DATA.forEach(p => (p.tags || []).forEach(t => allTags.add(t)));
    const tagList = Array.from(allTags).sort();
    if (tagSel) {
      tagSel.innerHTML = `<option value="">All topics</option>` + tagList.map(t => `<option value="${t}">${t}</option>`).join("");
    }
    if (tagChips) {
      tagChips.innerHTML = [
        `<button class="chip" type="button" data-tag="">All topics</button>`,
        ...tagList.map(t => `<button class="chip" type="button" data-tag="${t}">${t}</button>`)
      ].join("");
      $$(".chip", tagChips).forEach(btn => {
        btn.addEventListener("click", () => {
          const nextTag = btn.getAttribute("data-tag") || "";
          if (tagSel) {
            tagSel.value = nextTag;
          }
          apply();
        });
      });
    }

    const syncChips = (activeTag) => {
      if (!tagChips) return;
      $$(".chip", tagChips).forEach(btn => {
        const tag = btn.getAttribute("data-tag") || "";
        const isActive = tag === (activeTag || "");
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    };

    function apply() {
      const query = (q && q.value ? q.value : "").trim().toLowerCase();
      const tag = (tagSel && tagSel.value ? tagSel.value : "");
      const data = [...window.NEWS_DATA].sort((a, b) => (a.date < b.date ? 1 : -1)).filter(p => {
        const matchQ = !query || (p.title + p.excerpt + p.contentHtml).toLowerCase().includes(query);
        const matchT = !tag || (p.tags || []).includes(tag);
        return matchQ && matchT;
      });

      if (count) {
        const total = data.length;
        count.textContent = `${total} ${total === 1 ? "activity" : "activities"}`;
      }
      syncChips(tag);

      if (!data.length) {
        list.innerHTML = `
          <div class="news-empty">
            No activities match your search. Try another keyword or topic.
          </div>
        `;
        setupReveal();
        return;
      }

      list.innerHTML = data.map((p, index) => {
        const tags = (p.tags || []).slice(0, 4).map(t => `<span class="news-tag">${t}</span>`).join("");
        const preview = (p.excerpt || "").trim();
        const featured = index === 0;
        const mediaClass = p.image ? "" : " is-empty";
        const mediaStyle = p.image ? ` style="background-image: url('${p.image}')"` : "";
        const actionClass = featured ? "primary" : "secondary";
        const featureLabel = featured ? `<span class="news-feature">Featured</span>` : "";
        return `
          <article class="news-card${featured ? " featured" : ""} reveal" data-id="${p.id}">
            <div class="news-media${mediaClass}"${mediaStyle}>
              ${featureLabel}
            </div>
            <div class="news-body">
              <div class="news-top">
                <time class="news-date" datetime="${p.date}">${fmtDate(p.date)}</time>
                <div class="news-tags">${tags}</div>
              </div>
              <h3>${p.title}</h3>
              <p class="small">${preview}</p>
              <div class="news-actions">
                <button class="btn ${actionClass}" data-open="${p.id}" type="button">Read more</button>
                <button class="icon-btn" data-share="${p.id}" type="button" aria-label="Copy link" title="Copy link">
                  <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 1 0-7.07-7.07L10 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M14 11a5 5 0 0 0-7.07 0l-2.12 2.12a5 5 0 1 0 7.07 7.07L14 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </article>
        `;
      }).join("");

      setupReveal();

      $$("[data-open]").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-open");
          const post = window.NEWS_DATA.find(x => x.id === id);
          if (post) {
            openModal(post.title, buildAnnouncementModal(post));
            history.replaceState(null, "", `#${post.id}`);
          }
        });
      });

      $$("[data-share]").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-share");
          if (!id) return;
          const ok = await copyToClipboard(getShareUrl(id));
          flashShareHint(btn, ok ? "Link copied" : "Copy failed");
        });
      });
    }

    if (q) q.addEventListener("input", apply);
    if (tagSel) tagSel.addEventListener("change", apply);
    apply();

    // Open if hash
    const openFromHash = () => {
      const id = (location.hash || "").replace("#", "").trim();
      if (!id) return;
      const post = window.NEWS_DATA.find(x => x.id === id);
      if (post) {
        openModal(post.title, buildAnnouncementModal(post));
      }
    };
    window.addEventListener("hashchange", openFromHash);
    openFromHash();
  }

  // Publications
  function setupPublicationsPage() {
    if (!window.PUBLICATIONS_DATA) return;
    const list = $("#pubList");
    if (!list) return;

    const q = $("#pubSearch");
    const catSel = $("#pubCategory");

    const cats = new Set();
    window.PUBLICATIONS_DATA.forEach(p => cats.add(p.category || "Other"));
    if (catSel) {
      catSel.innerHTML = `<option value="">All categories</option>` + Array.from(cats).sort().map(c => `<option value="${c}">${c}</option>`).join("");
    }

    function apply() {
      const query = (q && q.value ? q.value : "").trim().toLowerCase();
      const cat = (catSel && catSel.value ? catSel.value : "");
      const data = window.PUBLICATIONS_DATA.filter(p => {
        const matchQ = !query || (p.title + p.author + p.description).toLowerCase().includes(query);
        const matchC = !cat || (p.category === cat);
        return matchQ && matchC;
      });

      list.innerHTML = data.map(p => `
        <article class="item">
          <h3>${p.title}</h3>
          <div class="meta">
            <span>👤 ${p.author || "—"}</span>
            <span>📌 ${p.category || "—"}</span>
            <span>🗓️ ${p.year || "—"}</span>
          </div>
          <p class="small">${p.description || ""}</p>
          <div class="actions">
            <a class="btn primary" href="${p.file}" download>${(window.NHC_ICONS ? window.NHC_ICONS.download : null) || ""} Download PDF</a>
            <a class="btn secondary" href="${p.file}" target="_blank" rel="noopener">Preview</a>
          </div>
        </article>
      `).join("") || `<div class="note">No publications match your filters.</div>`;
    }

    if (q) q.addEventListener("input", apply);
    if (catSel) catSel.addEventListener("change", apply);
    apply();
  }

  // Tafsir
  function setupTafsirPage() {
    if (!window.TAFSIR_DATA) return;
    const list = $("#tafsirList");
    if (!list) return;

    const q = $("#tafsirSearch");
    const typeSel = $("#tafsirType");
    const speakerSel = $("#tafsirSpeaker");

    const speakers = new Set();
    window.TAFSIR_DATA.forEach(x => speakers.add(x.speaker || "—"));
    if (speakerSel) {
      speakerSel.innerHTML = `<option value="">All speakers</option>` + Array.from(speakers).sort().map(s => `<option value="${s}">${s}</option>`).join("");
    }

    function apply() {
      const query = (q && q.value ? q.value : "").trim().toLowerCase();
      const type = (typeSel && typeSel.value ? typeSel.value : "");
      const speaker = (speakerSel && speakerSel.value ? speakerSel.value : "");
      const data = window.TAFSIR_DATA.filter(x => {
        const matchQ = !query || (x.title + x.series + x.speaker + x.notes).toLowerCase().includes(query);
        const matchT = !type || x.type === type;
        const matchS = !speaker || x.speaker === speaker;
        return matchQ && matchT && matchS;
      });

      list.innerHTML = data.map(x => {
        const meta = `<div class="meta">
          <span>🎙️ ${x.speaker || "—"}</span>
          <span>📚 ${x.series || "—"}</span>
          <span>🗓️ ${fmtDate(x.date)}</span>
          <span>${x.type === "audio" ? "🔊 Audio" : "🎬 Video"}</span>
        </div>`;

        const body = x.type === "audio"
          ? `<audio controls style="width:100%; margin-top:10px">
               <source src="${x.file}" />
               Your browser does not support audio.
             </audio>`
          : `<div class="note" style="margin-top:10px">This item plays in a popup for a clean layout.</div>`;

        const actions = x.type === "video"
          ? `<div class="actions">
               <button class="btn primary" type="button" data-play="${encodeURIComponent(x.embedUrl)}">Play video</button>
               <button class="btn secondary" type="button" data-notes="${x.title.replace(/"/g, '&quot;')}">Notes</button>
             </div>`
          : `<div class="actions">
               <a class="btn secondary" href="${x.file}" target="_blank" rel="noopener">Open audio file</a>
               <button class="btn primary" type="button" data-notes="${x.title.replace(/"/g, '&quot;')}">Notes</button>
             </div>`;

        return `
          <article class="item">
            <h3>${x.title}</h3>
            ${meta}
            <p class="small">${x.notes || ""}</p>
            ${body}
            ${actions}
          </article>
        `;
      }).join("") || `<div class="note">No lectures match your filters.</div>`;

      $$("[data-play]").forEach(btn => {
        btn.addEventListener("click", () => {
          const url = decodeURIComponent(btn.getAttribute("data-play"));
          openModal("Video Lecture", `<div style="position:relative; padding-top:56.25%">
            <iframe src="${url}" title="Video" style="position:absolute; inset:0; width:100%; height:100%; border:0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>`);
        });
      });
      $$("[data-notes]").forEach(btn => {
        btn.addEventListener("click", () => {
          const title = btn.getAttribute("data-notes");
          const item = window.TAFSIR_DATA.find(x => x.title === title);
          if (item) {
            openModal(item.title, `<div class="meta"><span>🎙️ ${item.speaker || "—"}</span><span>📚 ${item.series || "—"}</span><span>🗓️ ${fmtDate(item.date)}</span></div><hr class="sep"/><p>${item.notes || ""}</p>`);
          }
        });
      });
    }

    if (q) q.addEventListener("input", apply);
    if (typeSel) typeSel.addEventListener("change", apply);
    if (speakerSel) speakerSel.addEventListener("change", apply);
    apply();
  }

  // Contact page (mailto + social links)
  function setupContactPage() {
    const form = $("#contactForm");
    if (!form) return;
    const sc = window.SITE_CONFIG || {};
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#cName").value.trim();
      const email = $("#cEmail").value.trim();
      const msg = $("#cMsg").value.trim();
      const subject = encodeURIComponent(`Website Contact — ${name || "New message"}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${msg}\n\n— Sent from the website contact form.`);
      window.location.href = `mailto:${sc.email || "support@bnkayhalabjaytaza.org"}?subject=${subject}&body=${body}`;
    });

    // Populate info card links
    const phoneCard = $("#contactPhoneCard");
    const emailCard = $("#contactEmailCard");
    if (phoneCard && sc.phone) phoneCard.href = "tel:" + sc.phone.replace(/\s/g, "");
    if (emailCard && sc.email) emailCard.href = "mailto:" + sc.email;

    // Populate social links
    const fb = $("#contactFacebook");
    const ig = $("#contactInstagram");
    const wa = $("#contactWhatsapp");
    if (fb && sc.facebookUrl) fb.href = sc.facebookUrl;
    if (ig && sc.instagramUrl) ig.href = sc.instagramUrl;
    if (wa && sc.whatsappUrl) wa.href = sc.whatsappUrl;
  }

  // Home previews
  if (page === "home") {
    // Listen for news data to be ready
    window.addEventListener('newsDataReady', () => {
      renderNews("#homeNews");
      setupActivitiesSlider();
    });

    // Also try to render immediately in case data is already loaded
    if (window.NEWS_DATA && window.NEWS_DATA.length > 0) {
      renderNews("#homeNews");
      setupActivitiesSlider();
    }

    // Re-render cards and reset slider position whenever the language changes
    // so RTL/LTR layout and translations update instantly.
    document.addEventListener('languageChanged', () => {
      if (window.NEWS_DATA && window.NEWS_DATA.length > 0) {
        renderNews("#homeNews");
        // Give the browser one frame to apply the new direction before resetting
        requestAnimationFrame(() => setupActivitiesSlider());
      }
    });
  }
  if (page === "news") {
    // load data script already included in page
    setupNewsPage();
  }
  if (page === "publications") {
    setupPublicationsPage();
  }
  if (page === "tafsir") {
    setupTafsirPage();
  }
  if (page === "contact") {
    setupContactPage();
  }

  // Navigation uses native full-page requests for reliability.

  // Expose icons (used in dynamic templates)
  window.NHC_ICONS = {
    download: `<span aria-hidden="true" style="display:inline-flex; margin-right:6px; vertical-align:-2px">${(document.getElementById("svgDownloadIcon") ? document.getElementById("svgDownloadIcon").innerHTML : "") || ""}</span>`
  };
})();
