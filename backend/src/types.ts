export type MarketType = "real" | "otc";
export type TradeDuration = 1 | 2 | 5;
export type SignalDirection = "CALL" | "PUT";
export type SignalStrength = "VERY HIGH" | "STRONG" | "MODERATE" | "WEAK";
export type MarketCondition = "TRENDING" | "RANGING" | "VOLATILE";
export type NextCandleClassification = "UP" | "DOWN" | "NORMAL" | "DOJI";
export type LiveDirection = "UP" | "DOWN" | "FLAT";

export interface Candle {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface LivePriceCheck {
  name: string;
  direction: LiveDirection;
  value: string;
}

export interface LivePriceSignal {
  livePrice: number;
  marketDirection: LiveDirection;
  nextCandleType: NextCandleClassification;
  entry: SignalDirection | null;
  checks: LivePriceCheck[];
  upCount: number;
  downCount: number;
  totalChecks: number;
  alignmentLabel: string;
  strength: SignalStrength;
  summary: string;
  entryPrice: string;
  entryAt: string;
  recentCandles: Candle[];
  formingCandle: Candle;
  analyzedBeforeCloseSec: number;
}

export interface IndicatorResult {
  name: string;
  bullish: boolean;
  bearish: boolean;
  value: string;
}

export interface LiveMarketData {
  symbol: string;
  interval: string;
  fetchedAt: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  lastCandle: Candle;
  previousCandle: Candle | null;
  candleCount: number;
  recentCandles?: Candle[];
  exchange?: string;
  currency?: string;
}

export interface SignalResponse {
  hasSignal: boolean;
  direction: SignalDirection | null;
  confidence: number;
  strength: SignalStrength | null;
  price: string;
  bull: number;
  bear: number;
  agreement: number;
  indicators: IndicatorResult[];
  marketCondition: MarketCondition;
  dataSource: "live" | "simulated";
  symbol: string;
  market: MarketType;
  duration: TradeDuration;
  candle: {
    durationMinutes: TradeDuration;
    openedAt: string;
    closesAt: string;
    secondsUntilClose: number;
  };
  nextCandle: {
    opensAt: string;
    closesAt: string;
    secondsUntilOpen: number;
  };
  confirmed: boolean;
  veryHigh: boolean;
  liveSignal: LivePriceSignal;
  liveMarket?: LiveMarketData;
  message?: string;
}

export interface PairInfo {
  id: string;
  label: string;
  symbol: string;
  market: MarketType;
}
