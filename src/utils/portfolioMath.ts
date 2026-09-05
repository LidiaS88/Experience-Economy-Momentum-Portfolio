import {
  PriceBar,
  DailyReturn,
  AlignedReturnMatrix,
  CovarianceMatrixResult,
  CorrelationMatrixResult,
  PortfolioPerformanceMetrics,
  PortfolioReadinessSummary,
  SymbolDataMap,
  CandidateScreeningItem,
} from '../types';
import { BENCHMARK } from '../config';
import { MIN_REQUIRED_DAILY_BARS } from '../services/portfolioLoader';

/**
 * Calculates simple daily returns from adjacent closing prices.
 * Formula: r_t = (P_t - P_{t-1}) / P_{t-1}
 * Safely excludes invalid values (e.g. non-positive prices, NaNs, missing data).
 *
 * @param priceRows Array of historical price bars.
 * @returns Array of valid Date/Value pairs in chronological order.
 */
export function calculateDailyReturns(priceRows: readonly PriceBar[]): DailyReturn[] {
  if (!priceRows || priceRows.length < 2) {
    return [];
  }

  // Ensure bars are sorted chronologically ascending by date
  const sorted = [...priceRows].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const returns: DailyReturn[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    const prevClose = prev.close;
    const currClose = curr.close;

    if (
      typeof prevClose === 'number' &&
      typeof currClose === 'number' &&
      !isNaN(prevClose) &&
      !isNaN(currClose) &&
      isFinite(prevClose) &&
      isFinite(currClose) &&
      prevClose > 0 &&
      currClose > 0
    ) {
      const returnVal = (currClose - prevClose) / prevClose;

      if (!isNaN(returnVal) && isFinite(returnVal)) {
        returns.push({
          date: curr.date,
          value: returnVal,
        });
      }
    }
  }

  return returns;
}

/**
 * Aligns daily return series across multiple tickers to common shared dates.
 * Keeps only dates shared by every eligible stock.
 * Returns an aligned matrix with one row per common date and one column per ticker.
 * Generates a clear warning if the common-date history is too short.
 *
 * @param returnSeriesByTicker Map of ticker symbol to its array of DailyReturn pairs.
 * @returns AlignedReturnMatrix object containing common dates, ticker column headers, and data matrix.
 */
export function alignReturnSeries(
  returnSeriesByTicker: Record<string, DailyReturn[]>
): AlignedReturnMatrix {
  const tickers = Object.keys(returnSeriesByTicker).filter(
    (t) => Array.isArray(returnSeriesByTicker[t]) && returnSeriesByTicker[t].length > 0
  );

  if (tickers.length === 0) {
    return {
      dates: [],
      tickers: [],
      matrix: [],
      seriesByTicker: {},
      startDate: null,
      endDate: null,
      dateCount: 0,
      isSufficient: false,
      warning: 'No return series provided for alignment.',
    };
  }

  // Build a lookup map of Date -> Return Value for each ticker
  const tickerDateMaps: Record<string, Map<string, number>> = {};
  for (const ticker of tickers) {
    const map = new Map<string, number>();
    for (const r of returnSeriesByTicker[ticker]) {
      map.set(r.date, r.value);
    }
    tickerDateMaps[ticker] = map;
  }

  // Find the intersection of dates across all tickers
  const firstTicker = tickers[0];
  const commonDates: string[] = [];

  for (const r of returnSeriesByTicker[firstTicker]) {
    const date = r.date;
    let presentInAll = true;

    for (let i = 1; i < tickers.length; i++) {
      const otherMap = tickerDateMaps[tickers[i]];
      if (!otherMap.has(date)) {
        presentInAll = false;
        break;
      }
    }

    if (presentInAll) {
      commonDates.push(date);
    }
  }

  // Sort common dates chronologically ascending
  commonDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const dateCount = commonDates.length;
  const isSufficient = dateCount >= MIN_REQUIRED_DAILY_BARS;

  let warning: string | undefined;
  if (dateCount === 0) {
    warning = 'No overlapping common trading dates found across the selected assets.';
  } else if (!isSufficient) {
    warning = `Common history length of ${dateCount} trading days is below the minimum ${MIN_REQUIRED_DAILY_BARS}-day annual requirement for robust covariance estimation.`;
  }

  // Build matrix (Rows: Common Dates, Columns: Tickers)
  const matrix: number[][] = [];
  const seriesByTicker: Record<string, number[]> = {};

  for (const ticker of tickers) {
    seriesByTicker[ticker] = [];
  }

  for (let d = 0; d < dateCount; d++) {
    const date = commonDates[d];
    const row: number[] = [];

    for (let col = 0; col < tickers.length; col++) {
      const ticker = tickers[col];
      const val = tickerDateMaps[ticker].get(date)!;
      row.push(val);
      seriesByTicker[ticker].push(val);
    }

    matrix.push(row);
  }

  return {
    dates: commonDates,
    tickers,
    matrix,
    seriesByTicker,
    startDate: dateCount > 0 ? commonDates[0] : null,
    endDate: dateCount > 0 ? commonDates[dateCount - 1] : null,
    dateCount,
    isSufficient,
    warning,
  };
}

