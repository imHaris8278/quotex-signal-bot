import type {
  IndicatorResult,
  LiveMarketData,
  LivePriceSignal,
  MarketType,
  SignalResponse,
  SignalStrength,
  TradeDuration,
} from "../types.js";
import type { Candle } from "../types.js";
import { detectMarketCondition } from "./candleTiming.js";
import { getCandleTiming } from "./candleTiming.js";
import { analyzeLivePriceAction } from "./livePriceAction.js";

export function analyzeCandles(
  candles: Candle[],
  options: {
    symbol: string;
    market: MarketType;
    duration: TradeDuration;
    dataSource: "live" | "simulated";
    liveMarket?: LiveMarketData;
  }
): SignalResponse {
  const timing = getCandleTiming(options.duration);
  const livePrice = options.liveMarket?.currentPrice ?? candles[candles.length - 1].close;

  const liveSignal = analyzeLivePriceAction(
    candles,
    livePrice,
    timing.closesAt,
    timing.secondsUntilClose,
    options.duration
  );

  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const marketCondition = detectMarketCondition(closes, highs, lows);

  const indicators: IndicatorResult[] = liveSignal.checks.map((check) => ({
    name: check.name,
    bullish: check.direction === "UP",
    bearish: check.direction === "DOWN",
    value: check.value,
  }));

  const hasSignal = liveSignal.entry !== null;
  const direction = liveSignal.entry;

  const confirmCount =
    liveSignal.entry === "CALL" ? liveSignal.upCount :
    liveSignal.entry === "PUT" ? liveSignal.downCount : 0;

  const alignmentPercent = hasSignal
    ? Math.round((confirmCount / liveSignal.totalChecks) * 100)
    : Math.round((Math.max(liveSignal.upCount, liveSignal.downCount) / liveSignal.totalChecks) * 100);

  const confirmed = hasSignal && confirmCount >= 4;

  return {
    hasSignal,
    direction,
    confidence: alignmentPercent,
    strength: liveSignal.strength as SignalStrength,
    price: liveSignal.entryPrice,
    bull: liveSignal.upCount,
    bear: liveSignal.downCount,
    agreement: hasSignal ? confirmCount : Math.max(liveSignal.upCount, liveSignal.downCount),
    indicators,
    marketCondition,
    dataSource: options.dataSource,
    symbol: options.symbol,
    market: options.market,
    duration: options.duration,
    candle: timing,
    nextCandle: timing.nextCandle,
    confirmed,
    veryHigh: alignmentPercent >= 80,
    liveSignal,
    liveMarket: options.liveMarket,
    message: hasSignal
      ? undefined
      : liveSignal.nextCandleType === "DOJI"
        ? "Live doji forming — no trade"
        : liveSignal.nextCandleType === "NORMAL"
          ? "Live market ranging — wait"
          : "Live checks split — no trade",
  };
}
