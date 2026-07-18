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

  parseAccionesTxt(text) {
    const blocks = text.trim().split(/\n\s*\n/);
    const portfolioItems = [];
    const transactions = [];

    for (const block of blocks) {
      const lines = block.trim().split('\n').map(l => l.trim());
      if (lines.length < 2) continue;

      const header = lines[0].split('\t');
      const ticker = header[0].toUpperCase();

      let totalShares = 0;
      let totalCost = 0;

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split('\t');
        if (parts.length < 3) continue;
        const type = parts[0];
        const shares = parseFloat(parts[1].replace(',', '.'));
        const price = parseFloat(parts[2].replace(',', '.'));
        var dateStr = parts[3] ? parts[3].trim() : '';

        if (!shares || !price) continue;

        var dateParts = dateStr.split('/');
        var isoDate = dateParts.length === 3 ? dateParts[2] + '-' + dateParts[1] + '-' + dateParts[0] : '';

        var isBuy = type === '+' || type === '';

        if (isBuy) {
          totalShares += shares;
          totalCost += shares * price;
        } else {
          totalShares -= shares;
        }

        transactions.push({
          id: generateId(),
          date: isoDate,
          ticker: ticker,
          type: isBuy ? 'BUY' : 'SELL',
          shares: shares,
          price: price,
          total: shares * price
        });
      }

      if (totalShares > 0) {
        portfolioItems.push({
          ticker: ticker,
          name: '',
          shares: totalShares,
          avgPrice: totalCost / (totalShares + 0)
        });
      }
    }

    return { portfolio: portfolioItems, transactions };
  },

  loadFromAccionesTxt(text) {
    try {
      const parsed = this.parseAccionesTxt(text);
      if (!parsed.portfolio || parsed.portfolio.length === 0) {
        return { success: false, error: 'No se encontraron posiciones válidas en el archivo' };
      }

      this._items = parsed.portfolio;
      this._save();
      this._notify();

      const totalInvested = parsed.portfolio.reduce(function (sum, p) {
        return sum + p.shares * p.avgPrice;
      }, 0);
      Storage.setInitialCapital(totalInvested);
      Storage.setCashBalance(0);
      Storage.setTransactions(parsed.transactions);

      return {
        success: true,
        count: parsed.portfolio.length,
        transactions: parsed.transactions.length
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
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