/**
 * Calculates the Sample Covariance Matrix from an aligned return matrix.
 * Uses Bessel's correction (1 / (T - 1)) for unbiased sample covariance.
 * Computes both Daily and Annualized Covariance (Daily * 252).
 *
 * @param alignedReturns Aligned return matrix structure.
 * @returns CovarianceMatrixResult containing NxN covariance matrices.
 */
export function calculateCovarianceMatrix(
  alignedReturns: AlignedReturnMatrix
): CovarianceMatrixResult {
  const { tickers, matrix, dateCount } = alignedReturns;
  const n = tickers.length;

  if (n === 0 || dateCount < 2) {
    return {
      tickers,
      dailyCovariance: [],
      annualizedCovariance: [],
      sampleSize: dateCount,
      hasPositiveDiagonalVariances: false,
    };
  }

  // 1. Calculate Mean of each ticker's return series
  const means = new Array(n).fill(0);
  for (let t = 0; t < dateCount; t++) {
    for (let i = 0; i < n; i++) {
      means[i] += matrix[t][i];
    }
  }
  for (let i = 0; i < n; i++) {
    means[i] /= dateCount;
  }

  // 2. Compute N x N Covariance Matrix
  const dailyCovariance: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const annualizedCovariance: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  const df = dateCount - 1; // degrees of freedom (T - 1)

  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let sumProduct = 0;
      for (let t = 0; t < dateCount; t++) {
        const diffI = matrix[t][i] - means[i];
        const diffJ = matrix[t][j] - means[j];
        sumProduct += diffI * diffJ;
      }

      const cov = sumProduct / df;
      const covAnn = cov * 252;

      dailyCovariance[i][j] = cov;
      dailyCovariance[j][i] = cov; // Symmetric matrix

      annualizedCovariance[i][j] = covAnn;
      annualizedCovariance[j][i] = covAnn;
    }
  }

  // Positive diagonal variance check: every diagonal covariance value must be finite and greater than zero
  let hasPositiveDiagonalVariances = true;
  for (let i = 0; i < n; i++) {
    const diag = dailyCovariance[i][i];
    if (typeof diag !== 'number' || !Number.isFinite(diag) || isNaN(diag) || diag <= 0) {
      hasPositiveDiagonalVariances = false;
      break;
    }
  }

  return {
    tickers,
    dailyCovariance,
    annualizedCovariance,
    sampleSize: dateCount,
    hasPositiveDiagonalVariances,
  };
}

/**
 * Calculates the Correlation Matrix from an aligned return matrix.
 * Formula: Corr(i, j) = Cov(i, j) / (Std(i) * Std(j))
 *
 * @param alignedReturns Aligned return matrix structure.
 * @returns CorrelationMatrixResult containing NxN correlation matrix.
 */
