'use strict';
(() => {
  const dialog = document.getElementById('home-roadmap-dialog');
  const image = document.getElementById('home-roadmap-full-image');
  const title = document.getElementById('home-roadmap-title');
  const close = document.getElementById('home-roadmap-close');
  let trigger;

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-home-roadmap]');
    if (!button) return;
    const artwork = button.querySelector('img');
    trigger = button;
    title.textContent = button.dataset.homeRoadmap;
    image.src = artwork.src;
    image.alt = artwork.alt;
    dialog.showModal();
    document.body.classList.add('home-roadmap-viewing');
    dialog.scrollTop = 0;
    close.focus({ preventScroll: true });
  });

  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('home-roadmap-viewing');
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
  });
  window.addEventListener('gold:render', () => {
    if (dialog.open) dialog.close();
  });
})();
