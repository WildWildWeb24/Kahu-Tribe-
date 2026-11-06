/**
 * Kahu quick view: opens a product in Horizon's quick-buy popup from any element,
 * without needing a Horizon product card. Used by sections/kahu-image-rail.liquid.
 *
 * Markup:
 *   <kahu-quick-view data-product-url="/products/x" data-product-title="X" data-product-id="1">
 *     <a href="/products/x">…</a>
 *   </kahu-quick-view>
 *
 * Reuses QuickAddComponent (assets/quick-add.js) so the popup, variant picker, add to cart
 * and mobile layout behave exactly like Horizon's own quick add.
 */
import { QuickAddComponent } from '@theme/quick-add';

/** Make sure Horizon's quick-add dialog exists once on the page (theme setting may have it off). */
function ensureQuickAddDialog() {
  if (document.getElementById('quick-add-dialog')) return;
  const template = document.querySelector('template[data-kahu-modal-template]');
  if (!(template instanceof HTMLTemplateElement)) return;
  document.body.appendChild(template.content.cloneNode(true));
}

class KahuQuickView extends QuickAddComponent {
  get productPageUrl() {
    return this.dataset.productUrl || '';
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this.#onClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('click', this.#onClick);
  }

  /** @param {MouseEvent} event */
  #onClick = (event) => {
    // Let people open the product in a new tab with cmd/ctrl/shift/middle click
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) return;

    ensureQuickAddDialog();
    if (!document.getElementById('quick-add-dialog')) return; // no popup available: follow the link

    this.handleClick(event);
  };
}

if (!customElements.get('kahu-quick-view')) {
  customElements.define('kahu-quick-view', KahuQuickView);
}
