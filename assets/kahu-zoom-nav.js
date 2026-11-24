/**
 * Kahu: product image pop-up (Horizon zoom dialog) as a one-image-per-screen slider.
 * Adds ‹ › arrows at the sides and dots at the bottom; arrow keys work too.
 * Layout: assets/kahu-tokens.css ("Product image pop-up"). Uses zoom-dialog's own selectThumbnail()
 * so high-resolution images still load as you move.
 */
const ARROW = (dir) =>
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="${dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}"/></svg>`;

function setup(zoom) {
  if (zoom.dataset.kahuNav) return;
  const dialog = zoom.querySelector('dialog');
  const list = zoom.querySelector('.dialog-zoomed-gallery');
  if (!dialog || !list) return;
  const slides = () => Array.from(list.children);
  if (slides().length < 2) return;
  zoom.dataset.kahuNav = '1';

  const nav = document.createElement('div');
  nav.className = 'kahu-zoom-nav';
  nav.innerHTML = `
    <button type="button" class="kahu-zoom-nav__arrow kahu-zoom-nav__arrow--prev" aria-label="Previous image">${ARROW('prev')}</button>
    <button type="button" class="kahu-zoom-nav__arrow kahu-zoom-nav__arrow--next" aria-label="Next image">${ARROW('next')}</button>
    <div class="kahu-zoom-nav__dots" role="tablist">${slides()
      .map((_, i) => `<button type="button" class="kahu-zoom-nav__dot" role="tab" aria-label="Image ${i + 1}"></button>`)
      .join('')}</div>`;
  dialog.appendChild(nav);

  const [prev, next] = nav.querySelectorAll('.kahu-zoom-nav__arrow');
  const dots = Array.from(nav.querySelectorAll('.kahu-zoom-nav__dot'));
  const current = () => Math.round(list.scrollLeft / Math.max(1, list.clientWidth));

  const go = (i) => {
    const n = slides().length;
    const index = (i + n) % n;
    if (typeof zoom.selectThumbnail === 'function' && zoom.refs?.thumbnails?.children.length) {
      zoom.selectThumbnail(index, { behavior: 'smooth' });
    } else {
      list.scrollTo({ left: index * list.clientWidth, behavior: 'smooth' });
    }
    paint(index);
  };
  const paint = (index = current()) => {
    dots.forEach((d, i) => d.setAttribute('aria-selected', String(i === index)));
  };

  // the image itself closes the pop-up on click; keep the controls from doing that
  nav.addEventListener('click', (e) => e.stopPropagation());
  prev.addEventListener('click', () => go(current() - 1));
  next.addEventListener('click', () => go(current() + 1));
  dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
  let raf = 0;
  list.addEventListener('scroll', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => paint());
  }, { passive: true });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1); }
  });
  // opening on image N: sync the dots once the dialog has scrolled there
  new MutationObserver(() => { if (dialog.open) setTimeout(() => paint(), 120); }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  paint(0);
}

const run = () => document.querySelectorAll('zoom-dialog').forEach(setup);
run();
customElements.whenDefined('zoom-dialog').then(run);
document.addEventListener('DOMContentLoaded', run);
