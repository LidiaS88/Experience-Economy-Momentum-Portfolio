import React, { useState, useMemo } from 'react';
import {
  PieChart,
  SlidersHorizontal,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Shield,
  Layers,
  Info,
  DollarSign,
  TrendingDown,
  Activity,
  ArrowDownRight,
  Sparkles,
  HelpCircle,
  Building,
  RefreshCw,
  Search,
  Filter,
  Check,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  SymbolDataMap,
  OptimizationResult,
  OptimizedHolding,
  LatestQuotesMap,
  QuoteRefreshSummary,
} from '../types';
import { screenAllCandidates } from '../utils/technicalIndicators';
import {
  runPortfolioOptimizer,
  TOTAL_PORTFOLIO_CAPITAL,
  MAX_WEIGHT_CONSTRAINT,
  MIN_REQUIRED_HOLDINGS,
} from '../utils/portfolioOptimizer';

interface OptimizedPortfolioProps {
  dataMap: SymbolDataMap;
  optimizationResult: OptimizationResult;
  latestQuotes: LatestQuotesMap;
  isRefreshingQuotes: boolean;
  quoteRefreshProgress: string;
  quoteRefreshSummary: QuoteRefreshSummary | null;
  hasTwelveDataKey: boolean;
  onRefreshLatestPrices: () => void;
}

