import {
  PriceBar,
  MACDResult,
  TechnicalSummaryMetrics,
  CandidateScreeningItem,
  TechnicalScoreBreakdown,
  TechnicalRatingLabel,
  EligibilityStatus,
  SymbolDataMap,
} from '../types';
import { PORTFOLIO_UNIVERSE } from '../config';
import { MIN_REQUIRED_DAILY_BARS } from '../services/portfolioLoader';

/**
 * Calculates the Simple Moving Average (SMA) of close prices over a given period.
 * 
 * Formula: SMA_t = (1 / period) * sum_{i=0}^{period-1} Close_{t-i}
 * 
 * @param rows - Ascending array of daily price bars (oldest to newest)
 * @param period - Number of observations required for the window
 * @returns Array of SMA values corresponding to each input row (null if insufficient history)
 */
export function calculateSMA(rows: readonly PriceBar[], period: number): (number | null)[] {
  if (!rows || rows.length === 0 || period <= 0) {
    return [];
  }

  const result: (number | null)[] = new Array(rows.length).fill(null);
  if (rows.length < period) {
    return result; // Insufficient history for even one window
  }

  let runningSum = 0;
  for (let i = 0; i < period; i++) {
    runningSum += rows[i].close;
  }
  result[period - 1] = runningSum / period;

  // Slide the window across subsequent observations
  for (let i = period; i < rows.length; i++) {
    runningSum += rows[i].close - rows[i - period].close;
    result[i] = runningSum / period;
  }

  return result;
}

/**
 * Calculates the Exponential Moving Average (EMA) of close prices.
 * 
 * Formula:
 * - Multiplier k = 2 / (period + 1)
 * - EMA_seed = SMA_period (first observation at index period - 1)
 * - EMA_t = (Close_t - EMA_{t-1}) * k + EMA_{t-1}
 * 
 * @param rows - Ascending array of daily price bars
 * @param period - Smoothing period
 * @returns Array of EMA values corresponding to each input row (null until seed index)
 */
export function calculateEMA(rows: readonly PriceBar[], period: number): (number | null)[] {
  if (!rows || rows.length === 0 || period <= 0) {
    return [];
  }

  const result: (number | null)[] = new Array(rows.length).fill(null);
  if (rows.length < period) {
    return result;
  }

  // Seed the first valid EMA with the period SMA
  let initialSum = 0;
  for (let i = 0; i < period; i++) {
    initialSum += rows[i].close;
  }
  let prevEma = initialSum / period;
  result[period - 1] = prevEma;

  const multiplier = 2 / (period + 1);

  // Successive exponential smoothing
  for (let i = period; i < rows.length; i++) {
    const currentEma = (rows[i].close - prevEma) * multiplier + prevEma;
    result[i] = currentEma;
    prevEma = currentEma;
  }

  return result;
}

/**
 * Calculates the Moving Average Convergence Divergence (MACD).
 * 
 * Formula:
 * - Fast EMA (default 12) and Slow EMA (default 26) on close prices.
 * - MACD Line = Fast EMA - Slow EMA
 * - Signal Line = 9-period EMA of the valid MACD Line
 * - MACD Histogram = MACD Line - Signal Line
 * 
 * @param rows - Ascending array of daily price bars
 * @param fastPeriod - Fast EMA period (default 12)
 * @param slowPeriod - Slow EMA period (default 26)
 * @param signalPeriod - Signal line EMA period (default 9)
 * @returns Object containing full series (macdLine, signalLine, histogram) and latest scalar values
 */
