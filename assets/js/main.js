(function(){
  const $ = (q,root=document)=>root.querySelector(q);
  const $$ = (q,root=document)=>Array.from(root.querySelectorAll(q));

  // Mobile menu
  const menuBtn = $("#menuBtn");
  const mobileDrawer = $("#mobileDrawer");
  const drawerPanel = $(".drawer-panel", mobileDrawer || undefined);
  if(menuBtn && mobileDrawer){
    const setDrawer = (open)=>{
      mobileDrawer.classList.toggle("open", open);
      document.body.classList.toggle("drawer-open", open);
      menuBtn.classList.toggle("is-active", open);
    };
    menuBtn.addEventListener("click", ()=>{
      const isOpen = mobileDrawer.classList.contains("open");
      setDrawer(!isOpen);
    });
    mobileDrawer.addEventListener("click", (e)=>{
      if(e.target === mobileDrawer) setDrawer(false);
    });
    $$("a", drawerPanel || mobileDrawer).forEach(link=>{
      link.addEventListener("click", ()=>setDrawer(false));
    });
  }

  // i18n
  function applyLanguage(lang){
    const dict = (window.I18N && window.I18N[lang]) ? window.I18N[lang] : window.I18N.en;
    // Direction rules
    const rtl = (lang === "ar" || lang === "ku");
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.body.setAttribute("dir", rtl ? "rtl" : "ltr");

    $$("[data-i18n]").forEach(el=>{
      const key = el.getAttribute("data-i18n");
      if(dict[key]) el.textContent = dict[key];
    });
  }

  // Site config (contact/social)
  function applySiteConfig(){
    const cfg = window.SITE_CONFIG || {};
    const setText = (id, val)=>{ const el = document.getElementById(id); if(el) el.textContent = val || ""; };
    const setLink = (id, val)=>{
      const el = document.getElementById(id);
      if(!el) return;
      el.dataset.url = val || "";
      if(el.dataset.bound === "true") return;
      el.addEventListener("click", (e)=>{
        const targetUrl = el.dataset.url;
        if(!targetUrl) return;
        e.preventDefault();
        window.open(targetUrl, "_blank", "noopener");
      });
      el.dataset.bound = "true";
    };

    setText("contactPhone", cfg.phone);
    setText("contactEmail", cfg.email);
    setText("contactAddress", cfg.address);

    setText("contactPhone2", cfg.phone);
    setText("contactEmail2", cfg.email);
    setText("contactAddress2", cfg.address);

    setLink("footerLinkA", cfg.facebookUrl);
    setLink("footerLinkB", cfg.instagramUrl);
    setLink("footerLinkC", cfg.whatsappUrl);
    setLink("drawerLinkA", cfg.facebookUrl);
    setLink("drawerLinkB", cfg.instagramUrl);
    setLink("drawerLinkC", cfg.whatsappUrl);

    // mailto links
    const mailLinks = Array.from(document.querySelectorAll("[data-mailto]"));
    mailLinks.forEach(a=>{
      const email = cfg.email || a.getAttribute("data-mailto");
      if(email) a.setAttribute("href", "mailto:" + email);
    });
  }

  function setupLanguageDropdown(langSelect){
    const langWrap = langSelect?.closest(".lang");
    if(!langWrap || langWrap.querySelector(".lang-trigger")) return null;

    langWrap.classList.add("lang--custom");
    const icon = langWrap.querySelector("span[aria-hidden='true']");

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "lang-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    if(icon){
      icon.classList.add("lang-icon");
      trigger.appendChild(icon);
    }

    const label = document.createElement("span");
    label.className = "lang-label";
    trigger.appendChild(label);

    const caret = document.createElement("span");
    caret.className = "lang-caret";
    caret.setAttribute("aria-hidden", "true");
    trigger.appendChild(caret);

    const menu = document.createElement("div");
    menu.className = "lang-menu";
    menu.setAttribute("role", "listbox");
    menu.setAttribute("aria-label", "Language");

    const options = Array.from(langSelect.options).map(opt=>{
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lang-option";
      btn.setAttribute("role", "option");
      btn.setAttribute("data-value", opt.value);
      btn.textContent = opt.textContent;
      btn.addEventListener("click", ()=>{
        langSelect.value = opt.value;
        langSelect.dispatchEvent(new Event("change", {bubbles:true}));
        setOpen(false);
        trigger.focus();
      });
      menu.appendChild(btn);
      return btn;
    });

    langWrap.insertBefore(trigger, langSelect);
    langWrap.appendChild(menu);

    function setOpen(open){
      langWrap.classList.toggle("open", open);
      trigger.setAttribute("aria-expanded", open ? "true" : "false");
      if(open){
        const current = menu.querySelector("[aria-selected='true']") || options[0];
        current?.focus();
      }
    }

    function sync(){
      const current = langSelect.value;
      const selectedOpt = langSelect.selectedOptions[0];
      label.textContent = selectedOpt ? selectedOpt.textContent : current.toUpperCase();
      options.forEach(btn=>{
        const selected = btn.getAttribute("data-value") === current;
        btn.setAttribute("aria-selected", selected ? "true" : "false");
        btn.tabIndex = selected ? 0 : -1;
      });
    }

    trigger.addEventListener("click", (e)=>{
      e.preventDefault();
      setOpen(!langWrap.classList.contains("open"));
    });
    trigger.addEventListener("keydown", (e)=>{
      if(e.key === "ArrowDown" || e.key === "Enter" || e.key === " "){
        e.preventDefault();
        setOpen(true);
      }
      if(e.key === "Escape") setOpen(false);
    });

    menu.addEventListener("keydown", (e)=>{
      const currentIndex = options.indexOf(document.activeElement);
      if(e.key === "ArrowDown"){
        e.preventDefault();
        options[Math.min(options.length - 1, currentIndex + 1)]?.focus();
      }
      if(e.key === "ArrowUp"){
        e.preventDefault();
        options[Math.max(0, currentIndex - 1)]?.focus();
      }
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        document.activeElement?.click();
      }
    });

    document.addEventListener("click", (e)=>{
      if(!langWrap.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", (e)=>{
      if(e.key === "Escape") setOpen(false);
    });

    sync();
    return { sync };
  }

  const langSelect = $("#langSelect");
  const stored = localStorage.getItem("nhc_lang") || "en";
  if(langSelect){
    langSelect.value = stored;
    applyLanguage(stored);
    applySiteConfig();
    const langUI = setupLanguageDropdown(langSelect);
    langUI?.sync();
    langSelect.addEventListener("change", ()=>{
      localStorage.setItem("nhc_lang", langSelect.value);
      applyLanguage(langSelect.value);
      applySiteConfig();
      langUI?.sync();
    });
  } else {
    applyLanguage(stored);
    applySiteConfig();
  }

  // Count-up animation (home only)
  function animateCounters(){
    const counters = $$(".num[data-target]");
    if(!counters.length) return;
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(!e.isIntersecting) return;
        const el = e.target;
        io.unobserve(el);
        const target = parseInt(el.getAttribute("data-target"),10);
        const suffix = el.getAttribute("data-suffix") || "";
        const duration = 900;
        const start = performance.now();
        function tick(now){
          const t = Math.min(1,(now-start)/duration);
          const val = Math.floor(target * (0.15 + 0.85*t));
          el.textContent = val.toLocaleString() + suffix;
          if(t<1) requestAnimationFrame(tick);
          else el.textContent = target.toLocaleString() + suffix;
        }
        requestAnimationFrame(tick);
      });
    }, {threshold: .35});
    counters.forEach(c=>io.observe(c));
  }
  animateCounters();

  // Scroll reveal animations
  function setupReveal(){
    const nodes = $$(".reveal");
    if(!nodes.length) return;
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add("in-view");
          io.unobserve(e.target);
        }
      });
    }, {threshold: 0.18});
    nodes.forEach(n=>io.observe(n));
  }
  setupReveal();

  // Programs accordion (mobile)
  function setupProgramsAccordion(){
    const programs = $(".programs-new");
    if(!programs) return;
    const cards = $$(".program-card", programs);
    if(!cards.length) return;

    const mql = window.matchMedia("(max-width: 768px)");
    const bodyMap = new Map();
    const setExpandedHeight = (body)=>{
      body.style.maxHeight = body.scrollHeight + "px";
    };
    const resizeObserver = ("ResizeObserver" in window)
      ? new ResizeObserver((entries)=>{
          entries.forEach(entry=>{
            const body = entry.target;
            const toggle = bodyMap.get(body);
            if(!toggle) return;
            if(!programs.classList.contains("is-accordion")) return;
            if(toggle.getAttribute("aria-expanded") !== "true") return;
            setExpandedHeight(body);
          });
        })
      : null;

    const syncHeights = ()=>{
      if(!programs.classList.contains("is-accordion")) return;
      cards.forEach(card=>{
        const toggle = $(".program-toggle", card);
        const body = $(".program-body", card);
        if(!toggle || !body) return;
        if(toggle.getAttribute("aria-expanded") === "true"){
          setExpandedHeight(body);
        }
      });
    };

    const setMode = ()=>{
      const isMobile = mql.matches;
      programs.classList.toggle("is-accordion", isMobile);
      cards.forEach(card=>{
        const toggle = $(".program-toggle", card);
        const body = $(".program-body", card);
        if(!toggle || !body) return;
        if(isMobile){
          toggle.setAttribute("aria-expanded", "false");
          body.setAttribute("aria-hidden", "true");
          body.style.maxHeight = "0px";
          body.classList.remove("active");
        } else {
          toggle.setAttribute("aria-expanded", "true");
          body.setAttribute("aria-hidden", "false");
          body.style.maxHeight = "";
        }
      });
    };

    const closeItem = (toggle, body)=>{
      toggle.setAttribute("aria-expanded", "false");
      body.setAttribute("aria-hidden", "true");
      body.style.maxHeight = "0px";
      body.classList.remove("active");
    };
    const openItem = (toggle, body, card)=>{
      toggle.setAttribute("aria-expanded", "true");
      body.setAttribute("aria-hidden", "false");
      body.classList.add("active");
      body.style.maxHeight = "0px";
      requestAnimationFrame(()=>{
        setExpandedHeight(body);
      });
      setTimeout(()=>{
        card.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    };

    cards.forEach(card=>{
      const toggle = $(".program-toggle", card);
      const body = $(".program-body", card);
      if(!toggle || !body) return;
      bodyMap.set(body, toggle);
      if(resizeObserver) resizeObserver.observe(body);
      toggle.addEventListener("click", ()=>{
        if(!programs.classList.contains("is-accordion")) return;
        const isOpen = toggle.getAttribute("aria-expanded") === "true";
        if(isOpen){
          closeItem(toggle, body);
          return;
        }
        cards.forEach(otherCard=>{
          const otherToggle = $(".program-toggle", otherCard);
          const otherBody = $(".program-body", otherCard);
          if(!otherToggle || !otherBody || otherToggle === toggle) return;
          if(otherToggle.getAttribute("aria-expanded") === "true"){
            closeItem(otherToggle, otherBody);
          }
        });
        openItem(toggle, body, card);
      });
    });

    setMode();
    if(mql.addEventListener){
      mql.addEventListener("change", setMode);
    } else if(mql.addListener){
      mql.addListener(setMode);
    }
    window.addEventListener("resize", syncHeights);
  }
  setupProgramsAccordion();

  // Scroll indicator (home)
  const scrollIndicator = $(".scroll-indicator");
  if(scrollIndicator){
    let ticking = false;
    const updateIndicator = ()=>{
      const hide = window.scrollY > 10;
      scrollIndicator.classList.toggle("hidden", hide);
    };
    const onScroll = ()=>{
      if(ticking) return;
      ticking = true;
      requestAnimationFrame(()=>{
        updateIndicator();
        ticking = false;
      });
    };
    updateIndicator();
    window.addEventListener("scroll", onScroll, {passive:true});
  }


  // Modal helpers
  const modal = $("#modal");
  const modalTitle = $("#modalTitle");
  const modalContent = $("#modalContent");
  const modalClose = $("#modalClose");
  const modalBox = modal?.querySelector(".box");
  let lastFocusedElement = null;

  if(modal) modal.setAttribute("aria-hidden", "true");

  const getFocusable = ()=>{
    if(!modalBox) return [];
    return Array.from(modalBox.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((el)=>!el.hasAttribute("aria-hidden"));
  };

  const onModalKeydown = (e)=>{
    if(!modal || !modal.classList.contains("open")) return;
    if(e.key === "Escape"){
      e.preventDefault();
      closeModal();
      return;
    }
    if(e.key !== "Tab") return;
    const focusable = getFocusable();
    if(!focusable.length){
      e.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if(modalBox && !modalBox.contains(active)){
      e.preventDefault();
      first.focus({preventScroll:true});
      return;
    }
    if(e.shiftKey && active === first){
      e.preventDefault();
      last.focus({preventScroll:true});
    }else if(!e.shiftKey && active === last){
      e.preventDefault();
      first.focus({preventScroll:true});
    }
  };

  function openModal(title, html){
    if(!modal) return;
    lastFocusedElement = document.activeElement;
    modalTitle.textContent = title || "Details";
    modalContent.innerHTML = html || "";
    modalContent.scrollTop = 0;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onModalKeydown);
    requestAnimationFrame(()=>{
      const focusable = getFocusable();
      const target = focusable[0] || modalClose;
      target?.focus({preventScroll:true});
    });
  }
  function closeModal(){
    if(!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onModalKeydown);
    if(lastFocusedElement && typeof lastFocusedElement.focus === "function"){
      lastFocusedElement.focus({preventScroll:true});
    }
  }
  if(modalClose) modalClose.addEventListener("click", closeModal);
  if(modal) modal.addEventListener("click", (e)=>{ if(e.target === modal) closeModal(); });
  window.NHC_MODAL = { open: openModal, close: closeModal };

  // Page-specific renderers
  const page = document.body.getAttribute("data-page");

  function fmtDate(iso){
    try{
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {year:"numeric", month:"short", day:"2-digit"});
    }catch(_){ return iso; }
  }

  // NEWS
  function renderNews(targetSelector, limit){
    const host = $(targetSelector);
    if(!host || !window.NEWS_DATA) return;
    const data = [...window.NEWS_DATA].sort((a,b)=> (a.date<b.date?1:-1));
    const items = limit ? data.slice(0,limit) : data;

    host.innerHTML = items.map((p, index)=>{
      const image = p.image || "assets/img/3.jpg";
      const position = index + 1;
      const total = items.length;
      return `
        <article class="news-mini" data-id="${p.id}" role="listitem" aria-roledescription="slide" aria-label="${position} of ${total}">
          <div class="news-mini-media" style="background-image:url('${image}')" aria-hidden="true"></div>
          <div class="news-mini-meta">
            <div class="news-mini-date">${fmtDate(p.date)}</div>
            <a class="news-mini-title" href="news.html#${p.id}">${p.title}</a>
          </div>
          <p class="news-mini-excerpt">${p.excerpt || ""}</p>
          <a class="btn ghost" href="news.html#${p.id}">Read More <span aria-hidden="true">&rarr;</span></a>
        </article>
      `;
    }).join("");
  }

  function setupActivitiesSlider(){
    const track = $("#homeNews");
    const prev = $(".activities-arrow.prev");
    const next = $(".activities-arrow.next");
    const slider = track?.closest(".activities-slider");
    const status = slider?.querySelector(".activities-status");
    const dots = slider?.querySelector(".activities-dots");
    if(!track || !prev || !next) return;

    const getSlides = ()=>Array.from(track.querySelectorAll(".news-mini"));

    const getLayout = ()=>{
      const card = track.querySelector(".news-mini");
      if(!card) return null;
      const styles = getComputedStyle(track);
      const gapValue = styles.columnGap || styles.gap || "0";
      const gap = parseFloat(gapValue) || 0;
      const paddingLeft = parseFloat(styles.paddingLeft) || 0;
      const paddingRight = parseFloat(styles.paddingRight) || 0;
      const available = Math.max(0, track.clientWidth - paddingLeft - paddingRight);
      const cardWidth = card.getBoundingClientRect().width;
      const step = cardWidth + gap;
      const visibleCount = step ? Math.max(1, Math.floor((available + gap) / step)) : 1;
      return {gap, step, visibleCount};
    };

    const getDotLimit = ()=>window.matchMedia("(max-width: 768px)").matches ? 6 : 4;

    let pendingFocus = false;
    let dotButtons = [];
    let dotMaxStart = 0;
    let dotCount = 0;
    let dotVisibleCount = 0;
    let dotTotal = 0;
    const getDotSlideIndex = (dotIndex)=>{
      if(dotCount <= 1 || dotMaxStart <= 0) return 0;
      return Math.round((dotIndex / (dotCount - 1)) * dotMaxStart);
    };
    const getActiveDotIndex = (slideIndex)=>{
      if(dotCount <= 1 || dotMaxStart <= 0) return 0;
      return Math.round((slideIndex / dotMaxStart) * (dotCount - 1));
    };
    const scrollToIndex = (index, shouldFocus=false)=>{
      const slides = getSlides();
      const clampedIndex = Math.max(0, Math.min(slides.length - 1, index));
      const target = slides[clampedIndex];
      if(!target) return;
      pendingFocus = shouldFocus;
      target.scrollIntoView({behavior: "smooth", inline: "start", block: "nearest"});
      requestAnimationFrame(update);
    };
    const scrollByStep = (dir, shouldFocus=false)=>{
      const step = getLayout()?.step || 0;
      if(!step) return;
      pendingFocus = shouldFocus;
      track.scrollBy({left: dir * step, behavior: "smooth"});
      requestAnimationFrame(update);
    };

    prev.addEventListener("click", ()=>scrollByStep(-1));
    next.addEventListener("click", ()=>scrollByStep(1));

    const handleDotKeydown = (e)=>{
      if(e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      e.stopPropagation();
      const currentIndex = dotButtons.indexOf(e.currentTarget);
      if(currentIndex === -1) return;
      let nextIndex = currentIndex;
      if(e.key === "ArrowLeft") nextIndex = currentIndex === 0 ? dotButtons.length - 1 : currentIndex - 1;
      if(e.key === "ArrowRight") nextIndex = currentIndex === dotButtons.length - 1 ? 0 : currentIndex + 1;
      if(e.key === "Home") nextIndex = 0;
      if(e.key === "End") nextIndex = dotButtons.length - 1;
      dotButtons[nextIndex]?.focus({preventScroll:true});
      scrollToIndex(getDotSlideIndex(nextIndex), false);
    };

    const buildDots = (total, visibleCount)=>{
      if(!dots) return;
      dots.innerHTML = "";
      dotButtons = [];
      dotVisibleCount = visibleCount;
      dotTotal = total;
      for(let i = 0; i < dotCount; i += 1){
        const slideIndex = getDotSlideIndex(i);
        const start = slideIndex + 1;
        const end = Math.min(total, slideIndex + visibleCount);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "activities-dot";
        btn.setAttribute("aria-label", visibleCount > 1 ? `Go to slides ${start}-${end}` : `Go to slide ${start}`);
        btn.addEventListener("click", ()=>scrollToIndex(slideIndex, false));
        btn.addEventListener("keydown", handleDotKeydown);
        dots.appendChild(btn);
        dotButtons.push(btn);
      }
    };

    const updateButtons = ()=>{
      const max = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
      prev.setAttribute("aria-disabled", prev.disabled ? "true" : "false");
      next.setAttribute("aria-disabled", next.disabled ? "true" : "false");
    };

    const updateStatus = ()=>{
      const slides = getSlides();
      const total = slides.length;
      if(!total){
        if(status) status.textContent = "0 / 0";
        if(dots) dots.innerHTML = "";
        dotButtons = [];
        dotCount = 0;
        dotVisibleCount = 0;
        dotTotal = 0;
        return;
      }
      const layout = getLayout();
      const step = layout?.step || 0;
      const visibleCount = layout?.visibleCount || 1;
      dotMaxStart = Math.max(0, total - visibleCount);
      dotCount = Math.max(1, Math.min(getDotLimit(), dotMaxStart + 1, total));
      if(dots && (dotButtons.length !== dotCount || dotVisibleCount !== visibleCount || dotTotal !== total)){
        buildDots(total, visibleCount);
      }
      const offset = Math.abs(track.scrollLeft);
      const rawIndex = step ? Math.round(offset / step) : 0;
      const index = Math.max(0, Math.min(dotMaxStart, rawIndex));
      slides.forEach((slide, idx)=>{
        slide.setAttribute("aria-current", idx === index ? "true" : "false");
      });
      if(dotButtons.length){
        const activeDot = getActiveDotIndex(index);
        dotButtons.forEach((dot, idx)=>{
          dot.setAttribute("aria-current", idx === activeDot ? "true" : "false");
        });
      }
      if(status) status.textContent = `${index + 1} / ${total}`;
      if(pendingFocus){
        const focusTarget = slides[index]?.querySelector("a, button, [tabindex]:not([tabindex='-1'])");
        focusTarget?.focus({preventScroll:true});
        pendingFocus = false;
      }
    };

    const update = ()=>{
      updateButtons();
      updateStatus();
    };

    slider?.addEventListener("keydown", (e)=>{
      if(e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const active = document.activeElement;
      const keepFocus = active && active.classList.contains("activities-arrow");
      scrollByStep(e.key === "ArrowLeft" ? -1 : 1, !keepFocus);
    });

    track.addEventListener("scroll", update, {passive:true});
    window.addEventListener("resize", update);
    update();
  }

  function setupNewsPage(){
    if(!window.NEWS_DATA) return;
    const list = $("#newsList");
    if(!list) return;

    const q = $("#newsSearch");
    const tagSel = $("#newsTag");

    const getShareUrl = (id)=>{
      const base = window.location.href.split("#")[0];
      return `${base}#${id}`;
    };

    const copyToClipboard = async (text)=>{
      if(navigator.clipboard && window.isSecureContext){
        try{
          await navigator.clipboard.writeText(text);
          return true;
        }catch(_){
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
      try{
        ok = document.execCommand("copy");
      }catch(_){
        ok = false;
      }
      document.body.removeChild(field);
      return ok;
    };

    const flashShareHint = (btn, message)=>{
      const original = btn.getAttribute("title") || "Copy link";
      btn.setAttribute("title", message);
      btn.setAttribute("aria-label", message);
      window.setTimeout(()=>{
        btn.setAttribute("title", original);
        btn.setAttribute("aria-label", original);
      }, 1500);
    };

    const buildAnnouncementModal = (post)=>{
      const date = post?.date || "";
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
    window.NEWS_DATA.forEach(p=>(p.tags||[]).forEach(t=>allTags.add(t)));
    if(tagSel){
      tagSel.innerHTML = `<option value="">All topics</option>` + Array.from(allTags).sort().map(t=>`<option value="${t}">${t}</option>`).join("");
    }

    function apply(){
      const query = (q?.value || "").trim().toLowerCase();
      const tag = (tagSel?.value || "");
      const data = [...window.NEWS_DATA].sort((a,b)=> (a.date<b.date?1:-1)).filter(p=>{
        const matchQ = !query || (p.title+p.excerpt+p.contentHtml).toLowerCase().includes(query);
        const matchT = !tag || (p.tags||[]).includes(tag);
        return matchQ && matchT;
      });

      list.innerHTML = data.map(p=>{
        const tags = (p.tags||[]).slice(0,4).map(t=>`<span class="tag">${t}</span>`).join("");
        const preview = (p.excerpt || "").trim();
        return `
          <article class="news-card reveal" data-id="${p.id}">
            <div class="news-top">
              <div class="news-badge">🗓️ ${fmtDate(p.date)}</div>
              <div class="news-tags">${tags}</div>
            </div>
            <h3>${p.title}</h3>
            <p class="small">${preview}</p>
            <div class="news-actions">
              <button class="btn primary" data-open="${p.id}" type="button">Read more</button>
              <button class="icon-btn" data-share="${p.id}" type="button" aria-label="Copy link" title="Copy link">
                <svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 1 0-7.07-7.07L10 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M14 11a5 5 0 0 0-7.07 0l-2.12 2.12a5 5 0 1 0 7.07 7.07L14 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </article>
        `;
      }).join("");

      setupReveal();

      $$("[data-open]").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          const id = btn.getAttribute("data-open");
          const post = window.NEWS_DATA.find(x=>x.id===id);
          if(post){
            openModal(post.title, buildAnnouncementModal(post));
            history.replaceState(null,"", `#${post.id}`);
          }
        });
      });

      $$("[data-share]").forEach(btn=>{
        btn.addEventListener("click", async ()=>{
          const id = btn.getAttribute("data-share");
          if(!id) return;
          const ok = await copyToClipboard(getShareUrl(id));
          flashShareHint(btn, ok ? "Link copied" : "Copy failed");
        });
      });
    }

    q?.addEventListener("input", apply);
    tagSel?.addEventListener("change", apply);
    apply();

    // Open if hash
    const openFromHash = ()=>{
      const id = (location.hash||"").replace("#","").trim();
      if(!id) return;
      const post = window.NEWS_DATA.find(x=>x.id===id);
      if(post){
        openModal(post.title, buildAnnouncementModal(post));
      }
    };
    window.addEventListener("hashchange", openFromHash);
    openFromHash();
  }

  // Publications
  function setupPublicationsPage(){
    if(!window.PUBLICATIONS_DATA) return;
    const list = $("#pubList");
    if(!list) return;

    const q = $("#pubSearch");
    const catSel = $("#pubCategory");

    const cats = new Set();
    window.PUBLICATIONS_DATA.forEach(p=>cats.add(p.category || "Other"));
    if(catSel){
      catSel.innerHTML = `<option value="">All categories</option>` + Array.from(cats).sort().map(c=>`<option value="${c}">${c}</option>`).join("");
    }

    function apply(){
      const query = (q?.value||"").trim().toLowerCase();
      const cat = (catSel?.value||"");
      const data = window.PUBLICATIONS_DATA.filter(p=>{
        const matchQ = !query || (p.title+p.author+p.description).toLowerCase().includes(query);
        const matchC = !cat || (p.category===cat);
        return matchQ && matchC;
      });

      list.innerHTML = data.map(p=>`
        <article class="item">
          <h3>${p.title}</h3>
          <div class="meta">
            <span>👤 ${p.author || "—"}</span>
            <span>📌 ${p.category || "—"}</span>
            <span>🗓️ ${p.year || "—"}</span>
          </div>
          <p class="small">${p.description || ""}</p>
          <div class="actions">
            <a class="btn primary" href="${p.file}" download>${window.NHC_ICONS?.download || ""} Download PDF</a>
            <a class="btn secondary" href="${p.file}" target="_blank" rel="noopener">Preview</a>
          </div>
        </article>
      `).join("") || `<div class="note">No publications match your filters.</div>`;
    }

    q?.addEventListener("input", apply);
    catSel?.addEventListener("change", apply);
    apply();
  }

  // Tafsir
  function setupTafsirPage(){
    if(!window.TAFSIR_DATA) return;
    const list = $("#tafsirList");
    if(!list) return;

    const q = $("#tafsirSearch");
    const typeSel = $("#tafsirType");
    const speakerSel = $("#tafsirSpeaker");

    const speakers = new Set();
    window.TAFSIR_DATA.forEach(x=>speakers.add(x.speaker || "—"));
    if(speakerSel){
      speakerSel.innerHTML = `<option value="">All speakers</option>` + Array.from(speakers).sort().map(s=>`<option value="${s}">${s}</option>`).join("");
    }

    function apply(){
      const query = (q?.value||"").trim().toLowerCase();
      const type = (typeSel?.value||"");
      const speaker = (speakerSel?.value||"");
      const data = window.TAFSIR_DATA.filter(x=>{
        const matchQ = !query || (x.title+x.series+x.speaker+x.notes).toLowerCase().includes(query);
        const matchT = !type || x.type===type;
        const matchS = !speaker || x.speaker===speaker;
        return matchQ && matchT && matchS;
      });

      list.innerHTML = data.map(x=>{
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
               <button class="btn secondary" type="button" data-notes="${x.title.replace(/"/g,'&quot;')}">Notes</button>
             </div>`
          : `<div class="actions">
               <a class="btn secondary" href="${x.file}" target="_blank" rel="noopener">Open audio file</a>
               <button class="btn primary" type="button" data-notes="${x.title.replace(/"/g,'&quot;')}">Notes</button>
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

      $$("[data-play]").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          const url = decodeURIComponent(btn.getAttribute("data-play"));
          openModal("Video Lecture", `<div style="position:relative; padding-top:56.25%">
            <iframe src="${url}" title="Video" style="position:absolute; inset:0; width:100%; height:100%; border:0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>`);
        });
      });
      $$("[data-notes]").forEach(btn=>{
        btn.addEventListener("click", ()=>{
          const title = btn.getAttribute("data-notes");
          const item = window.TAFSIR_DATA.find(x=>x.title===title);
          if(item){
            openModal(item.title, `<div class="meta"><span>🎙️ ${item.speaker || "—"}</span><span>📚 ${item.series || "—"}</span><span>🗓️ ${fmtDate(item.date)}</span></div><hr class="sep"/><p>${item.notes || ""}</p>`);
          }
        });
      });
    }

    q?.addEventListener("input", apply);
    typeSel?.addEventListener("change", apply);
    speakerSel?.addEventListener("change", apply);
    apply();
  }

  // Contact page (mailto)
  function setupContactPage(){
    const form = $("#contactForm");
    if(!form) return;
    form.addEventListener("submit", (e)=>{
      e.preventDefault();
      const name = $("#cName").value.trim();
      const email = $("#cEmail").value.trim();
      const msg = $("#cMsg").value.trim();
      const subject = encodeURIComponent(`Website Contact — ${name || "New message"}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${msg}\n\n— Sent from the website contact form.`);
      window.location.href = `mailto:info@newhalabja.center?subject=${subject}&body=${body}`;
    });
  }

  // Home previews
  if(page === "home"){
    renderNews("#homeNews");
    setupActivitiesSlider();
  }
  if(page === "news"){
    // load data script already included in page
    setupNewsPage();
  }
  if(page === "publications"){
    setupPublicationsPage();
  }
  if(page === "tafsir"){
    setupTafsirPage();
  }
  if(page === "contact"){
    setupContactPage();
  }

  // Expose icons (used in dynamic templates)
  window.NHC_ICONS = {
    download: `<span aria-hidden="true" style="display:inline-flex; margin-right:6px; vertical-align:-2px">${document.getElementById("svgDownloadIcon")?.innerHTML || ""}</span>`
  };
})();




