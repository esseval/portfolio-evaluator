const MarketData = {
  CACHE_TTL: 5 * 60 * 1000,
  _cache: {},
  _pending: {},

  init() {
    this._cache = Storage.getMarketCache();
  },

  _getCached(ticker) {
    const entry = this._cache[ticker.toUpperCase()];
    if (entry && Date.now() - entry.timestamp < this.CACHE_TTL) {
      return entry.data;
    }
    return null;
  },

  _setCache(ticker, data) {
    this._cache[ticker.toUpperCase()] = {
      data,
      timestamp: Date.now()
    };
    Storage.setMarketCache(this._cache);
  },

  async fetchQuote(ticker) {
    ticker = ticker.toUpperCase();
    const cached = this._getCached(ticker);
    if (cached) return cached;

    if (this._pending[ticker]) return this._pending[ticker];

    const promise = this._fetchWithFallback(ticker)
      .then(data => {
        this._setCache(ticker, data);
        delete this._pending[ticker];
        return data;
      })
      .catch(err => {
        delete this._pending[ticker];
        throw err;
      });

    this._pending[ticker] = promise;
    return promise;
  },

  async _fetchWithFallback(ticker) {
    const errors = [];
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?url='
    ];
    for (const proxy of proxies) {
      try {
        return await this._fetchFromYahoo(ticker, proxy);
      } catch (e) {
        errors.push(e.message);
      }
    }
    throw new Error('All fetch attempts failed for ' + ticker + ': ' + errors.join(' | '));
  },

  async _fetchFromYahoo(ticker, proxy) {
    const yahooUrl = 'https://query1.finance.yahoo.com/v8/finance/chart/' + ticker + '?interval=1d&range=6mo';
    const url = proxy ? proxy + encodeURIComponent(yahooUrl) : yahooUrl;
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const text = await response.text();
    const json = JSON.parse(text);
    const result = json.chart.result[0];
    const meta = result.meta;
    const quotes = result.indicators.quote[0];
    const timestamps = result.timestamp;

    const closes = [];
    const highs = [];
    const lows = [];
    const volumes = [];

    for (let i = 0; i < timestamps.length; i++) {
      if (quotes.close[i] !== null) {
        closes.push(quotes.close[i]);
        highs.push(quotes.high[i] || 0);
        lows.push(quotes.low[i] || 0);
        volumes.push(quotes.volume[i] || 0);
      }
    }

    return {
      ticker: ticker.toUpperCase(),
      currentPrice: meta.regularMarketPrice,
      previousClose: meta.chartPreviousClose || meta.previousClose,
      high: meta.regularMarketDayHigh || Math.max(...highs.slice(-30)),
      low: meta.regularMarketDayLow || Math.min(...lows.slice(-30)),
      open: meta.regularMarketOpen || closes[closes.length - 1],
      change: meta.regularMarketPrice - (meta.chartPreviousClose || meta.previousClose || closes[closes.length - 2] || 0),
      changePercent: ((meta.regularMarketPrice - (meta.chartPreviousClose || meta.previousClose || closes[closes.length - 2] || 0)) / (meta.chartPreviousClose || meta.previousClose || closes[closes.length - 2] || 1)) * 100,
      closes,
      highs,
      lows,
      volumes,
      dates: timestamps.map(t => new Date(t * 1000))
    };
  },

  async fetchQuotes(tickers) {
    const results = {};
    const unique = [...new Set(tickers.map(t => t.toUpperCase()))];
    for (const ticker of unique) {
      try {
        results[ticker] = await this.fetchQuote(ticker);
      } catch (e) {
        console.warn('Failed to fetch ' + ticker + ':', e.message);
        results[ticker] = null;
      }
    }
    return results;
  }
};
