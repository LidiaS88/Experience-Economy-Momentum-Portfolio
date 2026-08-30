import React from 'react';
import { Filter, Table, RefreshCw, AlertCircle } from 'lucide-react';

export const CandidateScreening: React.FC = () => {
  return (
    <section id="candidate-screening-section" className="mb-8">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="candidate-screening-heading" className="text-lg font-bold text-slate-900">
                Candidate Screening Universe
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                20-Stock Target
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Screening pipeline across travel, lodging, leisure, live events, airlines, and experiential dining
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200">
              <Filter className="w-3.5 h-3.5" />
              <span>Technical Filter: Price &gt; 200 SMA</span>
            </span>
          </div>
        </div>

        {/* Responsive Table Container */}
        <div id="candidate-table-container" className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Ticker</th>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Sub-Industry</th>
                <th className="py-3 px-4 text-right">3M Mom.</th>
                <th className="py-3 px-4 text-right">6M Mom.</th>
                <th className="py-3 px-4 text-right">12M Mom.</th>
                <th className="py-3 px-4 text-center">200-Day SMA</th>
                <th className="py-3 px-4 text-right">30D Volatility</th>
                <th className="py-3 px-4 text-center">Screen Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Not loaded yet placeholder rows */}
              <tr>
                <td colSpan={10} className="py-12 px-4 text-center bg-slate-50/30">
                  <div className="max-w-md mx-auto flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                      <Table className="w-6 h-6" />
                    </div>
                    <div id="candidate-screening-status-text" className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span>Not loaded yet</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed text-center">
                      The 20-stock candidate screening table will populate once price momentum rankings and technical moving average filters are executed.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
                      <span>Universe: Travel, Lodging, Cruise Lines, Entertainment &amp; Theme Parks</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Table Footer / Summary Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>Target Selection: Top 20 ranked securities by composite relative momentum</span>
          <span className="font-mono text-slate-400">Screening Data: Not loaded yet</span>
        </div>
      </div>
    </section>
  );
};
