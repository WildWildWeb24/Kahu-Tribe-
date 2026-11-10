/**
 * Kahu reviews: fills the review cards of sections/kahu-reviews.liquid with live Judge.me reviews.
 * Uses Judge.me's public widget API (public token only, safe for storefronts) and keeps the
 * manual "Review" blocks as a fallback if Judge.me is unavailable or returns nothing.
 */
(() => {
  if (customElements.get('kahu-reviews')) return;

  const CACHE_MINUTES = 30;

  class KahuReviews extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-kr-track]');
      this.template = this.querySelector('template[data-kr-card]');
      this.querySelector('[data-kr-prev]')?.addEventListener('click', () => this.scrollByCard(-1));
      this.querySelector('[data-kr-next]')?.addEventListener('click', () => this.scrollByCard(1));
      if (this.dataset.source === 'judgeme' && this.dataset.token && this.track && this.template) this.load();
    }

    scrollByCard(dir) {
      const card = this.track.querySelector('.kahu-rv__card');
      const step = card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(this.track).columnGap || 0) : 300;
      this.track.scrollBy({ left: dir * step, behavior: 'smooth' });
    }

    cacheKey() {
      return `kahu-reviews:${this.dataset.shop}`;
    }

    async fetchHtml() {
      try {
        const cached = JSON.parse(sessionStorage.getItem(this.cacheKey()) || 'null');
        if (cached && Date.now() - cached.t < CACHE_MINUTES * 60000) return cached.html;
      } catch (e) {}
      const url = `https://judge.me/api/v1/widgets/featured_carousel?shop_domain=${encodeURIComponent(this.dataset.shop)}&api_token=${encodeURIComponent(this.dataset.token)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Judge.me ${res.status}`);
      const json = await res.json();
      const html = json.featured_carousel || '';
      try { sessionStorage.setItem(this.cacheKey(), JSON.stringify({ t: Date.now(), html })); } catch (e) {}
      return html;
    }

    parse(html) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return [...doc.querySelectorAll('.jdgm-carousel-item')].map((el) => {
        const text = (sel) => (el.querySelector(sel)?.textContent || '').replace(/\s+/g, ' ').trim();
        const img = el.querySelector('.jdgm-carousel-item__product-image');
        return {
          stars: el.querySelectorAll('.jdgm-star.jdgm--on').length || parseInt(el.querySelector('[aria-label$="stars"]')?.getAttribute('aria-label'), 10) || 5,
          title: text('.jdgm-carousel-item__review-title'),
          body: text('.jdgm-carousel-item__review-body'),
          name: text('.jdgm-carousel-item__reviewer-name'),
          date: el.querySelector('.jdgm-carousel-item__timestamp')?.dataset.time || '',
          product: img?.getAttribute('alt') || '',
        };
      });
    }

    async load() {
      try {
        const reviews = this.parse(await this.fetchHtml());
        const minStars = parseInt(this.dataset.minStars, 10) || 1;
        const minChars = parseInt(this.dataset.minChars, 10) || 0;
        const max = parseInt(this.dataset.max, 10) || 6;
        const list = reviews.filter((r) => r.stars >= minStars && r.body.length >= minChars).slice(0, max);
        if (!list.length) return; // keep the manual fallback cards
        const frag = document.createDocumentFragment();
        list.forEach((r) => frag.appendChild(this.card(r)));
        this.track.replaceChildren(frag);
        this.classList.add('is-live');
      } catch (e) {
        // Judge.me unavailable: manual fallback cards stay visible
      }
    }

    card(r) {
      const node = this.template.content.firstElementChild.cloneNode(true);
      const set = (sel, value) => {
        const el = node.querySelector(sel);
        if (!el) return;
        if (value) el.textContent = value;
        else el.remove();
      };
      node.querySelector('[data-kr-stars]')?.setAttribute('aria-label', `${r.stars} out of 5 stars`);
      const starsEl = node.querySelector('[data-kr-stars-text]');
      if (starsEl) starsEl.textContent = '★'.repeat(r.stars) + '☆'.repeat(Math.max(0, 5 - r.stars));
      set('[data-kr-title]', this.dataset.showTitle === 'true' ? r.title : '');
      set('[data-kr-body]', r.body ? `“${r.body}”` : '');
      const who = this.dataset.attribution === 'name' && r.name && r.name.toLowerCase() !== 'anonymous' ? r.name : this.dataset.label;
      set('[data-kr-name]', who);
      set('[data-kr-product]', this.dataset.showProduct === 'true' ? r.product : '');
      set('[data-kr-date]', this.dataset.showDate === 'true' ? r.date : '');
      return node;
    }
  }

  customElements.define('kahu-reviews', KahuReviews);
})();