export function calculateMACD(
  rows: readonly PriceBar[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): MACDResult {
  const n = rows ? rows.length : 0;
  const emptyResult: MACDResult = {
    macdLine: new Array(n).fill(null),
    signalLine: new Array(n).fill(null),
    histogram: new Array(n).fill(null),
    latest: { macd: null, signal: null, histogram: null },
  };

  if (n === 0 || n < slowPeriod) {
    return emptyResult;
  }

  const fastEma = calculateEMA(rows, fastPeriod);
  const slowEma = calculateEMA(rows, slowPeriod);

  // 1. Calculate MACD Line (Fast EMA - Slow EMA)
  const macdLine: (number | null)[] = new Array(n).fill(null);
  const validMacdValues: { index: number; value: number }[] = [];

  for (let i = 0; i < n; i++) {
    if (fastEma[i] !== null && slowEma[i] !== null) {
      const diff = fastEma[i]! - slowEma[i]!;
      macdLine[i] = diff;
      validMacdValues.push({ index: i, value: diff });
    }
  }

  // 2. Calculate Signal Line (EMA of MACD Line values)
  const signalLine: (number | null)[] = new Array(n).fill(null);
  const histogram: (number | null)[] = new Array(n).fill(null);

  if (validMacdValues.length >= signalPeriod) {
    // Seed signal line with SMA of first `signalPeriod` MACD values
    let sumSeed = 0;
    for (let j = 0; j < signalPeriod; j++) {
      sumSeed += validMacdValues[j].value;
    }
    let prevSignalEma = sumSeed / signalPeriod;
    const seedIndex = validMacdValues[signalPeriod - 1].index;
    signalLine[seedIndex] = prevSignalEma;

    const signalMultiplier = 2 / (signalPeriod + 1);

    for (let j = signalPeriod; j < validMacdValues.length; j++) {
      const currIndex = validMacdValues[j].index;
      const currSignalEma = (validMacdValues[j].value - prevSignalEma) * signalMultiplier + prevSignalEma;
      signalLine[currIndex] = currSignalEma;
      prevSignalEma = currSignalEma;
    }

    // 3. Compute Histogram: MACD Line - Signal Line
    for (let i = 0; i < n; i++) {
      if (macdLine[i] !== null && signalLine[i] !== null) {
        histogram[i] = macdLine[i]! - signalLine[i]!;
      }
    }
  }

  // Extract latest values (from last row)
  const lastIndex = n - 1;
  const latestMacd = lastIndex >= 0 ? macdLine[lastIndex] : null;
  const latestSignal = lastIndex >= 0 ? signalLine[lastIndex] : null;
  const latestHistogram = lastIndex >= 0 ? histogram[lastIndex] : null;

  return {
    macdLine,
    signalLine,
    histogram,
    latest: {
      macd: latestMacd,
      signal: latestSignal,
      histogram: latestHistogram,
    },
  };
}

/**
 * Calculates the Relative Strength Index (RSI) using Wilder's smoothed method.
 * 
 * Formula:
 * - RS = Average Gain / Average Loss
 * - RSI = 100 - (100 / (1 + RS))
 * 
 * Edge cases:
 * - Zero loss and zero gain: RSI = 50 (flat market)
 * - Zero loss with positive gain: RSI = 100
 * - Zero gain with positive loss: RSI = 0
 * 
 * @param rows - Ascending array of daily price bars
 * @param period - Lookback period (default 14)
 * @returns Array of RSI values (null until period + 1 bars are available)
 */
export function calculateRSI(rows: readonly PriceBar[], period = 14): (number | null)[] {
  if (!rows || rows.length <= period || period <= 0) {
    return new Array(rows ? rows.length : 0).fill(null);
  }

  const n = rows.length;
  const rsiValues: (number | null)[] = new Array(n).fill(null);

  // Compute daily price changes
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < n; i++) {
    const diff = rows[i].close - rows[i - 1].close;
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  // Seed with standard SMA of gains and losses over the first `period` changes
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
  }
  avgGain /= period;
  avgLoss /= period;

  // Calculate first RSI at index `period`
  if (avgLoss === 0 && avgGain === 0) {
    rsiValues[period] = 50;
  } else if (avgLoss === 0) {
    rsiValues[period] = 100;
  } else if (avgGain === 0) {
    rsiValues[period] = 0;
  } else {
    const rs = avgGain / avgLoss;
    rsiValues[period] = 100 - 100 / (1 + rs);
  }

  // Wilder's smoothing for remaining bars
  for (let i = period + 1; i < n; i++) {
    const currentGain = gains[i - 1];
    const currentLoss = losses[i - 1];

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0 && avgGain === 0) {
      rsiValues[i] = 50;
    } else if (avgLoss === 0) {
      rsiValues[i] = 100;
    } else if (avgGain === 0) {
      rsiValues[i] = 0;
    } else {
      const rs = avgGain / avgLoss;
      rsiValues[i] = 100 - 100 / (1 + rs);
    }
  }

  return rsiValues;
}

