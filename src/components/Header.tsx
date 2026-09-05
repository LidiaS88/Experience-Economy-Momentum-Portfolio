import React from 'react';
import { AlertCircle, ShieldAlert, Sparkles, Sliders } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header id="main-header" className="bg-emerald-50/80 border-b border-emerald-200">
      {/* Top Banner Notice */}
      <div id="educational-notice-bar" className="bg-emerald-100/90 border-b border-emerald-300 px-4 py-2 text-xs text-emerald-950 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 font-medium">
          <ShieldAlert className="w-4 h-4 text-emerald-800 shrink-0" />
          <span>Educational use only — not investment advice. For academic simulation and quantitative demonstration purposes.</span>
        </div>
        <div className="flex items-center gap-3 text-emerald-900 text-[11px]">
          <span className="font-semibold px-2 py-0.5 bg-emerald-200/80 rounded text-emerald-950 border border-emerald-300">
            Model: $1,000,000 USD Benchmark
          </span>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase bg-emerald-200/70 text-emerald-900 rounded border border-emerald-300">
                Quantitative Equity Strategy
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-700 text-emerald-50 rounded border border-emerald-800">
                Momentum + Min-Variance
              </span>
            </div>
            <h1 id="app-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-950">
              Travel & Experience Portfolio Monitor
            </h1>
            <p id="app-subtitle" className="mt-1 text-sm sm:text-base text-emerald-800 max-w-3xl">
              A rules-based, educational portfolio of travel, leisure, and experience-economy equities
            </p>
          </div>

          {/* Quick Status Pill */}
          <div id="header-status-indicator" className="flex items-center gap-2 self-start md:self-auto bg-white/90 border border-emerald-200 rounded-lg p-3 text-xs shadow-xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <div className="font-semibold text-emerald-950">Portfolio Data Status</div>
              <div className="text-emerald-700 font-medium">Data not loaded yet (Awaiting pipeline)</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
