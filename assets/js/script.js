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
  const phoneViewport = matchMedia('(max-width:600px)');
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
    const storyStage = appStory.querySelector('.app-story-stage');
    let storyWidth = innerWidth, intrinsicFrame;
    function refreshPhoneTracks() {
      if (!phoneViewport.matches) return;
      cancelAnimationFrame(intrinsicFrame);
      intrinsicFrame = requestAnimationFrame(() => {
        // WebKit may cache an old intrinsic grid height after width/details changes.
        // Invalidate it synchronously before paint; do not retain a fixed slide height.
        storyStage.style.display = 'none';
        void storyStage.offsetHeight;
        storyStage.style.removeProperty('display');
      });
    }
    addEventListener('resize', () => { if(innerWidth !== storyWidth) { storyWidth=innerWidth; refreshPhoneTracks(); } }, {passive:true});
    storyStage.addEventListener('toggle', event => { if(event.target.matches('details'))refreshPhoneTracks(); }, true);
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
      return !phoneViewport.matches && storyInView && document.visibilityState === 'visible' && !reducedMotion.matches &&
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

      if (reducedMotion.matches || phoneViewport.matches) {
        settleStory();
        if (phoneViewport.matches && !reducedMotion.matches) incoming.animate([{opacity:0},{opacity:1}],{duration:180,easing:demiandMotion.ease});
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
      if (event.button !== 0 || event.target.closest('button,a,summary,details,input,select,textarea,video')) return;
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
  // Long desktop topics open outside the fixed-height terms panel.
  const termsDialog = document.createElement('dialog');
  termsDialog.className = 'terms-dialog';
  termsDialog.setAttribute('aria-labelledby', 'terms-dialog-title');
  termsDialog.innerHTML = '<header><h2 id="terms-dialog-title"></h2><button type="button" aria-label="Close partnership details">×</button></header><div class="terms-dialog-content"></div>';
  document.body.append(termsDialog);
  const termsDialogContent = termsDialog.querySelector('.terms-dialog-content');
  let dialogSource;
  termsDialog.querySelector('button').addEventListener('click', () => termsDialog.close());
  termsDialog.addEventListener('click', event => { if (event.target === termsDialog) { const r=termsDialog.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)termsDialog.close(); } });
  termsDialog.addEventListener('close', () => {
    if (dialogSource) { dialogSource.append(...termsDialogContent.childNodes); dialogSource.querySelector('summary').focus({preventScroll:true}); }
    document.body.classList.remove('terms-dialog-open');
  });
  matchMedia('(max-width:600px)').addEventListener('change', () => { if(termsDialog.open)termsDialog.close(); });
  let selectedTerm = partnerTerms.find(detail => detail.open);
  const termsPhone = matchMedia('(max-width:600px)');
  function configureLongTerms() {
    partnerTerms.filter(detail => detail.matches('.partnership-details,.demand-generation-details')).forEach(detail => {
      const summary=detail.querySelector('summary');
      if(termsPhone.matches) summary.removeAttribute('aria-haspopup');
      else { summary.setAttribute('aria-haspopup','dialog'); detail.open=false; }
    });
    if(!termsPhone.matches && !partnerTerms.some(detail=>detail.open)) { selectedTerm=partnerTerms[0]; selectedTerm.open=true; }
  }
  termsPhone.addEventListener('change',configureLongTerms);configureLongTerms();
  partnerTerms.forEach(detail => detail.querySelector('summary').addEventListener('click', event => {
    event.preventDefault();
    const summary = detail.querySelector('summary');
    if(innerWidth > 600 && detail.matches('.partnership-details,.demand-generation-details')) {
      dialogSource = detail;
      termsDialog.querySelector('h2').textContent = summary.firstChild.textContent.trim();
      termsDialogContent.append(...[...detail.childNodes].filter(node => node !== summary));
      document.body.classList.add('terms-dialog-open');
      termsDialog.showModal();
      return;
    }
    const top = summary.getClientRects().length ? summary.getBoundingClientRect().top : null;
    const container = detail.parentElement;
    selectedTerm = selectedTerm === detail ? null : detail;
    partnerTerms.forEach(item => { item.open = item === selectedTerm; });
    const delta = top === null ? 0 : summary.getBoundingClientRect().top - top;
    if (getComputedStyle(container).overflowY === 'auto') container.scrollTop += delta;
    else if (Math.abs(delta) > 1) window.scrollBy({top:delta,behavior:'instant'});
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
  document.querySelectorAll('.chapter-heading,.products,.benefit-grid,.manufacturing-metrics,.network-proof,.contact-top,.contact-intro,.partner-form,.contact-bottom').forEach(group => {
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
  const desktopModel = matchMedia('(min-width:1001px) and (min-aspect-ratio:1/1)');
  const sizeModel = () => {
    const radius = desktopModel.matches ? '88%' : '95%';
    model.setAttribute('min-camera-orbit', `auto 55deg ${radius}`);
    model.setAttribute('max-camera-orbit', `auto 88deg ${radius}`);
    model.setAttribute('camera-orbit', `28deg 80deg ${radius}`);
  };
  desktopModel.addEventListener('change', sizeModel);
  sizeModel();
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

/* Approved model photography. Shared filenames deliberately serve paired models. */
(() => {
  const colors = {
    white: { label: 'White', swatch: '#f1f0ec' },
    black: { label: 'Black', swatch: '#242528' },
    silver: { label: 'Silver', swatch: '#b7bbc3' },
    burgundy: { label: 'Burgundy', swatch: '#6a2937' }
  };
  const models = (items, singular) => items.map(([sku, photos]) => ({
    name: `${singular} / ${sku}`,
    colors: ['black', 'white', 'silver', 'burgundy'].filter(color => photos[color]).map(color => ({ ...colors[color], image: `assets/images/catalog/${photos[color]}` }))
  }));
  const catalog = {
    'air-fryers': {
      title: 'AIR FRYERS', image: 'assets/images/catalog-airfryer-2700.png', photoAlt: 'DEMIAND DK-2700 air fryer',
      models: models([
        ['DK-2500', { white:'2500-5300wh.webp', black:'2500-5300bl.webp' }],
        ['DK-2700', { white:'2700wh.jpg', black:'2700bl.webp' }],
        ['DK-2400', { white:'2200-2400wh.jpg', black:'2200-2400bl.jpg', silver:'2200-2400sil.jpg' }],
        ['DK-2100', { white:'2100wh.jpg', black:'2100bl.jpg' }],
        ['DK-5100', { white:'5100wh.webp', black:'5100bl.png', silver:'5100sil.webp' }],
        ['DK-2200', { white:'2200-2400wh.jpg', black:'2200-2400bl.jpg', silver:'2200-2400sil.jpg' }],
        ['DK-5000', { white:'5000wh.webp', black:'5000bl.webp' }],
        ['DK-5300', { white:'2500-5300wh.webp', black:'2500-5300bl.webp' }]
      ], 'AIR FRYER')
    },
    'coffee-makers': {
      title: 'COFFEE MAKERS', image: 'assets/images/catalog-coffee-3500.png', photoAlt: 'DEMIAND KF-3500 coffee maker',
      models: models([
        ['KF-3500', { white:'3500wh.webp', black:'3500bl.jpg', silver:'3500sil.webp' }],
        ['KF-3100', { black:'3100bl.jpg' }],
        ['KF-3200', { white:'3200wh.jpg', black:'3200bl.jpg' }]
      ], 'COFFEE MAKER')
    },
    blenders: {
      title: 'BLENDERS', image: 'assets/images/catalog-blender-1200.png', photoAlt: 'DEMIAND BL-1200 blender',
      models: models([
        ['BL-1200', { white:'1200wh.jpg', black:'1200bl.jpg' }],
        ['DB-E1300', { white:'1300wh.jpg', black:'1300bl.jpg', silver:'1300sil.jpg', burgundy:'1300bordo.1.a.jpg' }]
      ], 'BLENDER')
    }
  };
  // Start all approved catalogue photos with the page, at low priority so the
  // hero still gets bandwidth first. Shared model/color files are requested once.
  const catalogPhotos = new Set(Object.values(catalog).flatMap(category => category.models.flatMap(model => model.colors.map(color => color.image))));
  catalogPhotos.forEach(href => {
    const preload = document.createElement('link');
    preload.rel = 'preload'; preload.as = 'image'; preload.href = href; preload.fetchPriority = 'low';
    document.head.append(preload);
  });
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
    data.models.forEach((model, modelIndex) => {
      const card = document.createElement('article'); card.className = 'catalog-card';
      card.setAttribute('aria-label', model.name);
      const frame = document.createElement('div'); frame.className = 'catalog-image';
      const image = new Image(); image.alt = `${model.name} — ${model.colors[0].label}`;
      image.width = 2000; image.height = 2000; image.draggable = false; image.decoding = 'async';
      image.loading = modelIndex < 2 ? 'eager' : 'lazy';
      image.src = model.colors[0].image;
      frame.append(image);
      const name = document.createElement('h3'); name.textContent = model.name;
      const swatches = document.createElement('div'); swatches.className = 'catalog-swatches'; swatches.setAttribute('role', 'group'); swatches.setAttribute('aria-label', `${model.name}: available colors`);
      let selectionVersion = 0;
      model.colors.forEach((color, i) => {
        const button = document.createElement('button'); button.type = 'button'; button.style.setProperty('--swatch', color.swatch);
        button.setAttribute('aria-label', `${model.name}: ${color.label}`); button.title = color.label;
        button.setAttribute('aria-pressed', String(i === 0));
        button.addEventListener('click', async () => {
          const version = ++selectionVersion;
          frame.setAttribute('aria-busy', 'true');
          const nextImage = new Image(); nextImage.src = color.image;
          try {
            await nextImage.decode();
            if (version !== selectionVersion) return;
            image.src = color.image; image.alt = `${model.name} — ${color.label}`;
            swatches.querySelectorAll('button').forEach(node => node.setAttribute('aria-pressed', String(node === button)));
          } catch {
            // Keep the last successfully loaded photo and matching selected color.
          } finally {
            if (version === selectionVersion) frame.removeAttribute('aria-busy');
          }
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
    const categoryIcon = source.cloneNode();
    categoryIcon.classList.remove('product-image');
    anchor.replaceChildren(categoryIcon);
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

// Phone-only controls reuse the original content; no duplicated desktop/mobile sections.
(() => {
  const phone = matchMedia('(max-width:600px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function pager(rail, label, categories = false) {
    const items = [...rail.children];
    const controls = document.createElement('div');
    controls.className = categories ? 'mobile-category-nav' : 'mobile-pager';
    controls.setAttribute('role','group'); controls.setAttribute('aria-label',label);
    let active = 0;
    const move = index => {
      const target = Math.max(0,Math.min(items.length-1,index));
      rail.scrollTo({left:items[target].offsetLeft-items[0].offsetLeft,behavior:reduced.matches?'instant':'smooth'});
    };
    let previous,next,count,dots;
    if (categories) {
      ['Air Fryers','Coffee Makers','Blenders'].forEach((text,index) => {
        const button = document.createElement('button'); button.type='button'; button.textContent=text;
        button.addEventListener('click',()=>move(index)); controls.append(button);
      });
    } else {
      previous=document.createElement('button'); next=document.createElement('button'); count=document.createElement('span');
      previous.type=next.type='button'; previous.textContent='←'; next.textContent='→';
      previous.setAttribute('aria-label','Previous '+label); next.setAttribute('aria-label','Next '+label);
      count.setAttribute('aria-live','polite');count.className='sr-only';
      dots=document.createElement('div');dots.className='mobile-dots';
      items.forEach((_,index)=>{const dot=document.createElement('button');dot.type='button';dot.setAttribute('aria-label','Show '+label+' '+(index+1));dot.addEventListener('click',()=>move(index));dots.append(dot);});
      previous.addEventListener('click',()=>move(active-1)); next.addEventListener('click',()=>move(active+1));
      controls.append(previous,dots,count,next);
    }
    rail.after(controls);
    const update = () => {
      if (!phone.matches) return;
      const start=rail.getBoundingClientRect().left;
      active=items.reduce((best,item,i)=>Math.abs(item.getBoundingClientRect().left-start)<Math.abs(items[best].getBoundingClientRect().left-start)?i:best,0);
      if (categories) [...controls.children].forEach((button,i)=>button.setAttribute('aria-current',String(i===active)));
      else { count.textContent=String(active+1).padStart(2,'0')+' / '+String(items.length).padStart(2,'0');previous.disabled=active===0;next.disabled=active===items.length-1;[...dots.children].forEach((dot,i)=>dot.setAttribute('aria-current',String(i===active))); }
    };
    rail.addEventListener('scroll',update,{passive:true}); new ResizeObserver(update).observe(rail);
    rail.addEventListener('keydown',event=>{if(!phone.matches||!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();move(active+(event.key==='ArrowRight'?1:-1));});
    const configure=()=>{if(phone.matches)rail.setAttribute('tabindex','0');else {rail.removeAttribute('tabindex');rail.scrollLeft=0;}update();};
    phone.addEventListener('change',configure);configure();
  }
  pager(document.querySelector('.products'),'product categories',true);
  pager(document.querySelector('.benefit-grid'),'advantage');
  pager(document.querySelector('.terms-scaling ol'),'launch stage');
  const terms=document.querySelector('.terms-accordion');
  const panels=[...terms.querySelectorAll('details')];
  const tabs=document.createElement('div');tabs.className='mobile-terms-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Distributor terms');
  let termsResizeAnimation;
  panels.forEach((panel,index)=>{
    panel.id='term-panel-'+index;
    const button=document.createElement('button');button.type='button';button.setAttribute('role','tab');button.setAttribute('aria-controls',panel.id);
    button.textContent=panel.querySelector('summary').firstChild.textContent.trim();
    button.addEventListener('click',()=>{
      if(panel.open)return;
      const from=terms.getBoundingClientRect().height;
      termsResizeAnimation?.cancel();
      panel.querySelector('summary').click();
      const to=terms.getBoundingClientRect().height;
      const revealContent=()=>{
        if(!phone.matches||!panel.open||index<6)return;
        const targetTop=Math.max(document.querySelector('.nav').getBoundingClientRect().bottom+20,Math.min(innerHeight*.25,200));
        const distance=panel.getBoundingClientRect().top-targetTop;
        if(distance>8)window.scrollBy({top:distance,behavior:reduced.matches?'instant':'smooth'});
      };
      if(phone.matches&&!reduced.matches){
        termsResizeAnimation=terms.animate([{height:from+'px'},{height:to+'px'}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)'});
        panel.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:280,easing:'ease-out'});
        termsResizeAnimation.finished.then(revealContent).catch(()=>{});
      }else revealContent();
    });tabs.append(button);
  });
  const updateTerms=()=>[...tabs.children].forEach((button,index)=>{button.setAttribute('aria-selected',String(panels[index].open));button.tabIndex=panels[index].open?0:-1;});
  panels.forEach(panel=>{panel.querySelector('summary').addEventListener('click',updateTerms);panel.addEventListener('toggle',updateTerms);});
  tabs.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const buttons=[...tabs.children],index=buttons.indexOf(document.activeElement);
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;
    buttons[next].click();buttons[next].focus();
  });
  terms.prepend(tabs);updateTerms();
  const layout=document.querySelector('.marketing-layout');
  const moved=[...document.querySelectorAll('.marketing-copy .marketing-pack,.marketing-copy .marketing-note')].map(node=>{
    const marker=document.createComment('Original desktop position');node.before(marker);return {node,marker};
  });
  const disclosures=[];
  function disclosure(nodes,label) {
    const detail=document.createElement('details');detail.className='mobile-disclosure';
    const summary=document.createElement('summary');summary.textContent=label;detail.append(summary);
    const positions=nodes.map(node=>{const marker=document.createComment('Desktop content position');node.before(marker);return {node,marker};});
    disclosures.push({detail,positions});
  }
  disclosure([document.querySelector('.warranty-copy')],'Warranty & service details');
  disclosure([document.querySelector('.ownership-ready')],'Included in every market launch');
  disclosure([...document.querySelectorAll('.app-slide[data-app-slide="0"] .app-capability-grid,.app-slide[data-app-slide="0"] .app-proof-line')],'Programs, recipes & localization');
  const breaks=[...document.querySelectorAll('.app-slide h2 br')].map(br=>({br,space:document.createTextNode(' ')}));
  function arrange() {
    breaks.forEach(({br,space})=>phone.matches?br.before(space):space.remove());
    if(phone.matches&&!panels.some(panel=>panel.open))panels[0].querySelector('summary').click();
    updateTerms();
    moved.forEach(({node,marker})=>phone.matches?layout.append(node):marker.after(node));
    disclosures.forEach(({detail,positions})=>{
      if(phone.matches){positions[0].marker.after(detail);positions.forEach(({node})=>detail.append(node));}
      else {positions.forEach(({node,marker})=>marker.after(node));detail.remove();}
    });
  }
  phone.addEventListener('change',arrange);arrange();
})();

// Preload reels near the viewport; only the visible, selected reel plays.
(() => {
  const carousel = document.querySelector('.marketing-carousel');
  if (!carousel) return;
  const slides = [...carousel.querySelectorAll('[data-marketing-slide]')];
  const buttons = [...carousel.querySelectorAll('.marketing-pagination button')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0, animation, inView = false, warmed = false;
  const screen = carousel.querySelector('.marketing-screen');
  const playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7Z" fill="currentColor"/></svg>';
  const pauseIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM15 5h4v14h-4z" fill="currentColor"/></svg>';
  const media = slides.map((slide, index) => {
    if (!slide.dataset.videoSrc) return null;
    const video = document.createElement('video');
    video.muted = true; video.defaultMuted = true; video.setAttribute('muted', '');
    video.playsInline = true; video.loop = true; video.preload = 'none';
    video.disablePictureInPicture = true; video.tabIndex = -1;
    video.setAttribute('aria-label', `DEMIAND reel ${index + 1}`);
    video.poster = slide.dataset.videoPoster || '';
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'reel-toggle';
    const item = {video, toggle, userPaused:false};
    const updateControl = () => {
      toggle.innerHTML = video.paused ? playIcon : pauseIcon;
      toggle.setAttribute('aria-label', `${video.paused ? 'Play' : 'Pause'} video ${index + 1}`);
      toggle.title = video.paused ? 'Play' : 'Pause';
    };
    video.addEventListener('play', updateControl); video.addEventListener('pause', updateControl);
    video.addEventListener('error', updateControl); updateControl();
    toggle.addEventListener('click', () => {
      item.userPaused = !video.paused;
      syncPlayback();
    });
    slide.append(video, toggle);
    return item;
  });
  function load(index) {
    const item = media[index];
    if (!item || item.video.getAttribute('src')) return;
    item.video.preload = 'auto'; item.video.src = slides[index].dataset.videoSrc; item.video.load();
  }
  function warm() {
    if (warmed) return;
    warmed = true;
    load(current);
    // Four small fast-start MP4s can buffer before the carousel enters view.
    media.forEach((_, index) => load(index));
  }
  function syncPlayback() {
    media.forEach((item, index) => {
      if (!item) return;
      if (index !== current || !inView || document.hidden || item.userPaused) {
        item.video.pause(); return;
      }
      load(index);
      item.video.play().catch(() => {
        // Low Power Mode and browser policies can require a manual tap.
        if (item.video.paused) {
          item.toggle.innerHTML = playIcon;
          item.toggle.setAttribute('aria-label', `Play video ${index + 1}`);
        }
      });
    });
  }
  function select(index, direction = 1) {
    const next = (index + slides.length) % slides.length;
    if (next === current) return;
    animation?.cancel();
    slides[current].querySelector('video')?.pause();
    current = next;
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    if (media[current]) { media[current].userPaused = false; media[current].video.currentTime = 0; }
    buttons.forEach((button, i) => {
      if (i === current) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    carousel.querySelector('.marketing-status').textContent = `Video ${current + 1} of ${slides.length}`;
    syncPlayback();
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
  screen.addEventListener('pointerdown', event => { if (event.pointerType !== 'mouse' && !event.target.closest('button')) start = {x:event.clientX,y:event.clientY}; });
  screen.addEventListener('pointerup', event => {
    if (!start) return;
    const x = event.clientX - start.x, y = event.clientY - start.y;
    if (Math.abs(x) > 45 && Math.abs(x) > Math.abs(y)) select(current + (x < 0 ? 1 : -1), x < 0 ? 1 : -1);
    start = null;
  });
  screen.addEventListener('pointercancel', () => { start = null; });
  reduced.addEventListener('change', () => { if (reduced.matches) animation?.cancel(); });
  const preloadObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { warm(); preloadObserver.disconnect(); }
  }, {rootMargin:'1600px 0px'});
  preloadObserver.observe(screen);
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting && entries[0].intersectionRatio >= .15;
    if (inView) warm();
    syncPlayback();
  }, {threshold:[0,.15]}).observe(screen);
  document.addEventListener('visibilitychange', syncPlayback);
  window.addEventListener('pagehide', () => media.forEach(item => item?.video.pause()));
  window.addEventListener('pageshow', syncPlayback);
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
    if (source) video.play().catch(() => {});
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
