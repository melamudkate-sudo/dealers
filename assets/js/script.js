/* CSS is the single source of timing values for native and scripted motion. */
const demiandMotion = (() => {
  const styles = getComputedStyle(document.documentElement);
  const read = name => parseFloat(styles.getPropertyValue('--motion-' + name));
  return Object.freeze({ micro:read('micro'), state:read('state'), chapter:read('chapter'), slide:read('slide'), visual:read('visual'), stagger:read('stagger'), ease:styles.getPropertyValue('--ease').trim() });
})();
/* DEMIAND / navigation, motion and contact interactions. */
(() => {
  const header = document.querySelector('.nav');
  const navigation = header.querySelector('nav');
  const menuToggle = header.querySelector('.menu-toggle');
  const moreToggle = header.querySelector('.nav-sections');
  const moreMenu = document.querySelector('.section-menu');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(pointer: fine)');

  moreMenu.inert = true;
  moreMenu.querySelectorAll('.section-menu-grid a').forEach((link, index) => link.style.setProperty('--menu-order', index));
  function positionMorePointer() {
    const trigger = moreToggle.getBoundingClientRect();
    const left = header.getBoundingClientRect().left + moreMenu.offsetLeft;
    const anchor = Math.max(24, Math.min(moreMenu.offsetWidth - 24, trigger.left + trigger.width / 2 - left));
    moreMenu.style.setProperty('--menu-anchor', anchor + 'px');
  }
  addEventListener('resize', positionMorePointer, { passive:true });
  document.fonts.ready.then(positionMorePointer);
  let menuCloseTimer;
  function setMoreOpen(open) {
    clearTimeout(menuCloseTimer);
    const wasOpen = moreMenu.classList.contains('open');
    moreMenu.classList.toggle('open', open);
    moreMenu.classList.toggle('closing', !open && wasOpen && !reducedMotion.matches);
    moreMenu.inert = !open;
    moreToggle.setAttribute('aria-expanded', String(open));
    moreMenu.setAttribute('aria-hidden', String(!open));
    if (!open) menuCloseTimer = setTimeout(() => moreMenu.classList.remove('closing'), reducedMotion.matches ? 0 : demiandMotion.state);
  }
  function closeMenus() {
    navigation.classList.remove('open');
    setMoreOpen(false);
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
  }
  menuToggle.addEventListener('click', () => {
    const open = !navigation.classList.contains('open');
    closeMenus();
    navigation.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  moreToggle.addEventListener('click', () => {
    const open = !moreMenu.classList.contains('open');
    positionMorePointer();
    setMoreOpen(open);
  });
  header.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenus));
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const focus = moreMenu.classList.contains('open') ? moreToggle : menuToggle;
    const wasOpen = navigation.classList.contains('open') || moreMenu.classList.contains('open');
    closeMenus();
    if (wasOpen) focus.focus();
  });
  document.addEventListener('pointerdown', event => { if (!header.contains(event.target)) closeMenus(); });

  const marketTabs = [...document.querySelectorAll('.market-tabs [role=tab]')];
  function selectMarket(index, focus = false) {
    marketTabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
    if (focus) marketTabs[index].focus();
  }
  marketTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectMarket(index));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % marketTabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + marketTabs.length - 1) % marketTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = marketTabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectMarket(next, true); }
    });
  });

  const appStory = document.getElementById('smartcook');
  if (appStory) {
    const storyShell = appStory.querySelector('.app-story-shell');
    const storySlides = [...appStory.querySelectorAll('[data-app-slide]')];
    // Decode the final compositions before their first reveal; hidden PNGs otherwise paint late.
    const appMediaObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      appStory.querySelectorAll('.app-mockup img,.app-overview-group img').forEach(image => image.decode().catch(() => {}));
      observer.disconnect();
    }, { rootMargin:'1200px 0px' });
    appMediaObserver.observe(appStory);
    const storyDots = [...appStory.querySelectorAll('.app-story-pagination button')];
    const storyCount = appStory.querySelector('.app-story-count');
    const storyTitle = appStory.querySelector('.app-story-title');
    const storyTitles = [
      'Digital cooking ecosystem', 'Connected appliance control', 'Three levels of intelligence',
      'Expanded programs', 'Smart programs', 'AI Mode', 'Growing content library',
      'Recipe experience', 'AI Culinary Assistant'
    ];
    const storyScenes = [
      ['0px','0px','0px'], ['-24px','16px','18px'], ['18px','-12px','-12px'],
      ['-10px','24px','26px'], ['28px','4px','-20px'], ['-18px','-20px','12px'],
      ['20px','18px','30px'], ['-30px','-8px','-18px'], ['8px','-24px','20px']
    ];
    let activeStoryIndex = 0;
    let storyAnimations = [];
    let storyGeneration = 0;
    const storyAutoplayDelay = 6000;
    let storyAutoplayTimer = null;
    let storyAutoplayStarted = 0;
    let storyAutoplayRemaining = storyAutoplayDelay;
    let storyInView = false;
    let storyFocusInside = false;
    let storyPointerInteraction = false;
    let storyDragging = false;

    function storyCanAutoplay() {
      return storyInView && document.visibilityState === 'visible' && !reducedMotion.matches &&
        !storyFocusInside && !storyDragging;
    }

    function clearStoryAutoplayTimer() {
      if (storyAutoplayTimer === null) return;
      clearTimeout(storyAutoplayTimer);
      storyAutoplayTimer = null;
    }

    function pauseStoryAutoplay() {
      if (storyAutoplayTimer !== null) {
        storyAutoplayRemaining = Math.max(250,storyAutoplayRemaining - (performance.now() - storyAutoplayStarted));
      }
      clearStoryAutoplayTimer();
      if (appStory.classList.contains('is-autoplay-running')) appStory.classList.add('is-autoplay-paused');
    }

    function resumeStoryAutoplay() {
      if (!storyCanAutoplay() || storyAutoplayTimer !== null) return;
      if (!appStory.classList.contains('is-autoplay-running')) {
        storyAutoplayRemaining = storyAutoplayDelay;
        appStory.classList.add('is-autoplay-running');
      }
      appStory.classList.remove('is-autoplay-paused');
      storyAutoplayStarted = performance.now();
      storyAutoplayTimer = setTimeout(() => {
        storyAutoplayTimer = null;
        selectStorySlide(activeStoryIndex + 1,1);
      },storyAutoplayRemaining);
    }

    function resetStoryAutoplay() {
      clearStoryAutoplayTimer();
      storyAutoplayRemaining = storyAutoplayDelay;
      appStory.classList.remove('is-autoplay-running','is-autoplay-paused');
      if (!storyCanAutoplay()) return;
      void appStory.offsetWidth;
      appStory.classList.add('is-autoplay-running');
      storyAutoplayStarted = performance.now();
      storyAutoplayTimer = setTimeout(() => {
        storyAutoplayTimer = null;
        selectStorySlide(activeStoryIndex + 1,1);
      },storyAutoplayDelay);
    }

    function settleStory() {
      storyAnimations.forEach(animation => animation.cancel());
      storyAnimations = [];
      storySlides.forEach((slide, index) => {
        const active = index === activeStoryIndex;
        slide.style.removeProperty('z-index');
        slide.hidden = !active;
        slide.inert = !active;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
    }

    function updateStoryInterface(index) {
      storyCount.textContent = `${String(index + 1).padStart(2,'0')} / ${String(storySlides.length).padStart(2,'0')}`;
      storyTitle.textContent = storyTitles[index];
      storyDots.forEach((dot, dotIndex) => {
        if (dotIndex === index) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      const [orbitX, orbitY, gridX] = storyScenes[index];
      appStory.style.setProperty('--orbit-x', orbitX);
      appStory.style.setProperty('--orbit-y', orbitY);
      appStory.style.setProperty('--grid-x', gridX);
      appStory.dataset.activeSlide = index;
    }

    function selectStorySlide(requestedIndex, requestedDirection) {
      const nextIndex = (requestedIndex + storySlides.length) % storySlides.length;
      if (nextIndex === activeStoryIndex) {
        resetStoryAutoplay();
        return;
      }
      settleStory();
      const previousIndex = activeStoryIndex;
      const outgoing = storySlides[previousIndex];
      const incoming = storySlides[nextIndex];
      const direction = requestedDirection || (nextIndex > previousIndex ? 1 : -1);
      const generation = ++storyGeneration;
      activeStoryIndex = nextIndex;
      outgoing.inert = true;
      outgoing.setAttribute('aria-hidden','true');
      incoming.hidden = false;
      incoming.inert = false;
      incoming.setAttribute('aria-hidden', 'false');
      updateStoryInterface(nextIndex);
      appStory.querySelector('.app-story-frame').dataset.direction = direction;
      resetStoryAutoplay();

      if (reducedMotion.matches) {
        settleStory();
        return;
      }

      // Two overlapping layers per slide; no nested item animation or clipping.
      const options = { duration:560, easing:demiandMotion.ease, fill:'both' };
      incoming.style.zIndex = '2'; outgoing.style.zIndex = '1';
      storyAnimations = [];
      for (const selector of ['.app-slide-copy', '.app-slide-visual']) {
        const visual = selector === '.app-slide-visual';
        storyAnimations.push(outgoing.querySelector(selector).animate([
          {opacity:1,transform:'translateX(0)'},
          {opacity:0,transform:`translateX(${-direction*(visual?26:10)}px)`}
        ],{...options,duration:visual?560:320}));
        storyAnimations.push(incoming.querySelector(selector).animate([
          {opacity:0,transform:`translateX(${direction*(visual?34:14)}px)`},
          {opacity:1,transform:'translateX(0)'}
        ],{...options,delay:visual?0:70}));
      }
      const running = [...storyAnimations];
      Promise.all(running.map(animation => animation.finished)).then(() => {
        if (generation !== storyGeneration) return;
        settleStory();
      }).catch(() => {});
    }

    appStory.addEventListener('pointerdown', () => { storyPointerInteraction = true; storyFocusInside = false; }, {capture:true});
    appStory.querySelector('.app-story-prev').addEventListener('click', () => selectStorySlide(activeStoryIndex - 1, -1));
    appStory.querySelector('.app-story-next').addEventListener('click', () => selectStorySlide(activeStoryIndex + 1, 1));
    storyDots.forEach((dot, index) => dot.addEventListener('click', () => selectStorySlide(index, index > activeStoryIndex ? 1 : -1)));
    storyShell.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      if (event.target.matches('input,select,textarea')) return;
      event.preventDefault();
      storyPointerInteraction = false;
      storyFocusInside = true;
      pauseStoryAutoplay();
      selectStorySlide(activeStoryIndex + (event.key === 'ArrowRight' ? 1 : -1), event.key === 'ArrowRight' ? 1 : -1);
    });

    let dragStart = null;
    storyShell.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('button,a')) return;
      dragStart = { x:event.clientX, y:event.clientY, id:event.pointerId };
      storyDragging = true;
      storyShell.setPointerCapture(event.pointerId);
      pauseStoryAutoplay();
    });
    storyShell.addEventListener('pointerup', event => {
      if (!dragStart || dragStart.id !== event.pointerId) return;
      if (storyShell.hasPointerCapture(event.pointerId)) storyShell.releasePointerCapture(event.pointerId);
      const distanceX = event.clientX - dragStart.x;
      const distanceY = event.clientY - dragStart.y;
      dragStart = null;
      storyDragging = false;
      if (Math.abs(distanceX) < 48 || Math.abs(distanceX) < Math.abs(distanceY) * 1.35) {
        resumeStoryAutoplay();
        return;
      }
      selectStorySlide(activeStoryIndex + (distanceX < 0 ? 1 : -1), distanceX < 0 ? 1 : -1);
    });
    storyShell.addEventListener('pointercancel', () => {
      dragStart = null;
      storyDragging = false;
      resumeStoryAutoplay();
    });

    let horizontalWheel = 0;
    let wheelReset;
    storyShell.addEventListener('wheel', event => {
      if (Math.abs(event.deltaX) < Math.abs(event.deltaY) * 1.25 || Math.abs(event.deltaX) < 2) return;
      event.preventDefault();
      horizontalWheel += event.deltaX;
      clearTimeout(wheelReset);
      wheelReset = setTimeout(() => { horizontalWheel = 0; }, 180);
      if (Math.abs(horizontalWheel) < 42) return;
      const direction = horizontalWheel > 0 ? 1 : -1;
      horizontalWheel = 0;
      selectStorySlide(activeStoryIndex + direction, direction);
    }, { passive:false });

    const storyVisibilityObserver = new IntersectionObserver(entries => {
      storyInView = entries[0]?.isIntersecting && entries[0].intersectionRatio >= .45;
      if (storyInView) resumeStoryAutoplay();
      else pauseStoryAutoplay();
    }, { threshold:[0,.45,.75] });
    storyVisibilityObserver.observe(appStory);

    document.addEventListener('keydown', () => { storyPointerInteraction = false; }, {capture:true});
    appStory.addEventListener('focusin', () => {
      storyFocusInside = !storyPointerInteraction && document.activeElement.matches(':focus-visible');
      if (storyFocusInside) pauseStoryAutoplay();
    });
    appStory.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        storyFocusInside = !storyPointerInteraction && appStory.contains(document.activeElement);
        if (!appStory.contains(document.activeElement)) storyPointerInteraction = false;
        if (!storyFocusInside) resumeStoryAutoplay();
      });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') resumeStoryAutoplay();
      else pauseStoryAutoplay();
    });
    reducedMotion.addEventListener('change', () => {
      storyGeneration++;
      settleStory();
      if (reducedMotion.matches) {
        clearStoryAutoplayTimer();
        appStory.classList.remove('is-autoplay-running','is-autoplay-paused');
      } else {
        resetStoryAutoplay();
      }
    });
    updateStoryInterface(0);
    settleStory();
  }

  const partnerTerms = [...document.querySelectorAll('.terms-accordion details')];
  let selectedTerm = partnerTerms.find(detail => detail.open);
  const closingTerms = new Map();
  partnerTerms.forEach(detail => detail.querySelector('summary').addEventListener('click', event => {
    event.preventDefault();
    selectedTerm = selectedTerm === detail ? null : detail;
    partnerTerms.forEach(item => {
      closingTerms.get(item)?.cancel();
      closingTerms.delete(item);
      if (item === selectedTerm) { item.open = true; return; }
      if (!item.open) return;
      if (reducedMotion.matches) { item.open = false; return; }
      const animation = item.querySelector('p').animate([
        { opacity:1, transform:'none', clipPath:'inset(0)' },
        { opacity:0, transform:'translateY(-5px)', clipPath:'inset(0 0 100%)' }
      ], { duration:demiandMotion.state, easing:demiandMotion.ease });
      closingTerms.set(item, animation);
      animation.finished.then(() => {
        if (closingTerms.get(item) !== animation) return;
        item.open = false; closingTerms.delete(item);
      }).catch(() => {});
    });
  }));

  // Ordered story reveals, independent of native document scrolling.
  const storyObserver = new IntersectionObserver(entries => {
    entries.forEach(({target,isIntersecting}) => {
      if(!isIntersecting) return;
      target.classList.add('story-entered'); storyObserver.unobserve(target);

    });
  },{threshold:.12});
  document.querySelectorAll('[data-transition="story"]').forEach(section => storyObserver.observe(section));
  const ambientObserver = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => target.classList.toggle('is-in-view',isIntersecting)), {threshold:.1});
  document.querySelectorAll('.viewport-section').forEach(section => ambientObserver.observe(section));
  document.addEventListener('visibilitychange', () => document.documentElement.classList.toggle('tab-hidden',document.hidden));
  const sectionLinks=[...moreMenu.querySelectorAll('a')], visibleSections=new Map();
  const mapObserver=new IntersectionObserver(entries => {
    entries.forEach(entry => visibleSections.set(entry.target,entry));
    const current=[...visibleSections.values()].filter(entry=>entry.isIntersecting)
      .sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0]?.target;
    if(!current) return;
    sectionLinks.forEach(link=>{
      if(link.hash==='#'+current.id) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
  },{rootMargin:'-72px 0px -25% 0px',threshold:[0,.2,.5,.8]});
  document.querySelectorAll('[data-section]').forEach(section=>mapObserver.observe(section));
  sectionLinks.forEach(link => link.addEventListener('click', () => {
    const target = document.querySelector(link.hash);
    if (target) { target.tabIndex = -1; target.focus({preventScroll:true}); }
  }));
  moreToggle.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'){event.preventDefault();setMoreOpen(true);requestAnimationFrame(()=>sectionLinks[0].focus({preventScroll:true}));}
  });
  moreMenu.addEventListener('keydown',event=>{
    const links=sectionLinks, index=links.indexOf(document.activeElement);
    if(event.key==='Tab'){
      if(event.shiftKey && index===0){event.preventDefault();links.at(-1).focus();}
      else if(!event.shiftKey && index===links.length-1){event.preventDefault();links[0].focus();}
    }
    if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?links.length-1:(index+(event.key==='ArrowDown'?1:-1)+links.length)%links.length;
      links[next].focus();
    }
  });

  // One entrance observer: chapter labels, copy, and grouped systems share CSS tokens.
  // Group existing small reveals to avoid nested animations and excessive staggering.
  document.querySelectorAll('.chapter-heading,.products,.benefit-grid,.manufacturing-metrics,.network-proof,.contact-top,.contact-intro,.contact-main').forEach(group => {
    group.querySelectorAll('.reveal').forEach(node => node.classList.remove('reveal'));
    group.classList.add('reveal');
  });
  const revealNodes = [...document.querySelectorAll('.reveal')];
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => {
      if (!isIntersecting) return;
      target.classList.add('visible');
      revealObserver.unobserve(target);
    });
  }, { threshold:0, rootMargin:'0px 0px -3% 0px' });
  revealNodes.forEach(node => {
    if (!node.closest('.hero')) {
      node.dataset.reveal = node.matches('.section-label,.contact-top') ? 'chapter'
        : node.matches('.chapter-heading,.app-story-chapter,.contact-intro,h2,p') ? 'copy' : 'system';
    }
    if (reducedMotion.matches) node.classList.add('visible');
    else revealObserver.observe(node);
  });
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    revealNodes.forEach(node => node.classList.add('visible'));
    revealObserver.disconnect();
  });

  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => {
      if (!isIntersecting) return;
      counterObserver.unobserve(target);
      if (reducedMotion.matches) return;
      const end = Number(target.dataset.count);
      const decimals = Number(target.dataset.decimals || 0);
      const start = performance.now();
      const tick = now => {
        const progress = Math.min((now - start) / demiandMotion.chapter, 1);
        target.textContent = (end * (1 - Math.pow(1 - progress, 4))).toFixed(decimals);
        if (progress < 1 && !reducedMotion.matches) requestAnimationFrame(tick);
        else target.textContent = end.toFixed(decimals);
      };
      requestAnimationFrame(tick);
    });
  }, {threshold:.8});
  document.querySelectorAll('[data-count]').forEach(node => counterObserver.observe(node));

  let scrollQueued = false;
  function updateScroll() {
    scrollQueued = false;
    header.classList.toggle('scrolled', scrollY > 24);

  }
  addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  addEventListener('resize', updateScroll, { passive: true });
  updateScroll();

  const model = document.querySelector('.hero-model');
  const stage = document.querySelector('.model-stage');
  const hero = document.querySelector('.hero');
  let dragging = false;
  let heroInView = true;
  const syncMotionPreference = () => model.toggleAttribute('auto-rotate', heroInView && !document.hidden && !reducedMotion.matches);
  new IntersectionObserver(([entry]) => { heroInView = entry.isIntersecting; syncMotionPreference(); }).observe(hero);
  document.addEventListener('visibilitychange', syncMotionPreference);
  reducedMotion.addEventListener('change', syncMotionPreference);
  syncMotionPreference();
  model.addEventListener('pointerdown', () => { dragging = true; stage.style.setProperty('--model-ry', '0deg'); });
  addEventListener('pointerup', () => { dragging = false; });
  hero.addEventListener('pointermove', event => {
    if (dragging || reducedMotion.matches || !finePointer.matches) return;
    const rect = hero.getBoundingClientRect();
    const position = (event.clientX - rect.left) / rect.width * 2 - 1;
    stage.style.setProperty('--model-ry', (position * 2).toFixed(2) + 'deg');
  });
  hero.addEventListener('pointerleave', () => stage.style.setProperty('--model-ry', '0deg'));
  model.addEventListener('progress', event => {
    const loader = model.querySelector('.model-loader');
    loader.querySelector('i').style.width = event.detail.totalProgress * 100 + '%';
    loader.hidden = event.detail.totalProgress >= 1;
  });

  const form = document.querySelector('.partner-form');
  const partnerEmail = form.dataset.email;
  form.querySelectorAll('input, select').forEach(field => { field.required = true; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const body = ['International distribution enquiry', '', 'Business email: ' + data.get('email'), 'Company: ' + data.get('company'), 'Country / market: ' + data.get('market'), 'Product categories: ' + data.get('category'), '', 'Please share wholesale pricing, MOQ, lead times and distributor terms.'].join('\n');
    const request = 'mailto:' + partnerEmail + '?subject=' + encodeURIComponent('DEMIAND distribution enquiry — ' + data.get('company')) + '&body=' + encodeURIComponent(body);
    location.href = request;
    form.querySelector('.form-status').textContent = 'Email request prepared. Review and send it in your email app.';
  });
})();

