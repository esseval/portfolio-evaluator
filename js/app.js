const App = {
  _marketData: {},
  _signals: {},
  _indicators: {},
  _loading: false,

  async init() {
    Portfolio.init();
    MarketData.init();
    this._setupUI();
    this._setupEventListeners();
    Portfolio.onChange(() => this.refresh());
    this.refresh();
  },

  _setupUI() {
    this._renderPortfolioTable();
    this._renderSummary();
    this._renderTransactions();
    this._renderEquityChart();
  },

  _setupEventListeners() {
    document.getElementById('loadFileBtn').addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', (e) => this._handleFileUpload(e));
    document.getElementById('loadAccionesBtn').addEventListener('click', () => {
      document.getElementById('accionesFileInput').click();
    });
    document.getElementById('accionesFileInput').addEventListener('change', (e) => this._handleAccionesUpload(e));
    document.getElementById('addTransactionBtn').addEventListener('click', () => this._showTransactionModal());
    document.getElementById('transactionForm').addEventListener('submit', (e) => this._handleTransactionSubmit(e));
    document.getElementById('exportTextBtn').addEventListener('click', () => this._exportText());
    document.getElementById('exportCSVBtn').addEventListener('click', () => this._exportCSV());
    document.getElementById('exportJSONBtn').addEventListener('click', () => this._exportJSON());
    document.getElementById('printBtn').addEventListener('click', () => window.print());
    document.getElementById('refreshBtn').addEventListener('click', () => this.refresh());
    document.getElementById('themeToggle').addEventListener('click', () => this._toggleTheme());
    
    document.getElementById('clearDataBtn').addEventListener('click', () => this._clearData());
    document.getElementById('cancelTransaction').addEventListener('click', () => this._hideTransactionModal());
    document.getElementById('closeReport').addEventListener('click', () => this._hideReportModal());
    document.getElementById('copyReportBtn').addEventListener('click', () => this._copyReport());
    document.getElementById('downloadReportBtn').addEventListener('click', () => this._downloadReport());
    document.getElementById('downloadReportCSVBtn').addEventListener('click', () => this._downloadReportCSV());
    document.getElementById('showReportBtn').addEventListener('click', () => this._showReport());
    document.getElementById('initialCapitalInput').addEventListener('change', (e) => {
      const value = parseFloat(e.target.value) || 0;
      Storage.setInitialCapital(value);
      this._renderSummary();
      this._updateEquityHistory();
    });
  },

  async refresh() {
    if (this._loading) return;
    this._loading = true;
    this._showLoading(true);
    const portfolio = Portfolio.getAll();
    if (portfolio.length === 0) {
      this._showLoading(false);
      this._loading = false;
      return;
    }
    const tickers = portfolio.map(p => p.ticker);
    this._marketData = await MarketData.fetchQuotes(tickers);
    this._calculateIndicators();
    this._generateSignals();
    this._updateEquityHistory();
    this._renderAll();
    this._showLoading(false);
    this._loading = false;
  },

  async _refreshSingleTicker(ticker) {
    if (this._loading) return;
    this._loading = true;
    this._showLoading(true);
    try {
      const data = await MarketData.fetchQuote(ticker, true);
      this._marketData[ticker] = data;
      if (data && data.closes && data.closes.length > 0) {
        this._indicators[ticker] = Indicators.calculateAll(data.closes);
        this._signals[ticker] = Signals.generate(this._indicators[ticker], data.closes);
      }
      this._renderAll();
      this.showToast(ticker + ' actualizado', 'success');
    } catch (e) {
      console.warn('Failed to refresh ' + ticker + ':', e.message);
      this.showToast('Error al actualizar ' + ticker, 'error');
    }
    this._showLoading(false);
    this._loading = false;
  },

  _calculateIndicators() {
    this._indicators = {};
    for (const ticker in this._marketData) {
      const md = this._marketData[ticker];
      if (md && md.closes && md.closes.length > 0) {
        this._indicators[ticker] = Indicators.calculateAll(md.closes);
      }
    }
  },

  _generateSignals() {
    this._signals = {};
    for (const ticker in this._marketData) {
      const md = this._marketData[ticker];
      const ind = this._indicators[ticker];
      if (md && ind) {
        this._signals[ticker] = Signals.generate(ind, md.closes);
      }
    }
  },

  _updateEquityHistory() {
    const portfolio = Portfolio.getAll();
    let positionsValue = 0;
    portfolio.forEach(item => {
      const md = this._marketData[item.ticker];
      if (md) {
        positionsValue += item.shares * md.currentPrice;
      }
    });
    const cash = Storage.getCashBalance();
    const totalValue = positionsValue + cash;
    if (totalValue > 0) {
      const history = Storage.getEquityHistory();
      const today = getDateStr(new Date());
      if (history.length === 0 || history[history.length - 1].date !== today) {
        history.push({ date: today, value: totalValue });
        Storage.setEquityHistory(history);
      } else {
        history[history.length - 1].value = totalValue;
        Storage.setEquityHistory(history);
      }
    }
  },

  _renderAll() {
    this._renderPortfolioTable();
    this._renderSummary();
    this._renderTransactions();
    this._renderEquityChart();
  },

  _renderPortfolioTable() {
    const portfolio = Portfolio.getAll();
    const tbody = document.querySelector('#portfolioTable tbody');
    tbody.innerHTML = '';
    if (portfolio.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Carga un archivo CSV/JSON o agrega posiciones manualmente</td></tr>';
      return;
    }
    portfolio.forEach(item => {
      const md = this._marketData[item.ticker];
      const currentPrice = md ? md.currentPrice : 0;
      const invested = item.shares * item.avgPrice;
      const current = item.shares * currentPrice;
      const gainLoss = current - invested;
      const gainLossPercent = invested > 0 ? ((current - invested) / invested) * 100 : 0;
      const signal = this._signals[item.ticker] ? this._signals[item.ticker].signal : 'NEUTRAL';

      const tr = document.createElement('tr');
      tr.innerHTML = [
        '<td><strong>' + item.ticker + '</strong><br><small>' + item.name + '</small></td>',
        '<td><input type="number" class="edit-shares" value="' + item.shares + '" min="0" step="1" data-ticker="' + item.ticker + '"></td>',
        '<td><input type="number" class="edit-price" value="' + item.avgPrice + '" min="0" step="0.01" data-ticker="' + item.ticker + '"></td>',
        '<td><input type="number" class="edit-currentprice" value="' + (currentPrice > 0 ? currentPrice : '') + '" min="0" step="0.01" data-ticker="' + item.ticker + '" placeholder="\u2014"></td>',
        '<td class="' + (gainLoss >= 0 ? 'positive' : 'negative') + '">' + formatCurrency(gainLoss) + ' (' + formatPercent(gainLossPercent) + ')</td>',
        '<td class="signal-' + signal.toLowerCase() + '">' + this._signalLabel(signal) + '</td>',
        '<td>' +
          '<button class="btn btn-sm btn-refresh" data-ticker="' + item.ticker + '" title="Actualizar cotizaci\u00f3n">\u21bb</button> ' +
          '<button class="btn btn-sm btn-danger remove-btn" data-ticker="' + item.ticker + '">\u2715</button>' +
        '</td>'
      ].join('');
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.edit-shares').forEach(input => {
      input.addEventListener('change', (e) => {
        const ticker = e.target.dataset.ticker;
        const shares = parseFloat(e.target.value);
        if (shares >= 0) {
          Portfolio.update(ticker, { shares });
        }
      });
    });

    document.querySelectorAll('.edit-price').forEach(input => {
      input.addEventListener('change', (e) => {
        const ticker = e.target.dataset.ticker;
        const price = parseFloat(e.target.value);
        if (price > 0) {
          Portfolio.update(ticker, { avgPrice: price });
        }
      });
    });

    document.querySelectorAll('.edit-currentprice').forEach(input => {
      input.addEventListener('change', (e) => {
        const ticker = e.target.dataset.ticker;
        const price = parseFloat(e.target.value);
        if (price > 0) {
          if (!this._marketData[ticker]) {
            this._marketData[ticker] = {};
          }
          this._marketData[ticker].currentPrice = price;
          this._renderAll();
        }
      });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ticker = e.target.dataset.ticker;
        if (confirm('Eliminar ' + ticker + ' del portafolio?')) {
          Portfolio.remove(ticker);
        }
      });
    });

    document.querySelectorAll('.btn-refresh').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ticker = e.target.dataset.ticker;
        this._refreshSingleTicker(ticker);
      });
    });
  },

  _signalLabel(signal) {
    const labels = {
      'STRONG_BUY': 'FUERTE COMPRA',
      'BUY': 'COMPRA',
      'NEUTRAL': 'NEUTRAL',
      'SELL': 'VENTA',
      'STRONG_SELL': 'FUERTE VENTA'
    };
    return labels[signal] || signal;
  },

  _renderSummary() {
    const portfolio = Portfolio.getAll();
    const summary = Report.generateSummary(portfolio, this._marketData, this._signals);
    const initialCapital = Storage.getInitialCapital();
    const cash = Storage.getCashBalance();
    const totalValue = summary.totalCurrent + cash;
    const totalGainLoss = initialCapital > 0 ? totalValue - initialCapital : summary.totalGainLoss;
    const totalReturn = initialCapital > 0 ? (totalGainLoss / initialCapital) * 100 : summary.totalReturn;

    document.getElementById('totalInvested').textContent = formatCurrency(initialCapital > 0 ? initialCapital : summary.totalInvested);
    document.getElementById('totalCurrent').textContent = formatCurrency(totalValue);
    document.getElementById('cashBalance').textContent = formatCurrency(cash);
    document.getElementById('initialCapitalInput').value = initialCapital;
    const gainLossEl = document.getElementById('totalGainLoss');
    gainLossEl.textContent = formatCurrency(totalGainLoss) + ' (' + formatPercent(totalReturn) + ')';
    gainLossEl.className = totalGainLoss >= 0 ? 'positive' : 'negative';
    document.getElementById('positionCount').textContent = portfolio.length;
  },

  _renderTransactions() {
    const transactions = Storage.getTransactions();
    const tbody = document.querySelector('#transactionsTable tbody');
    tbody.innerHTML = '';
    if (transactions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay transacciones registradas</td></tr>';
      return;
    }
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    sorted.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = [
        '<td>' + t.date + '</td>',
        '<td>' + t.ticker + '</td>',
        '<td class="' + (t.type === 'BUY' ? 'positive' : 'negative') + '">' + (t.type === 'BUY' ? 'COMPRA' : 'VENTA') + '</td>',
        '<td>' + t.shares + '</td>',
        '<td>' + formatCurrency(t.price) + '</td>',
        '<td>' + formatCurrency(t.total) + '</td>'
      ].join('');
      tbody.appendChild(tr);
    });
  },

  _renderEquityChart() {
    const canvas = document.getElementById('equityChart');
    const ctx = canvas.getContext('2d');
    const history = Storage.getEquityHistory();
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (history.length < 2) {
      ctx.fillStyle = '#999';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Datos insuficientes para el gr\u00e1fico', canvas.width / 2, canvas.height / 2);
      return;
    }

    const padding = { top: 20, right: 20, bottom: 30, left: 60 };
    const chartW = canvas.width - padding.left - padding.right;
    const chartH = canvas.height - padding.top - padding.bottom;
    const values = history.map(h => h.value);
    const min = Math.min(...values) * 0.95;
    const max = Math.max(...values) * 1.05;
    const range = max - min;

    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    values.forEach((v, i) => {
      const x = padding.left + (i / (values.length - 1)) * chartW;
      const y = padding.top + chartH - ((v - min) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#666';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (i / 4) * chartH;
      const val = max - (i / 4) * range;
      ctx.fillText(formatCurrency(val), padding.left - 5, y + 4);
      ctx.strokeStyle = '#eee';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(canvas.width - padding.right, y);
      ctx.stroke();
    }
  },

  _handleAccionesUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      var result = Portfolio.loadFromAccionesTxt(content);
      if (result.success) {
        this.showToast('Cargadas ' + result.count + ' posiciones y ' + result.transactions + ' transacciones', 'success');
      } else {
        this.showToast('Error: ' + result.error, 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  },

  _handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      let result;
      if (file.name.endsWith('.json')) {
        result = Portfolio.loadFromJSON(content);
      } else if (file.name.endsWith('.csv')) {
        result = Portfolio.loadFromCSV(content);
      } else {
        this.showToast('Formato no soportado. Usa .json o .csv', 'error');
        return;
      }
      if (result.success) {
        this.showToast('Cargadas ' + result.count + ' posiciones', 'success');
      } else {
        this.showToast('Error: ' + result.error, 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  },

  _showTransactionModal() {
    document.getElementById('transactionModal').classList.add('show');
    document.getElementById('transactionDate').value = getDateStr(new Date());
  },

  _hideTransactionModal() {
    document.getElementById('transactionModal').classList.remove('show');
    document.getElementById('transactionForm').reset();
  },

  _handleTransactionSubmit(e) {
    e.preventDefault();
    const ticker = document.getElementById('transactionTicker').value.toUpperCase();
    const type = document.getElementById('transactionType').value;
    const shares = parseFloat(document.getElementById('transactionShares').value);
    const price = parseFloat(document.getElementById('transactionPrice').value);
    const date = document.getElementById('transactionDate').value;

    if (!ticker || shares <= 0 || price <= 0 || !date) {
      this.showToast('Completa todos los campos correctamente', 'error');
      return;
    }

    const transaction = {
      id: generateId(),
      date: date,
      ticker: ticker,
      type: type,
      shares: shares,
      price: price,
      total: shares * price
    };

    const transactions = Storage.getTransactions();
    transactions.push(transaction);
    Storage.setTransactions(transactions);

    const total = shares * price;
    let cash = Storage.getCashBalance();

    if (type === 'BUY') {
      Portfolio.add({ ticker: ticker, shares: shares, avgPrice: price });
      cash -= total;
    } else {
      const item = Portfolio.get(ticker);
      if (item) {
        const newShares = item.shares - shares;
        if (newShares <= 0) {
          Portfolio.remove(ticker);
        } else {
          Portfolio.update(ticker, { shares: newShares });
        }
      }
      cash += total;
    }

    Storage.setCashBalance(cash);

    this._hideTransactionModal();
    this.showToast('Transacci\u00f3n registrada', 'success');
  },

  _showReport() {
    const portfolio = Portfolio.getAll();
    const summary = Report.generateSummary(portfolio, this._marketData, this._signals);
    const transactions = Storage.getTransactions();
    const text = Report.generateTextReport(summary, transactions);
    document.getElementById('reportContent').textContent = text;
    document.getElementById('reportModal').classList.add('show');
  },

  _hideReportModal() {
    document.getElementById('reportModal').classList.remove('show');
  },

  _copyReport() {
    const content = document.getElementById('reportContent').textContent;
    Report.copyToClipboard(content);
  },

  _downloadReport() {
    const content = document.getElementById('reportContent').textContent;
    Report.download(content, 'reporte-portafolio.txt', 'text/plain');
  },

  _downloadReportCSV() {
    const portfolio = Portfolio.getAll();
    const summary = Report.generateSummary(portfolio, this._marketData, this._signals);
    const csv = Report.generateCSV(summary);
    Report.download(csv, 'posiciones.csv', 'text/csv');
  },

  _exportText() {
    const portfolio = Portfolio.getAll();
    const summary = Report.generateSummary(portfolio, this._marketData, this._signals);
    const transactions = Storage.getTransactions();
    const text = Report.generateTextReport(summary, transactions);
    Report.download(text, 'reporte-portafolio.txt', 'text/plain');
  },

  _exportCSV() {
    const portfolio = Portfolio.getAll();
    const summary = Report.generateSummary(portfolio, this._marketData, this._signals);
    const csv = Report.generateCSV(summary);
    Report.download(csv, 'posiciones.csv', 'text/csv');
  },

  _exportJSON() {
    const portfolio = Portfolio.getAll();
    const data = { portfolio: portfolio, exportedAt: new Date().toISOString() };
    const json = JSON.stringify(data, null, 2);
    Report.download(json, 'portafolio.json', 'application/json');
  },

  _toggleTheme() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-theme');
    Storage.setSettings({ theme: isDark ? 'dark' : 'light' });
  },

  _clearData() {
    if (confirm('Eliminar todos los datos del portafolio?')) {
      Storage.clearAll();
      Portfolio.init();
      this._marketData = {};
      this._signals = {};
      this._indicators = {};
      this._renderAll();
      this.showToast('Datos eliminados', 'success');
    }
  },

  _getTotalValue() {
    const portfolio = Portfolio.getAll();
    let positionsValue = 0;
    portfolio.forEach(item => {
      const md = this._marketData[item.ticker];
      if (md) {
        positionsValue += item.shares * md.currentPrice;
      }
    });
    return positionsValue + Storage.getCashBalance();
  },

  _showLoading(show) {
    document.getElementById('loadingIndicator').style.display = show ? 'block' : 'none';
  },

  showToast(message, type) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};
