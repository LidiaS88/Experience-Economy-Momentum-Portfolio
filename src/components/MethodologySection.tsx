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
              <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded">
                <Target className="w-4 h-4" />
              </div>
              <h3>1. The Investment Thesis</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              The portfolio captures structural consumer spending migration from physical goods to real-world experiences. 
              The eligible universe comprises established equities across five core segments: 
              <strong className="text-slate-800"> Airlines</strong>, 
              <strong className="text-slate-800"> Hotels, Lodging and Resorts</strong>, 
              <strong className="text-slate-800"> Booking and Travel Platforms</strong>, 
              <strong className="text-slate-800"> Cruises, Events, and Leisure</strong>, and 
              <strong className="text-slate-800"> Entertainment, Dining, and Payments</strong>.
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
              Equities are evaluated against eight quantitative technical rules and eligibility criteria:
            </p>
            <ul className="text-xs text-slate-600 mt-2 space-y-1 list-disc list-inside">
              <li><strong className="text-slate-700">1. Data Sufficiency:</strong> At least 252 valid daily price bars are required.</li>
              <li><strong className="text-slate-700">2. Trend Verification:</strong> Latest close must be above the 200-day SMA.</li>
              <li><strong className="text-slate-700">3. Moving Average Alignment:</strong> 50-day SMA must be above the 200-day SMA.</li>
              <li><strong className="text-slate-700">4. MACD Momentum:</strong> MACD(12, 26, 9) must be above its signal line.</li>
              <li><strong className="text-slate-700">5. RSI Range:</strong> RSI(14) must be between 45 and 70 inclusive.</li>
              <li><strong className="text-slate-700">6. Technical Score:</strong> Each passed rule earns one point, for a technical score from 0 to 4.</li>
              <li><strong className="text-slate-700">7. Eligibility Gate:</strong> A holding is &ldquo;Eligible&rdquo; when it has sufficient data and technical score &ge; 2.</li>
              <li><strong className="text-slate-700">8. Fallback Inclusion:</strong> If fewer than 10 holdings are eligible, the optimizer adds the highest-scoring data-sufficient candidates as clearly labeled &ldquo;Fallback included&rdquo; holdings.</li>
            </ul>
          </div>

          {/* Pillar 3: Minimum-Variance Optimization */}
          <div id="methodology-pillar-optimization" className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 mb-2">
              <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded">
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
              <div className="p-1.5 bg-lime-100 text-lime-900 rounded">
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