/* One reference photo per category until individual model/color photography is ready. */
(() => {
  const colors = [
    { label: 'Pearl', swatch: '#dedfe2' },
    { label: 'Graphite', swatch: '#474a51' },
    { label: 'Silver', swatch: '#b7bbc3' },
    { label: 'Slate', swatch: '#8c929d' }
  ];
  const models = (items, singular) => items.map(([sku, colorCount]) => ({
    name: `${singular} / ${sku}`,
    colors: colors.slice(0, colorCount)
  }));
  const catalog = {
    'air-fryers': {
      title: 'AIR FRYERS', image: 'assets/images/catalog-airfryer-2700.png', photoAlt: 'DEMIAND DK-2700 air fryer',
      models: models([
        ['DK-2500', 2], ['DK-2700', 2], ['DK-2400', 3],
        ['DK-2100', 3], ['DK-5100', 3],
        ['DK-2200', 3], ['DK-5000', 2], ['DK-5300', 2]
      ], 'AIR FRYER')
    },
    'coffee-makers': {
      title: 'COFFEE MAKERS', image: 'assets/images/catalog-coffee-3500.png', photoAlt: 'DEMIAND KF-3500 coffee maker',
      models: models([['KF-3500', 3], ['KF-3100', 2], ['KF-3200', 1]], 'COFFEE MAKER')
    },
    blenders: {
      title: 'BLENDERS', image: 'assets/images/catalog-blender-1200.png', photoAlt: 'DEMIAND BL-1200 blender',
      models: models([['BL-1200', 2], ['DB-E1300', 4]], 'BLENDER')
    }
  };
  const section = document.getElementById('portfolio');
  const categories = section.querySelector('.products');
  const categoryHeading = section.querySelector('.category-heading');
  const heading = section.querySelector('.catalog-heading');
  const view = section.querySelector('.catalog-view');
  const rail = section.querySelector('.catalog-rail');
  const title = section.querySelector('#catalog-title');
  const count = section.querySelector('#catalog-count');
  const anchor = section.querySelector('.catalog-anchor');
  const back = section.querySelector('.catalog-back');
  const prev = section.querySelector('.catalog-prev');
  const next = section.querySelector('.catalog-next');
  const progress = section.querySelector('.catalog-progress');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const easing = demiandMotion.ease;
  let selected, busy = false, active = 0;
  const pad = number => String(number).padStart(2, '0');
  function animate(element, frames, options = {}) {
    if (reducedMotion.matches) return Promise.resolve();
    return element.animate(frames, { duration: demiandMotion.state, easing, ...options }).finished.catch(() => {});
  }
  function render(data) {
    rail.replaceChildren();
    data.models.forEach(model => {
      const card = document.createElement('article'); card.className = 'catalog-card';
      card.setAttribute('aria-label', model.name);
      const frame = document.createElement('div'); frame.className = 'catalog-image';
      const image = new Image(); image.src = data.image; image.alt = data.photoAlt;
      image.width = 2500; image.height = 2000; image.draggable = false; image.decoding = 'async';
      frame.append(image);
      const name = document.createElement('h3'); name.textContent = model.name;
      const swatches = document.createElement('div'); swatches.className = 'catalog-swatches'; swatches.setAttribute('role', 'group'); swatches.setAttribute('aria-label', `${model.name}: illustrative color options`);
      model.colors.forEach((color, i) => {
        const button = document.createElement('button'); button.type = 'button'; button.style.setProperty('--swatch', color.swatch);
        button.setAttribute('aria-label', `${model.name}: ${color.label}`); button.title = color.label;
        button.setAttribute('aria-pressed', String(i === 0));
        button.addEventListener('click', () => {
          swatches.querySelectorAll('button').forEach(node => node.setAttribute('aria-pressed', String(node === button)));
        });
        swatches.append(button);
      });
      card.append(frame, name, swatches); rail.append(card);
    });
  }
  function update() {
    if (view.hidden) return;
    const max = rail.scrollWidth - rail.clientWidth;
    const start = rail.getBoundingClientRect().left;
    const cards = [...rail.children];
    // At the end of the rail, the final model becomes the progress anchor.
    active = max > 2 && rail.scrollLeft >= max - 2 ? cards.length - 1 : cards.reduce((best, card, i) => Math.abs(card.getBoundingClientRect().left - start) < Math.abs(cards[best].getBoundingClientRect().left - start) ? i : best, 0);
    progress.textContent = `${pad(active + 1)} / ${pad(cards.length)}`;
    prev.disabled = rail.scrollLeft <= 2; next.disabled = rail.scrollLeft >= max - 2;
    section.querySelector('.catalog-track i').style.width = `${max > 2 ? 100 * (active + 1) / cards.length : 100}%`;
  }
  function move(direction) {
    const step = rail.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(rail).gap);
    rail.scrollBy({ left: direction * step, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }
  async function open(button) {
    if (busy) return; busy = true; selected = button;
    const source = button.querySelector('img');
    const from = source.getBoundingClientRect();
    const data = catalog[button.dataset.category];
    title.textContent = data.title; count.textContent = `${pad(data.models.length)} MODELS`;
    anchor.replaceChildren(source.cloneNode());
    render(data);
    if (!reducedMotion.matches) {
      const outgoing = categories.cloneNode(true);
      outgoing.classList.add('catalog-outgoing'); outgoing.inert = true;
      outgoing.setAttribute('aria-hidden', 'true');
      outgoing.querySelector(`[data-category="${button.dataset.category}"]`).style.visibility = 'hidden';
      section.querySelector('.portfolio-stage').append(outgoing);
      animate(outgoing, [{opacity:1, transform:'none'}, {opacity:0, transform:'translateY(10px) scale(.985)'}], {duration:demiandMotion.micro}).then(() => outgoing.remove());
    }
    categories.hidden = true; categoryHeading.hidden = true; heading.hidden = false; view.hidden = false;
    section.classList.add('catalog-open'); rail.scrollLeft = 0; update();
    const image = anchor.firstElementChild; const to = image.getBoundingClientRect();
    const shared = animate(image, [{ transform: `translate(${from.left - to.left}px,${from.top - to.top}px) scale(${from.width / to.width},${from.height / to.height})` }, { transform: 'none' }], { duration: demiandMotion.state });
    const cards = [...rail.children].map((card, i) => animate(card, [{ opacity: 0, transform: 'translateY(28px) scale(.97)', clipPath: 'inset(0 0 100% round 16px)' }, { opacity: 1, transform: 'none', clipPath: 'inset(0 round 16px)' }], { delay: Math.min(i, 2) * demiandMotion.stagger, fill: 'backwards' }));
    await Promise.all([shared, ...cards]); busy = false; title.focus({ preventScroll: true });
  }
  async function close() {
    if (busy) return; busy = true;
    view.hidden = true; heading.hidden = true; categories.hidden = false; categoryHeading.hidden = false; section.classList.remove('catalog-open');
    categories.querySelectorAll('.reveal').forEach(card => card.classList.add('visible'));
    await Promise.all([...categories.children].map((card, i) => animate(card, [{ opacity: 0, transform: 'translateY(18px) scale(.97)' }, { opacity: 1, transform: 'none' }], { delay: i * demiandMotion.stagger, fill: 'backwards' })));
    busy = false; selected.focus({ preventScroll: true });
  }
  categories.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => open(button)));
  back.addEventListener('click', close);
  prev.addEventListener('click', () => move(-1)); next.addEventListener('click', () => move(1));
  rail.addEventListener('scroll', update, { passive: true }); new ResizeObserver(update).observe(rail);
  rail.addEventListener('keydown', event => {
    if (event.target !== rail) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); }
    if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); rail.scrollTo({ left: event.key === 'Home' ? 0 : rail.scrollWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth' }); }
  });
  section.addEventListener('keydown', event => { if (event.key === 'Escape' && !view.hidden) { event.stopPropagation(); close(); } });
  rail.addEventListener('wheel', event => {
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rail.clientWidth : 1);
    const max = rail.scrollWidth - rail.clientWidth;
    if ((delta > 0 && rail.scrollLeft < max - 2) || (delta < 0 && rail.scrollLeft > 2)) { event.preventDefault(); rail.scrollLeft += delta; }
  }, { passive: false });
  let drag = null, suppressClick = false;
  rail.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('button')) return;
    drag = { x: event.clientX, scroll: rail.scrollLeft, id: event.pointerId }; suppressClick = false;
  });
  rail.addEventListener('pointermove', event => {
    if (!drag) return;
    const delta = event.clientX - drag.x;
    if (Math.abs(delta) > 5) { suppressClick = true; rail.setPointerCapture(drag.id); rail.classList.add('dragging'); }
    if (suppressClick) rail.scrollLeft = drag.scroll - delta;
  });
  const endDrag = () => { if (!drag) return; if (rail.hasPointerCapture(drag.id)) rail.releasePointerCapture(drag.id); drag = null; rail.classList.remove('dragging'); };
  window.addEventListener('pointerup', endDrag); rail.addEventListener('pointercancel', endDrag);
  rail.addEventListener('click', event => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; } }, true);
})();

