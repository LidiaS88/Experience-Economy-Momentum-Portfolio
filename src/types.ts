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
