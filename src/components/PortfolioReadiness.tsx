import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Activity,
  Layers,
  Calendar,
  Grid,
  BarChart3,
  Shield,
  Clock,
  Info,
  ChevronDown,
  ChevronUp,
  Table,
  Scale,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
} from 'lucide-react';
import {
  SymbolDataMap,
  CandidateScreeningItem,
  PortfolioReadinessSummary,
} from '../types';
import { BENCHMARK } from '../config';
import { screenAllCandidates } from '../utils/technicalIndicators';
import { evaluatePortfolioReadiness } from '../utils/portfolioMath';

interface PortfolioReadinessProps {
  dataMap: SymbolDataMap;
}

export const PortfolioReadiness: React.FC<PortfolioReadinessProps> = ({ dataMap }) => {
  const [activeInspectorTab, setActiveInspectorTab] = useState<'none' | 'correlation' | 'covariance' | 'dates'>('none');
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  // 1. Run Candidate Screening across universe
  const screeningItems = useMemo(() => {
    return screenAllCandidates(dataMap);
  }, [dataMap]);

  // 2. Evaluate Portfolio Analysis Readiness & Baselines
  const readiness: PortfolioReadinessSummary = useMemo(() => {
    return evaluatePortfolioReadiness(screeningItems, dataMap);
  }, [screeningItems, dataMap]);

  // Helper formatting functions
  const formatPercent = (val: number | null, withSign = false) => {
    if (val === null || isNaN(val)) return '-';
    const num = val * 100;
    const sign = withSign && num > 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  const formatNumber = (val: number | null, decimals = 2) => {
    if (val === null || isNaN(val)) return '-';
    return val.toFixed(decimals);
  };

  // Correlation heatmap color helper
  const getCorrelationColor = (val: number) => {
    if (val >= 0.8) return 'bg-blue-100 text-blue-900 font-bold';
    if (val >= 0.5) return 'bg-blue-50 text-blue-800 font-semibold';
    if (val >= 0.2) return 'bg-slate-50 text-slate-800';
    if (val >= -0.2) return 'bg-emerald-50 text-emerald-800';
    return 'bg-rose-50 text-rose-800';
  };

  const ew = readiness.equalWeightPerformance;
  const spy = readiness.benchmarkPerformance;

  return (
    <section id="portfolio-readiness-section" className="mb-8">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-50/75">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="portfolio-readiness-heading" className="text-base sm:text-lg font-bold text-slate-900">
                  Portfolio Analysis Readiness &amp; Baseline Validation
                </h2>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    readiness.covarianceStatus === 'Ready'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  {readiness.covarianceStatus === 'Ready' ? 'Optimization Ready' : 'Data Incomplete'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Common-date return alignment, unbiased covariance matrix estimation, and Equal-Weight vs SPY benchmark baselines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="math-doc-btn"
              type="button"
              onClick={() => setShowFormulaModal(!showFormulaModal)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span>{showFormulaModal ? 'Hide Math Specs' : 'Inspect Math &amp; Formulas'}</span>
            </button>
          </div>
        </div>

        {/* Mathematical Specifications Callout */}
        {showFormulaModal && (
          <div id="readiness-math-callout" className="p-4 sm:p-5 bg-indigo-50/50 border-b border-indigo-100 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Pure Deterministic Financial Mathematics Framework</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                <div className="font-bold text-indigo-900 mb-1">1. Date Alignment &amp; Return Series</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Simple daily returns <span className="font-mono font-semibold">r_t = (P_t - P_{'{t-1}'}) / P_{'{t-1}'}</span>. Matrix uses strictly shared common trading dates without zero-filling or forward filling.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                <div className="font-bold text-indigo-900 mb-1">2. Covariance &amp; Correlation</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Sample covariance with Bessel correction <span className="font-mono font-semibold">1 / (T - 1)</span>. Annualized covariance is <span className="font-mono font-semibold">Cov_daily &times; 252</span>. Correlation clamped in [-1, 1].
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                <div className="font-bold text-indigo-900 mb-1">3. Performance &amp; Sharpe Ratio</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  CAGR = <span className="font-mono font-semibold">(1 + CumReturn)^(252 / T) - 1</span>, Volatility = <span className="font-mono font-semibold">StdDev &times; &radic;252</span>, Sharpe uses <strong>0.0% displayed risk-free rate</strong> assumption.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Prominent Warning if fewer than 10 stocks are eligible */}
        {readiness.isEligibleBelowThreshold && (
          <div
            id="eligible-threshold-warning"
            className="p-4 bg-amber-50 border-b border-amber-200 flex items-start gap-3 text-xs text-amber-900"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950">
                Fewer than 10 eligible holdings ({readiness.eligibleCount} of 20 stocks qualified)
              </div>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Fewer than 10 eligible holdings; optimization may use the highest-scoring data-sufficient fallback holdings in the next step.
              </p>
            </div>
          </div>
        )}

        {/* Readiness Key Stats Grid */}
        <div id="readiness-stats-grid" className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            {/* 1. Eligible Holdings */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[10px] uppercase font-semibold">Eligible Holdings</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
                {readiness.eligibleCount} <span className="text-xs font-normal text-slate-500">/ 20</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Score &ge; 2 / 4</div>
            </div>

            {/* 2. Common Trading Dates */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[10px] uppercase font-semibold">Common Dates</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5 font-mono">
                {readiness.commonDateCount}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {readiness.isHistorySufficient ? '&ge; 252 Day Target Met' : 'Target: 252 Days'}
              </div>
            </div>

            {/* 3. History Start Date */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[10px] uppercase font-semibold">History Start</div>
              <div className="text-sm font-bold text-slate-900 mt-1 font-mono truncate" title={readiness.startDate ?? 'None'}>
                {readiness.startDate ?? 'Unavailable'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Earliest aligned bar</div>
            </div>

            {/* 4. History End Date */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[10px] uppercase font-semibold">History End</div>
              <div className="text-sm font-bold text-slate-900 mt-1 font-mono truncate" title={readiness.endDate ?? 'None'}>
                {readiness.endDate ?? 'Unavailable'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Latest aligned bar</div>
            </div>

            {/* 5. Covariance Status */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[10px] uppercase font-semibold">Covariance Status</div>
              <div className="mt-1">
                {readiness.covarianceStatus === 'Ready' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{readiness.eligibleCount}&times;{readiness.eligibleCount} Ready</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{readiness.covarianceStatus}</span>
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Bessel (T-1) Unbiased</div>
            </div>

            {/* 6. SPY Benchmark Availability */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[10px] uppercase font-semibold">SPY Benchmark</div>
              <div className="mt-1">
                {readiness.benchmarkAvailability === 'Aligned' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Exact Aligned</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-500 font-medium text-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{readiness.benchmarkAvailability}</span>
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">SPDR S&amp;P 500 ETF</div>
            </div>
          </div>

          {/* Eligible Tickers Pills List */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Eligible Tickers ({readiness.eligibleCount}):</span>
            </span>
            {readiness.eligibleTickers.length > 0 ? (
              readiness.eligibleTickers.map((ticker) => {
                const item = screeningItems.find((s) => s.ticker === ticker);
                return (
                  <span
                    key={ticker}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs"
                    title={`${ticker} - ${item?.company} (Score: ${item?.technicalScore}/4, Return60D: ${formatPercent(item?.trailing60Return ?? null)})`}
                  >
                    <span>{ticker}</span>
                    <span className="text-[10px] font-sans font-normal text-emerald-700 bg-emerald-100/80 px-1 rounded">
                      {item?.category.split(',')[0]}
                    </span>
                  </span>
                );
              })
            ) : (
              <span className="text-xs text-slate-400 italic">
                No eligible tickers yet. Load historical data above to trigger technical scoring.
              </span>
            )}
          </div>
        </div>

        {/* Baseline Portfolio Performance Comparison (Equal-Weight vs SPY Benchmark) */}
        <div className="p-4 sm:p-5 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>Pre-Optimization Baseline: Equal-Weight Portfolio vs SPY Benchmark</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated across the exact shared {readiness.commonDateCount}-day evaluation window (1/N allocation per eligible asset).
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-400 font-mono hidden sm:block">
              Risk-Free Rate: 0.0% (Reporting Assumption)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* 1. Equal Weight Baseline Card */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-2xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-indigo-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-100 text-indigo-800 rounded-md font-bold text-xs">
                    EW
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                      Equal-Weight Eligible Portfolio
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {readiness.eligibleCount > 0
                        ? `${(100 / readiness.eligibleCount).toFixed(2)}% per holding across ${readiness.eligibleCount} assets`
                        : 'Awaiting eligible holdings'}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                  Baseline
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-center">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-sans uppercase font-semibold">Cum. Return</div>
                  <div
                    className={`font-bold text-sm mt-0.5 ${
                      (ew?.cumulativeReturn ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {formatPercent(ew?.cumulativeReturn ?? null, true)}
                  </div>
                </div>

                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-sans uppercase font-semibold">Ann. Return</div>
                  <div
                    className={`font-bold text-sm mt-0.5 ${
                      (ew?.annualizedReturn ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {formatPercent(ew?.annualizedReturn ?? null, true)}
                  </div>
                </div>

                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-sans uppercase font-semibold">Ann. Volatility</div>
                  <div className="font-bold text-sm text-slate-800 mt-0.5">
                    {formatPercent(ew?.annualizedVolatility ?? null)}
                  </div>
                </div>

                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-sans uppercase font-semibold">Max Drawdown</div>
                  <div className="font-bold text-sm text-rose-700 mt-0.5">
                    {formatPercent(ew?.maxDrawdown ?? null)}
                  </div>
                </div>

                <div className="p-2 bg-white rounded border border-slate-200 col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-500 font-sans uppercase font-semibold">Sharpe (0% Rf)</div>
                  <div className="font-bold text-sm text-indigo-700 mt-0.5">
                    {formatNumber(ew?.sharpeRatio ?? null, 2)}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. SPY Benchmark Baseline Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-slate-100 text-slate-800 rounded-md font-bold text-xs font-mono">
                    {BENCHMARK.ticker}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">
                      {BENCHMARK.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Broad Market Equity Benchmark (Aligned to same {readiness.commonDateCount} days)
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                  Benchmark
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-center">
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-sans uppercase font-semibold">Cum. Return</div>
                  <div
                    className={`font-bold text-sm mt-0.5 ${
                      (spy?.cumulativeReturn ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {formatPercent(spy?.cumulativeReturn ?? null, true)}
                  </div>
                </div>

                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-sans uppercase font-semibold">Ann. Return</div>
                  <div
                    className={`font-bold text-sm mt-0.5 ${
                      (spy?.annualizedReturn ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {formatPercent(spy?.annualizedReturn ?? null, true)}
                  </div>
                </div>

                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-sans uppercase font-semibold">Ann. Volatility</div>
                  <div className="font-bold text-sm text-slate-800 mt-0.5">
                    {formatPercent(spy?.annualizedVolatility ?? null)}
                  </div>
                </div>

                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-sans uppercase font-semibold">Max Drawdown</div>
                  <div className="font-bold text-sm text-rose-700 mt-0.5">
                    {formatPercent(spy?.maxDrawdown ?? null)}
                  </div>
                </div>

                <div className="p-2 bg-slate-50 rounded border border-slate-200 col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-500 font-sans uppercase font-semibold">Sharpe (0% Rf)</div>
                  <div className="font-bold text-sm text-slate-700 mt-0.5">
                    {formatNumber(spy?.sharpeRatio ?? null, 2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Matrix & Alignment Inspector Tabs */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Inspect Mathematical Inputs:</span>
            <button
              type="button"
              onClick={() => setActiveInspectorTab(activeInspectorTab === 'correlation' ? 'none' : 'correlation')}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
                activeInspectorTab === 'correlation'
                  ? 'bg-indigo-600 text-white border-indigo-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Correlation Matrix ({readiness.eligibleCount}&times;{readiness.eligibleCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveInspectorTab(activeInspectorTab === 'covariance' ? 'none' : 'covariance')}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
                activeInspectorTab === 'covariance'
                  ? 'bg-indigo-600 text-white border-indigo-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Annualized Covariance Matrix
            </button>

            <button
              type="button"
              onClick={() => setActiveInspectorTab(activeInspectorTab === 'dates' ? 'none' : 'dates')}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
                activeInspectorTab === 'dates'
                  ? 'bg-indigo-600 text-white border-indigo-700'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Common Dates Log ({readiness.commonDateCount} Bars)
            </button>
          </div>

          {activeInspectorTab !== 'none' && (
            <button
              type="button"
              onClick={() => setActiveInspectorTab('none')}
              className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Close Inspector
            </button>
          )}
        </div>

        {/* Tab Content 1: Correlation Matrix Table */}
        {activeInspectorTab === 'correlation' && (
          <div className="p-4 sm:p-5 bg-white border-b border-slate-200 overflow-x-auto">
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="font-bold text-slate-900">
                Sample Correlation Matrix (&rho;<sub>ij</sub>) of Eligible Holdings
              </div>
              <div className="text-slate-500 text-[11px]">
                Values bounded between -1.00 and +1.00
              </div>
            </div>

            {readiness.correlationMatrix && readiness.correlationMatrix.tickers.length > 0 ? (
              <table className="w-full text-center text-xs font-mono border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="p-2 border border-slate-200 text-left font-sans text-[11px]">Ticker</th>
                    {readiness.correlationMatrix.tickers.map((t) => (
                      <th key={t} className="p-2 border border-slate-200 text-[11px]">
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {readiness.correlationMatrix.tickers.map((rowTicker, i) => (
                    <tr key={rowTicker} className="hover:bg-slate-50">
                      <td className="p-2 border border-slate-200 font-bold text-slate-900 text-left bg-slate-50">
                        {rowTicker}
                      </td>
                      {readiness.correlationMatrix!.tickers.map((colTicker, j) => {
                        const valAsString = readiness.correlationMatrix!.correlationMatrix[i][j];
                        return (
                          <td
                            key={colTicker}
                            className={`p-2 border border-slate-200 ${getCorrelationColor(valAsString)}`}
                          >
                            {valAsString.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4 bg-slate-50 rounded text-center text-slate-500 text-xs">
                No correlation matrix available yet. Load universe data to compute.
              </div>
            )}
          </div>
        )}

        {/* Tab Content 2: Covariance Matrix Table */}
        {activeInspectorTab === 'covariance' && (
          <div className="p-4 sm:p-5 bg-white border-b border-slate-200 overflow-x-auto">
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="font-bold text-slate-900">
                Annualized Sample Covariance Matrix (&Sigma; = Cov<sub>daily</sub> &times; 252)
              </div>
              <div className="text-slate-500 text-[11px]">
                Degrees of freedom: T - 1 = {Math.max(0, readiness.commonDateCount - 1)}
              </div>
            </div>

            {readiness.covarianceMatrix && readiness.covarianceMatrix.tickers.length > 0 ? (
              <table className="w-full text-right text-xs font-mono border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="p-2 border border-slate-200 text-left font-sans text-[11px]">Ticker</th>
                    {readiness.covarianceMatrix.tickers.map((t) => (
                      <th key={t} className="p-2 border border-slate-200 text-[11px] text-right">
                        {t}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {readiness.covarianceMatrix.tickers.map((rowTicker, i) => (
                    <tr key={rowTicker} className="hover:bg-slate-50">
                      <td className="p-2 border border-slate-200 font-bold text-slate-900 text-left bg-slate-50">
                        {rowTicker}
                      </td>
                      {readiness.covarianceMatrix!.tickers.map((colTicker, j) => {
                        const val = readiness.covarianceMatrix!.annualizedCovariance[i][j];
                        return (
                          <td
                            key={colTicker}
                            className={`p-2 border border-slate-200 ${
                              i === j ? 'bg-indigo-50 font-bold text-indigo-900' : 'text-slate-700'
                            }`}
                          >
                            {val.toFixed(4)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4 bg-slate-50 rounded text-center text-slate-500 text-xs">
                No covariance matrix available yet. Load universe data to compute.
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: Common Dates Log */}
        {activeInspectorTab === 'dates' && (
          <div className="p-4 sm:p-5 bg-white border-b border-slate-200">
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="font-bold text-slate-900">
                Aligned Common Trading Date Sample ({readiness.commonDateCount} Observations)
              </div>
              <div className="text-slate-500 text-[11px]">
                {readiness.startDate} &rarr; {readiness.endDate}
              </div>
            </div>

            {readiness.alignedReturns && readiness.alignedReturns.dates.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 font-mono text-xs max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                {readiness.alignedReturns.dates.map((d, idx) => (
                  <div key={d} className="p-1 bg-white rounded border border-slate-200 text-center text-slate-700">
                    <span className="text-[10px] text-slate-400 mr-1">#{idx + 1}</span>
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded text-center text-slate-500 text-xs">
                No aligned date history available.
              </div>
            )}
          </div>
        )}

        {/* Footer Note */}
        <div className="p-3 bg-slate-50 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Strict Mathematical Reproducibility: Unbiased covariance, aligned date intersection, 0% risk-free rate assumption.</span>
          </div>
          <div className="font-mono text-slate-500">
            Holdings: {readiness.eligibleCount} | Observations: {readiness.commonDateCount}
          </div>
        </div>
      </div>
    </section>
  );
};
