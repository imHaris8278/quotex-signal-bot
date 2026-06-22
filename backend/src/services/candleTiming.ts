import type { Candle, MarketCondition, TradeDuration } from "../types.js";

export function getCandleTiming(durationMinutes: TradeDuration, now = new Date()) {
  const durationMs = durationMinutes * 60 * 1000;
  const nowMs = now.getTime();
  const openedAtMs = Math.floor(nowMs / durationMs) * durationMs;
  const closesAtMs = openedAtMs + durationMs;
  const nextOpensAtMs = closesAtMs;
  const nextClosesAtMs = closesAtMs + durationMs;

  return {
    durationMinutes,
    openedAt: new Date(openedAtMs).toISOString(),
    closesAt: new Date(closesAtMs).toISOString(),
    secondsUntilClose: Math.max(0, Math.ceil((closesAtMs - nowMs) / 1000)),
    nextCandle: {
      opensAt: new Date(nextOpensAtMs).toISOString(),
      closesAt: new Date(nextClosesAtMs).toISOString(),
      secondsUntilOpen: Math.max(0, Math.ceil((nextOpensAtMs - nowMs) / 1000)),
    },
  };
}

export function detectMarketCondition(closes: number[], highs: number[], lows: number[]): MarketCondition {
  const emaShort = exponentialAverage(closes.slice(-20));
  const emaLong = exponentialAverage(closes.slice(-50));
  const trendStrength = Math.abs(emaShort - emaLong) / emaLong;

  const recent = closes.slice(-20);
  const returns = recent.slice(1).map((value, index) => Math.abs(value - recent[index]));
  const avgMove = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const volatility = avgMove / recent[recent.length - 1];

  const range = Math.max(...highs.slice(-20)) - Math.min(...lows.slice(-20));
  const rangeRatio = range / closes[closes.length - 1];

  if (volatility > 0.0015 || rangeRatio > 0.004) return "VOLATILE";
  if (trendStrength > 0.001) return "TRENDING";
  return "RANGING";
}

function exponentialAverage(values: number[]): number {
  if (!values.length) return 0;
  const k = 2 / (values.length + 1);
  let ema = values[0];
  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }
  return ema;
}

export function aggregateCandles(candles: Candle[], groupSize: number): Candle[] {
  if (groupSize <= 1) return candles;

  const aggregated: Candle[] = [];
  for (let i = 0; i < candles.length; i += groupSize) {
    const chunk = candles.slice(i, i + groupSize);
    if (!chunk.length) continue;

    aggregated.push({
      datetime: chunk[chunk.length - 1].datetime,
      open: chunk[0].open,
      high: Math.max(...chunk.map((c) => c.high)),
      low: Math.min(...chunk.map((c) => c.low)),
      close: chunk[chunk.length - 1].close,
    });
  }

  return aggregated;
}
