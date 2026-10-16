/* Progressive enhancement: image links remain usable without JavaScript. */
(() => {
  const links = [...document.querySelectorAll('[data-ch-image]')];
  const dialog = document.getElementById('ch-image-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = document.getElementById('ch-full-image');
  const stage = dialog.querySelector('.ch-image-stage');
  const zoom = document.getElementById('ch-zoom');
  let current = 0;
  let opener = null;
  const show = index => {
    current = (index + links.length) % links.length;
    const link = links[current];
    document.getElementById('ch-image-title').textContent = link.dataset.title;
    image.src = link.href;
    image.alt = link.querySelector('img').alt;
    document.getElementById('ch-original').href = link.href;
    document.getElementById('ch-image-count').textContent = `${current + 1} of ${links.length} graphics`;
    stage.classList.remove('is-zoomed');
    zoom.setAttribute('aria-pressed', 'false');
    zoom.textContent = 'Zoom in';
    stage.scrollTo(0, 0);
  };
  links.forEach((link, index) => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    show(index);
    dialog.showModal();
    document.body.classList.add('ch-viewer-open');
    document.getElementById('ch-close').focus();
  }));
  document.getElementById('ch-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('ch-viewer-open');
    opener?.focus({preventScroll:true});
  });
  zoom.addEventListener('click', () => {
    const expanded = stage.classList.toggle('is-zoomed');
    zoom.setAttribute('aria-pressed', String(expanded));
    zoom.textContent = expanded ? 'Fit width' : 'Zoom in';
  });
  document.getElementById('ch-previous').addEventListener('click', () => show(current - 1));
  document.getElementById('ch-next').addEventListener('click', () => show(current + 1));
})();
