import React from 'react';
import { Layers, CheckCircle2, TrendingUp, Tag, ShieldCheck } from 'lucide-react';
import { PORTFOLIO_UNIVERSE, BENCHMARK, UNIVERSE_CATEGORIES } from '../config';

export const UniverseSummary: React.FC = () => {
  return (
    <section id="universe-summary-section" className="mb-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/75 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-800">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 id="universe-summary-heading" className="text-base sm:text-lg font-bold text-slate-900">
              Universe &amp; Benchmark Specification
            </h2>
            <p className="text-xs text-slate-500">
              Pre-configured candidate pool and comparative equity benchmark
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Config Verified (Immutable)</span>
          </span>
        </div>
      </div>

      {/* Top Summary Stat Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5 border-b border-slate-200 bg-slate-50/40 text-xs">
        <div id="stat-candidate-stocks" className="p-3 bg-white rounded-lg border border-slate-200">
          <div className="text-slate-500 font-medium">Configured Universe</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">20 candidate stocks</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Liquid experience-economy leaders</div>
        </div>

        <div id="stat-categories" className="p-3 bg-white rounded-lg border border-slate-200">
          <div className="text-slate-500 font-medium">Industry Coverage</div>
          <div className="text-lg font-bold text-slate-900 mt-0.5">five categories</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Diverse sub-sector segmentation</div>
        </div>

        <div id="stat-benchmark" className="p-3 bg-white rounded-lg border border-slate-200">
          <div className="text-slate-500 font-medium">Benchmark Reference</div>
          <div className="text-lg font-bold text-emerald-700 mt-0.5 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>benchmark ticker SPY</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">S&amp;P 500 Broad Market Index</div>
        </div>
      </div>

      {/* Category Breakdown & Tickers Grid */}
      <div className="p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-slate-500" />
          <span>Category Breakdown &amp; Constituent Roster</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {UNIVERSE_CATEGORIES.map((category) => {
            const stocksInCategory = PORTFOLIO_UNIVERSE.filter((s) => s.category === category);
            return (
              <div
                key={category}
                id={`category-card-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="font-bold text-xs text-slate-800">{category}</span>
                    <span className="text-[10px] font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                      {stocksInCategory.length} Stocks
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {stocksInCategory.map((stock) => (
                      <div
                        key={stock.ticker}
                        className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded border border-slate-100"
                      >
                        <span className="font-mono font-bold text-slate-900">{stock.ticker}</span>
                        <span className="text-slate-600 text-[11px] truncate max-w-[150px] text-right">
                          {stock.company}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Benchmark Card */}
          <div
            id="benchmark-card-spy"
            className="p-3.5 bg-emerald-50/60 rounded-lg border border-emerald-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="font-bold text-xs text-emerald-950">Market Benchmark</span>
                <span className="text-[10px] font-semibold bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded text-emerald-900">
                  Primary Baseline
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 px-2.5 bg-white rounded border border-emerald-200 mb-2">
                <span className="font-mono font-bold text-emerald-950">{BENCHMARK.ticker}</span>
                <span className="text-slate-700 text-[11px] font-medium text-right">
                  {BENCHMARK.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Standard baseline used for beta calculation, tracking error estimation, and relative momentum divergence testing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
