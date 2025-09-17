import { parsePhoneNumberFromString } from 'libphonenumber-js';
import geohash from 'ngeohash';

class Normalizer {
  constructor() {
    // map of common abbreviations for name normalization
    this.abbreviationMap = {
      'st': 'street',
      'rd': 'road',
      'ave': 'avenue',
      'blvd': 'boulevard',
      'ln': 'lane',
      'dr': 'drive',
      'pl': 'place'
      // add more as needed
    };
  }

  /**
   * Normalize phone number to E.164
   * @param {string} phone
   * @param {string} defaultCountry - optional default country code, e.g., 'GB'
   * @returns {string|null} E.164 phone or null if invalid
   */
  normalizePhone(phone, defaultCountry = 'GB') {
    if (!phone) return null;
    try {
      const parsed = parsePhoneNumberFromString(phone, defaultCountry);
      if (parsed && parsed.isValid()) {
        return parsed.number; // E.164 format
      }
      return null;
    } catch (err) {
      return null;
    }
  }

  /**
   * Normalize restaurant name
   * - lowercase, ASCII only, remove punctuation
   * - expand common abbreviations
   * - collapse multiple spaces
   * @param {string} name
   */
  normalizeName(name) {
    if (!name) return '';
    let n = name.toLowerCase();

    // remove punctuation
    n = n.replace(/[^\w\s]/g, '');

    // expand abbreviations
    Object.keys(this.abbreviationMap).forEach(abbr => {
      const regex = new RegExp(`\\b${abbr}\\b`, 'g');
      n = n.replace(regex, this.abbreviationMap[abbr]);
    });

    // collapse multiple spaces
    n = n.replace(/\s+/g, ' ').trim();

    return n;
  }

  /**
   * Normalize postal code
   * - remove spaces, uppercase
   */
  normalizePostal(postal) {
    if (!postal) return '';
    return postal.replace(/\s+/g, '').toUpperCase();
  }

  /**
   * Round latitude/longitude to 5 decimal places
   */
  roundLatLng(lat, lng) {
    if (lat == null || lng == null) return { lat: null, lng: null };
    return {
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5))
    };
  }

  /**
   * Generate geohash from lat/lng rounded to 5 decimal places
   */
  generateGeohash(lat, lng) {
    if (lat == null || lng == null) return null;
    const { lat: rlat, lng: rlng } = this.roundLatLng(lat, lng);
    // precision 8 is ~19 meters; adjust as needed
    return geohash.encode(rlat, rlng, 6);
  }
}

const normalizer = new Normalizer();
export {
    normalizer,
}