export const OptimizedPortfolio: React.FC<OptimizedPortfolioProps> = ({
  dataMap,
  optimizationResult,
  latestQuotes,
  isRefreshingQuotes,
  quoteRefreshProgress,
  quoteRefreshSummary,
  hasTwelveDataKey,
  onRefreshLatestPrices,
}) => {
  const [showMathDetails, setShowMathDetails] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [inclusionFilter, setInclusionFilter] = useState<'ALL' | 'ELIGIBLE' | 'FALLBACK'>('ALL');

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

  const formatPrice = (val: number | null) => {
    if (val === null || isNaN(val)) return '-';
    return `$${val.toFixed(2)}`;
  };

  // Signal Badge Colors
  const getSignalBadge = (status: string) => {
    switch (status) {
      case 'Constructive':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Mixed':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Caution':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  // Filtered holdings list
  const filteredHoldings滑 = useMemo(() => {
    return optimizationResult.holdings.filter((h) => {
      const matchSearch =
        searchFilter === '' ||
        h.ticker.toLowerCase().includes(searchFilter.toLowerCase()) ||
        h.company.toLowerCase().includes(searchFilter.toLowerCase()) ||
        h.category.toLowerCase().includes(searchFilter.toLowerCase());

      const matchCategory =
        categoryFilter === 'ALL' || h.category.toLowerCase().includes(categoryFilter.toLowerCase());

      const matchInclusion利 =
        inclusionFilter === 'ALL' ||
        (inclusionFilter === 'ELIGIBLE' && h.inclusionReason === 'Eligible Technical Pass') ||
        (inclusionFilter === 'FALLBACK' && h.inclusionReason === 'Fallback included');

      return matchSearch && matchCategory && matchInclusion利;
    });
  }, [optimizationResult.holdings, searchFilter, categoryFilter, inclusionFilter]);

  const filteredHoldings = filteredHoldings滑;

  // Category weight breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { weight: number; dollars: number; count: number }> = {};
    for (const h of optimizationResult.holdings) {
      const cat人类 = h.category.split(',')[0].trim();
      const cat = cat人类;
      if (!map[cat]) {
        map[cat] = { weight: 0, dollars: 0, count: 0 };
      }
      map[cat].weight += h.weight;
      map[cat].dollars += h.dollarAllocation;
      map[cat].count += 1;
    }
    return Object.entries(map).sort((a, b) => b[1].weight - a[1].weight);
  }, [optimizationResult.holdings]);

  // Aggregate totals
  const totalDisplayWeight = optimizationResult.holdings.reduce((sum, h) => sum + h.weight, 0);
  const totalDisplayDollars = optimizationResult.holdings.reduce(
    (sum, h) => sum + h.dollarAllocation,
    0
  );

  const { validation } = optimizationResult;
  const isDataAvailable = optimizationResult.status !== 'No Data' && optimizationResult.status !== 'Insufficient Holdings';

  return (
    <section id="optimized-portfolio-section" className="mb-8">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-50/75">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="optimized-portfolio-heading" className="text-base sm:text-lg font-bold text-slate-900">
                  Constrained Minimum-Variance Optimized Portfolio
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200">
                  $1,000,000 Capital Model
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                    optimizationResult.status === 'Optimal'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : optimizationResult.status === 'Validation Fallback'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {optimizationResult.status === 'Optimal'
                    ? 'PGD Converged'
                    : optimizationResult.status === 'Validation Fallback'
                    ? 'Equal-Weight Fallback'
                    : optimizationResult.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Objective: <span className="font-mono font-semibold">min &frac12; wᵀ&Sigma;w</span> &bull; Box Constraints: <span className="font-mono font-semibold">0% &le; wᵢ &le; 20%</span> &bull; Budget: <span className="font-mono font-semibold">&sum;wᵢ = 1.0</span> &bull; Numerical: Projected Gradient Descent.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Refresh Latest Prices Action Button */}
            <button
              id="portfolio-table-refresh-prices-btn"
              type="button"
              onClick={onRefreshLatestPrices}
              disabled={!hasTwelveDataKey || isRefreshingQuotes || !isDataAvailable}
              title={
                !hasTwelveDataKey
                  ? 'Please enter your Twelve Data API key first'
                  : !isDataAvailable
                  ? 'Please load historical market data first'
                  : 'Fetch latest available quotes for optimized holdings (max concurrency 3)'
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border shadow-2xs ${
                !hasTwelveDataKey || isRefreshingQuotes || !isDataAvailable
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 cursor-pointer'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQuotes ? 'animate-spin' : ''}`} />
              <span>
                {isRefreshingQuotes
                  ? quoteRefreshProgress || 'Refreshing Quotes...'
                  : 'Refresh Latest Prices'}
              </span>
            </button>

            <button
              id="toggle-math-specs-btn"
              type="button"
              onClick={() => setShowMathDetails(!showMathDetails)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span>{showMathDetails ? 'Hide Math Specs' : 'Inspect Optimizer Math'}</span>
            </button>
          </div>
        </div>

        {/* Math & Algorithm Breakdown Accordion */}
        {showMathDetails && (
          <div
            id="optimizer-math-specs-callout"
            className="p-4 sm:p-5 bg-indigo-50/50 border-b border-indigo-100 text-xs text-slate-700"
          >
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Deterministic Numerical Optimizer: Projected Gradient Descent (PGD)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                <div className="font-bold text-indigo-900 mb-1">1. Quadratic Objective &amp; Gradient</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Objective <span className="font-mono font-semibold">f(w) = &frac12; wᵀ&Sigma;w</span> where &Sigma; is the annualized sample covariance matrix (&Sigma;<sub>daily</sub> &times; 252). Exact gradient is <span className="font-mono font-semibold">&nabla;f(w) = &Sigma;w</span>.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                <div className="font-bold text-indigo-900 mb-1">2. Exact Capped Simplex Projection</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Projects unconstrained step <span className="font-mono font-semibold">y = w - &alpha;&nabla;f</span> onto <span className="font-mono font-semibold">S = &#123;w | &sum;wᵢ = 1, 0 &le; wᵢ &le; 0.20&#125;</span> via exact root-finding on the Lagrange multiplier <span className="font-mono font-semibold">&lambda;*</span> with &lt; 10⁻¹⁵ tolerance.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                <div className="font-bold text-indigo-900 mb-1">3. Step Size &amp; Validation Standard</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Armijo backtracking line search with initial <span className="font-mono font-semibold">w₀ = [1/N, ..., 1/N]ᵀ</span>. Post-optimization checks sum to 100%, non-negativity, and 20% cap. If validation fails, safely falls back to 1/N equal weights.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Fallback Active Prominent Banner */}
        {optimizationResult.isFallbackActive && (
          <div
            id="fallback-active-banner"
            className="p-4 bg-amber-50 border-b border-amber-200 flex items-start gap-3 text-xs text-amber-900"
          >
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950">
                Fallback Inclusion Active ({optimizationResult.fallbackCount} fallback position
                {optimizationResult.fallbackCount > 1 ? 's' : ''} added)
              </div>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Fewer than 10 stocks passed the technical screening filter (Score &ge; 2). To maintain
                institutional diversification standards and ensure a well-conditioned 10-holding covariance matrix,
                the {optimizationResult.fallbackCount} highest-scoring data-sufficient candidate
                {optimizationResult.fallbackCount > 1 ? 's' : ''} have been included and explicitly tagged as{' '}
                <span className="font-semibold underline">"Fallback included"</span>.
              </p>
            </div>
          </div>
        )}

        {/* Validation Failure Warning */}
        {optimizationResult.status === 'Validation Fallback' && (
          <div
            id="validation-failure-warning"
            className="p-4 bg-rose-50 border-b border-rose-200 flex items-start gap-3 text-xs text-rose-900"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-rose-950">
                Optimization Post-Validation Warning: Equal-Weight Fallback Implemented
              </div>
              <p className="mt-0.5 text-rose-800 leading-relaxed">
                The numerical optimization output did not pass one or more post-optimization validation checks.
                The system has safely reverted to a uniform 1/N Equal-Weight baseline across all {optimizationResult.includedCount} included holdings.
              </p>
              {validation.validationErrors.length > 0 && (
                <ul className="mt-1.5 list-disc list-inside text-rose-800 space-y-0.5">
                  {validation.validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Insufficient Holdings Error Panel */}
        {optimizationResult.status === 'Insufficient Holdings' ||
        optimizationResult.status === 'No Data' ? (
          <div id="insufficient-data-stop-panel" className="p-8 sm:p-12 text-center bg-slate-50/50">
            <div className="max-w-md mx-auto flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3.5 shadow-2xs">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Optimization Halted: Insufficient Historical Market Data
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {optimizationResult.statusMessage}
              </p>
              <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200 text-left text-xs text-slate-600 w-full space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mathematical Pre-requisites for Optimization:</span>
                </div>
                <div className="text-[11px] text-slate-500 pl-4 space-y-0.5">
                  <div>&bull; Minimum 10 assets with &ge; 252 valid daily price bars</div>
                  <div>&bull; Common overlapping trading date history</div>
                  <div>&bull; Symmetric covariance matrix with positive diagonal variance check</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-4">
                Please enter your Twelve Data API key in the Data Access Panel above and click "Load Portfolio Historical Data".
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Optimizer Validation & Volatility Summary Panel */}
            <div id="optimizer-validation-panel" className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Institutional Optimizer Validation &amp; Volatility Metrics
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-mono hidden sm:inline-block">
                  Tolerance: &plusmn;0.01% | Max Cap: 20.00%
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                {/* 1. Optimizer Status */}
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Optimizer Status</div>
                  <div className="mt-1 flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    {validation.isValid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )}
                    <span className="truncate" title={optimizationResult.statusMessage}>
                      {optimizationResult.status === 'Optimal'
                        ? `Optimal (${optimizationResult.iterations} iters)`
                        : 'Validation Fallback'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {optimizationResult.convergenceReached ? 'Converged (tol < 1e-7)' : 'Iter limit reached'}
                  </div>
                </div>

                {/* 2. Included Holdings Count */}
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Included Holdings</div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 font-mono">
                    {optimizationResult.includedCount}{' '}
                    <span className="text-xs font-normal text-slate-500">Holdings</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {optimizationResult.includedCount >= 10 ? 'Diversification &ge; 10 met' : 'Under target'}
                  </div>
                </div>

                {/* 3. Total Weight Sum */}
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Weight Total</div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 font-mono flex items-center gap-1">
                    <span>{formatPercent(validation.weightSum, 2)}</span>
                    {validation.weightSumTolerancePassed && (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Target: 100.00% &plusmn; 0.01%</div>
                </div>

                {/* 4. Largest Weight (Cap <= 20%) */}
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Largest Weight</div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 font-mono flex items-center gap-1">
                    <span>{formatPercent(validation.largestWeight, 2)}</span>
                    {validation.maxWeightConstraintPassed ? (
                      <span className="text-[10px] font-sans font-semibold text-emerald-700 bg-emerald-50 px-1 rounded">
                        &le; 20%
                      </span>
                    ) : (
                      <span className="text-[10px] font-sans font-semibold text-rose-700 bg-rose-50 px-1 rounded">
                        Cap Violated
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Box Cap: 20.00% Max</div>
                </div>

                {/* 5. Fallback Holdings Count */}
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold">Fallback Holdings</div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 font-mono">
                    {optimizationResult.fallbackCount}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      {optimizationResult.fallbackCount === 1 ? 'Asset' : 'Assets'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {optimizationResult.fallbackCount > 0 ? 'Highest Score Fallback' : '0 (All Eligible)'}
                  </div>
                </div>

                {/* 6. Min-Variance vs Equal-Weight Volatility */}
                <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200">
                  <div className="text-indigo-900 text-[10px] uppercase font-bold">Min-Var vs EW Vol</div>
                  <div className="text-sm font-bold text-indigo-950 mt-0.5 font-mono flex items-center gap-1">
                    <span>{formatPercent(optimizationResult.minVarianceVolatility, 2)}</span>
                    <span className="text-[10px] font-normal text-indigo-700">
                      vs {formatPercent(optimizationResult.equalWeightVolatility, 2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-0.5">
                    <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                    <span>
                      {optimizationResult.relativeRiskReduction !== null &&
                      optimizationResult.relativeRiskReduction > 0
                        ? `-${optimizationResult.relativeRiskReduction.toFixed(1)}% Risk Reduction`
                        : 'Identical (1/N Base)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Breakdown Chips */}
              <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Category Exposures:</span>
                </span>
                {categoryBreakdown.map(([cat, data]) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-white border border-slate-200 text-slate-800 shadow-2xs font-mono"
                  >
                    <span className="font-sans font-semibold text-slate-700">{cat}:</span>
                    <span className="font-bold text-indigo-700">{formatPercent(data.weight)}</span>
                    <span className="text-[10px] font-sans text-slate-400">({data.count} assets)</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Interactive Filters Bar */}
            <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search holdings by ticker, name, or sub-industry..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Category Filter */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Live Events">Live Events</option>
                  <option value="Travel">Travel &amp; Lodging</option>
                  <option value="Wellness">Wellness &amp; Athleisure</option>
                  <option value="Streaming">Streaming &amp; Interactive</option>
                  <option value="Dining">Experiential Dining</option>
                </select>

                {/* Inclusion Filter */}
                <select
                  value={inclusionFilter}
                  onChange={(e) => setInclusionFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Inclusions</option>
                  <option value="ELIGIBLE">Eligible Only</option>
                  <option value="FALLBACK">Fallback Inclusions Only</option>
                </select>

                {(searchFilter || categoryFilter !== 'ALL' || inclusionFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchFilter('');
                      setCategoryFilter('ALL');
                      setInclusionFilter('ALL');
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* Holdings Table with Latest Prices and Quotes (Requirement 1 & 8) */}
            <div id="optimized-table-container" className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Ticker</th>
                    <th className="py-3 px-4">Company Name</th>
                    <th className="py-3 px-4">Inclusion Reason</th>
                    <th className="py-3 px-4 text-center">Tech Score</th>
                    <th className="py-3 px-4 text-right">Optimized Weight</th>
                    <th className="py-3 px-4 text-right">Dollar Allocation ($1M Model)</th>
                    <th className="py-3 px-4 text-right">Latest Quote / Price</th>
                    <th className="py-3 px-4 text-center">Market Feed Status</th>
                    <th className="py-3 px-4 text-center">Signal Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredHoldings.length > 0 ? (
                    filteredHoldings.map((h) => {
                      const isFallback = h.inclusionReason === 'Fallback included';
                      const quote = latestQuotes[h.ticker];
                      const hasFreshQuote = quote && quote.status === 'ok' && quote.price !== null;
                      const isQuoteError = quote && quote.status === 'error';

                      const displayPrice = hasFreshQuote ? quote.price : h.latestPrice;

                      return (
                        <tr
                          key={h.ticker}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isFallback ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          {/* 1. Category */}
                          <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                            {h.category.split(',')[0]}
                          </td>

                          {/* 2. Ticker */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <span>{h.ticker}</span>
                              {isFallback && (
                                <span
                                  className="w-2 h-2 rounded-full bg-amber-500"
                                  title="Fallback Included Asset"
                                />
                              )}
                            </span>
                          </td>

                          {/* 3. Company */}
                          <td className="py-3 px-4 text-slate-800 font-medium">
                            <div className="font-semibold text-slate-900">{h.company}</div>
                            {h.shares !== null && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                Est. {h.shares.toLocaleString()} shares
                              </div>
                            )}
                          </td>

                          {/* 4. Inclusion Reason */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isFallback ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Fallback included</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Eligible Technical Pass</span>
                              </span>
                            )}
                          </td>

                          {/* 5. Technical Score */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="inline-block font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {h.technicalScore !== null ? `${h.technicalScore} / 4` : '-'}
                            </span>
                          </td>

                          {/* 6. Optimized Weight */}
                          <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                            <div className="font-bold text-sm text-indigo-900">
                              {formatPercent(h.weight, 2)}
                            </div>
                            <div className="w-16 ml-auto bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1">
                              <div
                                className="bg-indigo-600 h-full rounded-full"
                                style={{ width: `${Math.min(100, (h.weight / MAX_WEIGHT_CONSTRAINT) * 100)}%` }}
                              />
                            </div>
                          </td>

                          {/* 7. Dollar Allocation */}
                          <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                            <div className="font-bold text-xs sm:text-sm text-slate-900">
                              {formatCurrency(h.dollarAllocation)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {((h.dollarAllocation / TOTAL_PORTFOLIO_CAPITAL) * 100).toFixed(2)}% of $1M
                            </div>
                          </td>

                          {/* 8. Latest Price & Intraday Change (Requirement 1) */}
                          <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                            <div className="font-bold text-slate-900">
                              {formatPrice(displayPrice)}
                            </div>
                            {hasFreshQuote && quote.percentChange !== null && (
                              <div
                                className={`text-[10px] font-semibold ${
                                  quote.percentChange >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {quote.percentChange >= 0 ? '+' : ''}
                                {quote.percentChange.toFixed(2)}%
                                {quote.change !== null && ` (${quote.change >= 0 ? '+' : ''}$${quote.change.toFixed(2)})`}
                              </div>
                            )}
                            {hasFreshQuote && quote.previousClose !== null && (
                              <div className="text-[9px] text-slate-400 font-mono">
                                Prev: ${quote.previousClose.toFixed(2)}
                              </div>
                            )}
                          </td>

                          {/* 9. Market Feed Status (Requirement 1: "Latest available price" / "Live market price") */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {hasFreshQuote ? (
                              <div>
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                    quote.priceLabel === 'Live market price'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {quote.priceLabel}
                                </span>
                                {quote.datetime && (
                                  <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                                    {quote.datetime.split(' ')[0]}
                                  </div>
                                )}
                              </div>
                            ) : isQuoteError ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                                title={quote.errorMessage || 'Quote failed'}
                              >
                                <AlertCircle className="w-3 h-3 text-rose-500" />
                                <span>Quote Error</span>
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-500 border border-slate-200">
                                Historical close
                              </span>
                            )}
                          </td>

                          {/* 10. Signal Status */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getSignalBadge(
                                h.signalStatus
                              )}`}
                            >
                              {h.signalStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-8 px-4 text-center text-slate-500 text-xs bg-slate-50/50">
                        No holdings match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* Table Footer Totals */}
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 text-xs">
                    <td colSpan={5} className="py-3 px-4 text-left">
                      Portfolio Totals ({optimizationResult.includedCount} Active Positions)
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-indigo-950 text-sm">
                      {formatPercent(totalDisplayWeight, 2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-950 text-sm">
                      {formatCurrency(totalDisplayDollars)}
                    </td>
                    <td colSpan={3} className="py-3 px-4 text-center text-slate-500 font-normal text-[11px]">
                      Fully Invested Model Allocation
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Table Bottom Status Bar */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Deterministic Convex Quadratic Programming (Long-Only Capped Min-Variance).</span>
              </div>
              <div className="font-mono text-slate-500">
                Capital: $1,000,000.00 | Cap: 20.00% | Allocations: {optimizationResult.status}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
