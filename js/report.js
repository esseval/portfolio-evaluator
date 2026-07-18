const Report = {
  generateSummary(portfolio, marketData, signals) {
    let totalInvested = 0;
    let totalCurrent = 0;
    let totalGainLoss = 0;
    const positions = [];

    portfolio.forEach(item => {
      const md = marketData[item.ticker];
      const currentPrice = md ? md.currentPrice : 0;
      const invested = item.shares * item.avgPrice;
      const current = item.shares * currentPrice;
      const gainLoss = current - invested;
      const gainLossPercent = invested > 0 ? ((current - invested) / invested) * 100 : 0;
      totalInvested += invested;
      totalCurrent += current;
      totalGainLoss += gainLoss;

      positions.push({
        ticker: item.ticker,
        name: item.name,
        shares: item.shares,
        avgPrice: item.avgPrice,
        currentPrice: currentPrice,
        invested: invested,
        current: current,
        gainLoss: gainLoss,
        gainLossPercent: gainLossPercent,
        signal: signals[item.ticker] ? signals[item.ticker].signal : 'NEUTRAL'
      });
    });

    const totalReturn = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrent,
      totalGainLoss: totalCurrent - totalInvested,
      totalReturn,
      positions
    };
  },

  generateTextReport(summary, transactions) {
    const lines = [];
    lines.push('=== REPORTE DE PORTAFOLIO ===');
    lines.push('Fecha: ' + new Date().toLocaleDateString());
    lines.push('');
    lines.push('RESUMEN');
    lines.push('Capital Invertido: ' + formatCurrency(summary.totalInvested));
    lines.push('Valor Actual: ' + formatCurrency(summary.totalCurrent));
    lines.push('Ganancia/Pérdida: ' + formatCurrency(summary.totalGainLoss) + ' (' + formatPercent(summary.totalReturn) + ')');
    lines.push('');
    lines.push('POSICIONES');
    lines.push('Ticker | Nombre | Cantidad | Precio Compra | Precio Actual | Rendimiento | Señal');
    lines.push('-'.repeat(90));
    summary.positions.forEach(p => {
      lines.push(p.ticker + ' | ' + p.name + ' | ' + p.shares + ' | ' + formatCurrency(p.avgPrice) + ' | ' + formatCurrency(p.currentPrice) + ' | ' + formatPercent(p.gainLossPercent) + ' | ' + p.signal);
    });

    if (transactions && transactions.length > 0) {
      lines.push('');
      lines.push('TRANSACCIONES');
      lines.push('Fecha | Ticker | Tipo | Cantidad | Precio | Total');
      lines.push('-'.repeat(60));
      transactions.forEach(t => {
        lines.push(t.date + ' | ' + t.ticker + ' | ' + t.type + ' | ' + t.shares + ' | ' + formatCurrency(t.price) + ' | ' + formatCurrency(t.total));
      });
    }

    return lines.join('\n');
  },

  generateCSV(summary) {
    const lines = [];
    lines.push('Ticker,Nombre,Cantidad,Precio Compra,Precio Actual,Invertido,Valor Actual,Ganancia/Ganancia%,Señal');
    summary.positions.forEach(p => {
      lines.push(p.ticker + ',' + p.name + ',' + p.shares + ',' + p.avgPrice + ',' + p.currentPrice + ',' + p.invested.toFixed(2) + ',' + p.current.toFixed(2) + ',' + p.gainLossPercent.toFixed(2) + ',' + p.signal);
    });
    return lines.join('\n');
  },

  generateTransactionsCSV(transactions) {
    const lines = [];
    lines.push('Fecha,Ticker,Tipo,Cantidad,Precio,Total');
    transactions.forEach(t => {
      lines.push(t.date + ',' + t.ticker + ',' + t.type + ',' + t.shares + ',' + t.price.toFixed(2) + ',' + t.total.toFixed(2));
    });
    return lines.join('\n');
  },

  download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      App.showToast('Copiado al portapapeles', 'success');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      App.showToast('Copiado al portapapeles', 'success');
    });
  }
};