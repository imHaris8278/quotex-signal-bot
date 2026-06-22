import type { MarketType, PairInfo, SignalResponse, TradeDuration } from "./types";

function getApiBase(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "http://localhost:4000";
}

export async function fetchPairs(market: MarketType): Promise<PairInfo[]> {
  const response = await fetch(`${getApiBase()}/api/pairs?market=${market}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to load pairs");
  const data = await response.json();
  return data.pairs;
}

export async function fetchSignal(
  pairId: string,
  market: MarketType,
  duration: TradeDuration
): Promise<SignalResponse> {
  let response: Response;

  try {
    response = await fetch(
      `${getApiBase()}/api/signal/${pairId}?market=${market}&duration=${duration}`,
      { cache: "no-store" }
    );
  } catch {
    throw new Error(
      "Cannot reach backend — make sure it is running on port 4000 (npm run dev:backend)"
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        (response.status === 502
          ? "Twelve Data API unavailable — check your API key and internet connection"
          : "Failed to fetch signal")
    );
  }

  return data;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBase()}/health`, { cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}
