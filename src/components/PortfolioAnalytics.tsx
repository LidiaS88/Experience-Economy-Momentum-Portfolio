import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Compass,
  AlertCircle,
  LineChart as LineChartIcon,
  Shield,
  Activity,
  ArrowDownRight,
  Sparkles,
  PieChart as PieIcon,
  Grid,
  Info,
  Scale,
  Maximize2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  OptimizationResult,
  SymbolDataMap,
  CandidateScreeningItem,
} from '../types';
import { MAX_WEIGHT_CONSTRAINT } from '../utils/portfolioOptimizer';

interface PortfolioAnalyticsProps {
  optimizationResult: OptimizationResult;
  screeningItems: CandidateScreeningItem[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Live Events': '#047857', // Deep Emerald
  'Travel': '#10b981',      // Vivid Emerald
  'Wellness': '#34d399',    // Mint Green
  'Streaming': '#065f46',   // Forest Green
  'Dining': '#84cc16',      // Olive / Lime Green
};

const SIGNAL_COLORS = {
  'Constructive': '#10b981', // Vivid Emerald
  'Mixed': '#84cc16',        // Lime/Sage Green
  'Caution': '#064e3b',      // Deep Forest Pine
};

export const PortfolioAnalytics: React.FC<PortfolioAnalyticsProps> = ({
  optimizationResult,
  screeningItems,
}) => {
  const [selectedCorrelationPair, setSelectedCorrelationPair] = useState<{
    tickerA: string;
    tickerB: string;
    value: number;
  } | null>(null);

  const isDataAvailable =
    optimizationResult.status !== 'No Data' &&
    optimizationResult.status !== 'Insufficient Holdings' &&
    optimizationResult.cumulativeSeries.length > 0;

  // 1. Prepare Weight Distribution Chart Data
  const weightChartData = useMemo(() => {
    return optimizationResult.holdings.map((h) => {
      const primaryCat = h.category.split(',')[0].trim();
      const color = CATEGORY_COLORS[primaryCat] || '#6366f1';
      return {
        ticker: h.ticker,
        company: h.company,
        category: primaryCat,
        weight: Number((h.weight * 100).toFixed(2)),
        weightRaw: h.weight,
        dollarAllocation: h.dollarAllocation,
        technicalScore: h.technicalScore,
        fill: color,
      };
    });
  }, [optimizationResult.holdings]);

  // 2. Prepare Technical-Signal Distribution Data (Donut Chart)
  const signalDistributionData = useMemo(() => {
    const counts = { Constructive: 0, Mixed: 0, Caution: 0 };
    for (const h of optimizationResult.holdings) {
      if (h.signalStatus in counts) {
        counts[h.signalStatus as keyof typeof counts]++;
      }
    }

    const total = optimizationResult.holdings.length;
    return [
      {
        name: 'Constructive',
        value: counts.Constructive,
        percentage: total > 0 ? ((counts.Constructive / total) * 100).toFixed(1) : '0',
        color: SIGNAL_COLORS.Constructive,
      },
      {
        name: 'Mixed',
        value: counts.Mixed,
        percentage: total > 0 ? ((counts.Mixed / total) * 100).toFixed(1) : '0',
        color: SIGNAL_COLORS.Mixed,
      },
      {
        name: 'Caution',
        value: counts.Caution,
        percentage: total > 0 ? ((counts.Caution / total) * 100).toFixed(1) : '0',
        color: SIGNAL_COLORS.Caution,
      },
    ].filter((d) => d.value > 0);
  }, [optimizationResult.holdings]);

  // 3. Correlation Heatmap Color Calculator
  const getCorrelationColor = (val: number) => {
    if (isNaN(val)) return 'bg-emerald-50 text-emerald-600';
    if (val === 1.0) return 'bg-emerald-800 text-white font-bold';

    if (val >= 0.7) return 'bg-emerald-700 text-white font-semibold';
    if (val >= 0.5) return 'bg-emerald-600 text-white font-semibold';
    if (val >= 0.3) return 'bg-emerald-400 text-emerald-950 font-medium';
    if (val >= 0.1) return 'bg-emerald-200 text-emerald-950';
    if (val >= -0.1) return 'bg-emerald-100 text-emerald-900';
    if (val >= -0.3) return 'bg-emerald-50 text-emerald-800';
    if (val >= -0.5) return 'bg-[#d1fae5] text-emerald-900 font-semibold';
    return 'bg-emerald-300 text-emerald-950 font-bold';
  };

  const corrMatrixResult = optimizationResult.correlationMatrix;

  return (
    <section id="portfolio-analytics-section" className="mb-8">
      {/* Section Heading */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 id="analytics-heading" className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Portfolio Analytics, Visualizations &amp; Risk Heatmap</span>
            <span className="text-xs font-normal text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Interactive Quantitative Dashboard
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Cumulative indexed returns (base 100), asset weight distribution, technical signal composition, and correlation matrix
          </p>
        </div>
      </div>

      {!isDataAvailable ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <div className="max-w-md mx-auto flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <LineChartIcon className="w-6 h-6" />
            </div>
            <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-lime-600" />
              <span>Historical Time Series Not Ingested</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Load historical market data with your Twelve Data API key above to render live cumulative performance trajectories, asset weight charts, signal distributions, and covariance heatmaps.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Cumulative Indexed Performance Chart (Requirement 3: Base 100 Line Chart) */}
          <div
            id="chart-pane-cumulative-return"
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>Cumulative Indexed Portfolio Performance (Base = 100.00)</span>
                  <span className="text-xs font-normal text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 font-mono">
                    Common Evaluation Window
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Trajectory comparison of Min-Variance Portfolio vs. 1/N Equal-Weight Baseline and S&amp;P 500 (SPY)
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                  <span className="w-3 h-0.5 bg-emerald-800 inline-block rounded" />
                  <span>Min-Variance</span>
                </span>
                <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                  <span className="w-3 h-0.5 bg-emerald-500 inline-block rounded" />
                  <span>Equal-Weight</span>
                </span>
                <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                  <span className="w-3 h-0.5 bg-lime-600 inline-block rounded" />
                  <span>SPY S&amp;P 500</span>
                </span>
              </div>
            </div>

            {/* Line Chart Container */}
            <div className="h-[320px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={optimizationResult.cumulativeSeries}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#d4eedd" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#226238' }}
                    tickFormatter={(val) => {
                      if (!val) return '';
                      const parts = val.split('-');
                      return parts.length >= 2 ? `${parts[1]}/${parts[0].slice(2)}` : val;
                    }}
                    minTickGap={30}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fill: '#226238' }}
                    tickFormatter={(val) => `${val.toFixed(0)}`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-emerald-950 text-white p-3 rounded-lg shadow-lg border border-emerald-800 text-xs font-mono">
                            <div className="font-sans font-bold text-emerald-200 border-b border-emerald-800 pb-1 mb-1.5">
                              Trading Date: {label}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-4 text-emerald-300">
                                <span>Min-Variance Index:</span>
                                <span className="font-bold">{data.minVarIndex.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-emerald-400">
                                <span>Equal-Weight Index:</span>
                                <span className="font-bold">{data.equalWeightIndex.toFixed(2)}</span>
                              </div>
                              {data.spyIndex !== null && (
                                <div className="flex items-center justify-between gap-4 text-lime-300">
                                  <span>SPY Benchmark Index:</span>
                                  <span className="font-bold">{data.spyIndex.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="minVarIndex"
                    name="Min-Variance Portfolio"
                    stroke="#065f46"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="equalWeightIndex"
                    name="Equal-Weight Portfolio"
                    stroke="#10b981"
                    strokeWidth={1.75}
                    strokeDasharray="4 2"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  {optimizationResult.cumulativeSeries.some((p) => p.spyIndex !== null) && (
                    <Line
                      type="monotone"
                      dataKey="spyIndex"
                      name="SPY Benchmark"
                      stroke="#84cc16"
                      strokeWidth={1.75}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Comparison Metrics Matrix */}
            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                  Min-Var Cumulative
                </span>
                <span className="font-bold text-emerald-950 text-sm font-mono">
                  {optimizationResult.minVarPerformance?.cumulativeReturn !== null
                    ? `${(optimizationResult.minVarPerformance!.cumulativeReturn! * 100).toFixed(2)}%`
                    : '-'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                  Min-Var Sharpe (Rf=0%)
                </span>
                <span className="font-bold text-emerald-950 text-sm font-mono">
                  {optimizationResult.minVarPerformance?.sharpeRatio !== null
                    ? optimizationResult.minVarPerformance!.sharpeRatio!.toFixed(2)
                    : '-'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                  Min-Var Max Drawdown
                </span>
                <span className="font-bold text-emerald-800 text-sm font-mono">
                  {optimizationResult.minVarPerformance?.maxDrawdown !== null
                    ? `${(optimizationResult.minVarPerformance!.maxDrawdown! * 100).toFixed(2)}%`
                    : '-'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                  Risk Reduction vs EW
                </span>
                <span className="font-bold text-emerald-700 text-sm font-mono">
                  {optimizationResult.relativeRiskReduction !== null
                    ? `-${optimizationResult.relativeRiskReduction.toFixed(1)}%`
                    : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Grid: Optimized Weights by Ticker & Technical Signal Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 2: Optimized Weights by Ticker (Requirement 3: Weights Bar Chart) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Optimized Portfolio Asset Weights
                  </h3>
                  <p className="text-xs text-slate-500">
                    Individual holding allocations with 20.00% maximum cap constraint
                  </p>
                </div>
                <div className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Max Cap: 20.00%
                </div>
              </div>

              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={weightChartData}
                    margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="ticker"
                      tick={{ fontSize: 11, fontWeight: 'bold', fill: '#1e293b' }}
                    />
                    <YAxis
                      domain={[0, 25]}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <ReferenceLine
                      y={20}
                      stroke="#f43f5e"
                      strokeDasharray="4 4"
                      label={{
                        value: '20% Cap',
                        position: 'top',
                        fill: '#f43f5e',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-lg border border-slate-800 text-xs font-mono">
                              <div className="font-sans font-bold text-slate-200">{d.ticker} - {d.company}</div>
                              <div className="text-[11px] text-slate-400 font-sans">{d.category}</div>
                              <div className="mt-1 pt-1 border-t border-slate-700 flex justify-between gap-3 text-emerald-300">
                                <span>Weight:</span>
                                <span className="font-bold">{d.weight}%</span>
                              </div>
                              <div className="flex justify-between gap-3 text-slate-300">
                                <span>Capital:</span>
                                <span>${d.dollarAllocation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              </div>
                              <div className="flex justify-between gap-3 text-slate-400 text-[10px]">
                                <span>Tech Score:</span>
                                <span>{d.technicalScore} / 4</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="weight" radius={[4, 4, 0, 0]}>
                      {weightChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
                    <span key={cat} className="inline-flex items-center gap-1 text-[11px]">
                      <span className="w-2.5 h-2.5 rounded-xs inline-block" style={{ backgroundColor: color }} />
                      <span>{cat}</span>
                    </span>
                  ))}
                </div>
                <span className="font-mono text-[11px]">N = {optimizationResult.includedCount} assets</span>
              </div>
            </div>

            {/* Chart 3: Technical-Signal Distribution (Requirement 3: Signal Distribution Donut) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Technical Signal Distribution
                  </h3>
                  <p className="text-xs text-slate-500">Momentum &amp; trend alignment across portfolio</p>
                </div>
                <PieIcon className="w-4 h-4 text-emerald-700" />
              </div>

              <div className="h-[180px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={signalDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {signalDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d的的 = payload[0].payload;
                          const d = d的的;
                          return (
                            <div className="bg-slate-900 text-white p-2 rounded shadow text-xs">
                              <span className="font-bold">{d.name}: </span>
                              <span>{d.value} assets ({d.percentage}%)</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 text-xs mt-2 pt-2 border-t border-slate-100">
                {signalDistributionData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                      <span>{s.name} (Score {s.name === 'Constructive' ? '3-4' : s.name === 'Mixed' ? '2' : '0-1'}):</span>
                    </span>
                    <span className="font-bold font-mono text-slate-900">
                      {s.value} ({s.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Correlation Heat Map / Matrix Table (Requirement 3: Correlation Matrix/Heatmap) */}
          {corrMatrixResult && corrMatrixResult.tickers.length > 0 && (
            <div
              id="chart-pane-correlation-matrix"
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Grid className="w-4 h-4 text-emerald-700" />
                    <span>Asset Correlation Matrix &amp; Diversification Heatmap</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pairwise Pearson correlation coefficients calculated over common trading days
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-[11px] text-slate-500">Legend:</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-300 text-emerald-950 text-[10px] font-bold">
                    &le; 0.0 (High Diversification)
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] border border-emerald-300">
                    0.1 - 0.4 (Moderate)
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-bold">
                    &ge; 0.7 (Strong)
                  </span>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-center text-[11px] border-collapse font-mono">
                  <thead>
                    <tr>
                      <th className="p-2 text-left font-bold text-slate-700 uppercase bg-slate-50 border border-slate-200">
                        Ticker
                      </th>
                      {corrMatrixResult.tickers.map((ticker) => (
                        <th
                          key={ticker}
                          className="p-2 font-bold text-slate-800 bg-slate-50 border border-slate-200 min-w-[52px]"
                        >
                          {ticker}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {corrMatrixResult.tickers.map((rowTicker, rowIdx) => (
                      <tr key={rowTicker}>
                        <td className="p-2 font-bold text-left text-slate-900 bg-slate-50 border border-slate-200 whitespace-nowrap">
                          {rowTicker}
                        </td>
                        {corrMatrixResult.tickers.map((colTicker, colIdx) => {
                          const val = corrMatrixResult.correlationMatrix[rowIdx][colIdx];
                          const isSelf = rowIdx === colIdx;

                          return (
                            <td
                              key={`${rowTicker}-${colTicker}`}
                              onClick={() =>
                                setSelectedCorrelationPair({
                                  tickerA: rowTicker,
                                  tickerB: colTicker,
                                  value: val,
                                })
                              }
                              className={`p-1.5 border border-slate-200 cursor-pointer transition-all hover:ring-2 hover:ring-emerald-600 hover:z-10 ${getCorrelationColor(
                                val
                              )}`}
                              title={`${rowTicker} vs ${colTicker}: ${val.toFixed(3)}`}
                            >
                              {isSelf ? '1.00' : val.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Selected Pair Detail Card */}
              {selectedCorrelationPair && (
                <div className="mt-4 p-3 bg-emerald-100/70 border border-emerald-300 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-700" />
                    <span className="font-semibold text-emerald-950">
                      Selected Pair Correlation: {selectedCorrelationPair.tickerA} &harr; {selectedCorrelationPair.tickerB}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-emerald-900 text-sm">
                    {selectedCorrelationPair.value.toFixed(4)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
