import { BaseWebScraper } from './BaseWebScraper.js';
import fs from 'fs';

/**
 * Uber Eats specific scraper implementation
 * Extends BaseWebScraper with Uber Eats DOM navigation and data extraction
 */
export class UberEatsScraper extends BaseWebScraper {
  constructor(url, options = {}) {
    super(url, {
      timeout: 90000,
      ...options
    });
  }

  // ==================== REQUIRED IMPLEMENTATIONS ====================

  getSiteName() {
    return 'UberEats';
  }

  async waitForInitialContent() {
    // Wait for main content skeleton
    await this.page.waitForSelector('main#main-content', { timeout: this.options.timeout });
    this.logStep('Main content detected');
    
    // Let initial content settle
    await this.sleep(3000);
  }

  async extractFromDOM() {
    try {
      // Get the feed-desktop container using the specific DOM path
      const feedDesktop = await this.getFeedDesktopHandle();
      
      // Extract sections from that container
      const data = await this.extractSectionsFromFeed(feedDesktop);
      
      return [...data.speedyDeliveries, ...data.allStores];
    } catch (error) {
      this.logStep(`DOM extraction failed: ${error.message}`);
      return [];
    }
  }

  extractFromNetworkData(captured) {
    const stores = [];

    const looksLikeStore = (obj) => {
      if (!obj || typeof obj !== 'object') return false;
      const keys = Object.keys(obj).map(k => k.toLowerCase());
      const keyStr = keys.join('|');
      const hasName = 'name' in obj || 'title' in obj || 'storeName' in obj || 'restaurantName' in obj;
      const hasEta = 'eta' in obj || 'etaRange' in obj || keyStr.includes('eta');
      const hasImg = 'imageUrl' in obj || (obj.image && (obj.image.url || obj.image.src)) || 'logoUrl' in obj;
      const hasRating = 'rating' in obj || 'averageRating' in obj || keyStr.includes('rating');
      const maybeUuid = keyStr.includes('uuid') || keyStr.includes('storeuuid') || keyStr.includes('merchantuuid');
      return hasName && (hasEta || hasImg || hasRating || maybeUuid);
    };

    const mapStore = (obj) => ({
      name: obj.name || obj.title || obj.storeName || obj.restaurantName || null,
      cuisine: (Array.isArray(obj.cuisines) && obj.cuisines.join(' • ')) || obj.cuisine || null,
      rating: obj.rating?.value || obj.rating || obj.averageRating || null,
      deliveryTime: obj.eta || 
        (obj.etaRange ? `${obj.etaRange.min}-${obj.etaRange.max} min` : null) ||
        (obj.deliveryTime ? `${obj.deliveryTime} min` : null),
      priceInfo: obj.price || obj.priceRating || obj.priceTier || null,
      image: obj.imageUrl || obj.logoUrl || (obj.image && (obj.image.url || obj.image.src)) || null,
      link: obj.storeUrl || obj.storefrontUrl || 
        (obj.action && (obj.action.link || obj.action.url)) ||
        (obj.slug ? `https://www.ubereats.com/store/${obj.slug}` : null)
    });

    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        if (node.length && typeof node[0] === 'object' && node.some(looksLikeStore)) {
          node.filter(looksLikeStore).forEach(obj => stores.push(mapStore(obj)));
        }
        node.forEach(walk);
      } else {
        Object.values(node).forEach(walk);
      }
    };

    for (const capture of captured) {
      if (capture.json) walk(capture.json);
    }

    // Deduplicate by name+link
    const seen = new Set();
    return stores.filter(store => {
      const key = `${store.name}::${store.link || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return !!store.name;
    });
  }

  async saveResults(result) {
    const filename = `ubereats_${result.source}_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(result.data, null, 2));
    this.logStep(`Results saved: ${filename} (${result.data.length} items)`);
  }

  // ==================== OPTIONAL OVERRIDES ====================

  getNetworkCapturePatterns() {
    return [
      /ubereats|eats|api|getfeed|store|search|list/i,
      'ubereats',
      'eats',
      'menu',
      'graphql',
      'store',
      'restaurant'
    ];
  }

  getBlockedDomains() {
    return [
      ...super.getBlockedDomains(),
      'google',
      'doubleclick',
      'tiktok',
      'criteo'
    ];
  }

  isNetworkDataSufficient(networkData) {
    return networkData.length > 10; // Need substantial data from network
  }

  // ==================== UBER EATS SPECIFIC DOM METHODS ====================

  /**
   * Navigate through Uber Eats specific DOM structure to find feed-desktop container
   * This follows the exact path: body > #root > main > div > div > [5th child] > div > div > feed-desktop
   */
  async getFeedDesktopHandle() {
    this.logStep('Step 1: <body> → #root');
    const root = await this.page.$('body > div#root');
    if (!root) throw new Error('Root div (#root) not found right under <body>');

    this.logStep('Step 2: #root → <main id="main-content">');
    const main = await root.$(':scope main#main-content');
    if (!main) throw new Error('main#main-content not found under #root');

    this.logStep('Step 3: main → DIV-1 (first direct child div)');
    const div1 = await main.$(':scope > div');
    if (!div1) throw new Error('DIV-1 (direct child of main) not found');

    this.logStep('Step 4: DIV-1 → DIV-1-Child (its direct child)');
    const div1Child = await div1.$(':scope > div');
    if (!div1Child) throw new Error('DIV-1-Child not found');

    this.logStep('Step 5: DIV-1-Child → pick the 5th child');
    const children = await div1Child.$$(':scope > div');
    if (children.length < 5) {
      throw new Error('Less than 5 children inside DIV-1-Child');
    }
    const fifthChild = children[4]; // 0-based index

    this.logStep('Step 6: 5th child → its direct child');
    const fifthChildInner = await fifthChild.$(':scope > div');
    if (!fifthChildInner) throw new Error('Direct child inside 5th child not found');

    this.logStep('Step 7: That inner → Only Child');
    const onlyChild = await fifthChildInner.$(':scope > div');
    if (!onlyChild) throw new Error('Only child div not found');

    this.logStep('Step 8: Only Child → feed-desktop container');
    const feedDesktop = await onlyChild.$(
      ':scope div[class*="feed-desktop"], div[data-testid="feed-desktop"]'
    );
    if (!feedDesktop) throw new Error('feed-desktop container not found inside Only Child');

    this.logStep('✅ feed-desktop found');
    return feedDesktop;
  }

  /**
   * Extract restaurant data from the feed-desktop container
   */
  async extractSectionsFromFeed(feedDesktopHandle) {
    return await feedDesktopHandle.evaluate((feed) => {
      const txt = (el) => (el ? el.textContent.trim() : null);
      
      const extractCard = (card) => {
        const q = (sel) => card.querySelector(sel);

        let name = txt(q('h3')) || txt(q('h4')) || 
          (q('a[aria-label]') ? q('a[aria-label]').getAttribute('aria-label') : null);

        let link = q('a[href*="/store/"]')?.href || null;
        let image = q('picture img')?.src || q('img')?.src || 
          (q('img') ? q('img').getAttribute('src') : null);

        const allText = (card.innerText || '').replace(/\s+/g, ' ').trim();

        let rating = null;
        const mRating = allText.match(/(\d\.\d)\s*★?|\s★\s*(\d\.\d)/);
        if (mRating) rating = mRating[1] || mRating[2] || null;

        let deliveryTime = null;
        const mEta = allText.match(/(\d+\s*[–-]\s*\d+\s*min|\d+\s*min)/i);
        if (mEta) deliveryTime = mEta[1];

        let priceInfo = null;
        const mPrice = allText.match(/£{1,4}/);
        if (mPrice) priceInfo = mPrice[0];

        let cuisine = null;
        const sub = txt(q('p')) || txt(q('[data-testid*="subtitle"]')) || 
          txt(q('div[role="text"]')) || null;
        if (sub) {
          const tokens = sub.split(/•|·|\||,/)
            .map(s => s.trim())
            .filter(s => s && !/\bmin\b/i.test(s) && !/£/.test(s) && 
              !/^\d+(\.\d+)?$/.test(s) && !/star|rating/i.test(s));
          if (tokens.length) cuisine = tokens.join(' • ');
        }

        let offer = null;
        const offerNode = Array.from(card.querySelectorAll('div, span'))
          .map(e => e.textContent.trim())
          .find(t => /free item|off|discount|deal|save/i.test(t));
        if (offerNode) offer = offerNode;

        return { name, cuisine, rating, deliveryTime, priceInfo, offer, link, image };
      };

      const getByText = (sel, text) => {
        const t = s => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
        const target = t(text);
        const list = feed.querySelectorAll(sel);
        for (const el of list) if (t(el.textContent) === target) return el;
        return null;
      };

      const result = { speedyDeliveries: [], allStores: [] };

      // Extract Speedy Deliveries section
      const speedySpan = getByText('h2 span', 'Speedy deliveries');
      if (speedySpan) {
        const section = speedySpan.closest('section');
        if (section) {
          const cards = section.querySelectorAll('[data-testid="store-card"]');
          for (const c of cards) result.speedyDeliveries.push(extractCard(c));
        }
      }

      // Extract All Stores section
      const allStoresH2 = getByText('h2', 'All Stores');
      if (allStoresH2) {
        const container = allStoresH2.closest('div') || feed;
        const cards = container.querySelectorAll('[data-testid="store-card"]');
        for (const c of cards) result.allStores.push(extractCard(c));
      }

      return result;
    });
  }
}
