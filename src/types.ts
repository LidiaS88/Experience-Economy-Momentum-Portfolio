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