export function calculateCorrelationMatrix(
  alignedReturns: AlignedReturnMatrix
): CorrelationMatrixResult {
  const covResult = calculateCovarianceMatrix(alignedReturns);
  const { tickers, dailyCovariance } = covResult;
  const n = tickers.length;

  if (n === 0 || dailyCovariance.length === 0) {
    return {
      tickers,
      correlationMatrix: [],
    };
  }

  const standardDeviations = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const variance = dailyCovariance[i][i];
    standardDeviations[i] = variance > 0 ? Math.sqrt(variance) : 0;
  }

  const correlationMatrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    correlationMatrix[i][i] = 1.0; // Diagonal is strictly 1.0
    for (let j = i + 1; j < n; j++) {
      const denom = standardDeviations[i] * standardDeviations[j];
      const corr = denom > 0 ? dailyCovariance[i][j] / denom : 0;
      // Clamp between -1.0 and 1.0 to guard against floating-point imprecision
      const clampedCorr = Math.max(-1.0, Math.min(1.0, corr));

      correlationMatrix[i][j] = clampedCorr;
      correlationMatrix[j][i] = clampedCorr;
    }
  }

  return {
    tickers,
    correlationMatrix,
  };
}

/**
 * Calculates the Equal-Weight Portfolio return series from an aligned return matrix.
 * Formula: r_{EW, t} = (1 / N) * sum_{i=1}^N r_{i, t}
 *
 * @param alignedReturns Aligned return matrix structure.
 * @returns DailyReturn[] array of equal-weight portfolio returns.
 */
export function calculateEqualWeightPortfolioReturns(
  alignedReturns: AlignedReturnMatrix
): DailyReturn[] {
  const { dates, matrix, tickers } = alignedReturns;
  const n = tickers.length;
  const tCount = dates.length;

  if (n === 0 || tCount === 0) {
    return [];
  }

  const ewReturns: DailyReturn[] = [];

  for (let t = 0; t < tCount; t++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += matrix[t][i];
    }
    const ewVal = sum / n;
    ewReturns.push({
      date: dates[t],
      value: ewVal,
    });
  }

  return ewReturns;
}

/**
 * Calculates comprehensive portfolio performance metrics from a daily return series.
 * Metrics:
 * - Cumulative Return: Product(1 + r_t) - 1
 * - Annualized Return: Compound Annual Growth Rate (CAGR) = (1 + CumReturn)^(252 / T) - 1
 * - Annualized Volatility: Sample StdDev(r_t) * sqrt(252)
 * - Maximum Drawdown: Peak-to-trough decline of cumulative wealth curve
 * - Sharpe Ratio: (Annualized Return - Risk Free Rate) / Annualized Volatility
 *
 * @param returnSeries Array of DailyReturn objects or array of raw numbers.
 * @param riskFreeRate Displayed risk-free rate assumption (defaults to 0.0).
 * @returns PortfolioPerformanceMetrics object.
 */
