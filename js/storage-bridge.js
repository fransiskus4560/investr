/* ═══════════════════════════════════════════════════════════
   INVESTR — Storage Bridge v1.0
   Hybrid: writes to localStorage (instant) + Firebase (sync).
   Existing pages call Store.get/set/remove instead of localStorage.
   On login, pulls cloud data down to localStorage first.
═══════════════════════════════════════════════════════════ */

'use strict';

const Store = {
  _cloudReady: false,

  /* write: localStorage now + cloud in background */
  set(key, value) {
    try { localStorage.setItem(key, value); } catch(e){}
    if (window.InvestrCloud && window.InvestrCloud.user) {
      // store parsed value in cloud (Firestore handles objects)
      let payload = value;
      try { payload = JSON.parse(value); } catch(e){ /* keep string */ }
      window.InvestrCloud.save(key, payload); // fire-and-forget
    }
  },

  /* read: localStorage (instant) */
  get(key) {
    try { return localStorage.getItem(key); } catch(e){ return null; }
  },

  remove(key) {
    try { localStorage.removeItem(key); } catch(e){}
    if (window.InvestrCloud && window.InvestrCloud.user) {
      window.InvestrCloud.remove(key);
    }
  },

  /* On login: pull all known cloud keys into localStorage,
     so pages render synced data. Returns when done.          */
  async pullFromCloud() {
    if (!window.InvestrCloud || !window.InvestrCloud.user) return;
    const keys = this._knownKeys();
    for (const key of keys) {
      const val = await window.InvestrCloud.load(key);
      if (val !== null && val !== undefined) {
        const str = (typeof val === 'string') ? val : JSON.stringify(val);
        try { localStorage.setItem(key, str); } catch(e){}
      }
    }
    this._cloudReady = true;
  },

  /* keys Investr uses across pages */
  _knownKeys() {
    const markets = ['IDX','US','ASX','Crypto'];
    const keys = [
      'investr-theme', 'investr-market',
      'investr-transactions', 'investr-checklist',
      'investr-accounts-saham', 'investr-accounts-crypto',
    ];
    markets.forEach(m => {
      keys.push('investr-wl-' + m);
      keys.push('investr-custom-analysis-' + m);
    });
    return keys;
  },
};

window.Store = Store;
