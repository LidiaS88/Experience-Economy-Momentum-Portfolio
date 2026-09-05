import React, { useState, useMemo } from 'react';
import {
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  SlidersHorizontal,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Award,
  Shield,
  Layers,
  Sparkles,
  BarChart3,
  TrendingUp,
  Activity,
  Check,
  X,
} from 'lucide-react';
import {
  SymbolDataMap,
  CandidateScreeningItem,
  EligibilityStatus,
  TechnicalRatingLabel,
} from '../types';
import { screenAllCandidates } from '../utils/technicalIndicators';
import { PORTFOLIO_UNIVERSE } from '../config';

interface CandidateScreeningProps {
  dataMap: SymbolDataMap;
}

type SortField =
  | 'category'
  | 'ticker'
  | 'company'
  | 'latestPrice'
  | 'smaComparison'
  | 'macdStatus'
  | 'rsi14'
  | 'trailing60Return'
  | 'annualizedVolatility'
  | 'technicalScore'
  | 'eligibility';

type SortDirection = 'asc' | 'desc';

export const CandidateScreening: React.FC<CandidateScreeningProps> = ({ dataMap }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [eligibilityFilter, setEligibilityFilter] = useState<'all' | EligibilityStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [technicalFilter, setTechnicalFilter] = useState<'all' | TechnicalRatingLabel>('all');
  const [sortField, setSortField] = useState<SortField>('technicalScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);

  // Compute screening metrics for all 20 candidates
  const screenedCandidates = useMemo(() => {
    return screenAllCandidates(dataMap);
  }, [dataMap]);

  // Aggregate summary statistics
  const totalCandidates = screenedCandidates.length;
  const sufficientDataCount = screenedCandidates.filter((c) => c.hasSufficientData).length;
  const normallyEligibleCount = screenedCandidates.filter((c) => c.eligibility === 'Eligible').length;
  const fallbackCount = screenedCandidates.filter((c) => c.eligibility === 'Fallback Included').length;
  const totalEligibleCount = normallyEligibleCount + fallbackCount;
  const ineligibleCount = screenedCandidates.filter((c) => c.eligibility === 'Ineligible').length;
  const unavailableCount = screenedCandidates.filter((c) => c.eligibility === 'Data unavailable').length;

  // Category aggregate breakdown
  const categoryStats = useMemo(() => {
    const map = new Map<string, { total: number; eligible: number; candidates: CandidateScreeningItem[] }>();

    // Unique categories from universe
    for (const c of screenedCandidates) {
      if (!map.has(c.category)) {
        map.set(c.category, { total: 0, eligible: 0, candidates: [] });
      }
      const entry = map.get(c.category)!;
      entry.total += 1;
      if (c.eligibility === 'Eligible' || c.eligibility === 'Fallback Included') {
        entry.eligible += 1;
      }
      entry.candidates.push(c);
    }

    return Array.from(map.entries()).map(([category, stats]) => ({
      category,
      total: stats.total,
      eligible: stats.eligible,
      candidates: stats.candidates,
    }));
  }, [screenedCandidates]);

  // Handle column header sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // Default to descending for numeric/score metrics, ascending for strings
      if (['latestPrice', 'rsi14', 'trailing60Return', 'technicalScore', 'annualizedVolatility'].includes(field)) {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    }
  };

  // Filter and Sort Candidates
  const filteredAndSortedCandidates = useMemo(() => {
    return screenedCandidates
      .filter((candidate) => {
        const matchesSearch =
          candidate.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          candidate.category.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesEligibility =
          eligibilityFilter === 'all' || candidate.eligibility === eligibilityFilter;

        const matchesCategory =
          categoryFilter === 'all' || candidate.category === categoryFilter;

        const matchesTechnical =
          technicalFilter === 'all' || candidate.technicalLabel === technicalFilter;

        return matchesSearch && matchesEligibility && matchesCategory && matchesTechnical;
      })
      .sort((a, b) => {
        let valA: any = null;
        let valB: any = null;

        switch (sortField) {
          case 'category':
            valA = a.category;
            valB = b.category;
            break;
          case 'ticker':
            valA = a.ticker;
            valB = b.ticker;
            break;
          case 'company':
            valA = a.company;
            valB = b.company;
            break;
          case 'latestPrice':
            valA = a.latestPrice ?? -Infinity;
            valB = b.latestPrice ?? -Infinity;
            break;
          case 'smaComparison':
            valA = a.smaComparisonLabel;
            valB = b.smaComparisonLabel;
            break;
          case 'macdStatus':
            valA = a.macdStatusLabel;
            valB = b.macdStatusLabel;
            break;
          case 'rsi14':
            valA = a.rsi14 ?? -Infinity;
            valB = b.rsi14 ?? -Infinity;
            break;
          case 'trailing60Return':
            valA = a.trailing60Return ?? -Infinity;
            valB = b.trailing60Return ?? -Infinity;
            break;
          case 'annualizedVolatility':
            valA = a.annualizedVolatility ?? Infinity;
            valB = b.annualizedVolatility ?? Infinity;
            break;
          case 'technicalScore':
            valA = a.technicalScore ?? -1;
            valB = b.technicalScore ?? -1;
            break;
          case 'eligibility':
            valA = a.eligibility === 'Eligible' ? 3 : a.eligibility === 'Fallback Included' ? 2 : a.eligibility === 'Ineligible' ? 1 : 0;
            valB = b.eligibility === 'Eligible' ? 3 : b.eligibility === 'Fallback Included' ? 2 : b.eligibility === 'Ineligible' ? 1 : 0;
            break;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [screenedCandidates, searchTerm, eligibilityFilter, categoryFilter, technicalFilter, sortField, sortDirection]);

  // Formatter helpers
  const formatPrice = (val: number | null) => (val !== null ? `$${val.toFixed(2)}` : '-');
  const formatPercent = (val: number | null, withSign = false) => {
    if (val === null) return '-';
    const num = val * 100;
    const sign = withSign && num > 0 ? '+' : '';
    return `${sign}${num.toFixed(2)}%`;
  };

  const getEligibilityBadge = (status: EligibilityStatus) => {
    switch (status) {
      case 'Eligible':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Eligible</span>
          </span>
        );
      case 'Fallback Included':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-lime-100 text-lime-900 border border-lime-300">
            <AlertTriangle className="w-3.5 h-3.5 text-lime-700" />
            <span>Fallback Included</span>
          </span>
        );
      case 'Ineligible':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Ineligible</span>
          </span>
        );
      case 'Data unavailable':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Data unavailable</span>
          </span>
        );
    }
  };

  const getTechnicalLabelBadge = (label: TechnicalRatingLabel) => {
    switch (label) {
      case 'Constructive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span>Constructive</span>
          </span>
        );
      case 'Mixed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <span>Mixed</span>
          </span>
        );
      case 'Caution':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-200/80 text-emerald-950 border border-emerald-400">
            <span>Caution</span>
          </span>
        );
      case 'Data unavailable':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <span>Data unavailable</span>
          </span>
        );
    }
  };

  const renderSortHeader = (field: SortField, label: string, align: 'left' | 'right' | 'center' = 'left') => {
    const isActive = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        className={`py-3 px-3.5 cursor-pointer select-none hover:bg-slate-200/75 transition-colors text-slate-700 font-semibold uppercase text-[10px] tracking-wider ${
          align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
        }`}
      >
        <div className={`inline-flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
          <span>{label}</span>
          {isActive ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-emerald-700" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
          )}
        </div>
      </th>
    );
  };

  return (
    <section id="candidate-screening-section" className="mb-8">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-50/75">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-800">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="candidate-screening-heading" className="text-base sm:text-lg font-bold text-slate-900">
                  Candidate Technical Screening Pipeline
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-300">
                  20 Universe Stocks
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-factor technical scoring (0–4 pts). Candidates achieving score &ge; 2 qualify as <strong>Eligible</strong>.
              </p>
            </div>
          </div>

          {/* Methodology Trigger */}
          <div className="flex items-center gap-2">
            <button
              id="view-methodology-btn"
              type="button"
              onClick={() => setShowMethodologyModal(!showMethodologyModal)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-emerald-700" />
              <span>{showMethodologyModal ? 'Hide Scoring Rules' : 'Scoring Rules &amp; Logic'}</span>
            </button>
          </div>
        </div>

        {/* Scoring Methodology Collapsible Callout */}
        {showMethodologyModal && (
          <div id="screening-methodology-details" className="p-4 sm:p-5 bg-emerald-50/60 border-b border-emerald-200 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>Deterministic Technical Scoring Framework (0 to 4 Points)</span>
            </div>
            <p className="mb-3 text-slate-600 leading-relaxed">
              Every candidate with at least 252 valid daily trading observations is evaluated against 4 objective, rule-based quantitative criteria:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span>1. Price Trend (+1 pt)</span>
                  <span className="font-mono bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded">Close &gt; SMA 200</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Confirms the asset is trading in an expansive structural uptrend above its long-term baseline.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span>2. Golden Cross (+1 pt)</span>
                  <span className="font-mono bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded">SMA 50 &gt; SMA 200</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Verifies medium-term 50-day moving average is advancing above the 200-day secular trend.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span>3. MACD Momentum (+1 pt)</span>
                  <span className="font-mono bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded">MACD &gt; Signal</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Fast exponential momentum (12/26) leads above the 9-day trigger signal line.
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span>4. RSI Window (+1 pt)</span>
                  <span className="font-mono bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded">45 &le; RSI(14) &le; 70</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Bullish RSI range without extreme overbought exhaustion (&gt;70) or bearish decay (&lt;45).
                </p>
              </div>
            </div>

            <div className="mt-3 p-2.5 bg-white/90 rounded border border-emerald-200 flex items-center justify-between flex-wrap gap-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Eligibility Verdict:</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Score &ge; 2 = Eligible
                </span>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1 text-lime-800 font-semibold">
                  <X className="w-3.5 h-3.5 text-lime-700" /> Score &lt; 2 = Ineligible
                </span>
              </div>
              <div className="text-slate-500">
                Ratings: Constructive (3–4 pts), Mixed (2 pts), Caution (0–1 pts), Data unavailable (&lt;252 bars).
              </div>
            </div>
          </div>
        )}

        {/* 1. Summary Panel */}
        <div id="screening-summary-panel" className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4 text-xs">
            {/* Metric 1: Total Candidates */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[10px] uppercase font-semibold">Total Candidates</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{totalCandidates} Universe Stocks</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Fixed 20 candidate pool</div>
            </div>

            {/* Metric 2: Sufficient Data */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-slate-500 text-[10px] uppercase font-semibold">Sufficient History</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">
                {sufficientDataCount} <span className="text-xs font-normal text-slate-500">/ {totalCandidates}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">&ge; 252 valid daily bars</div>
            </div>

            {/* Metric 3: Eligible */}
            <div className="p-3 bg-white rounded-lg border border-emerald-200">
              <div className="text-emerald-700 text-[10px] uppercase font-semibold">Eligible (15-Stock Floor)</div>
              <div className="text-lg font-bold text-emerald-700 mt-0.5">
                {totalEligibleCount} <span className="text-xs font-normal text-emerald-600">Eligible</span>
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">
                {fallbackCount > 0
                  ? `${normallyEligibleCount} Qualified + ${fallbackCount} Fallback`
                  : `${normallyEligibleCount} Qualified`}
              </div>
            </div>

            {/* Metric 4: Ineligible / Restricted */}
            <div className="p-3 bg-white rounded-lg border border-lime-300">
              <div className="text-lime-800 text-[10px] uppercase font-semibold">Ineligible / Restricted</div>
              <div className="text-lg font-bold text-lime-800 mt-0.5">
                {ineligibleCount} <span className="text-xs font-normal text-lime-700">Restricted</span>
              </div>
              <div className="text-[10px] text-lime-700 mt-0.5">Below technical hurdle</div>
            </div>

            {/* Metric 5: Data Unavailable / Pending */}
            <div className="p-3 bg-white rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
              <div className="text-slate-500 text-[10px] uppercase font-semibold">Data Unavailable / Pending</div>
              <div className="text-lg font-bold text-slate-600 mt-0.5">{unavailableCount} Pending</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Awaiting data fetch</div>
            </div>
          </div>

          {/* Category-Level Eligibility Breakdown */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
                <span>Category Eligibility Breakdown (5 Sub-Sectors)</span>
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                Minimum 1 eligible stock per category recommended for sector balance
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {categoryStats.map((cat) => (
                <div
                  key={cat.category}
                  className={`p-2.5 rounded-lg border transition-colors ${
                    cat.eligible > 0
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="text-[11px] font-bold text-slate-800 truncate" title={cat.category}>
                    {cat.category}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    <span className="text-slate-500">Eligible:</span>
                    <span
                      className={`font-mono font-bold ${
                        cat.eligible > 0 ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {cat.eligible} / {cat.total}
                    </span>
                  </div>
                  {/* Visual dots for candidate status */}
                  <div className="flex items-center gap-1 mt-1.5">
                    {cat.candidates.map((c) => (
                      <span
                        key={c.ticker}
                        title={`${c.ticker}: ${c.eligibility} (Score: ${c.technicalScore ?? 'N/A'})`}
                        className={`inline-block w-2.5 h-2.5 rounded-full ${
                          c.eligibility === 'Eligible'
                            ? 'bg-emerald-500'
                            : c.eligibility === 'Fallback Included'
                            ? 'bg-lime-500'
                            : c.eligibility === 'Ineligible'
                            ? 'bg-slate-400'
                            : 'bg-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="candidate-search-input"
              type="text"
              placeholder="Search ticker, company, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
            {/* Eligibility Filter */}
            <select
              id="candidate-eligibility-filter"
              value={eligibilityFilter}
              onChange={(e) => setEligibilityFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">All Eligibility ({totalCandidates})</option>
              <option value="Eligible">Eligible ({normallyEligibleCount})</option>
              {fallbackCount > 0 && (
                <option value="Fallback Included">Fallback Included ({fallbackCount})</option>
              )}
              <option value="Ineligible">Ineligible / Restricted ({ineligibleCount})</option>
              <option value="Data unavailable">Data unavailable / Pending ({unavailableCount})</option>
            </select>

            {/* Technical Rating Filter */}
            <select
              id="candidate-technical-filter"
              value={technicalFilter}
              onChange={(e) => setTechnicalFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">All Ratings</option>
              <option value="Constructive">Constructive (Score 3–4)</option>
              <option value="Mixed">Mixed (Score 2)</option>
              <option value="Caution">Caution (Score 0–1)</option>
              <option value="Data unavailable">Data unavailable</option>
            </select>

            {/* Category Filter */}
            <select
              id="candidate-category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">All Categories</option>
              {categoryStats.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Candidate Screening Table */}
        <div id="candidate-screening-table-container" className="overflow-x-auto">
          <table id="candidate-screening-table" className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                {renderSortHeader('category', 'Category')}
                {renderSortHeader('ticker', 'Ticker')}
                {renderSortHeader('company', 'Company Name')}
                {renderSortHeader('latestPrice', 'Latest Price', 'right')}
                {renderSortHeader('smaComparison', 'SMA50 vs SMA200', 'center')}
                {renderSortHeader('macdStatus', 'MACD Status', 'center')}
                {renderSortHeader('rsi14', 'RSI 14', 'right')}
                {renderSortHeader('trailing60Return', '60D Return', 'right')}
                {renderSortHeader('annualizedVolatility', 'Ann. Vol.', 'right')}
                {renderSortHeader('technicalScore', 'Tech Score', 'center')}
                {renderSortHeader('eligibility', 'Eligibility', 'center')}
                <th className="py-3 px-3 text-center text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
                  Inspect
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredAndSortedCandidates.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500 bg-slate-50/40">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-slate-400 mb-2" />
                      <p className="font-semibold text-slate-700">No candidate stocks match the current filter criteria.</p>
                      <p className="text-xs text-slate-400 mt-1">Try resetting the search or category filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedCandidates.map((c) => {
                  const isExpanded = expandedTicker === c.ticker;

                  return (
                    <React.Fragment key={c.ticker}>
                      <tr
                        id={`screening-row-${c.ticker}`}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          c.eligibility === 'Eligible'
                            ? 'bg-emerald-50/15'
                            : c.eligibility === 'Ineligible'
                            ? 'bg-lime-50/15'
                            : ''
                        }`}
                      >
                        {/* Category */}
                        <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                          <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                            {c.category}
                          </span>
                        </td>

                        {/* Ticker */}
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {c.ticker}
                        </td>

                        {/* Company Name */}
                        <td className="py-3 px-3.5 text-slate-800 font-medium whitespace-nowrap max-w-xs truncate">
                          {c.company}
                        </td>

                        {/* Latest Price */}
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatPrice(c.latestPrice)}
                        </td>

                        {/* SMA50 vs SMA200 */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {c.smaComparisonLabel === 'Above' ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                              title={`SMA50 ($${c.sma50?.toFixed(2)}) > SMA200 ($${c.sma200?.toFixed(2)})`}
                            >
                              <span>Above</span>
                            </span>
                          ) : c.smaComparisonLabel === 'Below' ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-950 border border-emerald-300"
                              title={`SMA50 ($${c.sma50?.toFixed(2)}) < SMA200 ($${c.sma200?.toFixed(2)})`}
                            >
                              <span>Below</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-medium">Data unavailable</span>
                          )}
                        </td>

                        {/* MACD Status */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {c.macdStatusLabel === 'Bullish' ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                              title={`MACD Line (${c.macd?.toFixed(3)}) > Signal (${c.macdSignal?.toFixed(3)})`}
                            >
                              <span>Bullish</span>
                            </span>
                          ) : c.macdStatusLabel === 'Bearish' ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-950 border border-emerald-300"
                              title={`MACD Line (${c.macd?.toFixed(3)}) < Signal (${c.macdSignal?.toFixed(3)})`}
                            >
                              <span>Bearish</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-medium">Data unavailable</span>
                          )}
                        </td>

                        {/* RSI 14 */}
                        <td className="py-3 px-3.5 text-right font-mono whitespace-nowrap">
                          {c.rsi14 !== null ? (
                            <span
                              className={`font-semibold ${
                                c.rsi14 >= 45 && c.rsi14 <= 70
                                  ? 'text-emerald-700'
                                  : 'text-emerald-950'
                              }`}
                              title={
                                c.rsi14 >= 45 && c.rsi14 <= 70
                                  ? 'Qualifies for RSI point (45 <= RSI <= 70)'
                                  : c.rsi14 > 70
                                  ? 'Overbought (>70)'
                                  : 'Oversold/Weak (<45)'
                              }
                            >
                              {c.rsi14.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* 60-Day Return */}
                        <td className="py-3 px-3.5 text-right font-mono whitespace-nowrap">
                          {c.trailing60Return !== null ? (
                            <span
                              className={`font-semibold ${
                                c.trailing60Return > 0
                                  ? 'text-emerald-700'
                                  : c.trailing60Return < 0
                                  ? 'text-emerald-950'
                                  : 'text-slate-800'
                              }`}
                            >
                              {formatPercent(c.trailing60Return, true)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Annualized Volatility */}
                        <td className="py-3 px-3.5 text-right font-mono text-slate-800 whitespace-nowrap">
                          {c.annualizedVolatility !== null ? (
                            formatPercent(c.annualizedVolatility)
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Technical Score (0-4) */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {c.technicalScore !== null ? (
                            <div className="inline-flex flex-col items-center">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                                    c.technicalScore >= 3
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                      : c.technicalScore === 2
                                      ? 'bg-emerald-200/70 text-emerald-950 border border-emerald-300'
                                      : 'bg-lime-100 text-lime-950 border border-lime-300'
                                  }`}
                                >
                                  {c.technicalScore} / 4
                                </span>
                              </div>
                              <div className="mt-0.5">{getTechnicalLabelBadge(c.technicalLabel)}</div>
                            </div>
                          ) : (
                            <div className="text-slate-400 text-[11px]">
                              <span>-</span>
                            </div>
                          )}
                        </td>

                        {/* Eligibility Status */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {getEligibilityBadge(c.eligibility)}
                        </td>

                        {/* Inspect Details Toggle */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setExpandedTicker(isExpanded ? null : c.ticker)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            title="Inspect 4-point calculation checklist"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Score Breakdown Detail Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={12} className="p-4">
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
                              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm">
                                    {c.ticker} ({c.company}) — Technical Score Proof &amp; Component Audit
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    ({c.validBarCount} Daily Bars Analyzed)
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-600">Calculated Score:</span>
                                  <span className="font-mono font-bold px-2 py-0.5 bg-slate-100 text-slate-900 rounded border border-slate-300">
                                    {c.technicalScore ?? 'N/A'} / 4 Points
                                  </span>
                                  {getEligibilityBadge(c.eligibility)}
                                </div>
                              </div>

                              {c.scoreBreakdown ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                  {/* Rule 1 */}
                                  <div
                                    className={`p-3 rounded-lg border ${
                                      c.scoreBreakdown.priceAboveSma200
                                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                        : 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between font-bold">
                                      <span>1. Price &gt; SMA 200</span>
                                      <span className="font-mono text-xs">
                                        {c.scoreBreakdown.priceAboveSma200 ? '+1 Pt' : '0 Pt'}
                                      </span>
                                    </div>
                                    <div className="mt-2 text-[11px] space-y-1 font-mono">
                                      <div>Latest Close: {formatPrice(c.latestPrice)}</div>
                                      <div>SMA 200: {formatPrice(c.sma200)}</div>
                                    </div>
                                    <div className="mt-2 text-[10px] font-sans font-semibold">
                                      {c.scoreBreakdown.priceAboveSma200
                                        ? '✓ Price is trading above 200 SMA'
                                        : '✗ Price is trading below 200 SMA'}
                                    </div>
                                  </div>

                                  {/* Rule 2 */}
                                  <div
                                    className={`p-3 rounded-lg border ${
                                      c.scoreBreakdown.sma50AboveSma200
                                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                        : 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between font-bold">
                                      <span>2. SMA 50 &gt; SMA 200</span>
                                      <span className="font-mono text-xs">
                                        {c.scoreBreakdown.sma50AboveSma200 ? '+1 Pt' : '0 Pt'}
                                      </span>
                                    </div>
                                    <div className="mt-2 text-[11px] space-y-1 font-mono">
                                      <div>SMA 50: {formatPrice(c.sma50)}</div>
                                      <div>SMA 200: {formatPrice(c.sma200)}</div>
                                    </div>
                                    <div className="mt-2 text-[10px] font-sans font-semibold">
                                      {c.scoreBreakdown.sma50AboveSma200
                                        ? '✓ Golden Cross confirmed (SMA50 > SMA200)'
                                        : '✗ Death Cross regime (SMA50 < SMA200)'}
                                    </div>
                                  </div>

                                  {/* Rule 3 */}
                                  <div
                                    className={`p-3 rounded-lg border ${
                                      c.scoreBreakdown.macdAboveSignal
                                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                        : 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between font-bold">
                                      <span>3. MACD &gt; Signal</span>
                                      <span className="font-mono text-xs">
                                        {c.scoreBreakdown.macdAboveSignal ? '+1 Pt' : '0 Pt'}
                                      </span>
                                    </div>
                                    <div className="mt-2 text-[11px] space-y-1 font-mono">
                                      <div>MACD: {c.macd !== null ? c.macd.toFixed(3) : '-'}</div>
                                      <div>Signal: {c.macdSignal !== null ? c.macdSignal.toFixed(3) : '-'}</div>
                                    </div>
                                    <div className="mt-2 text-[10px] font-sans font-semibold">
                                      {c.scoreBreakdown.macdAboveSignal
                                        ? '✓ Positive MACD momentum crossover'
                                        : '✗ Bearish MACD momentum posture'}
                                    </div>
                                  </div>

                                  {/* Rule 4 */}
                                  <div
                                    className={`p-3 rounded-lg border ${
                                      c.scoreBreakdown.rsiInRange
                                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                                        : 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between font-bold">
                                      <span>4. RSI In Range (45–70)</span>
                                      <span className="font-mono text-xs">
                                        {c.scoreBreakdown.rsiInRange ? '+1 Pt' : '0 Pt'}
                                      </span>
                                    </div>
                                    <div className="mt-2 text-[11px] space-y-1 font-mono">
                                      <div>RSI 14: {c.rsi14 !== null ? c.rsi14.toFixed(2) : '-'}</div>
                                      <div>Target: [45.00, 70.00]</div>
                                    </div>
                                    <div className="mt-2 text-[10px] font-sans font-semibold">
                                      {c.scoreBreakdown.rsiInRange
                                        ? '✓ RSI within constructive bullish band'
                                        : c.rsi14 !== null && c.rsi14 > 70
                                        ? '✗ RSI overbought (>70)'
                                        : '✗ RSI oversold or weak (<45)'}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3 bg-slate-100 rounded text-slate-600 text-xs">
                                  Historical price data for {c.ticker} has not been loaded yet. Please click &quot;Load Portfolio Historical Data&quot; in the Data Access section above.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Summary Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-700" />
            <span>Deterministic Scoring: All 20 stocks displayed transparently without model bias or arbitrary omissions.</span>
          </div>
          <span className="font-mono text-slate-500">
            Eligibility Hurdle: Score &ge; 2 / 4 ({totalEligibleCount} of {totalCandidates} Passing{fallbackCount > 0 ? `, incl. ${fallbackCount} fallback` : ''})
          </span>
        </div>
      </div>
    </section>
  );
};
