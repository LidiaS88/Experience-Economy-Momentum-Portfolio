import { StockCandidate, BenchmarkConfig, SymbolDataRecord, SymbolDataMap, FetchStatus, LatestQuotesMap, LatestQuoteResult } from '../types';
import { PORTFOLIO_UNIVERSE, BENCHMARK } from '../config';
import { fetchDailyHistory, fetchLatestQuote } from './twelveData';

/**
 * Minimum valid daily rows required for a symbol to be marked as 'success'.
 */
export const MIN_REQUIRED_DAILY_BARS = 252;

/**
 * Initializes default pending records for the 20 portfolio stocks + SPY benchmark.
 */
export function createInitialSymbolDataMap(): SymbolDataMap {
  const map: SymbolDataMap = {};

  // Add 20 portfolio universe candidates
  for (const stock of PORTFOLIO_UNIVERSE) {
    map[stock.ticker] = {
      ticker: stock.ticker,
      company: stock.company,
      category: stock.category,
      status: 'pending',
      validBarCount: 0,
      earliestDate: null,
      latestDate: null,
      data: [],
    };
  }

  // Add SPY benchmark independently
  map[BENCHMARK.ticker] = {
    ticker: BENCHMARK.ticker,
    company: BENCHMARK.name,
    category: 'Benchmark (S&P 500)',
    status: 'pending',
    validBarCount: 0,
    earliestDate: null,
    latestDate: null,
    data: [],
  };

  return map;
}

/**
 * Fetches portfolio historical data with a strict concurrency limit (max 3 at a time).
 * Reuses in-memory cached results so previously successful tickers are not re-fetched.
 *
 * @param apiKey - Twelve Data API Key
 * @param currentData - Current in-memory symbol data map
 * @param onProgress - Callback triggered when symbol statuses change or items complete
 * @param concurrencyLimit - Maximum concurrent fetch requests (default: 3)
 */
export async function loadPortfolioHistoryBatch(
  apiKey: string,
  currentData: SymbolDataMap,
  onProgress: (updatedMap: SymbolDataMap, completedCount: number, totalCount: number) => void,
  concurrencyLimit = 3
): Promise<SymbolDataMap> {
  // Working clone of current state
  const resultMap: SymbolDataMap = { ...currentData };

  // All 21 items in order (20 portfolio stocks + SPY)
  const allSymbols: { ticker: string; company: string; category: string }[] = [
    ...PORTFOLIO_UNIVERSE.map((s) => ({ ticker: s.ticker, company: s.company, category: s.category })),
    { ticker: BENCHMARK.ticker, company: BENCHMARK.name, category: 'Benchmark (S&P 500)' },
  ];

  const totalCount = allSymbols.length;

  // Determine which symbols need fetching vs already cached
  const queue: { ticker: string; company: string; category: string }[] = [];
  let completedCount = 0;

  for (const sym of allSymbols) {
    const existing = resultMap[sym.ticker];
    if (existing && existing.status === 'success' && existing.data.length >= MIN_REQUIRED_DAILY_BARS) {
      // Already cached successfully in JS runtime
      completedCount++;
    } else {
      queue.push(sym);
      // Set to pending if not already
      resultMap[sym.ticker] = {
        ...(existing || {
          ticker: sym.ticker,
          company: sym.company,
          category: sym.category,
          validBarCount: 0,
          earliestDate: null,
          latestDate: null,
          data: [],
        }),
        status: 'pending',
      };
    }
  }

  // Initial progress update
  onProgress({ ...resultMap }, completedCount, totalCount);

  if (queue.length === 0) {
    return resultMap;
  }

  // Worker queue processor with max concurrency
  let queueIndex = 0;

  const runWorker = async () => {
    while (queueIndex < queue.length) {
      const currentIndex = queueIndex++;
      const item = queue[currentIndex];

      // Mark symbol as loading
      resultMap[item.ticker] = {
        ...resultMap[item.ticker],
        status: 'loading',
      };
      onProgress({ ...resultMap }, completedCount, totalCount);

      try {
        const fetchResult = await fetchDailyHistory(item.ticker, apiKey);

        if (fetchResult.status === 'ok' && fetchResult.data.length > 0) {
          const bars = fetchResult.data;
          const barCount = bars.length;
          const earliestDate = bars[0]?.date || null;
          const latestDate = bars[bars.length - 1]?.date || null;

          if (barCount >= MIN_REQUIRED_DAILY_BARS) {
            resultMap[item.ticker] = {
              ticker: item.ticker,
              company: item.company,
              category: item.category,
              status: 'success',
              validBarCount: barCount,
              earliestDate,
              latestDate,
              data: bars,
            };
          } else {
            resultMap[item.ticker] = {
              ticker: item.ticker,
              company: item.company,
              category: item.category,
              status: 'insufficient-data',
              validBarCount: barCount,
              earliestDate,
              latestDate,
              errorMessage: `Only ${barCount} daily bars retrieved; at least ${MIN_REQUIRED_DAILY_BARS} required for 200 SMA & 60D momentum evaluation.`,
              data: bars,
            };
          }
        } else {
          resultMap[item.ticker] = {
            ticker: item.ticker,
            company: item.company,
            category: item.category,
            status: 'failed',
            validBarCount: 0,
            earliestDate: null,
            latestDate: null,
            errorMessage: fetchResult.message || 'Failed to fetch historical series from Twelve Data.',
            data: [],
          };
        }
      } catch (err: any) {
        resultMap[item.ticker] = {
          ticker: item.ticker,
          company: item.company,
          category: item.category,
          status: 'failed',
          validBarCount: 0,
          earliestDate: null,
          latestDate: null,
          errorMessage: err?.message || 'Unexpected network or processing exception occurred.',
          data: [],
        };
      }

      completedCount++;
      onProgress({ ...resultMap }, completedCount, totalCount);
    }
  };

  // Launch up to concurrencyLimit concurrent workers
  const activeWorkers: Promise<void>[] = [];
  const workerPoolSize = Math.min(concurrencyLimit, queue.length);

  for (let i = 0; i < workerPoolSize; i++) {
    activeWorkers.push(runWorker());
  }

  await Promise.all(activeWorkers);
  return resultMap;
}

