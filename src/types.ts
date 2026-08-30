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

export type EligibilityStatus = 'Eligible' | 'Ineligible' | 'Data unavailable';
export type TechnicalRatingLabel = 'Constructive' | 'Mixed' | 'Caution' | 'Data unavailable';

export interface TechnicalScoreBreakdown {
  priceAboveSma200: boolean;
  sma50AboveSma200: boolean;
  macdAboveSignal: boolean;
  rsiInRange: boolean;
}

export interface CandidateScreeningItem {
  ticker: string;
  company: string;
  category: string;
  hasSufficientData: boolean;
  validBarCount: number;
  latestPrice: number | null;
  sma50: number | null;
  sma200: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  rsi14: number | null;
  trailing60Return: number | null;
  annualizedVolatility: number | null;
  technicalScore: number | null;
  scoreBreakdown: TechnicalScoreBreakdown | null;
  smaComparisonLabel: 'Above' | 'Below' | 'Data unavailable';
  macdStatusLabel: 'Bullish' | 'Bearish' | 'Data unavailable';
  technicalLabel: TechnicalRatingLabel;
  eligibility: EligibilityStatus;
}

export interface DailyReturn {
  date: string;
  value: number;
}

export interface AlignedReturnMatrix {
  dates: string[];
  tickers: string[];
  matrix: number[][]; // rows: dates, cols: tickers
  seriesByTicker: Record<string, number[]>;
  startDate: string | null;
  endDate: string | null;
  dateCount: number;
  isSufficient: boolean;
  warning?: string;
}

export interface CovarianceMatrixResult {
  tickers: string[];
  dailyCovariance: number[][];
  annualizedCovariance: number[][];
  sampleSize: number;
  isPositiveDefinite: boolean;
}

export interface CorrelationMatrixResult {
  tickers: string[];
  correlationMatrix: number[][];
}

export interface PortfolioPerformanceMetrics {
  cumulativeReturn: number | null;
  annualizedReturn: number | null;
  annualizedVolatility: number | null;
  maxDrawdown: number | null;
  sharpeRatio: number | null;
  riskFreeRateAssumption: number;
  observationCount: number;
  startDate: string | null;
  endDate: string | null;
}

export interface PortfolioReadinessSummary {
  eligibleTickers: string[];
  eligibleCount: number;
  totalCandidates: number;
  isEligibleBelowThreshold: boolean;
  fallbackNotice?: string;
  commonDateCount: number;
  startDate: string | null;
  endDate: string | null;
  isHistorySufficient: boolean;
  covarianceStatus: 'Ready' | 'Insufficient Dates' | 'No Eligible Stocks' | 'Data Unavailable';
  alignedReturns: AlignedReturnMatrix | null;
  covarianceMatrix: CovarianceMatrixResult | null;
  correlationMatrix: CorrelationMatrixResult | null;
  equalWeightPerformance: PortfolioPerformanceMetrics | null;
  benchmarkPerformance: PortfolioPerformanceMetrics | null;
  benchmarkAvailability: 'Available' | 'Aligned' | 'Insufficient Data' | 'Unavailable';
}

export type InclusionReason = 'Eligible Technical Pass' | 'Fallback included';

export type OptimizerSignalStatus = 'Constructive' | 'Mixed' | 'Caution' | 'Data Unavailable';

export interface OptimizedHolding {
  ticker: string;
  company: string;
  category: string;
  inclusionReason: InclusionReason;
  technicalScore: number | null;
  weight: number; // Decimal (e.g. 0.125 for 12.50%)
  dollarAllocation: number; // Scaled to $1,000,000
  latestPrice: number | null;
  signalStatus: OptimizerSignalStatus;
  shares: number | null;
}

export interface OptimizerValidation {
  isValid: boolean;
  weightSum: number;
  weightSumTolerancePassed: boolean;
  noNegativeWeights: boolean;
  maxWeightConstraintPassed: boolean;
  allHoldingsWeighted: boolean;
  largestWeight: number;
  smallestWeight: number;
  validationErrors: string[];
}

export interface LatestQuoteResult {
  symbol: string;
  price: number | null;
  previousClose: number | null;
  change: number | null;
  percentChange: number | null;
  datetime: string | null;
  timestamp: number | null;
  isMarketOpen: boolean | null;
  fetchedAt: string;
  status: 'ok' | 'error';
  errorMessage?: string;
  priceLabel: 'Live market price' | 'Latest available price' | 'Data unavailable';
}

export type LatestQuotesMap = Record<string, LatestQuoteResult>;

export interface QuoteRefreshSummary {
  lastRefreshedAt: string | null;
  totalAttempted: number;
  successCount: number;
  failureCount: number;
  errors: { symbol: string; error: string }[];
}

export interface CumulativePerformancePoint {
  date: string;
  minVarIndex: number;
  equalWeightIndex: number;
  spyIndex: number | null;
  minVarReturn?: number;
  equalWeightReturn?: number;
  spyReturn?: number | null;
}

export interface OptimizationResult {
  status: 'Optimal' | 'Validation Fallback' | 'Insufficient Holdings' | 'No Data';
  statusMessage: string;
  iterations: number;
  convergenceReached: boolean;
  finalGradientNorm: number;
  holdings: OptimizedHolding[];
  includedCount: number;
  fallbackCount: number;
  minVarianceVolatility: number | null;
  equalWeightVolatility: number | null;
  volatilityDelta: number | null;
  relativeRiskReduction: number | null;
  minVarPerformance: PortfolioPerformanceMetrics | null;
  equalWeightPerformance: PortfolioPerformanceMetrics | null;
  benchmarkPerformance: PortfolioPerformanceMetrics | null;
  cumulativeSeries: CumulativePerformancePoint[];
  correlationMatrix: CorrelationMatrixResult | null;
  validation: OptimizerValidation;
  totalCapital: number;
  tickers: string[];
  isFallbackActive: boolean;
  historyStartDate: string | null;
  historyEndDate: string | null;
  commonDateCount: number;
}

