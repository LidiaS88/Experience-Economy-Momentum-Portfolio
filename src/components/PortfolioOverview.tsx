import React from 'react';
import { DollarSign, Layers, Activity, Database, AlertCircle } from 'lucide-react';

export const PortfolioOverview: React.FC = () => {
  return (
    <section id="portfolio-overview-section" className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 id="overview-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Portfolio Overview</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Key Metrics
            </span>
          </h2>
          <p className="text-xs text-slate-500">Summary metrics for the $1,000,000 baseline investment portfolio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Portfolio Value */}
        <div id="card-portfolio-value" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Portfolio Value</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-400">Not loaded yet</div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
              <span>Target Capital:</span>
              <span className="font-semibold text-slate-700">$1,000,000.00 USD</span>
            </div>
          </div>
        </div>

        {/* Card 2: Eligible Holdings */}
        <div id="card-eligible-holdings" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Eligible Holdings</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-400">Not loaded yet</div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
              <span>Candidate Universe:</span>
              <span className="font-semibold text-slate-700">Top 20 Equities</span>
            </div>
          </div>
        </div>

        {/* Card 3: Annualized Volatility */}
        <div id="card-annualized-volatility" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Annualized Volatility</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-400">Not loaded yet</div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
              <span>Optimization Method:</span>
              <span className="font-semibold text-slate-700">Min-Variance</span>
            </div>
          </div>
        </div>

        {/* Card 4: Data Status */}
        <div id="card-data-status" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Data Feed Status</span>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-amber-600 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              <span>Not loaded yet</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
              <span>Feed State:</span>
              <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                Awaiting Ingestion
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