/**
 * Refreshes latest available price quotes for specified tickers using Twelve Data Quote API.
 * - Concurrency limit of 3.
 * - Non-blocking: failure of one quote does not stop remaining requests.
 * - Does not re-fetch historical time series.
 *
 * @param tickers Array of tickers to refresh
 * @param apiKey Twelve Data API Key
 * @param onProgress Callback invoked on each quote completion
 * @param concurrencyLimit Maximum concurrency (default: 3)
 */
export async function refreshLatestPricesBatch(
  tickers: string[],
  apiKey: string,
  onProgress: (quotesMap: LatestQuotesMap, completed: number, total: number) => void,
  concurrencyLimit = 3
): Promise<LatestQuotesMap> {
  const quotesMap: LatestQuotesMap = {};
  const cleanTickers = Array.from(new Set(tickers.map((t) => (t || '').trim().toUpperCase()))).filter(Boolean);
  const total = cleanTickers.length;

  if (total === 0) {
    return quotesMap;
  }

  let queueIndex = 0;
  let completed = 0;

  const runQuoteWorker = async () => {
    while (queueIndex < cleanTickers.length) {
      const currentIndex = queueIndex++;
      const ticker = cleanTickers[currentIndex];

      try {
        const quote = await fetchLatestQuote(ticker, apiKey);
        quotesMap[ticker] = quote;
      } catch (err: any) {
        quotesMap[ticker] = {
          symbol: ticker,
          price: null,
          previousClose: null,
          change: null,
          percentChange: null,
          datetime: null,
          timestamp: null,
          isMarketOpen: null,
          fetchedAt: new Date().toISOString(),
          status: 'error',
          errorMessage: err?.message || 'Failed to fetch quote.',
          priceLabel: 'Data unavailable',
        };
      }

      completed++;
      onProgress({ ...quotesMap }, completed, total);
    }
  };

  const poolSize = Math.min(concurrencyLimit, cleanTickers.length);
  const workers: Promise<void>[] = [];

  for (let i = 0; i < poolSize; i++) {
    workers.push(runQuoteWorker());
  }

  await Promise.all(workers);
  return quotesMap;
}