// Four marketing previews. Add a repository-relative data-video-src to each
// article when its approved film arrives; until then the artwork stays explicit.
(() => {
  const carousel = document.querySelector('.marketing-carousel');
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll('[data-marketing-slide]')];
  const buttons = [...carousel.querySelectorAll('.marketing-pagination button')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0, animation;
  function select(index, direction = 1) {
    const next = (index + slides.length) % slides.length;
    if (next === current) return;
    animation?.cancel();
    slides[current].querySelector('video')?.pause();
    current = next;
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    buttons.forEach((button, i) => {
      if (i === current) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    carousel.querySelector('.marketing-status').textContent = `Video ${current + 1} of ${slides.length}`;
    if (!reduced.matches) animation = slides[current].animate([
      { opacity:0, transform:`translateX(${direction * 22}px) scale(.985)` },
      { opacity:1, transform:'none' }
    ], { duration:demiandMotion.state, easing:demiandMotion.ease });
  }
  carousel.querySelector('.marketing-prev').addEventListener('click', () => select(current - 1, -1));
  carousel.querySelector('.marketing-next').addEventListener('click', () => select(current + 1));
  buttons.forEach((button, index) => button.addEventListener('click', () => select(index, index > current ? 1 : -1)));
  carousel.addEventListener('keydown', event => {
    if (event.target.closest('video')) return;
    const actions = { ArrowRight:current + 1, ArrowLeft:current - 1, Home:0, End:slides.length - 1 };
    if (!(event.key in actions)) return;
    event.preventDefault(); select(actions[event.key], event.key === 'ArrowLeft' ? -1 : 1);
  });
  let start;
  const screen = carousel.querySelector('.marketing-screen');
  screen.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse') start = {x:event.clientX,y:event.clientY}; });
  screen.addEventListener('pointerup', event => {
    if (!start) return;
    const x = event.clientX - start.x, y = event.clientY - start.y;
    if (Math.abs(x) > 45 && Math.abs(x) > Math.abs(y)) select(current + (x < 0 ? 1 : -1), x < 0 ? 1 : -1);
    start = null;
  });
  screen.addEventListener('pointercancel', () => { start = null; });
  reduced.addEventListener('change', () => { if (reduced.matches) animation?.cancel(); });
  slides.forEach(slide => {
    if (!slide.dataset.videoSrc) return;
    const video = document.createElement('video');
    video.src = slide.dataset.videoSrc; video.controls = true; video.playsInline = true; video.preload = 'none';
    video.poster = slide.querySelector('.marketing-product').src;
    slide.querySelector('.marketing-product').hidden = true;
    slide.querySelector('.marketing-video-caption').hidden = true;
    slide.append(video);
  });
})();

// Set data-video-src on the trigger when the approved production film is ready.
(() => {
  const trigger = document.querySelector('.production-video');
  const dialog = document.querySelector('#production-dialog');
  if (!trigger || !dialog) return;
  const video = dialog.querySelector('video');
  trigger.addEventListener('click', () => {
    const source = trigger.dataset.videoSrc;
    if (source && !video.getAttribute('src')) video.src = source;
    video.hidden = !source;
    dialog.querySelector('.film-placeholder').hidden = !!source;
    document.body.classList.add('film-open');
    dialog.showModal();
  });
  dialog.querySelector('.film-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    video.pause(); document.body.classList.remove('film-open'); trigger.focus({preventScroll:true});
  });
})();
