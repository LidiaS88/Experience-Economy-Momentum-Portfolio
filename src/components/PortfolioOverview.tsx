import React from 'react';
import {
  DollarSign,
  Layers,
  Activity,
  Database,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ArrowDownRight,
  Scale,
  Sparkles,
} from 'lucide-react';
import {
  SymbolDataMap,
  OptimizationResult,
  LatestQuotesMap,
  QuoteRefreshSummary,
} from '../types';
import { TOTAL_PORTFOLIO_CAPITAL } from '../utils/portfolioOptimizer';

interface PortfolioOverviewProps {
  dataMap: SymbolDataMap;
  optimizationResult: OptimizationResult;
  latestQuotes: LatestQuotesMap;
  isRefreshingQuotes: boolean;
  quoteRefreshProgress: string;
  quoteRefreshSummary: QuoteRefreshSummary | null;
  hasTwelveDataKey: boolean;
  onRefreshLatestPrices: () => void;
}

export const PortfolioOverview: React.FC<PortfolioOverviewProps> = ({
  dataMap,
  optimizationResult,
  latestQuotes,
  isRefreshingQuotes,
  quoteRefreshProgress,
  quoteRefreshSummary,
  hasTwelveDataKey,
  onRefreshLatestPrices,
}) => {
  const isDataLoaded并且 = optimizationResult.status !== 'No Data' && optimizationResult.status !== 'Insufficient Holdings';
  const isDataLoaded = optimizationResult.status !== 'No Data' && optimizationResult.status !== 'Insufficient Holdings';

  // Format helpers
  const formatPercent = (val: number | null, decimals = 2) => {
    if (val === null || isNaN(val)) return '-';
    return `${(val * 100).toFixed(decimals)}%`;
  };

  const formatCurrency = (val: number | null) => {
    if (val === null || isNaN(val)) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Calculate simulated mark-to-market portfolio value if latest prices are available
  let simulatedMarkToMarket = TOTAL_PORTFOLIO_CAPITAL;
  let hasRefreshedQuotesCount = 0;

  if (isDataLoaded && optimizationResult.holdings.length > 0) {
    let markToMarketSum = 0;
    let anyQuoteAvailable = false;

    for (const h of optimizationResult.holdings) {
      const quote = latestQuotes[h.ticker];
      if (quote && quote.status === 'ok' && quote.price && h.shares && h.latestPrice) {
        hasRefreshedQuotesCount++;
        anyQuoteAvailable = true;
        // Current value of shares + cash remainder
        const currentPositionVal = h.shares * quote.price;
        const cashRemainder = h.dollarAllocation - (h.shares * h.latestPrice);
        markToMarketSum += currentPositionVal + cashRemainder;
      } else {
        markToMarketSum += h.dollarAllocation;
      }
    }

    if (anyQuoteAvailable) {
      simulatedMarkToMarket = markToMarketSum;
    }
  }

  const markToMarketDelta = simulatedMarkToMarket - TOTAL_PORTFOLIO_CAPITAL;
  const markToMarketPct = (markToMarketDelta / TOTAL_PORTFOLIO_CAPITAL) * 100;

  // Key performance values
  const minVarPerf = optimizationResult.minVarPerformance;
  const ewPerf最佳 = optimizationResult.equalWeightPerformance;
  const ewPerf = optimizationResult.equalWeightPerformance;
  const spyPerf = optimizationResult.benchmarkPerformance;

  return (
    <section id="portfolio-overview-section" className="mb-8">
      {/* Header with Title and "Refresh Latest Prices" Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 id="overview-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Portfolio Overview &amp; Key Performance Indicators</span>
            <span className="text-xs font-normal text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-mono">
              $1,000,000 Baseline Model
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time simulated mark-to-market valuation, diversification, and historical risk-adjusted metrics
          </p>
        </div>

        {/* Refresh Latest Prices Action Button (Requirement: Refresh Latest Prices) */}
        <div className="flex items-center gap-2">
          <button
            id="refresh-latest-prices-btn"
            type="button"
            onClick={onRefreshLatestPrices}
            disabled={!hasTwelveDataKey || isRefreshingQuotes || !isDataLoaded}
            title={
              !hasTwelveDataKey
                ? 'Please enter your Twelve Data API key first'
                : !isDataLoaded
                ? 'Please load historical market data first'
                : 'Fetch latest available quotes for optimized holdings (max concurrency 3)'
            }
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all shadow-xs ${
              !hasTwelveDataKey || isRefreshingQuotes || !isDataLoaded
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-98'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQuotes ? 'animate-spin' : ''}`} />
            <span>
              {isRefreshingQuotes
                ? quoteRefreshProgress || 'Refreshing Quotes (Max 3)...'
                : 'Refresh Latest Prices'}
            </span>
          </button>
        </div>
      </div>

      {/* Primary Overview Cards Grid (Requirement 2: Portfolio Overview Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Simulated Portfolio Value */}
        <div
          id="card-portfolio-value"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Simulated Portfolio Value
            </span>
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            {isDataLoaded ? (
              <>
                <div className="text-2xl font-bold font-mono text-slate-900">
                  {formatCurrency(simulatedMarkToMarket)}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
                  <span>Target Allocation:</span>
                  <span className="font-semibold text-slate-700 font-mono">$1,000,000.00 USD</span>
                </div>
                {hasRefreshedQuotesCount > 0 && (
                  <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Quote Intraday Mark:</span>
                    <span
                      className={`font-semibold ${
                        markToMarketDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {markToMarketDelta >= 0 ? '+' : ''}
                      {formatCurrency(markToMarketDelta)} ({markToMarketPct >= 0 ? '+' : ''}
                      {markToMarketPct.toFixed(2)}%)
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-400">Not loaded yet</div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
                  <span>Target Capital:</span>
                  <span className="font-semibold text-slate-700">$1,000,000.00 USD</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Optimized Holdings Count */}
        <div
          id="card-eligible-holdings"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Optimized Holdings
            </span>
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            {isDataLoaded ? (
              <>
                <div className="text-2xl font-bold font-mono text-slate-900 flex items-center gap-2">
                  <span>{optimizationResult.includedCount}</span>
                  <span className="text-xs font-normal text-slate-500 font-sans">
                    / 20 Universe Assets
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
                  <span>Composition:</span>
                  <span className="font-semibold text-slate-700 font-sans">
                    {optimizationResult.includedCount - optimizationResult.fallbackCount} Eligible
                    {optimizationResult.fallbackCount > 0
                      ? `, ${optimizationResult.fallbackCount} Fallback`
                      : ' (100% Eligible)'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-400">Not loaded yet</div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
                  <span>Candidate Universe:</span>
                  <span className="font-semibold text-slate-700">Top 20 Equities</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 3: Annualized Volatility */}
        <div
          id="card-annualized-volatility"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Annualized Volatility (&sigma;)
            </span>
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            {isDataLoaded && optimizationResult.minVarianceVolatility !== null ? (
              <>
                <div className="text-2xl font-bold font-mono text-indigo-950 flex items-center gap-1.5">
                  <span>{formatPercent(optimizationResult.minVarianceVolatility, 2)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
                  <span>Equal-Weight Vol:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {formatPercent(optimizationResult.equalWeightVolatility, 2)}
                  </span>
                </div>
                {optimizationResult.relativeRiskReduction !== null && (
                  <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Risk Reduction:</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                      <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                      <span>{optimizationResult.relativeRiskReduction.toFixed(1)}% vs EW</span>
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-400">Not loaded yet</div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
                  <span>Optimization Method:</span>
                  <span className="font-semibold text-slate-700">Min-Variance</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 4: Maximum Drawdown */}
        <div
          id="card-max-drawdown"
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Maximum Drawdown (MDD)
            </span>
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            {isDataLoaded && minVarPerf && minVarPerf.maxDrawdown !== null ? (
              <>
                <div className="text-2xl font-bold font-mono text-rose-700">
                  {formatPercent(minVarPerf.maxDrawdown, 2)}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
                  <span>Equal-Weight MDD:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {ewPerf && ewPerf.maxDrawdown !== null ? formatPercent(ewPerf.maxDrawdown, 2) : '-'}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                  <span>SPY Benchmark MDD:</span>
                  <span className="font-semibold text-slate-600">
                    {spyPerf && spyPerf.maxDrawdown !== null ? formatPercent(spyPerf.maxDrawdown, 2) : 'Awaiting SPY'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-400">Not loaded yet</div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
                  <span>Risk Profile:</span>
                  <span className="font-semibold text-slate-700">Peak-to-Trough Loss</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Overview & Comparison Bar (Equal-Weight, SPY Status, and Refresh Status Area) */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Equal-Weight & Benchmark Comparison Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
              <span>Equal-Weight vs Min-Variance</span>
            </span>
            <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
              1/N Baseline
            </span>
          </div>

          {isDataLoaded && minVarPerf && ewPerf ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Cumulative Return:</span>
                <div className="font-mono font-semibold text-slate-800">
                  <span className="text-indigo-700 font-bold">{formatPercent(minVarPerf.cumulativeReturn)}</span>
                  <span className="text-slate-400 font-normal"> vs {formatPercent(ewPerf.cumulativeReturn)} (EW)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Annualized CAGR:</span>
                <div className="font-mono font-semibold text-slate-800">
                  <span className="text-indigo-700 font-bold">{formatPercent(minVarPerf.annualizedReturn)}</span>
                  <span className="text-slate-400 font-normal"> vs {formatPercent(ewPerf.annualizedReturn)} (EW)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Sharpe Ratio (Rf=0%):</span>
                <div className="font-mono font-semibold text-slate-800">
                  <span className="text-indigo-700 font-bold">
                    {minVarPerf.sharpeRatio !== null ? minVarPerf.sharpeRatio.toFixed(2) : '-'}
                  </span>
                  <span className="text-slate-400 font-normal">
                    {' '}vs {ewPerf.sharpeRatio !== null ? ewPerf.sharpeRatio.toFixed(2) : '-'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">
              Awaiting portfolio data load to compare against 1/N baseline.
            </div>
          )}
        </div>

        {/* SPY Benchmark Comparison Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>S&amp;P 500 (SPY) Benchmark Status</span>
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                spyPerf
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {spyPerf ? 'Aligned & Active' : 'Awaiting Data'}
            </span>
          </div>

          {spyPerf ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">SPY Cumulative Return:</span>
                <span className="font-mono font-bold text-slate-800">
                  {formatPercent(spyPerf.cumulativeReturn)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">SPY Annualized Volatility:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {formatPercent(spyPerf.annualizedVolatility)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">SPY Sharpe Ratio:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {spyPerf.sharpeRatio !== null ? spyPerf.sharpeRatio.toFixed(2) : '-'}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-400">
              SPY time series will populate benchmark comparisons once ingested.
            </div>
          )}
        </div>

        {/* Refresh Status & Data Timestamp Area (Requirement: Refresh Status Area) */}
        <div id="refresh-status-card" className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Data As-Of &amp; Feed Status</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500">Dual-Stream Feed</span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Historical Series Info */}
            <div className="flex items-start justify-between">
              <span className="text-slate-500">Historical Series:</span>
              <div className="text-right font-mono text-[11px]">
                {optimizationResult.historyStartDate && optimizationResult.historyEndDate ? (
                  <span className="font-semibold text-slate-800">
                    {optimizationResult.historyStartDate} to {optimizationResult.historyEndDate}
                    <div className="text-[10px] text-slate-400 font-normal">
                      ({optimizationResult.commonDateCount} common trading days)
                    </div>
                  </span>
                ) : (
                  <span className="text-slate-400">Not ingested yet</span>
                )}
              </div>
            </div>

            {/* Latest Price Feed Info */}
            <div className="flex items-start justify-between border-t border-slate-100 pt-2">
              <span className="text-slate-500">Latest Quote Feed:</span>
              <div className="text-right font-mono text-[11px]">
                {quoteRefreshSummary && quoteRefreshSummary.lastRefreshedAt ? (
                  <div>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Refreshed ({quoteRefreshSummary.successCount}/{quoteRefreshSummary.totalAttempted})
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(quoteRefreshSummary.lastRefreshedAt).toLocaleTimeString()} (Max Concurrency 3)
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400 italic">Click "Refresh Latest Prices" above</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
