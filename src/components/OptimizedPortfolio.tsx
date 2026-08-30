import React from 'react';
import { PieChart, SlidersHorizontal, AlertCircle, DollarSign } from 'lucide-react';

export const OptimizedPortfolio: React.FC = () => {
  return (
    <section id="optimized-portfolio-section" className="mb-8">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Section Header */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="optimized-portfolio-heading" className="text-lg font-bold text-slate-900">
                Optimized Portfolio Allocations
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-200">
                $1,000,000 Model
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Constrained minimum-variance weighting with individual position bounds (2.0% min – 10.0% max)
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Optimization: Long-Only Min-Variance</span>
            </span>
          </div>
        </div>

        {/* Model Parameters Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-100/60 border-b border-slate-200 text-xs">
          <div className="px-2 py-1">
            <span className="text-slate-500 block text-[11px]">Target Capital</span>
            <span className="font-semibold text-slate-800">$1,000,000.00</span>
          </div>
          <div className="px-2 py-1">
            <span className="text-slate-500 block text-[11px]">Weight Constraints</span>
            <span className="font-semibold text-slate-800">2.0% Min / 10.0% Max</span>
          </div>
          <div className="px-2 py-1">
            <span className="text-slate-500 block text-[11px]">Optimization Objective</span>
            <span className="font-semibold text-slate-800">Minimize Variance (wᵀΣw)</span>
          </div>
          <div className="px-2 py-1">
            <span className="text-slate-500 block text-[11px]">Allocation Status</span>
            <span className="font-semibold text-amber-700">Not loaded yet</span>
          </div>
        </div>

        {/* Responsive Table Container */}
        <div id="optimized-table-container" className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Ticker</th>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Sub-Industry</th>
                <th className="py-3 px-4 text-right">Target Weight (%)</th>
                <th className="py-3 px-4 text-right">Dollar Allocation ($1M Model)</th>
                <th className="py-3 px-4 text-right">Estimated Shares</th>
                <th className="py-3 px-4 text-right">Risk Contribution</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Empty placeholder state */}
              <tr>
                <td colSpan={8} className="py-12 px-4 text-center bg-slate-50/30">
                  <div className="max-w-md mx-auto flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
                      <PieChart className="w-6 h-6" />
                    </div>
                    <div id="optimized-portfolio-status-text" className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span>Not loaded yet</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed text-center">
                      Portfolio asset weights, share calculations, and dollar values scaled to $1,000,000 will be computed after covariance matrix estimation.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
                      <span>Target Holdings Count: 10 – 15 Active Positions</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>Rebalance Cadence: Monthly / Quarterly Risk Recalibration</span>
          <span className="font-mono text-slate-400">Allocations: Not loaded yet</span>
        </div>
      </div>
    </section>
  );
};
