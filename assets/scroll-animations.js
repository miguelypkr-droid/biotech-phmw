import { onDocumentReady, prefersReducedMotion } from '@theme/utilities';

/**
 * Site-wide scroll-reveal animations for headings, paragraphs and images.
 *
 * Each qualifying section is assigned one animation variant (rotating through
 * VARIANTS so neighbouring sections never repeat the same effect), and every
 * matching element inside that section reveals with a small stagger.
 *
 * Sections built around their own continuous motion (marquee / slideshow)
 * are skipped entirely, since layering a scroll-reveal on top of already
 * moving content would just conflict with it.
 */

const VARIANTS = ['fade-up', 'fade-left', 'fade-right', 'scale-in', 'fade-in', 'blur-in'];

const TEXT_SELECTOR = '.text-block, h1, h2, h3, h4, h5, h6';
const IMAGE_SELECTOR = 'img';

const STAGGER_STEP_MS = 90;
const MAX_STAGGER_MS = 450;

/** @type {IntersectionObserver | null} */
let observer = null;
/** @type {WeakSet<Element>} */
const preparedSections = new WeakSet();

function getObserver() {
  if (observer) return observer;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        observer?.unobserve(entry.target);
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );

  return observer;
}

/**
 * @param {Element} section
 */
function hasOwnMotion(section) {
  return section.querySelector('marquee-component, slideshow-component') !== null;
}

/**
 * Picks the outermost matches for a selector: if an ancestor within the same
 * root already matched, its descendants are skipped to avoid double-reveal.
 * @param {Element} root
 * @param {string} selector
 * @returns {Element[]}
 */
function outermostMatches(root, selector) {
  const all = Array.from(root.querySelectorAll(selector));
  return all.filter((el) => !all.some((other) => other !== el && other.contains(el)));
}

/**
 * @param {Element} section
 * @param {string} variant
 */
function prepareSection(section, variant) {
  if (preparedSections.has(section)) return;
  preparedSections.add(section);

  const textElements = outermostMatches(section, TEXT_SELECTOR);
  const imageElements = Array.from(section.querySelectorAll(IMAGE_SELECTOR));

  const elements = [...textElements, ...imageElements];
  const io = getObserver();

  elements.forEach((el, index) => {
    if (el.hasAttribute('data-reveal')) return;

    const delay = Math.min(index * STAGGER_STEP_MS, MAX_STAGGER_MS);
    el.setAttribute('data-reveal', variant);
    if (delay > 0) {
      el.style.setProperty('--reveal-delay', `${delay}ms`);
    }

    io.observe(el);
  });
}

function run() {
  if (prefersReducedMotion()) return;

  const sections = document.querySelectorAll('#MainContent .shopify-section, footer .shopify-section');
  let variantIndex = 0;

  sections.forEach((section) => {
    if (preparedSections.has(section) || hasOwnMotion(section)) return;

    const variant = VARIANTS[variantIndex % VARIANTS.length];
    variantIndex++;
    prepareSection(section, variant);
  });
}

onDocumentReady(run);

// Re-scan when the theme editor injects or re-renders a section, so newly
// added/edited sections pick up the reveal animations too.
document.addEventListener('shopify:section:load', run);
document.addEventListener('shopify:section:select', run);
