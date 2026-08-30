import React from 'react';
import { FileText, AlertCircle, Clock, UserCheck } from 'lucide-react';

export const ExecutiveCommentary: React.FC = () => {
  return (
    <section id="executive-commentary-section" className="mb-8">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Memo Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="commentary-heading" className="text-lg font-bold text-slate-900">
                Executive Commentary &amp; Strategy Memo
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                Investment Committee Note
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Qualitative overview of market conditions, momentum rotations, and portfolio adjustments
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Status: Pending Review</span>
            </span>
          </div>
        </div>

        {/* Memo Details */}
        <div className="p-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <div id="executive-commentary-status-text" className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Not loaded yet</span>
            </div>
            <p className="text-sm text-slate-600 mt-2 max-w-xl leading-relaxed">
              Formal executive commentary and qualitative market regime observations will be available once the quantitative portfolio review and risk-budgeting simulations are finalized.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 border-t border-slate-200 pt-3 w-full max-w-md">
              <span>Target Memo Topics:</span>
              <span className="text-slate-600">• Factor Rotations</span>
              <span className="text-slate-600">• Volatility Regimes</span>
              <span className="text-slate-600">• Rebalance Rationale</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
