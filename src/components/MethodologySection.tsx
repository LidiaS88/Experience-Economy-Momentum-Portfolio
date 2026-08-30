import React from 'react';
import { BookOpen, Compass, Target, Scale, AlertTriangle, ShieldCheck } from 'lucide-react';

export const MethodologySection: React.FC = () => {
  return (
    <section id="methodology-limitations-section" className="mb-12">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h2 id="methodology-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-700" />
              <span>Methodology, Technical Rules &amp; Limitations</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive institutional framework, mathematical optimization specifications, and risk disclosures
            </p>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1: Investment Thesis */}
          <div id="methodology-pillar-thesis" className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 mb-2">
              <div className="p-1.5 bg-blue-100 text-blue-800 rounded">
                <Target className="w-4 h-4" />
              </div>
              <h3>1. The Investment Thesis</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              The portfolio captures structural consumer spending migration from physical goods to real-world experiences. 
              The eligible universe comprises established equities across five core segments: 
              <strong className="text-slate-800"> Live Entertainment &amp; Ticketing</strong>, 
              <strong className="text-slate-800"> Lodging &amp; Boutique Resorts</strong>, 
              <strong className="text-slate-800"> Cruise Operators &amp; Maritime Leisure</strong>, 
              <strong className="text-slate-800"> Airlines &amp; Global Transit</strong>, and 
              <strong className="text-slate-800"> Experiential Dining &amp; Theme Parks</strong>.
            </p>
          </div>

          {/* Pillar 2: Technical Rules & Screening */}
          <div id="methodology-pillar-rules" className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 mb-2">
              <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded">
                <Compass className="w-4 h-4" />
              </div>
              <h3>2. Technical Rules &amp; Momentum Filter</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Equities are evaluated against seven quantitative eligibility and technical screening rules:
            </p>
            <ul className="text-xs text-slate-600 mt-2 space-y-1 list-disc list-inside">
              <li><strong className="text-slate-700">Data Sufficiency:</strong> At least 252 valid daily price bars are required for indicator computation and covariance estimation.</li>
              <li><strong className="text-slate-700">Rule 1 (Price Trend):</strong> Latest close &gt; 200-day SMA.</li>
              <li><strong className="text-slate-700">Rule 2 (Moving Average Cross):</strong> 50-day SMA &gt; 200-day SMA.</li>
              <li><strong className="text-slate-700">Rule 3 (Momentum):</strong> MACD(12, 26, 9) line &gt; MACD signal line.</li>
              <li><strong className="text-slate-700">Rule 4 (Oscillator Band):</strong> RSI-14 is between 45 and 70 inclusive.</li>
              <li><strong className="text-slate-700">Technical Score:</strong> One point awarded per satisfied rule, producing an integer score from 0 to 4.</li>
              <li><strong className="text-slate-700">Eligibility &amp; Fallback:</strong> A stock is Eligible when it has &ge; 252 daily bars and a technical score &ge; 2. If fewer than 10 holdings are eligible, the optimizer transparently includes the highest-scoring data-sufficient fallback candidates and labels them as fallback holdings.</li>
            </ul>
          </div>

          {/* Pillar 3: Minimum-Variance Optimization */}
          <div id="methodology-pillar-optimization" className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 mb-2">
              <div className="p-1.5 bg-indigo-100 text-indigo-800 rounded">
                <Scale className="w-4 h-4" />
              </div>
              <h3>3. Minimum-Variance Optimization &amp; Covariance</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Portfolio allocations avoid arbitrary capitalization weighting by formulating a quadratic risk minimization problem:
            </p>
            <div className="my-2 p-2 bg-white rounded border border-slate-200 font-mono text-[11px] text-slate-800 text-center">
              Minimize: (1/2) wᵀ Σ w &nbsp;|&nbsp; Subject to: Σ wᵢ = 1.0, &nbsp;0.0% ≤ wᵢ ≤ 20.0%
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sample covariance matrices are expected to be positive semidefinite in theory; the dashboard validates usable finite diagonal variances and optimizer constraints via a positive diagonal variance check before running projected gradient descent.
            </p>
          </div>

          {/* Pillar 4: Key Risks & Limitations */}
          <div id="methodology-pillar-risks" className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 mb-2">
              <div className="p-1.5 bg-rose-100 text-rose-800 rounded">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3>4. Key Risks &amp; Model Limitations</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Investors and researchers must consider specific risk factors:
            </p>
            <ul className="text-xs text-slate-600 mt-2 space-y-1 list-disc list-inside">
              <li><strong className="text-slate-700">Historical illustration only:</strong> optimized weights are estimated using the displayed lookback period. Results are in-sample, not an out-of-sample or rolling backtest, and do not indicate future performance.</li>
              <li><strong className="text-slate-700">Discretionary Sensitivity:</strong> Experience spending is highly correlated with disposable income and recessionary cycles.</li>
              <li><strong className="text-slate-700">Exogenous Shocks:</strong> Geopolitical tensions, fuel price spikes, or health emergencies disproportionately impact travel corridors.</li>
              <li><strong className="text-slate-700">Estimation Risk:</strong> Past covariance and momentum relationships may decouple during rapid market regime shifts.</li>
            </ul>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div id="methodology-disclaimer-box" className="p-4 bg-slate-100/75 border-t border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-800">Academic &amp; Research Disclaimer:</strong> This quantitative shell is designed solely for educational modeling and theoretical portfolio construction. All metrics, allocations, and simulations are hypothetical and do not constitute solicitation, recommendation, or investment advice.
          </p>
        </div>
      </div>
    </section>
  );
};