export function calculatePortfolioPerformance(
  returnSeries: (DailyReturn | number)[],
  riskFreeRate: number = 0.0
): PortfolioPerformanceMetrics {
  if (!returnSeries || returnSeries.length === 0) {
    return {
      cumulativeReturn: null,
      annualizedReturn: null,
      annualizedVolatility: null,
      maxDrawdown: null,
      sharpeRatio: null,
      riskFreeRateAssumption: riskFreeRate,
      observationCount: 0,
      startDate: null,
      endDate: null,
    };
  }

  const values: number[] = [];
  let startDate: string | null = null;
  let endDate: string | null = null;

  for (let i = 0; i < returnSeries.length; i++) {
    const item = returnSeries[i];
    if (typeof item === 'number') {
      if (!isNaN(item) && isFinite(item)) {
        values.push(item);
      }
    } else if (item && typeof item.value === 'number') {
      if (!isNaN(item.value) && isFinite(item.value)) {
        values.push(item.value);
        if (i === 0) startDate = item.date;
        if (i === returnSeries.length - 1) endDate = item.date;
      }
    }
  }

  const tCount = values.length;
  if (tCount === 0) {
    return {
      cumulativeReturn: null,
      annualizedReturn: null,
      annualizedVolatility: null,
      maxDrawdown: null,
      sharpeRatio: null,
      riskFreeRateAssumption: riskFreeRate,
      observationCount: 0,
      startDate: null,
      endDate: null,
    };
  }

  // 1. Cumulative Wealth Curve & Maximum Drawdown
  let wealth = 1.0;
  let peakWealth = 1.0;
  let maxDrawdown = 0.0; // stored as negative value e.g. -0.15 for 15% drawdown

  for (let t = 0; t < tCount; t++) {
    wealth *= 1.0 + values[t];
    if (wealth > peakWealth) {
      peakWealth = wealth;
    }
    const currentDrawdown = (wealth - peakWealth) / peakWealth;
    if (currentDrawdown < maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }
  }

  const cumulativeReturn = wealth - 1.0;

  // 2. Annualized Return (Compound Annual Growth Rate)
  let annualizedReturn: number | null = null;
  if (tCount > 0) {
    if (wealth > 0) {
      annualizedReturn = Math.pow(wealth, 252.0 / tCount) - 1.0;
    } else {
      // If wealth collapsed to 0 or negative, use annualized arithmetic mean
      const sum = values.reduce((acc, v) => acc + v, 0);
      annualizedReturn = (sum / tCount) * 252;
    }
  }

  // 3. Annualized Volatility (Sample Standard Deviation * sqrt(252))
  let annualizedVolatility: number | null = null;
  if (tCount >= 2) {
    const mean = values.reduce((acc, v) => acc + v, 0) / tCount;
    let sumSqDiff = 0;
    for (let t = 0; t < tCount; t++) {
      const diff = values[t] - mean;
      sumSqDiff += diff * diff;
    }
    const sampleVariance = sumSqDiff / (tCount - 1);
    const sampleStdDev = Math.sqrt(sampleVariance);
    annualizedVolatility = sampleStdDev * Math.sqrt(252);
  }

  // 4. Sharpe Ratio = (Annualized Return - Risk Free Rate) / Annualized Volatility
  let sharpeRatio: number | null = null;
  if (
    annualizedReturn !== null &&
    annualizedVolatility !== null &&
    annualizedVolatility > 0
  ) {
    sharpeRatio = (annualizedReturn - riskFreeRate) / annualizedVolatility;
  }

  return {
    cumulativeReturn,
    annualizedReturn,
    annualizedVolatility,
    maxDrawdown,
    sharpeRatio,
    riskFreeRateAssumption: riskFreeRate,
    observationCount: tCount,
    startDate,
    endDate,
  };
}

/**
 * Aligns benchmark (SPY) returns to match a specified target list of common evaluation dates.
 *
 * @param benchmarkRows Raw price bars for the benchmark ETF.
 * @param targetDates Array of target evaluation dates.
 * @returns Array of DailyReturn objects strictly matching targetDates.
 */
export function alignBenchmarkReturns(
  benchmarkRows: readonly PriceBar[],
  targetDates: string[]
): DailyReturn[] {
  if (!benchmarkRows || benchmarkRows.length < 2 || targetDates.length === 0) {
    return [];
  }

  const rawReturns = calculateDailyReturns(benchmarkRows);
  const benchmarkDateMap = new Map<string, number>();
  for (const r of rawReturns) {
    benchmarkDateMap.set(r.date, r.value);
  }

  const alignedBenchmark: DailyReturn[] = [];
  for (const date of targetDates) {
    if (benchmarkDateMap.has(date)) {
      alignedBenchmark.push({
        date,
        value: benchmarkDateMap.get(date)!,
      });
    }
  }

  return alignedBenchmark;
}

/**
 * Evaluates the full portfolio analysis readiness state given current screening items,
 * symbol data cache, and benchmark data.
 *
 * Handles:
 * - Eligible tickers identification
 * - Daily returns calculation per ticker
 * - Common date intersection alignment
 * - Covariance & correlation matrix computation
 * - Equal-weight portfolio baseline performance
 * - SPY benchmark alignment & performance comparison
 * - < 10 eligible stocks fallback threshold alert
 *
 * @param screeningItems List of candidate screening items.
 * @param dataMap In-memory market data map.
 * @returns PortfolioReadinessSummary object.
 */
