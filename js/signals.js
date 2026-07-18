const Signals = {
  generate(indicators, closes) {
    if (!indicators || !closes || closes.length < 2) return { signal: 'NEUTRAL', score: 0, details: [] };
    const details = [];
    let score = 0;
    const lastIdx = indicators.rsi.length - 1;
    const rsi = indicators.rsi[lastIdx];
    const sma50 = indicators.sma50[lastIdx];
    const macd = indicators.macd;
    const bb = indicators.bollinger;

    if (rsi !== null) {
      if (rsi < 30) {
        score += 2;
        details.push({ type: 'BUY', reason: 'RSI en sobreventa (' + rsi.toFixed(1) + ')', weight: 2 });
      } else if (rsi > 70) {
        score -= 2;
        details.push({ type: 'SELL', reason: 'RSI en sobrecompra (' + rsi.toFixed(1) + ')', weight: 2 });
      }
    }

    if (sma50 !== null) {
      const prevPrice = closes[closes.length - 2];
      const currPrice = closes[closes.length - 1];
      if (prevPrice <= sma50 && currPrice > sma50) {
        score += 1.5;
        details.push({ type: 'BUY', reason: 'Precio cruza arriba SMA(50)', weight: 1.5 });
      } else if (prevPrice >= sma50 && currPrice < sma50) {
        score -= 1.5;
        details.push({ type: 'SELL', reason: 'Precio cruza abajo SMA(50)', weight: 1.5 });
      }
    }

    if (macd && macd.histogram && macd.histogram.length >= 2) {
      const prevHist = macd.histogram[macd.histogram.length - 2];
      const currHist = macd.histogram[macd.histogram.length - 1];
      if (prevHist < 0 && currHist > 0) {
        score += 1.5;
        details.push({ type: 'BUY', reason: 'MACD bullish crossover', weight: 1.5 });
      } else if (prevHist > 0 && currHist < 0) {
        score -= 1.5;
        details.push({ type: 'SELL', reason: 'MACD bearish crossover', weight: 1.5 });
      }
    }

    if (bb && bb.upper[lastIdx] !== null) {
      const currPrice = closes[lastIdx];
      if (currPrice <= bb.lower[lastIdx]) {
        score += 1;
        details.push({ type: 'BUY', reason: 'Precio toca banda inferior Bollinger', weight: 1 });
      } else if (currPrice >= bb.upper[lastIdx]) {
        score -= 1;
        details.push({ type: 'SELL', reason: 'Precio toca banda superior Bollinger', weight: 1 });
      }
    }

    let signal;
    if (score >= 3) signal = 'STRONG_BUY';
    else if (score >= 1) signal = 'BUY';
    else if (score <= -3) signal = 'STRONG_SELL';
    else if (score <= -1) signal = 'SELL';
    else signal = 'NEUTRAL';

    return { signal, score, details };
  }
};