import { Component } from '@theme/component';
import { prefersReducedMotion } from '@theme/utilities';

/**
 * A custom element that animates a number counting up from 0 to a target
 * value once it scrolls into view.
 */
class StatCounter extends Component {
  requiredRefs = ['number'];

  connectedCallback() {
    super.connectedCallback();

    this.#observer = new IntersectionObserver(this.#handleIntersect, { threshold: 0.4 });
    this.#observer.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.#observer?.disconnect();
  }

  /** @type {IntersectionObserver | null} */
  #observer = null;
  #animated = false;

  /**
   * @param {IntersectionObserverEntry[]} entries
   */
  #handleIntersect = (entries) => {
    const entry = entries[entries.length - 1];

    if (!entry?.isIntersecting || this.#animated) return;

    this.#animated = true;
    this.#observer?.disconnect();
    this.#animateCount();
  };

  #animateCount() {
    const target = Number(this.dataset.value) || 0;
    const suffix = this.dataset.suffix ?? '';
    const numberEl = this.refs.number;

    if (prefersReducedMotion()) {
      numberEl.textContent = `${target}${suffix}`;
      return;
    }

    const duration = 1600;
    const start = performance.now();

    /** @param {number} now */
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);

      numberEl.textContent = `${current}${suffix}`;

      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }
}

if (!customElements.get('stat-counter')) {
  customElements.define('stat-counter', StatCounter);
}
