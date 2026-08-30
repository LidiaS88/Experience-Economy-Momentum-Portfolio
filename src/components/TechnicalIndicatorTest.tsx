import React from 'react';
import {
  Gauge,
  TrendingUp,
  Activity,
  BarChart2,
  LineChart,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { PriceBar } from '../types';
import { calculateAllTechnicalMetrics } from '../utils/technicalIndicators';

interface TechnicalIndicatorTestProps {
  symbol: string;
  data: PriceBar[];
}

export const TechnicalIndicatorTest: React.FC<TechnicalIndicatorTestProps> = ({ symbol, data }) => {
  const metrics = calculateAllTechnicalMetrics(data);

  // Formatting helpers that preserve precision internally while displaying clean rounded values
  const formatCurrency = (val: number | null): React.ReactNode => {
    if (val === null || isNaN(val)) {
      return <span className="text-amber-700 font-medium text-xs bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Insufficient history</span>;
    }
    return `$${val.toFixed(2)}`;
  };

  const formatNumber = (val: number | null, decimals = 2, withSign = false): React.ReactNode => {
    if (val === null || isNaN(val)) {
      return <span className="text-amber-700 font-medium text-xs bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Insufficient history</span>;
    }
    const sign = withSign && val > 0 ? '+' : '';
    return `${sign}${val.toFixed(decimals)}`;
  };

  const formatPercent = (val: number | null, decimals = 2, withSign = false): React.ReactNode => {
    if (val === null || isNaN(val)) {
      return <span className="text-amber-700 font-medium text-xs bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Insufficient history</span>;
    }
    const percentVal = val * 100;
    const sign = withSign && percentVal > 0 ? '+' : '';
    return `${sign}${percentVal.toFixed(decimals)}%`;
  };

  const isRsiOverbought = metrics.rsi14 !== null && metrics.rsi14 >= 70;
  const isRsiOversold = metrics.rsi14 !== null && metrics.rsi14 <= 30;

  return (
    <div id="technical-indicator-test-section" className="mt-4 pt-4 border-t border-emerald-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 rounded text-emerald-800">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 id="indicator-test-heading" className="text-sm font-bold text-slate-900">
              Technical Indicator Test &amp; Verification ({symbol})
            </h3>
            <p className="text-[11px] text-slate-600">
              Computed in-memory using pure mathematical routines on {data.length} ascending daily price bars
            </p>
          </div>
        </div>

        <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2.5 py-1 rounded border border-emerald-200 self-start sm:self-auto flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>8 Technical Metrics Computed</span>
        </span>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {/* 1. Latest Close */}
        <div id="metric-latest-close" className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-slate-600">Latest Close</span>
            <span className="text-[10px] text-slate-400">Most recent bar</span>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {formatCurrency(metrics.latestClose)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Baseline execution price
          </div>
        </div>

        {/* 2. SMA 50 */}
        <div id="metric-sma-50" className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-slate-600">SMA 50</span>
            <span className="text-[10px] text-slate-400">50-day average</span>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {formatCurrency(metrics.sma50)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Medium-term trend baseline
          </div>
        </div>

        {/* 3. SMA 200 */}
        <div id="metric-sma-200" className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-slate-600">SMA 200</span>
            <span className="text-[10px] text-slate-400">200-day average</span>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {formatCurrency(metrics.sma200)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Long-term eligibility filter gate
          </div>
        </div>

        {/* 4. MACD Line */}
        <div id="metric-macd-line" className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-slate-600">MACD Line</span>
            <span className="text-[10px] text-slate-400">EMA(12) - EMA(26)</span>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {formatNumber(metrics.macd, 3, true)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Fast vs slow momentum spread
          </div>
        </div>

        {/* 5. MACD Signal Line */}
        <div id="metric-macd-signal" className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-slate-600">MACD Signal Line</span>
            <span className="text-[10px] text-slate-400">9-day EMA of MACD</span>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {formatNumber(metrics.macdSignal, 3, true)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Trigger line for trend shifts
          </div>
        </div>

        {/* 6. MACD Histogram */}
        <div id="metric-macd-histogram" className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-slate-600">MACD Histogram</span>
            <span className="text-[10px] text-slate-400">MACD - Signal</span>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {formatNumber(metrics.macdHistogram, 3, true)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Momentum acceleration measure
          </div>
        </div>

        {/* 7. RSI 14 */}
        <div id="metric-rsi-14" className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-slate-600">RSI 14</span>
            <span className="text-[10px] text-slate-400">Wilder Smoothed</span>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
            <span>{formatNumber(metrics.rsi14, 2)}</span>
            {metrics.rsi14 !== null && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                isRsiOverbought
                  ? 'bg-rose-100 text-rose-800'
                  : isRsiOversold
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {isRsiOverbought ? 'Overbought' : isRsiOversold ? 'Oversold' : 'Neutral'}
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Relative strength oscillator (0-100)
          </div>
        </div>

        {/* 8. Trailing 60-Day Return */}
        <div id="metric-trailing-60-return" className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-slate-600">Trailing 60D Return</span>
            <span className="text-[10px] text-slate-400">60 trading days (~3M)</span>
          </div>
          <div className={`text-lg font-bold mt-1 ${
            metrics.trailing60Return !== null && metrics.trailing60Return > 0
              ? 'text-emerald-700'
              : metrics.trailing60Return !== null && metrics.trailing60Return < 0
              ? 'text-rose-700'
              : 'text-slate-900'
          }`}>
            {formatPercent(metrics.trailing60Return, 2, true)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Quarterly momentum ranking factor
          </div>
        </div>

        {/* 9. Annualized Volatility */}
        <div id="metric-annualized-volatility" className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-slate-600">Annualized Volatility</span>
            <span className="text-[10px] text-slate-400">σ_daily × √252</span>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {formatPercent(metrics.annualizedVolatility, 2)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Sample standard deviation of daily returns
          </div>
        </div>
      </div>
    </div>
  );
};