export function evaluatePortfolioReadiness(
  screeningItems: CandidateScreeningItem[],
  dataMap: SymbolDataMap
): PortfolioReadinessSummary {
  const totalCandidates = screeningItems.length;
  const eligibleItems = screeningItems.filter(
    (item) => item.eligibility === 'Eligible' || item.eligibility === 'Fallback Included'
  );
  const eligibleTickers = eligibleItems.map((item) => item.ticker);
  const eligibleCount = eligibleTickers.length;

  const isEligibleBelowThreshold = eligibleCount < 15;
  const fallbackNotice = isEligibleBelowThreshold
    ? 'Fewer than 15 eligible holdings; fallback promotion logic active to maintain portfolio floor.'
    : undefined;

  // If no eligible stocks, return uninitialized/empty readiness summary
  if (eligibleCount === 0) {
    return {
      eligibleTickers: [],
      eligibleCount: 0,
      totalCandidates,
      isEligibleBelowThreshold: true,
      fallbackNotice,
      commonDateCount: 0,
      startDate: null,
      endDate: null,
      isHistorySufficient: false,
      covarianceStatus: 'No Eligible Stocks',
      alignedReturns: null,
      covarianceMatrix: null,
      correlationMatrix: null,
      equalWeightPerformance: null,
      benchmarkPerformance: null,
      benchmarkAvailability: 'Unavailable',
    };
  }

  // Calculate daily returns for each eligible ticker
  const returnsByTicker: Record<string, DailyReturn[]> = {};
  for (const ticker of eligibleTickers) {
    const record = dataMap[ticker];
    if (record && record.data && record.data.length >= 2) {
      returnsByTicker[ticker] = calculateDailyReturns(record.data);
    } else {
      returnsByTicker[ticker] = [];
    }
  }

  // Align return series to common dates
  const alignedReturns = alignReturnSeries(returnsByTicker);

  if (alignedReturns.dateCount === 0) {
    return {
      eligibleTickers,
      eligibleCount,
      totalCandidates,
      isEligibleBelowThreshold,
      fallbackNotice,
      commonDateCount: 0,
      startDate: null,
      endDate: null,
      isHistorySufficient: false,
      covarianceStatus: 'Data Unavailable',
      alignedReturns,
      covarianceMatrix: null,
      correlationMatrix: null,
      equalWeightPerformance: null,
      benchmarkPerformance: null,
      benchmarkAvailability: 'Unavailable',
    };
  }

  // Covariance & Correlation matrices
  const covarianceMatrix = calculateCovarianceMatrix(alignedReturns);
  const correlationMatrix = calculateCorrelationMatrix(alignedReturns);

  // Equal Weight Portfolio returns & performance
  const ewReturns = calculateEqualWeightPortfolioReturns(alignedReturns);
  const equalWeightPerformance = calculatePortfolioPerformance(ewReturns, 0.0);

  // Benchmark (SPY) alignment & performance
  const benchmarkRecord = dataMap[BENCHMARK.ticker];
  let benchmarkPerformance: PortfolioPerformanceMetrics | null = null;
  let benchmarkAvailability: 'Available' | 'Aligned' | 'Insufficient Data' | 'Unavailable' = 'Unavailable';

  if (benchmarkRecord && benchmarkRecord.data && benchmarkRecord.data.length >= 2) {
    const alignedBenchmarkReturns = alignBenchmarkReturns(
      benchmarkRecord.data,
      alignedReturns.dates
    );

    if (alignedBenchmarkReturns.length === alignedReturns.dates.length) {
      benchmarkAvailability = 'Aligned';
      benchmarkPerformance = calculatePortfolioPerformance(alignedBenchmarkReturns, 0.0);
    } else if (alignedBenchmarkReturns.length > 0) {
      benchmarkAvailability = 'Insufficient Data';
      benchmarkPerformance = calculatePortfolioPerformance(alignedBenchmarkReturns, 0.0);
    } else {
      benchmarkAvailability = 'Unavailable';
    }
  }

  const covarianceStatus =
    alignedReturns.isSufficient && covarianceMatrix.dailyCovariance.length > 0
      ? 'Ready'
      : alignedReturns.dateCount > 0
      ? 'Insufficient Dates'
      : 'Data Unavailable';

  return {
    eligibleTickers,
    eligibleCount,
    totalCandidates,
    isEligibleBelowThreshold,
    fallbackNotice,
    commonDateCount: alignedReturns.dateCount,
    startDate: alignedReturns.startDate,
    endDate: alignedReturns.endDate,
    isHistorySufficient: alignedReturns.isSufficient,
    covarianceStatus,
    alignedReturns,
    covarianceMatrix,
    correlationMatrix,
    equalWeightPerformance,
    benchmarkPerformance,
    benchmarkAvailability,
  };
}
