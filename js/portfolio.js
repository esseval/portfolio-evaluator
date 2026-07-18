const Portfolio = {
  _items: [],
  _listeners: [],

  init() {
    this._items = Storage.getPortfolio();
    this._notify();
  },

  getAll() {
    return [...this._items];
  },

  get(ticker) {
    return this._items.find(p => p.ticker === ticker);
  },

  add(item) {
    const existing = this.get(item.ticker);
    if (existing) {
      const totalCost = existing.shares * existing.avgPrice + item.shares * item.avgPrice;
      const totalShares = existing.shares + item.shares;
      existing.avgPrice = totalCost / totalShares;
      existing.shares = totalShares;
      if (item.name) existing.name = item.name;
    } else {
      this._items.push({
        ticker: item.ticker.toUpperCase(),
        name: item.name || '',
        shares: item.shares,
        avgPrice: item.avgPrice
      });
    }
    this._save();
    this._notify();
  },

  remove(ticker) {
    this._items = this._items.filter(p => p.ticker !== ticker);
    this._save();
    this._notify();
  },

  update(ticker, data) {
    const item = this.get(ticker);
    if (!item) return;
    if (data.shares !== undefined) item.shares = data.shares;
    if (data.avgPrice !== undefined) item.avgPrice = data.avgPrice;
    if (data.name !== undefined) item.name = data.name;
    this._save();
    this._notify();
  },

  loadFromJSON(jsonText) {
    try {
      const data = JSON.parse(jsonText);
      if (!data.portfolio || !Array.isArray(data.portfolio)) {
        throw new Error('Invalid JSON format: expected { portfolio: [...] }');
      }
      const valid = data.portfolio.filter(item => {
        return item.ticker && item.shares > 0 && item.avgPrice > 0;
      });
      if (valid.length === 0) throw new Error('No valid items found in portfolio');
      valid.forEach(item => {
        item.ticker = item.ticker.toUpperCase();
        item.shares = Number(item.shares);
        item.avgPrice = Number(item.avgPrice);
      });
      this._items = valid;
      this._save();
      this._notify();
      return { success: true, count: valid.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  loadFromCSV(csvText) {
    const items = parseCSVToPortfolio(csvText);
    const valid = items.filter(item => {
      return item.ticker && item.shares > 0 && item.avgPrice > 0;
    });
    if (valid.length === 0) return { success: false, error: 'No valid items found in CSV' };
    valid.forEach(item => {
      item.ticker = item.ticker.toUpperCase();
    });
    this._items = valid;
    this._save();
    this._notify();
    return { success: true, count: valid.length };
  },

  onChange(fn) {
    this._listeners.push(fn);
  },

  _save() {
    Storage.setPortfolio(this._items);
  },

  _notify() {
    this._listeners.forEach(fn => fn(this._items));
  }
};
