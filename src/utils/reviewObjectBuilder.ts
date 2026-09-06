import {
  PortfolioReviewObject,
  ReviewHoldingItem,
  SymbolDataMap,
  CandidateScreeningItem,
  OptimizationResult,
  LatestQuotesMap,
  QuoteRefreshSummary,
} from '../types';

export function buildPortfolioReviewObject(
  portfolioDataMap: SymbolDataMap,
  screeningItems: CandidateScreeningItem[],
  optimizationResult: OptimizationResult,
  latestQuotes: LatestQuotesMap,
  quoteRefreshSummary: QuoteRefreshSummary | null
): PortfolioReviewObject {
  const isDataAvailable =
    optimizationResult.status !== 'No Data' &&
    optimizationResult.status !== 'Insufficient Holdings';

  // Helper formatters
  const formatPct = (val: number | null, decimals = 2) => {
    if (val === null || isNaN(val)) return 'N/A';
    return `${(val * 100).toFixed(decimals)}%`;
  };

  const formatCurr = (val: number | null) => {
    if (val === null || isNaN(val)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Collect data failures and issues from portfolioDataMap
  const dataFailuresOrErrors: string[] = [];
  const knownLimitations: string[] = [
    'Pure educational simulation model — not investment advice or fiduciary recommendation.',
    'Historical lookback performance does not guarantee future market returns or risk profiles.',
    'Sample covariance matrices are expected to be positive semidefinite in theory; the dashboard validates usable finite diagonal variances and optimizer constraints.',
    'Sharpe ratio assumes a 0.00% benchmark risk-free rate.',
    'Constrained box boundary w_i <= 20.00% is enforced via Projected Gradient Descent (PGD).',
  ];

  for (const [symbol, record] of Object.entries(portfolioDataMap)) {
    if (record.status === 'failed') {
      dataFailuresOrErrors.push(`${symbol}: Ingestion failed (${record.errorMessage || 'API error'})`);
    } else if (record.status === 'insufficient-data') {
      dataFailuresOrErrors.push(
        `${symbol}: Insufficient price bars (${record.validBarCount} < 252 bars required)`
      );
    }
  }

  if (quoteRefreshSummary && quoteRefreshSummary.errors.length > 0) {
    for (const err of quoteRefreshSummary.errors) {
      dataFailuresOrErrors.push(`Latest Quote Error for ${err.symbol}: ${err.error}`);
    }
  }

  // Holdings formatting
  const formattedHoldings: ReviewHoldingItem[] = optimizationResult.holdings.map((h) => {
    const quote = latestQuotes[h.ticker];
    const hasFreshQuote = quote && quote.status === 'ok' && quote.price !== null;
    const price = hasFreshQuote ? quote.price : h.latestPrice;

    return {
      ticker: h.ticker,
      company: h.company,
      category: h.category,
      inclusionReason: h.inclusionReason,
      technicalScore: h.technicalScore,
      signalStatus: h.signalStatus,
      weightPercentage: formatPct(h.weight, 2),
      dollarAllocation: formatCurr(h.dollarAllocation),
      latestPrice: price !== null ? `$${price.toFixed(2)}` : 'N/A',
      priceSource: hasFreshQuote ? quote.priceLabel : 'Historical Close Price',
    };
  });

  // Category breakdown calculation
  const categoryMap: Record<string, { weight: number; count: number }> = {};
  for (const h of optimizationResult.holdings) {
    const cat = h.category;
    if (!categoryMap[cat]) {
      categoryMap[cat] = { weight: 0, count: 0 };
    }
    categoryMap[cat].weight += h.weight;
    categoryMap[cat].count += 1;
  }

  const categoryAllocations = Object.entries(categoryMap).map(([category, data]) => ({
    category,
    weightPercent: formatPct(data.weight, 2),
    assetCount: data.count,
  }));

  // Fallback assets
  const fallbackAssets = optimizationResult.holdings
    .filter((h) => h.inclusionReason === 'Fallback included')
    .map((h) => `${h.ticker} (${h.company}, Score ${h.technicalScore ?? 'N/A'}/4)`);

  const minVar = optimizationResult.minVarPerformance;
  const ew = optimizationResult.equalWeightPerformance;
  const spy = optimizationResult.benchmarkPerformance;

  return {
    strategy: {
      name: 'Experience Economy Momentum & Minimum-Variance Portfolio',
      thesis:
        'Capturing structural consumer expenditure shifts toward experiential activities (Airlines, Hotels, Lodging and Resorts, Booking and Travel Platforms, Cruises, Events, and Leisure, Entertainment, Dining, and Payments) using a 4-rule technical momentum filter (Price > 200 SMA, 50 SMA > 200 SMA, MACD > Signal, RSI in 40-70) combined with long-only constrained minimum-variance quadratic optimization with a 20% single-holding cap on a $1,000,000 baseline capital model.',
      universeSize: Object.keys(portfolioDataMap).length,
      targetCapital: '$1,000,000.00 USD',
      singleHoldingWeightCap: '20.00%',
      optimizationObjective: 'min (1/2) w^T Σ w subject to sum(w)=1, 0 <= w_i <= 0.20',
    },
    dataSourceStatus: {
      historicalDataStatus: isDataAvailable
        ? `Loaded (${optimizationResult.commonDateCount} common trading days)`
        : 'Incomplete / Awaiting Ingestion',
      commonTradingDaysCount: optimizationResult.commonDateCount,
      startDate: optimizationResult.historyStartDate,
      endDate: optimizationResult.historyEndDate,
      latestQuoteFeedRefreshed: Boolean(quoteRefreshSummary && quoteRefreshSummary.successCount > 0),
      latestQuoteSuccessCount: quoteRefreshSummary?.successCount || 0,
      latestQuoteTotalAttempted: quoteRefreshSummary?.totalAttempted || 0,
      dataFailuresOrErrors,
    },
    holdingsSummary: {
      totalCandidatesScreened: screeningItems.length,
      eligibleHoldingsCount: screeningItems.filter((i) => i.eligibility === 'Eligible').length,
      includedHoldingsCount: optimizationResult.includedCount,
      fallbackCount: optimizationResult.fallbackCount,
      isFallbackActive: optimizationResult.isFallbackActive,
      holdings: formattedHoldings,
    },
    portfolioMetrics: {
      optimizerStatus: optimizationResult.status,
      minVarianceAnnualizedVolatility: formatPct(optimizationResult.minVarianceVolatility, 2),
      equalWeightAnnualizedVolatility: formatPct(optimizationResult.equalWeightVolatility, 2),
      volatilityDelta:
        optimizationResult.volatilityDelta !== null
          ? `${(optimizationResult.volatilityDelta * 100).toFixed(2)}%`
          : 'N/A',
      relativeRiskReductionPercent:
        optimizationResult.relativeRiskReduction !== null
          ? `${optimizationResult.relativeRiskReduction.toFixed(1)}%`
          : 'N/A',
      minVarianceCumulativeReturn: minVar ? formatPct(minVar.cumulativeReturn, 2) : 'N/A',
      minVarianceAnnualizedReturn: minVar ? formatPct(minVar.annualizedReturn, 2) : 'N/A',
      minVarianceSharpeRatio:
        minVar && minVar.sharpeRatio !== null ? minVar.sharpeRatio.toFixed(2) : 'N/A',
      minVarianceMaxDrawdown: minVar ? formatPct(minVar.maxDrawdown, 2) : 'N/A',
    },
    equalWeightComparison: ew
      ? {
          cumulativeReturn: formatPct(ew.cumulativeReturn, 2),
          annualizedReturn: formatPct(ew.annualizedReturn, 2),
          annualizedVolatility: formatPct(ew.annualizedVolatility, 2),
          sharpeRatio: ew.sharpeRatio !== null ? ew.sharpeRatio.toFixed(2) : 'N/A',
          maxDrawdown: formatPct(ew.maxDrawdown, 2),
        }
      : null,
    benchmarkComparison: spy
      ? {
          benchmarkTicker: 'SPY (S&P 500 ETF)',
          cumulativeReturn: formatPct(spy.cumulativeReturn, 2),
          annualizedReturn: formatPct(spy.annualizedReturn, 2),
          annualizedVolatility: formatPct(spy.annualizedVolatility, 2),
          sharpeRatio: spy.sharpeRatio !== null ? spy.sharpeRatio.toFixed(2) : 'N/A',
          maxDrawdown: formatPct(spy.maxDrawdown, 2),
        }
      : null,
    concentrationAndAllocationFlags: {
      maxWeightConstraintPassed: optimizationResult.validation.maxWeightConstraintPassed,
      largestHoldingWeight: formatPct(optimizationResult.validation.largestWeight, 2),
      smallestHoldingWeight: formatPct(optimizationResult.validation.smallestWeight, 2),
      categoryAllocations,
    },
    fallbackInclusionFlags: {
      isFallbackActive: optimizationResult.isFallbackActive,
      fallbackAssetCount: optimizationResult.fallbackCount,
      fallbackAssets,
      fallbackReasonMessage: optimizationResult.isFallbackActive
        ? `Fewer than 10 stocks passed technical momentum filters. Added ${optimizationResult.fallbackCount} highest-scoring candidate(s) to guarantee positive diagonal variances and standard diversification.`
        : 'None (All active holdings met strict 4-factor momentum screening criteria).',
    },
    knownLimitationsAndDataFailures: [
      ...knownLimitations,
      ...(dataFailuresOrErrors.length > 0
        ? [`Ingestion feed exceptions noted: ${dataFailuresOrErrors.join('; ')}`]
        : []),
    ],
  };
}
