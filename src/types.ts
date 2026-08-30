export interface StockCandidate {
  ticker: string;
  company: string;
  category: string;
}

export interface BenchmarkConfig {
  ticker: string;
  name: string;
  description: string;
}

export interface SessionApiKeys {
  twelveDataApiKey: string;
  openRouterApiKey: string;
  openRouterModel: string;
}

export interface PriceBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoryResult {
  symbol: string;
  status: 'ok' | 'error';
  data: PriceBar[];
  message?: string;
  fetchedAt: string;
}

export interface MACDResult {
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  histogram: (number | null)[];
  latest: {
    macd: number | null;
    signal: number | null;
    histogram: number | null;
  };
}

export interface TechnicalSummaryMetrics {
  latestClose: number | null;
  sma50: number | null;
  sma200: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  rsi14: number | null;
  trailing60Return: number | null;
  annualizedVolatility: number | null;
}

export type FetchStatus = 'pending' | 'loading' | 'success' | 'insufficient-data' | 'failed';

export interface SymbolDataRecord {
  ticker: string;
  company: string;
  category: string;
  status: FetchStatus;
  validBarCount: number;
  earliestDate: string | null;
  latestDate: string | null;
  errorMessage?: string;
  data: PriceBar[];
}

export type SymbolDataMap = Record<string, SymbolDataRecord>;

