export function calcRSI(closes: number[], period = 14): number {
  if (closes.length <= period) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  const avgLoss = losses / period;
  if (!avgLoss) return 100;

  const rs = gains / period / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calcEMA(closes: number[], period: number): number {
  if (closes.length < period) {
    return closes[closes.length - 1] ?? 0;
  }

  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((sum, value) => sum + value, 0) / period;

  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }

  return ema;
}

export function calcBollingerBands(closes: number[], period = 20) {
  const slice = closes.slice(-period);
  const mean = slice.reduce((sum, value) => sum + value, 0) / slice.length;
  const variance = slice.reduce((sum, value) => sum + (value - mean) ** 2, 0) / slice.length;
  const std = Math.sqrt(variance);

  return {
    upper: mean + 2 * std,
    middle: mean,
    lower: mean - 2 * std,
  };
}

export function calcStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): number {
  const high = Math.max(...highs.slice(-period));
  const low = Math.min(...lows.slice(-period));
  const current = closes[closes.length - 1];

  if (high === low) return 50;
  return ((current - low) / (high - low)) * 100;
}

export function calcATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): number {
  const trs: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trs.push(tr);
  }

  const slice = trs.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / slice.length;
}