/**
 * Calculates the trailing percentage return over a specified number of trading days.
 * 
 * Formula: Return = (Close_latest - Close_{latest - tradingDays}) / Close_{latest - tradingDays}
 * 
 * @param rows - Ascending array of daily price bars
 * @param tradingDays - Number of trading sessions to look back (default 60)
 * @returns Trailing decimal return (e.g. 0.054 for +5.4%) or null if insufficient history
 */
export function calculateTrailingReturn(
  rows: readonly PriceBar[],
  tradingDays = 60
): number | null {
  if (!rows || rows.length <= tradingDays || tradingDays <= 0) {
    return null; // Insufficient history
  }

  const latestClose = rows[rows.length - 1].close;
  const baseClose = rows[rows.length - 1 - tradingDays].close;

  if (baseClose <= 0) {
    return null;
  }

  return (latestClose - baseClose) / baseClose;
}

/**
 * Calculates the annualized sample volatility of daily simple returns.
 * 
 * Formula:
 * - r_t = (Close_t - Close_{t-1}) / Close_{t-1}
 * - Volatility_annualized = SampleStdDev(r) * sqrt(252)
 * 
 * @param rows - Ascending array of daily price bars
 * @returns Annualized volatility in decimal form (e.g. 0.245 for 24.5%) or null if < 2 observations
 */
export function calculateAnnualizedVolatility(rows: readonly PriceBar[]): number | null {
  if (!rows || rows.length < 2) {
    return null; // At least 2 daily observations required for 1 return
  }

  // Calculate daily simple returns
  const returns: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1].close;
    if (prev > 0) {
      returns.push((rows[i].close - prev) / prev);
    }
  }

  if (returns.length < 2) {
    return null;
  }

  // Mean return
  const mean = returns.reduce((acc, val) => acc + val, 0) / returns.length;

  // Sample variance with Bessel's correction (N - 1)
  const sumSquaredDiff = returns.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  const sampleVariance = sumSquaredDiff / (returns.length - 1);
  const dailyStdDev = Math.sqrt(sampleVariance);

  // Annualize using standard 252 trading days per year
  return dailyStdDev * Math.sqrt(252);
}

/**
 * Helper to compute all key summary metrics for a given history series.
 * 
 * @param rows - Ascending array of daily price bars
 * @returns Comprehensive TechnicalSummaryMetrics object
 */
export function calculateAllTechnicalMetrics(rows: readonly PriceBar[]): TechnicalSummaryMetrics {
  if (!rows || rows.length === 0) {
    return {
      latestClose: null,
      sma50: null,
      sma200: null,
      macd: null,
      macdSignal: null,
      macdHistogram: null,
      rsi14: null,
      trailing60Return: null,
      annualizedVolatility: null,
    };
  }

  const latestClose = rows[rows.length - 1].close;

  // SMA 50
  const sma50Series = calculateSMA(rows, 50);
  const sma50 = sma50Series.length > 0 ? sma50Series[sma50Series.length - 1] : null;

  // SMA 200
  const sma200Series = calculateSMA(rows, 200);
  const sma200 = sma200Series.length > 0 ? sma200Series[sma200Series.length - 1] : null;

  // MACD (12, 26, 9)
  const macdResult = calculateMACD(rows, 12, 26, 9);

  // RSI 14
  const rsiSeries = calculateRSI(rows, 14);
  const rsi14 = rsiSeries.length > 0 ? rsiSeries[rsiSeries.length - 1] : null;

  // Trailing 60-day return
  const trailing60Return = calculateTrailingReturn(rows, 60);

  // Annualized Volatility
  const annualizedVolatility = calculateAnnualizedVolatility(rows);

  return {
    latestClose,
    sma50,
    sma200,
    macd: macdResult.latest.macd,
    macdSignal: macdResult.latest.signal,
    macdHistogram: macdResult.latest.histogram,
    rsi14,
    trailing60Return,
    annualizedVolatility,
  };
}

