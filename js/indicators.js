const Indicators = {
  SMA(data, period) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(null);
      } else {
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) {
          sum += data[j];
        }
        result.push(sum / period);
      }
    }
    return result;
  },

  EMA(data, period) {
    const result = [];
    const multiplier = 2 / (period + 1);
    let ema = data[0];
    result.push(ema);
    for (let i = 1; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
      result.push(ema);
    }
    return result;
  },

  RSI(data, period) {
    period = period || 14;
    const result = [];
    const gains = [];
    const losses = [];
    for (let i = 1; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      gains.push(diff > 0 ? diff : 0);
      losses.push(diff < 0 ? -diff : 0);
    }
    for (let i = 0; i < data.length; i++) {
      if (i < period) {
        result.push(null);
      } else {
        const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
        if (avgLoss === 0) {
          result.push(100);
        } else {
          const rs = avgGain / avgLoss;
          result.push(100 - 100 / (1 + rs));
        }
      }
    }
    return result;
  },

  MACD(data) {
    const ema12 = this.EMA(data, 12);
    const ema26 = this.EMA(data, 26);
    const macdLine = [];
    for (let i = 0; i < data.length; i++) {
      macdLine.push(ema12[i] - ema26[i]);
    }
    const signal = this.EMA(macdLine, 9);
    const histogram = [];
    for (let i = 0; i < data.length; i++) {
      histogram.push(macdLine[i] - signal[i]);
    }
    return { macdLine, signal, histogram };
  },

  BollingerBands(data, period, stdDev) {
    period = period || 20;
    stdDev = stdDev || 2;
    const sma = this.SMA(data, period);
    const upper = [];
    const lower = [];
    for (let i = 0; i < data.length; i++) {
      if (sma[i] === null) {
        upper.push(null);
        lower.push(null);
      } else {
        let sumSq = 0;
        let count = 0;
        for (let j = Math.max(0, i - period + 1); j <= i; j++) {
          sumSq += Math.pow(data[j] - sma[i], 2);
          count++;
        }
        const std = Math.sqrt(sumSq / count);
        upper.push(sma[i] + stdDev * std);
        lower.push(sma[i] - stdDev * std);
      }
    }
    return { upper, middle: sma, lower };
  },

  calculateAll(closes) {
    if (!closes || closes.length < 50) return null;
    return {
      sma10: this.SMA(closes, 10),
      sma20: this.SMA(closes, 20),
      sma50: this.SMA(closes, 50),
      ema12: this.EMA(closes, 12),
      ema26: this.EMA(closes, 26),
      rsi: this.RSI(closes, 14),
      macd: this.MACD(closes),
      bollinger: this.BollingerBands(closes, 20, 2)
    };
  }
};
