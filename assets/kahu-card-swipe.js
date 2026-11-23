/**
 * Kahu product cards: show the featured image until a mouse hovers the card, then swipe through
 * the card's images (first swipe straight away, then every 7 seconds). Leaving the card goes back
 * to the featured image. Cards are marked with [data-kahu-hover-swipe] in snippets/card-gallery.liquid.
 * Touch screens have no hover, so they keep the featured image (people can still swipe by hand).
 */
const DELAY = 7000;
const timers = new WeakMap();

/** @param {Element} gallery */
const slideshowOf = (gallery) => gallery.querySelector('slideshow-component');

/** @param {PointerEvent} event */
function onEnter(event) {
  if (event.pointerType !== 'mouse') return;
  const gallery = event.currentTarget;
  const slideshow = slideshowOf(gallery);
  if (!slideshow || timers.has(gallery)) return;
  slideshow.next?.(undefined, { animate: true });
  timers.set(gallery, setInterval(() => slideshow.next?.(undefined, { animate: true }), DELAY));
}

/** @param {PointerEvent} event */
function onLeave(event) {
  if (event.pointerType !== 'mouse') return;
  const gallery = event.currentTarget;
  clearInterval(timers.get(gallery));
  timers.delete(gallery);
  slideshowOf(gallery)?.select?.(0, undefined, { animate: false });
}

function bind(root = document) {
  root.querySelectorAll('[data-kahu-hover-swipe]:not([data-kahu-swipe-bound])').forEach((gallery) => {
    gallery.setAttribute('data-kahu-swipe-bound', '');
    gallery.addEventListener('pointerenter', onEnter);
    gallery.addEventListener('pointerleave', onLeave);
  });
}

bind();
// Cards added later (filters, infinite scroll, sorting) get bound too
let queued = false;
new MutationObserver(() => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    bind();
  });
}).observe(document.body, { childList: true, subtree: true });
