function formatCurrency(value) {
  return '$' + ' ' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatPercent(value) {
  return (value >= 0 ? '+' : '') + value.toFixed(2) + '%';
}

function formatNumber(value, decimals) {
  if (decimals === undefined) decimals = 2;
  return value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
}

function parseCSVToPortfolio(text) {
  const rows = parseCSV(text);
  return rows.map(row => ({
    ticker: row.ticker.toUpperCase(),
    name: row.name || '',
    shares: parseFloat(row.shares) || 0,
    avgPrice: parseFloat(row.avgPrice) || 0
  }));
}

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function getDateStr(d) {
  return d.toISOString().split('T')[0];
}

function daysBetween(d1, d2) {
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}
