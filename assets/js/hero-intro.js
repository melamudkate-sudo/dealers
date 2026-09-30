/* Compositor-driven intro: steady orbits, then a real-load-triggered crossfade. */
(() => {
  const stage = document.querySelector('.model-stage');
  const model = stage?.querySelector('model-viewer');
  const overlay = stage?.querySelector('.model-intro');
  if (!model || !overlay) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const started = performance.now();
  let visible = true, finished = false, loaded = false, revealTimer;
  const settle = state => {
    finished = true;
    clearTimeout(fallbackTimer);
    clearTimeout(revealTimer);
    stage.dataset.intro = state;
    stage.setAttribute('aria-busy', 'false');
    overlay.setAttribute('aria-hidden', 'true');
    observer.disconnect();
    document.removeEventListener('visibilitychange', sync);
    motion.removeEventListener('change', sync);
  };
  const sync = () => {
    stage.toggleAttribute('data-intro-paused', document.hidden || !visible || motion.matches);
    if (loaded && (motion.matches || !visible || document.hidden)) settle('ready');
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  const fallbackTimer = setTimeout(() => settle(loaded ? 'ready' : 'fallback'), 25000);
  observer.observe(stage);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  sync();
  // Two paint turns also cover a cached model loaded before this script ran.
  const ready = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    loaded = true;
    if (finished || motion.matches || !visible || document.hidden) { settle('ready'); return; }
    clearTimeout(fallbackTimer);
    revealTimer = setTimeout(() => {
      stage.dataset.intro = 'revealing';
      revealTimer = setTimeout(() => settle('ready'), 1450);
    }, Math.max(0, 450-(performance.now()-started)));
  }));
  model.addEventListener('load', ready, {once:true});
  model.addEventListener('error', () => settle('fallback'), {once:true});
  if (model.loaded) ready();
})();