/**
 * Screens a single candidate asset based on price series observations and pure technical rules.
 * 
 * Rules:
 * - Requires at least MIN_REQUIRED_DAILY_BARS (252) observations.
 * - Score Rule 1 (+1): Latest Close > SMA 200
 * - Score Rule 2 (+1): SMA 50 > SMA 200
 * - Score Rule 3 (+1): MACD Line > MACD Signal Line
 * - Score Rule 4 (+1): RSI(14) between 45 and 70 inclusive
 * 
 * Eligibility:
 * - Eligible: Sufficient Data AND Technical Score >= 2
 * - Ineligible: Sufficient Data AND Technical Score < 2
 * - Data unavailable: < 252 valid daily observations
 */
export function screenCandidate(
  ticker: string,
  company: string,
  category: string,
  rows: readonly PriceBar[]
): CandidateScreeningItem {
  const hasSufficientData = Boolean(rows && rows.length >= MIN_REQUIRED_DAILY_BARS);
  const validBarCount = rows ? rows.length : 0;

  if (!hasSufficientData) {
    return {
      ticker,
      company,
      category,
      hasSufficientData: false,
      validBarCount,
      latestPrice: null,
      sma50: null,
      sma200: null,
      macd: null,
      macdSignal: null,
      macdHistogram: null,
      rsi14: null,
      trailing60Return: null,
      annualizedVolatility: null,
      technicalScore: null,
      scoreBreakdown: null,
      smaComparisonLabel: 'Data unavailable',
      macdStatusLabel: 'Data unavailable',
      technicalLabel: 'Data unavailable',
      eligibility: 'Data unavailable',
    };
  }

  const metrics = calculateAllTechnicalMetrics(rows);

  const priceAboveSma200 = metrics.latestClose !== null && metrics.sma200 !== null && metrics.latestClose > metrics.sma200;
  const sma50AboveSma200 = metrics.sma50 !== null && metrics.sma200 !== null && metrics.sma50 > metrics.sma200;
  const macdAboveSignal = metrics.macd !== null && metrics.macdSignal !== null && metrics.macd > metrics.macdSignal;
  const rsiInRange = metrics.rsi14 !== null && metrics.rsi14 >= 45 && metrics.rsi14 <= 70;

  let score = 0;
  if (priceAboveSma200) score += 1;
  if (sma50AboveSma200) score += 1;
  if (macdAboveSignal) score += 1;
  if (rsiInRange) score += 1;

  const scoreBreakdown: TechnicalScoreBreakdown = {
    priceAboveSma200,
    sma50AboveSma200,
    macdAboveSignal,
    rsiInRange,
  };

  const smaComparisonLabel: 'Above' | 'Below' | 'Data unavailable' =
    metrics.sma50 !== null && metrics.sma200 !== null
      ? metrics.sma50 > metrics.sma200
        ? 'Above'
        : 'Below'
      : 'Data unavailable';

  const macdStatusLabel: 'Bullish' | 'Bearish' | 'Data unavailable' =
    metrics.macd !== null && metrics.macdSignal !== null
      ? metrics.macd > metrics.macdSignal
        ? 'Bullish'
        : 'Bearish'
      : 'Data unavailable';

  let technicalLabel: TechnicalRatingLabel = 'Caution';
  if (score >= 3) {
    technicalLabel = 'Constructive';
  } else if (score === 2) {
    technicalLabel = 'Mixed';
  } else {
    technicalLabel = 'Caution';
  }

  const eligibility: EligibilityStatus = score >= 2 ? 'Eligible' : 'Ineligible';

  return {
    ticker,
    company,
    category,
    hasSufficientData: true,
    validBarCount,
    latestPrice: metrics.latestClose,
    sma50: metrics.sma50,
    sma200: metrics.sma200,
    macd: metrics.macd,
    macdSignal: metrics.macdSignal,
    macdHistogram: metrics.macdHistogram,
    rsi14: metrics.rsi14,
    trailing60Return: metrics.trailing60Return,
    annualizedVolatility: metrics.annualizedVolatility,
    technicalScore: score,
    scoreBreakdown,
    smaComparisonLabel,
    macdStatusLabel,
    technicalLabel,
    eligibility,
  };
}

