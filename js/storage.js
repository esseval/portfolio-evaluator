const Storage = {
  _prefix: 'portfolio_evaluator_',

  _key(key) {
    return this._prefix + key;
  },

  get(key, defaultValue) {
    try {
      const data = localStorage.getItem(this._key(key));
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.warn('Storage get error:', e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(this._key(key), JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Storage set error:', e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(this._key(key));
      return true;
    } catch (e) {
      console.warn('Storage remove error:', e);
      return false;
    }
  },

  getPortfolio() {
    return this.get('portfolio', []);
  },

  setPortfolio(portfolio) {
    return this.set('portfolio', portfolio);
  },

  getTransactions() {
    return this.get('transactions', []);
  },

  setTransactions(transactions) {
    return this.set('transactions', transactions);
  },

  getEquityHistory() {
    return this.get('equityHistory', []);
  },

  setEquityHistory(history) {
    return this.set('equityHistory', history);
  },

  getMarketCache() {
    return this.get('marketCache', {});
  },

  setMarketCache(cache) {
    return this.set('marketCache', cache);
  },

  getInitialCapital() {
    return this.get('initialCapital', 0);
  },

  setInitialCapital(value) {
    return this.set('initialCapital', value);
  },

  getCashBalance() {
    return this.get('cashBalance', 0);
  },

  setCashBalance(value) {
    return this.set('cashBalance', value);
  },

  getSettings() {
    return this.get('settings', { theme: 'light', autoRefresh: false, refreshInterval: 5 });
  },

  setSettings(settings) {
    return this.set('settings', settings);
  },

  clearAll() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this._prefix));
    keys.forEach(k => localStorage.removeItem(k));
  }
};
