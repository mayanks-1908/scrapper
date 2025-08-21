// src/scrapers/restaurant-info.js
import * as cheerio from 'cheerio';
import selectors from '../../config/selectors.js';

function getAttr($el, name) {
  const v = $el.attr(name);
  return v ? v.trim() : null;
}
function getText($el) {
  const t = $el.text();
  return t ? t.replace(/\s+/g, ' ').trim() : null;
}

export function extractRestaurantInfo(html) {
  const $ = cheerio.load(html);
  const s = selectors.restaurant;

  // Hero container existence (dynamic h8/h9/ha)
  const heroContainerEl = $(s.heroContainer.css).first();
  const heroContainerFound = heroContainerEl.length > 0;

  // Header info block (inside hero)
  const headerInfoEl = $(s.headerInfo.css).first();
  let nameLine = null;
  let metaLine = null;
  let addressLine = null;
  if (headerInfoEl.length) {
    // Heuristic: first h1 for name, first paragraph for meta, last paragraph/span for address
    const nameEl = headerInfoEl.find('h1').first();
    nameLine = getText(nameEl);

    const paragraphs = headerInfoEl.find('p');
    if (paragraphs.length) {
      metaLine = getText($(paragraphs.get(0)));
      if (paragraphs.length > 1) {
        addressLine = getText($(paragraphs.get(paragraphs.length - 1)));
      }
    } else {
      // fallback: try spans
      const spans = headerInfoEl.find('span');
      if (spans.length) {
        metaLine = getText($(spans.get(0)));
        addressLine = getText($(spans.get(spans.length - 1)));
      }
    }
  }

  // Description blurb (often followed by “More”)
  const descEl = $(s.description.css).first();
  let description = null;
  if (descEl.length) {
    const clone = descEl.clone();
    clone.find('a').remove(); // drop “More” link
    description = getText(clone);
  }

  // Hero image (top banner)
  const heroImgEl = $(s.heroImage.css).first();
  const heroImage = heroImgEl.length
    ? {
        src: getAttr(heroImgEl, 'src'),
        srcset: getAttr(heroImgEl, 'srcset'),
        alt: getAttr(heroImgEl, 'alt'),
      }
    : null;

  return {
    heroContainerFound,
    header: {
      name: nameLine,
      meta: metaLine,
      address: addressLine,
    },
    description,
    heroImage,
  };
}

export default extractRestaurantInfo;