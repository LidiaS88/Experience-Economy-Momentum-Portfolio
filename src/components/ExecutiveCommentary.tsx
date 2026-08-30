import React, { useState, useMemo } from 'react';
import {
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  AlertTriangle,
  Layers,
  TrendingUp,
  HelpCircle,
  Database,
  RefreshCw,
  Sliders,
  XCircle,
} from 'lucide-react';
import {
  SessionApiKeys,
  SymbolDataMap,
  CandidateScreeningItem,
  OptimizationResult,
  LatestQuotesMap,
  QuoteRefreshSummary,
  ExecutiveCommentaryResult,
} from '../types';
import { buildPortfolioReviewObject } from '../utils/reviewObjectBuilder';
import {
  generateExecutiveCommentary,
  POPULAR_OPENROUTER_MODELS,
} from '../services/openRouter';

interface ExecutiveCommentaryProps {
  apiKeys: SessionApiKeys;
  onUpdateKeys: (keys: Partial<SessionApiKeys>) => void;
  portfolioDataMap: SymbolDataMap;
  screeningItems: CandidateScreeningItem[];
  optimizationResult: OptimizationResult;
  latestQuotes: LatestQuotesMap;
  quoteRefreshSummary: QuoteRefreshSummary | null;
}

export const ExecutiveCommentary: React.FC<ExecutiveCommentaryProps> = ({
  apiKeys,
  onUpdateKeys,
  portfolioDataMap,
  screeningItems,
  optimizationResult,
  latestQuotes,
  quoteRefreshSummary,
}) => {
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isCommentaryCopied, setIsCommentaryCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [commentaryResult, setCommentaryResult] =
    useState<ExecutiveCommentaryResult | null>(null);

  // Default model fallback if empty
  const activeModel = apiKeys.openRouterModel.trim() || 'anthropic/claude-3.7-sonnet';

  // Build the review object strictly in-memory from calculated portfolio evidence
  const reviewObject = useMemo(() => {
    return buildPortfolioReviewObject(
      portfolioDataMap,
      screeningItems,
      optimizationResult,
      latestQuotes,
      quoteRefreshSummary
    );
  }, [
    portfolioDataMap,
    screeningItems,
    optimizationResult,
    latestQuotes,
    quoteRefreshSummary,
  ]);

  const isOptimizationReady =
    optimizationResult.status === 'Optimal' ||
    optimizationResult.status === 'Validation Fallback';

  const hasOpenRouterKey = Boolean(apiKeys.openRouterApiKey.trim());
  const hasModelName = Boolean(activeModel.trim());

  // Can generate button condition
  const canGenerate =
    hasOpenRouterKey &&
    hasModelName &&
    isOptimizationReady &&
    hasReviewed &&
    !isGenerating;

  // Handler to copy review object JSON
  const handleCopyReviewObject = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(reviewObject, null, 2));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
      console.warn('Could not copy to clipboard');
    }
  };

  // Handler to copy generated commentary
  const handleCopyCommentary = async () => {
    if (!commentaryResult) return;
    const text = `EXECUTIVE COMMENTARY & STRATEGY MEMO\nModel: ${
      commentaryResult.modelUsed || activeModel
    }\nGenerated: ${new Date(
      commentaryResult.generatedAt || ''
    ).toLocaleString()}\n\n1. PORTFOLIO OVERVIEW:\n${
      commentaryResult.portfolio_overview
    }\n\n2. TECHNICAL SIGNAL SUMMARY:\n${
      commentaryResult.signal_summary
    }\n\n3. PRIMARY RISKS:\n${commentaryResult.primary_risks
      .map((r, i) => `  ${i + 1}. ${r}`)
      .join('\n')}\n\n4. DATA LIMITATIONS:\n${commentaryResult.data_limitations
      .map((l, i) => `  ${i + 1}. ${l}`)
      .join('\n')}\n\n5. INVESTMENT COMMITTEE QUESTIONS:\n${commentaryResult.committee_questions
      .map((q, i) => `  ${i + 1}. ${q}`)
      .join('\n')}`;

    try {
      await navigator.clipboard.writeText(text);
      setIsCommentaryCopied(true);
      setTimeout(() => setIsCommentaryCopied(false), 2000);
    } catch {
      console.warn('Could not copy commentary to clipboard');
    }
  };

  // Handler to call OpenRouter once
  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const result = await generateExecutiveCommentary(
        apiKeys.openRouterApiKey,
        activeModel,
        reviewObject
      );
      setCommentaryResult(result);
    } catch (err: any) {
      setGenerationError(
        err?.message ||
          'Failed to generate executive commentary. Please check your OpenRouter credentials and network connectivity.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section
      id="executive-commentary-section"
      className="mb-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
    >
      {/* Section Header */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/75 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2
              id="commentary-heading"
              className="text-base sm:text-lg font-bold text-slate-900"
            >
              Executive Commentary &amp; Strategy Memo
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Investment Committee Synthesis</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict human-in-the-loop review workflow transforming quantitative
            evidence into institutional committee observations via OpenRouter.
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-xs">
          {commentaryResult ? (
            <span
              id="commentary-status-badge"
              className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-lg border border-emerald-200 font-semibold"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Memo Generated</span>
            </span>
          ) : isOptimizationReady ? (
            <span
              id="commentary-status-badge"
              className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-3 py-1 rounded-lg border border-blue-200 font-medium"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Review Surface Ready</span>
            </span>
          ) : (
            <span
              id="commentary-status-badge"
              className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-lg border border-slate-200"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Awaiting Portfolio Optimization</span>
            </span>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* 1. Structured Review Surface (Human-Inspectable) */}
        <div
          id="portfolio-review-surface"
          className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden"
        >
          {/* Review Surface Header */}
          <div className="p-4 bg-slate-100/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Quantitative Portfolio Review Surface
              </span>
              <p className="text-xs text-slate-500">
                Verify the exact evidence package before generating qualitative committee commentary.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Copy Review Object Button */}
              <button
                id="copy-review-object-button"
                type="button"
                onClick={handleCopyReviewObject}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Copy the exact JSON payload sent to the LLM to clipboard"
              >
                {isCopied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied review object!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy review object</span>
                  </>
                )}
              </button>

              {/* Raw JSON Toggle Button */}
              <button
                id="toggle-raw-json-button"
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <span>{showRawJson ? 'Hide JSON' : 'Inspect JSON'}</span>
                {showRawJson ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Review Surface Highlights Card */}
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Box 1: Strategy & Universe */}
              <div className="p-3.5 bg-white rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-800 pb-1.5 mb-1.5 border-b border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    Strategy &amp; Thesis
                  </span>
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                    $1,000,000 Target
                  </span>
                </div>
                <div className="space-y-1 text-slate-600 leading-relaxed text-[11px]">
                  <p>
                    <span className="font-semibold text-slate-700">Universe:</span>{' '}
                    {reviewObject.holdingsSummary.totalCandidatesScreened} Candidates
                    across 5 Experience Economy categories.
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Holdings:</span>{' '}
                    {reviewObject.holdingsSummary.includedHoldingsCount} Included (
                    {reviewObject.holdingsSummary.eligibleHoldingsCount} Met 4/4 Technical
                    Rules, {reviewObject.holdingsSummary.fallbackCount} Fallback).
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Weight Cap:</span>{' '}
                    Max 20.00% single holding (Constraint Passed:{' '}
                    {reviewObject.concentrationAndAllocationFlags
                      .maxWeightConstraintPassed ? (
                      <span className="text-emerald-700 font-semibold">Yes</span>
                    ) : (
                      <span className="text-rose-700 font-semibold">No</span>
                    )}
                    ).
                  </p>
                </div>
              </div>

              {/* Box 2: Data Status & Sample Window */}
              <div className="p-3.5 bg-white rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-800 pb-1.5 mb-1.5 border-b border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    Data Feeds &amp; History
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                    {reviewObject.dataSourceStatus.commonTradingDaysCount} Common Days
                  </span>
                </div>
                <div className="space-y-1 text-slate-600 leading-relaxed text-[11px]">
                  <p>
                    <span className="font-semibold text-slate-700">Sample Range:</span>{' '}
                    {reviewObject.dataSourceStatus.startDate || 'N/A'} to{' '}
                    {reviewObject.dataSourceStatus.endDate || 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Latest Quotes:</span>{' '}
                    {reviewObject.dataSourceStatus.latestQuoteFeedRefreshed ? (
                      <span className="text-emerald-700 font-semibold">
                        Refreshed ({reviewObject.dataSourceStatus.latestQuoteSuccessCount}/
                        {reviewObject.dataSourceStatus.latestQuoteTotalAttempted})
                      </span>
                    ) : (
                      <span className="text-slate-500">Historical Daily Close</span>
                    )}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Data Exceptions:</span>{' '}
                    {reviewObject.dataSourceStatus.dataFailuresOrErrors.length === 0 ? (
                      <span className="text-emerald-700 font-semibold">0 Failures</span>
                    ) : (
                      <span className="text-amber-700 font-semibold">
                        {reviewObject.dataSourceStatus.dataFailuresOrErrors.length} Issue(s)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Box 3: Metrics vs Benchmarks */}
              <div className="p-3.5 bg-white rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-800 pb-1.5 mb-1.5 border-b border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                    Key Risk Comparisons
                  </span>
                  <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                    {reviewObject.portfolioMetrics.optimizerStatus}
                  </span>
                </div>
                <div className="space-y-1 text-slate-600 leading-relaxed text-[11px]">
                  <p>
                    <span className="font-semibold text-slate-700">Min-Var Volatility:</span>{' '}
                    <span className="font-mono text-emerald-800 font-bold">
                      {reviewObject.portfolioMetrics.minVarianceAnnualizedVolatility}
                    </span>{' '}
                    (vs {reviewObject.portfolioMetrics.equalWeightAnnualizedVolatility} EW,{' '}
                    <span className="text-emerald-700 font-semibold">
                      {reviewObject.portfolioMetrics.relativeRiskReductionPercent} reduction
                    </span>
                    )
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Min-Var Sharpe:</span>{' '}
                    <span className="font-mono text-slate-900 font-semibold">
                      {reviewObject.portfolioMetrics.minVarianceSharpeRatio}
                    </span>{' '}
                    (vs {reviewObject.equalWeightComparison?.sharpeRatio ?? 'N/A'} EW,{' '}
                    {reviewObject.benchmarkComparison?.sharpeRatio ?? 'N/A'} SPY)
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Max Drawdown:</span>{' '}
                    <span className="font-mono text-slate-900">
                      {reviewObject.portfolioMetrics.minVarianceMaxDrawdown}
                    </span>{' '}
                    (vs {reviewObject.equalWeightComparison?.maxDrawdown ?? 'N/A'} EW)
                  </p>
                </div>
              </div>
            </div>

            {/* Holdings & Weight Breakdown Mini-Table */}
            {reviewObject.holdingsSummary.holdings.length > 0 && (
              <div className="mt-3 bg-white rounded-lg border border-slate-200 overflow-x-auto">
                <div className="p-2.5 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center justify-between">
                  <span>Included Portfolio Holdings &amp; $1,000,000 Allocations</span>
                  <span className="text-slate-500 font-normal">
                    {reviewObject.holdingsSummary.includedHoldingsCount} assets
                  </span>
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] uppercase font-semibold text-slate-500">
                      <th className="py-2 px-3">Ticker</th>
                      <th className="py-2 px-3">Company &amp; Sector</th>
                      <th className="py-2 px-3">Inclusion Reason</th>
                      <th className="py-2 px-3">Technical Score</th>
                      <th className="py-2 px-3 text-right">Opt. Weight</th>
                      <th className="py-2 px-3 text-right">Allocation ($)</th>
                      <th className="py-2 px-3 text-right">Latest Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {reviewObject.holdingsSummary.holdings.map((h) => (
                      <tr key={h.ticker} className="hover:bg-slate-50/70">
                        <td className="py-1.5 px-3 font-bold font-mono text-slate-900">
                          {h.ticker}
                        </td>
                        <td className="py-1.5 px-3 text-slate-700">
                          <span className="font-medium">{h.company}</span>{' '}
                          <span className="text-slate-400">({h.category})</span>
                        </td>
                        <td className="py-1.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              h.inclusionReason === 'Eligible Technical Pass'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {h.inclusionReason}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 font-mono">
                          {h.technicalScore !== null ? `${h.technicalScore}/4` : 'N/A'} (
                          {h.signalStatus})
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-slate-900">
                          {h.weightPercentage}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-700">
                          {h.dollarAllocation}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-600">
                          {h.latestPrice}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Expandable Raw JSON Area */}
            {showRawJson && (
              <div
                id="raw-json-review-surface"
                className="mt-4 p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto max-h-96 border border-slate-800"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
                  <span>Exact JSON Payload passed to OpenRouter Model</span>
                  <button
                    onClick={handleCopyReviewObject}
                    className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                  >
                    Copy JSON
                  </button>
                </div>
                <pre>{JSON.stringify(reviewObject, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        {/* 2. OpenRouter Model Selector & Generation Controls */}
        <div
          id="commentary-generation-controls"
          className="p-4 sm:p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. OpenRouter Model &amp; Synthesis Configuration
              </span>
              <p className="text-xs text-slate-500">
                Configure the LLM model to transform the quantitative review into an executive strategy memo.
              </p>
            </div>

            {/* API Key Status Pill */}
            <div className="flex items-center gap-2 text-xs">
              {hasOpenRouterKey ? (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>OpenRouter Key Set</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-800 rounded-md border border-rose-200 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Missing OpenRouter API Key</span>
                </span>
              )}
            </div>
          </div>

          {/* Model selection input & presets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-2 space-y-1.5">
              <label
                htmlFor="commentary-model-input"
                className="block text-xs font-semibold text-slate-700"
              >
                Model Name for Committee Synthesis
              </label>
              <input
                id="commentary-model-input"
                type="text"
                value={apiKeys.openRouterModel}
                onChange={(e) => onUpdateKeys({ openRouterModel: e.target.value })}
                placeholder="e.g., anthropic/claude-3.7-sonnet"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
              />
              {/* Quick model presets chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-slate-500">Presets:</span>
                {POPULAR_OPENROUTER_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onUpdateKeys({ openRouterModel: m.id })}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      activeModel === m.id
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Strict Output Guarantee:</p>
              <p className="text-[11px] leading-relaxed">
                The model is constrained to output structured JSON with zero hallucination of external events or prices.
              </p>
            </div>
          </div>

          {/* 3. Human Review Gate Checkbox */}
          <div
            id="human-review-gate-container"
            className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3 mt-4"
          >
            <input
              id="review-surface-checkbox"
              name="humanReviewConfirmed"
              type="checkbox"
              checked={hasReviewed}
              onChange={(e) => setHasReviewed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <label
              htmlFor="review-surface-checkbox"
              className="text-xs font-medium text-slate-800 leading-relaxed cursor-pointer select-none"
            >
              I have reviewed the portfolio surface and understand this is educational analysis, not investment advice.
            </label>
          </div>

          {/* 4. Action Button & Prerequisites Status */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-slate-500">
              {!isOptimizationReady && (
                <span className="text-amber-700 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Portfolio optimization must be calculated first.
                </span>
              )}
              {isOptimizationReady && !hasOpenRouterKey && (
                <span className="text-amber-700 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Enter OpenRouter API Key in Data Access Panel.
                </span>
              )}
              {isOptimizationReady && hasOpenRouterKey && !hasReviewed && (
                <span className="text-slate-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  Tick the review confirmation checkbox above to enable generation.
                </span>
              )}
              {isOptimizationReady && hasOpenRouterKey && hasReviewed && !isGenerating && (
                <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All requirements satisfied. Ready to synthesize commentary.
                </span>
              )}
            </div>

            <button
              id="generate-commentary-button"
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Executive Commentary...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Executive Commentary</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error notification if API call or parsing failed */}
        {generationError && (
          <div
            id="commentary-error-alert"
            className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900"
          >
            <div className="flex items-start gap-2.5">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-sm text-rose-950">
                  Commentary Generation Failed
                </span>
                <p className="text-rose-800 leading-relaxed font-mono text-[11px]">
                  {generationError}
                </p>
                <p className="text-slate-600 text-[11px] pt-1">
                  The dashboard state and quantitative metrics remain safe and intact. Please verify your OpenRouter API key, model credits, or selected model name and try again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. Rendered Executive Commentary Memo (When Available) */}
        {commentaryResult ? (
          <div
            id="rendered-executive-memo"
            className="bg-white rounded-xl border-2 border-indigo-200 shadow-sm overflow-hidden"
          >
            {/* Memo Top Header */}
            <div className="p-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-500/30 text-indigo-200 rounded border border-indigo-400/30">
                    Confidential
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Investment Committee Strategy Memo
                  </h3>
                </div>
                <p className="text-xs text-indigo-200 mt-1">
                  Synthesized via {commentaryResult.modelUsed || activeModel} •{' '}
                  {commentaryResult.generatedAt
                    ? new Date(commentaryResult.generatedAt).toLocaleString()
                    : 'Current Session'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="copy-commentary-text-button"
                  type="button"
                  onClick={handleCopyCommentary}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-600 border border-indigo-500 rounded-lg transition-colors cursor-pointer"
                >
                  {isCommentaryCopied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Copy Memo</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:text-white bg-indigo-800/60 hover:bg-indigo-800 border border-indigo-700 rounded-lg transition-colors cursor-pointer"
                  title="Re-run synthesis with updated data or model"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-synthesize</span>
                </button>
              </div>
            </div>

            {/* Memo Body Sections */}
            <div className="p-6 space-y-6 text-slate-800">
              {/* Section 1: Portfolio Overview */}
              <div id="memo-portfolio-overview" className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-100 pb-1.5">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>1. Executive Portfolio Overview &amp; Strategic Regime</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-lg border border-slate-200">
                  {commentaryResult.portfolio_overview}
                </p>
              </div>

              {/* Section 2: Technical Signal Summary */}
              <div id="memo-signal-summary" className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900 border-b border-indigo-100 pb-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>2. Technical Momentum &amp; Trend Signal Breakdown</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-lg border border-slate-200">
                  {commentaryResult.signal_summary}
                </p>
              </div>

              {/* Section 3: Primary Portfolio Risks */}
              <div id="memo-primary-risks" className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-900 border-b border-rose-100 pb-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>3. Primary Portfolio Risk Factors &amp; Vulnerabilities</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {commentaryResult.primary_risks.map((risk, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-rose-50/40 rounded-lg border border-rose-200 text-xs text-rose-950 flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-rose-900 mb-1.5">
                        <span className="w-4 h-4 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span>Risk Vector</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-[11px]">{risk}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Data Limitations */}
              <div id="memo-data-limitations" className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 border-b border-amber-100 pb-1.5">
                  <Database className="w-4 h-4 text-amber-600" />
                  <span>4. Data Limitations, Sample Biases &amp; Model Caveats</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {commentaryResult.data_limitations.map((limitation, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-amber-50/40 rounded-lg border border-amber-200 text-xs text-amber-950"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <span>Limitation Factor</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        {limitation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Committee Questions */}
              <div id="memo-committee-questions" className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-blue-100 pb-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>5. Fictional Investment Committee Inquiries &amp; Debate Prompts</span>
                </div>
                <div className="space-y-2.5">
                  {commentaryResult.committee_questions.map((question, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-blue-50/40 rounded-lg border border-blue-200 text-xs text-slate-800 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        Q{idx + 1}
                      </span>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {question}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Memo Footer Compliance Banner */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
              Generated for educational research and quantitative workflow demonstration purposes only. Not investment advice or solicitation.
            </div>
          </div>
        ) : (
          <div
            id="commentary-placeholder-notice"
            className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center flex flex-col items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
              <FileText className="w-6 h-6" />
            </div>
            <h3
              id="executive-commentary-status-text"
              className="text-sm font-bold text-slate-800 flex items-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Awaiting Human Review &amp; Synthesis</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
              Once you inspect the quantitative review surface, ensure your OpenRouter credentials and model are configured, and check the acknowledgment box to generate the executive strategy memo.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
