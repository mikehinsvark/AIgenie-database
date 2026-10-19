/* Page navigation only: does not access contact records, files, or browser storage. */
(() => {
  'use strict';
  const main = document.querySelector('main');
  if (!main || document.getElementById('gold-scroll-nav')) return;

  const rail = document.createElement('nav');
  rail.id = 'gold-scroll-nav';
  rail.className = 'gold-scroll-nav';
  rail.hidden = true;
  rail.setAttribute('aria-label', 'Gold Mine page navigation');
  rail.setAttribute('aria-describedby', 'gold-scroll-help');
  rail.innerHTML = `
    <span class="scroll-nav-help" id="gold-scroll-help">Scroll up or down with the arrows. Choose a dot to jump through the current page. When focused here, Home and End jump to the top and bottom.</span>
    <button type="button" class="scroll-arrow" data-scroll="up" aria-label="Scroll up the page" title="Scroll up"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg></button>
    <div class="scroll-stops" aria-label="Jump to a page position"></div>
    <button type="button" class="scroll-arrow" data-scroll="down" aria-label="Scroll down the page" title="Scroll down"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>`;
  document.body.append(rail);
  document.body.classList.add('gold-scroll-ready');

  const stops = rail.querySelector('.scroll-stops');
  const up = rail.querySelector('[data-scroll="up"]');
  const down = rail.querySelector('[data-scroll="down"]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let points = [];
  let scroller = window;
  let measureFrame = 0;
  let progressFrame = 0;

  function findScroller() {
    for (let element = main; element && element !== document.body; element = element.parentElement) {
      const overflow = getComputedStyle(element).overflowY;
      if (/(auto|scroll)/.test(overflow) && element.scrollHeight > element.clientHeight + 2) return element;
    }
    return window;
  }
  const position = () => scroller === window ? window.scrollY : scroller.scrollTop;
  const viewportHeight = () => scroller === window ? window.innerHeight : scroller.clientHeight;
  function maximum() {
    return Math.max(0, scroller === window
      ? document.documentElement.scrollHeight - window.innerHeight
      : scroller.scrollHeight - scroller.clientHeight);
  }
  function offsetTop(element) {
    const origin = scroller === window ? 0 : scroller.getBoundingClientRect().top + scroller.clientTop;
    return element.getBoundingClientRect().top - origin + position();
  }
  function jump(top) {
    scroller.scrollTo({
      top: Math.max(0, Math.min(maximum(), top)),
      behavior: reducedMotion.matches ? 'instant' : 'smooth',
    });
  }
  function move(direction) {
    jump(position() + direction * Math.max(240, viewportHeight() * 0.8));
  }
  function sync() {
    progressFrame = 0;
    const y = position();
    const max = maximum();
    up.disabled = y <= 2;
    down.disabled = y >= max - 2;
    let active = 0;
    let distance = Infinity;
    points.forEach((point, index) => {
      const difference = Math.abs(point.top - y);
      if (difference < distance) { distance = difference; active = index; }
    });
    if (y <= 2) active = 0;
    else if (y >= max - 2) active = points.length - 1;
    stops.querySelectorAll('button').forEach((button, index) => {
      if (index === active) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  }
  function requestProgress() {
    if (!progressFrame) progressFrame = requestAnimationFrame(sync);
  }
  function blocked() {
    return Boolean(document.querySelector('dialog[open]')) ||
      (window.matchMedia('(max-width: 760px)').matches && Boolean(document.querySelector('.sidebar.open')));
  }
  function headingFor(element) {
    const heading = element.querySelector('h1, h2, h3');
    return heading?.textContent.trim().replace(/\s+/g, ' ').slice(0, 100) ||
      element.getAttribute('aria-label') || 'Page section';
  }
  function measure() {
    measureFrame = 0;
    const nextScroller = findScroller();
    if (nextScroller !== scroller) {
      if (scroller !== window) scroller.removeEventListener('scroll', requestProgress);
      scroller = nextScroller;
      if (scroller !== window) scroller.addEventListener('scroll', requestProgress, { passive: true });
    }
    rail.hidden = blocked();
    const max = maximum();
    const pageName = document.getElementById('page-label')?.textContent.trim() ||
      main.querySelector('h1')?.textContent.trim().replace(/\s+/g, ' ').slice(0, 60) || 'Gold Mine';
    const candidates = [{ top: 0, label: `Back to the top — ${pageName}` }];
    const seen = [];
    const sections = Array.from(main.querySelectorAll('section, .learning-grid > article, .source-grid > article')).filter(element => {
      if (element.hidden || !element.getClientRects().length || element.closest('dialog')) return false;
      // Only outermost sections: nested cards and totals are not separate page stops.
      if (seen.some(parent => parent.contains(element))) return false;
      seen.push(element);
      return true;
    });
    let destinations = sections;
    if (sections.length > 6) {
      destinations = Array.from({ length: 6 }, (_, index) => sections[Math.round(index * (sections.length - 1) / 5)]);
    }
    if (destinations.length) {
      destinations.forEach(section => candidates.push({
        top: offsetTop(section) - 24,
        label: `Go to ${headingFor(section)}`,
      }));
    } else {
      // Short workspace tabs may have a form/table rather than semantic sections.
      for (let index = 1; index <= 6; index++) {
        candidates.push({ top: max * index / 7, label: `Go to page position ${index} of 6 — ${pageName}` });
      }
    }
    candidates.push({ top: max, label: 'Go to the bottom — DREAMS ecosystem footer' });
    points = [];
    candidates.forEach(point => {
      const top = Math.round(Math.max(0, Math.min(max, point.top)));
      if (!points.some(existing => Math.abs(existing.top - top) < 3)) points.push({ top, label: point.label });
    });
    points.sort((a, b) => a.top - b.top);
    const labels = JSON.stringify(points.map(point => point.label));
    if (stops.dataset.labels !== labels) {
      stops.replaceChildren(...points.map((point, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'scroll-stop';
        button.dataset.stop = String(index);
        button.setAttribute('aria-label', point.label);
        button.title = point.label;
        return button;
      }));
      stops.dataset.labels = labels;
    }
    sync();
  }
  function requestMeasurement() {
    if (!measureFrame) measureFrame = requestAnimationFrame(measure);
  }

  up.addEventListener('click', () => move(-1));
  down.addEventListener('click', () => move(1));
  stops.addEventListener('click', event => {
    const button = event.target.closest('[data-stop]');
    const point = button && points[Number(button.dataset.stop)];
    if (point) jump(point.top);
  });
  rail.addEventListener('keydown', event => {
    const actions = { Home: () => jump(0), End: () => jump(maximum()), ArrowUp: () => move(-1), ArrowDown: () => move(1) };
    if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
  });
  window.addEventListener('scroll', requestProgress, { passive: true });
  window.addEventListener('resize', requestMeasurement, { passive: true });
  window.addEventListener('gold:render', requestMeasurement);
  window.addEventListener('hashchange', requestMeasurement);
  window.addEventListener('load', requestMeasurement);
  document.addEventListener('close', requestMeasurement, true);
  new MutationObserver(records => {
    if (records.some(record => !rail.contains(record.target))) requestMeasurement();
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) new MutationObserver(requestMeasurement).observe(sidebar, { attributes: true, attributeFilter: ['class'] });
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(requestMeasurement);
    observer.observe(main);
    observer.observe(document.body);
  }
  if (document.fonts?.ready) document.fonts.ready.then(requestMeasurement);
  measure();
})();
