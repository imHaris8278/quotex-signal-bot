import type { MarketType, PairInfo } from "../types.js";

const REAL_PAIRS: Omit<PairInfo, "market">[] = [
  { id: "eurusd", label: "EUR/USD", symbol: "EUR/USD" },
  { id: "gbpusd", label: "GBP/USD", symbol: "GBP/USD" },
  { id: "usdjpy", label: "USD/JPY", symbol: "USD/JPY" },
  { id: "usdchf", label: "USD/CHF", symbol: "USD/CHF" },
  { id: "audusd", label: "AUD/USD", symbol: "AUD/USD" },
  { id: "usdcad", label: "USD/CAD", symbol: "USD/CAD" },
  { id: "nzdusd", label: "NZD/USD", symbol: "NZD/USD" },
  { id: "eurjpy", label: "EUR/JPY", symbol: "EUR/JPY" },
  { id: "gbpjpy", label: "GBP/JPY", symbol: "GBP/JPY" },
  { id: "eurgbp", label: "EUR/GBP", symbol: "EUR/GBP" },
  { id: "audjpy", label: "AUD/JPY", symbol: "AUD/JPY" },
  { id: "eurchf", label: "EUR/CHF", symbol: "EUR/CHF" },
  { id: "eurcad", label: "EUR/CAD", symbol: "EUR/CAD" },
  { id: "gbpaud", label: "GBP/AUD", symbol: "GBP/AUD" },
  { id: "gbpcad", label: "GBP/CAD", symbol: "GBP/CAD" },
  { id: "gbpchf", label: "GBP/CHF", symbol: "GBP/CHF" },
  { id: "cadchf", label: "CAD/CHF", symbol: "CAD/CHF" },
  { id: "cadjpy", label: "CAD/JPY", symbol: "CAD/JPY" },
  { id: "chfjpy", label: "CHF/JPY", symbol: "CHF/JPY" },
  { id: "nzdjpy", label: "NZD/JPY", symbol: "NZD/JPY" },
  { id: "audcad", label: "AUD/CAD", symbol: "AUD/CAD" },
  { id: "audchf", label: "AUD/CHF", symbol: "AUD/CHF" },
  { id: "audnzd", label: "AUD/NZD", symbol: "AUD/NZD" },
  { id: "eurnzd", label: "EUR/NZD", symbol: "EUR/NZD" },
  { id: "gbpnzd", label: "GBP/NZD", symbol: "GBP/NZD" },
  { id: "usdmxn", label: "USD/MXN", symbol: "USD/MXN" },
  { id: "usdtry", label: "USD/TRY", symbol: "USD/TRY" },
  { id: "usdzar", label: "USD/ZAR", symbol: "USD/ZAR" },
  { id: "usdcnh", label: "USD/CNH", symbol: "USD/CNH" },
  { id: "usdsge", label: "USD/SGD", symbol: "USD/SGD" },
  { id: "usdsek", label: "USD/SEK", symbol: "USD/SEK" },
  { id: "usdnok", label: "USD/NOK", symbol: "USD/NOK" },
  { id: "xauusd", label: "Gold (XAU/USD)", symbol: "XAU/USD" },
  { id: "xagusd", label: "Silver (XAG/USD)", symbol: "XAG/USD" },
  { id: "btcusd", label: "Bitcoin (BTC/USD)", symbol: "BTC/USD" },
  { id: "ethusd", label: "Ethereum (ETH/USD)", symbol: "ETH/USD" },
];

const OTC_PAIRS: Omit<PairInfo, "market">[] = [
  { id: "otc-eurusd", label: "EUR/USD (OTC)", symbol: "EUR/USD" },
  { id: "otc-gbpusd", label: "GBP/USD (OTC)", symbol: "GBP/USD" },
  { id: "otc-usdjpy", label: "USD/JPY (OTC)", symbol: "USD/JPY" },
  { id: "otc-audusd", label: "AUD/USD (OTC)", symbol: "AUD/USD" },
  { id: "otc-usdcad", label: "USD/CAD (OTC)", symbol: "USD/CAD" },
  { id: "otc-eurjpy", label: "EUR/JPY (OTC)", symbol: "EUR/JPY" },
  { id: "otc-gbpjpy", label: "GBP/JPY (OTC)", symbol: "GBP/JPY" },
  { id: "otc-btcusd", label: "BTC/USD (OTC)", symbol: "BTC/USD" },
  { id: "otc-ethusd", label: "ETH/USD (OTC)", symbol: "ETH/USD" },
  { id: "otc-xauusd", label: "Gold (OTC)", symbol: "XAU/USD" },
  { id: "otc-xagusd", label: "Silver (OTC)", symbol: "XAG/USD" },
  { id: "otc-usoil", label: "US Oil (OTC)", symbol: "WTI/USD" },
  { id: "otc-nas100", label: "NAS100 (OTC)", symbol: "NDX" },
  { id: "otc-spx500", label: "SPX500 (OTC)", symbol: "SPX" },
  { id: "otc-apple", label: "Apple (OTC)", symbol: "AAPL" },
  { id: "otc-tesla", label: "Tesla (OTC)", symbol: "TSLA" },
  { id: "otc-amazon", label: "Amazon (OTC)", symbol: "AMZN" },
  { id: "otc-meta", label: "Meta (OTC)", symbol: "META" },
  { id: "otc-netflix", label: "Netflix (OTC)", symbol: "NFLX" },
  { id: "otc-intc", label: "Intel (OTC)", symbol: "INTC" },
];

export function getPairs(market: MarketType): PairInfo[] {
  const source = market === "real" ? REAL_PAIRS : OTC_PAIRS;
  return source.map((pair) => ({ ...pair, market }));
}

export function findPair(id: string, market: MarketType): PairInfo | undefined {
  return getPairs(market).find((pair) => pair.id === id);
}

export function durationToInterval(duration: number): string {
  if (duration === 1) return "1min";
  if (duration === 2) return "2min";
  if (duration === 5) return "5min";
  return "1min";
}
