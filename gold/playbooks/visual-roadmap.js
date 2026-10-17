/* Simple image-and-close view, matching the LinkedIn playbook. */
(() => {
  const dialog = document.getElementById('visual-roadmap-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const image = document.getElementById('visual-roadmap-image');
  const close = document.getElementById('visual-roadmap-close');
  let opener;
  document.querySelectorAll('[data-visual-roadmap]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      document.getElementById('visual-roadmap-title').textContent = link.dataset.title;
      image.src = link.href;
      image.alt = link.querySelector('img').alt;
      dialog.showModal();
      dialog.scrollTop = 0;
      document.body.classList.add('visual-roadmap-open');
      close.focus({preventScroll:true});
    });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('visual-roadmap-open');
    opener?.focus({preventScroll:true});
  });
})();
