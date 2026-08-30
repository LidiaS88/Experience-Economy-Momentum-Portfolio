import React from 'react';
import { BarChart3, TrendingUp, Compass, AlertCircle, LineChart } from 'lucide-react';

export const PortfolioAnalytics: React.FC = () => {
  return (
    <section id="portfolio-analytics-section" className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 id="analytics-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Portfolio Analytics &amp; Benchmark Comparison</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Risk &amp; Return Profile
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Comparative performance, factor exposures, and risk analytics against benchmark indices
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Analytics Pane 1: Performance vs Benchmark Chart Placeholder */}
        <div id="chart-pane-cumulative-return" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Cumulative Return vs. Benchmarks</h3>
              <p className="text-xs text-slate-500">Relative performance vs. S&amp;P 500 (SPY) and Leisure ETF (PEJ)</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                <LineChart className="w-3.5 h-3.5" />
                <span>1-Year Simulation</span>
              </span>
            </div>
          </div>

          <div className="min-h-[220px] bg-slate-50/50 rounded-lg border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div id="analytics-chart-status" className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Not loaded yet</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Comparative return trajectory charts will render upon backtest time series ingestion.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-1.5 bg-slate-50 rounded">
              <span className="text-slate-400 block text-[10px] uppercase">Alpha (Annualized)</span>
              <span className="font-semibold text-slate-500">Not loaded yet</span>
            </div>
            <div className="p-1.5 bg-slate-50 rounded">
              <span className="text-slate-400 block text-[10px] uppercase">Beta vs SPY</span>
              <span className="font-semibold text-slate-500">Not loaded yet</span>
            </div>
            <div className="p-1.5 bg-slate-50 rounded">
              <span className="text-slate-400 block text-[10px] uppercase">Information Ratio</span>
              <span className="font-semibold text-slate-500">Not loaded yet</span>
            </div>
          </div>
        </div>

        {/* Analytics Pane 2: Industry & Factor Breakdown */}
        <div id="chart-pane-industry-allocation" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-900">Sub-Industry Allocation</h3>
              <p className="text-xs text-slate-500">Exposure across experience sectors</p>
            </div>
            <div className="p-1.5 bg-slate-100 rounded text-slate-600">
              <Compass className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="min-h-[220px] bg-slate-50/50 rounded-lg border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div id="industry-breakdown-status" className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Not loaded yet</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sector concentration bars across Live Events, Hospitality, Cruises, and Airlines will display here.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
            <span>Sector Cap: Max 35%</span>
            <span className="text-slate-400">Not loaded yet</span>
          </div>
        </div>
      </div>
    </section>
  );
};