export const MIN_ELIGIBLE_FLOOR = 15;

/**
 * Screens all 20 configured portfolio universe stocks using the current in-memory symbol data map.
 * 
 * Qualification and 15-stock floor logic:
 * 1. Base technical screen marks stock "Eligible" at score >= 2 out of 4 (rules: close > SMA200, SMA50 > SMA200, MACD > signal, RSI14 between 45–70).
 * 2. 15-Stock Floor & Fallback Promotion:
 *    If fewer than 15 stocks are eligible at score >= 2:
 *    - First try relaxing the threshold to score >= 1.
 *    - If that still doesn't reach 15, promote the highest-ranked remaining data-sufficient stocks
 *      (rank by: technical score descending, then 60-day return descending, then annualized volatility ascending, then ticker alphabetically)
 *      until exactly 15 are included.
 *    - Any stock added this way receives eligibility: 'Fallback Included' (distinct from normally-qualified 'Eligible').
 *    - Remaining data-sufficient stocks receive eligibility: 'Ineligible'.
 *    - Insufficient data stocks remain 'Data unavailable'.
 */
export function screenAllCandidates(dataMap: SymbolDataMap): CandidateScreeningItem[] {
  const initialItems = PORTFOLIO_UNIVERSE.map((candidate) => {
    const record = dataMap[candidate.ticker];
    const data = record ? record.data : [];
    return screenCandidate(candidate.ticker, candidate.company, candidate.category, data);
  });

  const dataSufficient = initialItems.filter((item) => item.hasSufficientData);

  // If no data is loaded yet, return initial pending states
  if (dataSufficient.length === 0) {
    return initialItems;
  }

  // Comparator for ranking candidates:
  // 1. Technical score descending
  // 2. 60-day return descending
  // 3. Annualized volatility ascending
  // 4. Ticker alphabetically ascending
  const compareRank = (a: CandidateScreeningItem, b: CandidateScreeningItem) => {
    const scoreA = a.technicalScore ?? -1;
    const scoreB = b.technicalScore ?? -1;
    if (scoreB !== scoreA) return scoreB - scoreA;

    const retA = a.trailing60Return ?? -Infinity;
    const retB = b.trailing60Return ?? -Infinity;
    if (Math.abs(retB - retA) > 1e-9) return retB - retA;

    const volA = a.annualizedVolatility ?? Infinity;
    const volB = b.annualizedVolatility ?? Infinity;
    if (Math.abs(volA - volB) > 1e-9) return volA - volB;

    return a.ticker.localeCompare(b.ticker);
  };

  const normallyEligible = dataSufficient.filter((item) => (item.technicalScore ?? 0) >= 2);
  const targetCount = Math.min(MIN_ELIGIBLE_FLOOR, dataSufficient.length);

  const normallyEligibleSet = new Set<string>();
  const fallbackSet = new Set<string>();

  if (normallyEligible.length >= targetCount) {
    for (const item of normallyEligible) {
      normallyEligibleSet.add(item.ticker);
    }
  } else {
    // Fewer than 15 stocks eligible at score >= 2
    for (const item of normallyEligible) {
      normallyEligibleSet.add(item.ticker);
    }

    const needed = targetCount - normallyEligibleSet.size;

    // Remaining data-sufficient candidates (score < 2)
    // Sorted by: technical score desc (score 1 before score 0),
    // then 60-day return desc, then annualized vol asc, then ticker asc.
    const remainingCandidates = dataSufficient
      .filter((item) => !normallyEligibleSet.has(item.ticker))
      .sort(compareRank);

    // Promote until exactly targetCount (15) are included
    for (let i = 0; i < needed && i < remainingCandidates.length; i++) {
      fallbackSet.add(remainingCandidates[i].ticker);
    }
  }

  return initialItems.map((item) => {
    if (!item.hasSufficientData) {
      return item;
    }
    if (normallyEligibleSet.has(item.ticker)) {
      return { ...item, eligibility: 'Eligible' as const };
    }
    if (fallbackSet.has(item.ticker)) {
      return { ...item, eligibility: 'Fallback Included' as const };
    }
    return { ...item, eligibility: 'Ineligible' as const };
  });
}
