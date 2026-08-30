/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { DataAccessPanel } from './components/DataAccessPanel';
import { PortfolioDataStatus } from './components/PortfolioDataStatus';
import { UniverseSummary } from './components/UniverseSummary';
import { PortfolioOverview } from './components/PortfolioOverview';
import { CandidateScreening } from './components/CandidateScreening';
import { PortfolioReadiness } from './components/PortfolioReadiness';
import { OptimizedPortfolio } from './components/OptimizedPortfolio';
import { PortfolioAnalytics } from './components/PortfolioAnalytics';
import { ExecutiveCommentary } from './components/ExecutiveCommentary';
import { MethodologySection } from './components/MethodologySection';
import {
  SessionApiKeys,
  SymbolDataMap,
  LatestQuotesMap,
  QuoteRefreshSummary,
  OptimizationResult,
} from './types';
import {
  createInitialSymbolDataMap,
  loadPortfolioHistoryBatch,
  refreshLatestPricesBatch,
} from './services/portfolioLoader';
import { screenAllCandidates } from './utils/technicalIndicators';
import { runPortfolioOptimizer } from './utils/portfolioOptimizer';

export default function App() {
  // Pure in-memory React state for session API keys (never saved to storage/cookies)
  const [apiKeys, setApiKeys] = useState<SessionApiKeys>({
    twelveDataApiKey: '',
    openRouterApiKey: '',
    openRouterModel: '',
  });

  // Pure in-memory React state for portfolio historical market data cache
  const [portfolioDataMap, setPortfolioDataMap] = useState<SymbolDataMap>(createInitialSymbolDataMap);
  const [isLoadingPortfolioData, setIsLoadingPortfolioData] = useState(false);
  const [progressText, setProgressText] = useState('');

  // Pure in-memory state for latest price quote refreshes (separate from historical OHLCV)
  const [latestQuotes, setLatestQuotes] = useState<LatestQuotesMap>({});
  const [isRefreshingQuotes, setIsRefreshingQuotes] = useState(false);
  const [quoteRefreshProgress, setQuoteRefreshProgress] = useState('');
  const [quoteRefreshSummary, setQuoteRefreshSummary] = useState<QuoteRefreshSummary | null>(null);

  const handleUpdateKeys = (updated: Partial<SessionApiKeys>) => {
    setApiKeys((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  const handleClearKeys = () => {
    setApiKeys({
      twelveDataApiKey: '',
      openRouterApiKey: '',
      openRouterModel: '',
    });
  };

  // 1. Batch Historical Daily OHLCV loader
  const handleLoadPortfolioData = async () => {
    if (!apiKeys.twelveDataApiKey.trim() || isLoadingPortfolioData) {
      return;
    }

    setIsLoadingPortfolioData(true);
    setProgressText('Initiating concurrent streams (max 3)...');

    try {
      await loadPortfolioHistoryBatch(
        apiKeys.twelveDataApiKey,
        portfolioDataMap,
        (updatedMap, completed, total) => {
          setPortfolioDataMap(updatedMap);
          setProgressText(`Loaded ${completed} of ${total} symbols.`);
        },
        3
      );
    } catch (err: any) {
      console.error('Error during batch load:', err);
    } finally {
      setIsLoadingPortfolioData(false);
    }
  };

  // 2. Candidate Screening & Technical Scoring
  const screeningItems = useMemo(() => {
    return screenAllCandidates(portfolioDataMap);
  }, [portfolioDataMap]);

  // 3. Minimum-Variance Portfolio Optimizer
  const optimizationResult: OptimizationResult = useMemo(() => {
    return runPortfolioOptimizer(screeningItems, portfolioDataMap);
  }, [screeningItems, portfolioDataMap]);

  // 4. Batch Latest Quotes Refresher (max concurrency 3)
  const handleRefreshLatestPrices = async () => {
    if (!apiKeys.twelveDataApiKey.trim() || isRefreshingQuotes) {
      return;
    }

    // Determine target tickers to refresh
    const targetTickers =
      optimizationResult.holdings.length > 0
        ? optimizationResult.holdings.map((h) => h.ticker)
        : Object.keys(portfolioDataMap);

    if (targetTickers.length === 0) return;

    setIsRefreshingQuotes(true);
    setQuoteRefreshProgress(`Refreshing 0 of ${targetTickers.length} quotes...`);

    try {
      const summary = await refreshLatestPricesBatch(
        targetTickers,
        apiKeys.twelveDataApiKey,
        (quotesMap, completed, total) => {
          setLatestQuotes((prev) => ({ ...prev, ...quotesMap }));
          setQuoteRefreshProgress(`Refreshing ${completed} of ${total} quotes...`);
        },
        3
      );
      setQuoteRefreshSummary(summary);
    } catch (err: any) {
      console.error('Error refreshing latest quotes:', err);
    } finally {
      setIsRefreshingQuotes(false);
      setQuoteRefreshProgress('');
    }
  };

  const hasTwelveDataKey = Boolean(apiKeys.twelveDataApiKey.trim());

  return (
    <div id="portfolio-app-root" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. Header with title, subtitle, and educational notice */}
      <Header />

      {/* Main Content Area */}
      <main id="main-dashboard-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Data Access Panel near the top of the page */}
        <DataAccessPanel
          apiKeys={apiKeys}
          onUpdateKeys={handleUpdateKeys}
          onClearKeys={handleClearKeys}
        />

        {/* Read-Only Universe Summary (20 stocks, 5 categories, benchmark SPY) */}
        <UniverseSummary />

        {/* Portfolio Historical Data Loader & Status Table */}
        <PortfolioDataStatus
          dataMap={portfolioDataMap}
          isLoading={isLoadingPortfolioData}
          progressText={progressText}
          hasTwelveDataKey={hasTwelveDataKey}
          onLoadData={handleLoadPortfolioData}
        />

        {/* 2. Portfolio Overview Section with KPI Cards & Refresh Latest Prices Action */}
        <PortfolioOverview
          dataMap={portfolioDataMap}
          optimizationResult={optimizationResult}
          latestQuotes={latestQuotes}
          isRefreshingQuotes={isRefreshingQuotes}
          quoteRefreshProgress={quoteRefreshProgress}
          quoteRefreshSummary={quoteRefreshSummary}
          hasTwelveDataKey={hasTwelveDataKey}
          onRefreshLatestPrices={handleRefreshLatestPrices}
        />

        {/* 3. Candidate Screening Section */}
        <CandidateScreening dataMap={portfolioDataMap} />

        {/* 3.5. Portfolio Analysis Readiness & Baseline Validation */}
        <PortfolioReadiness dataMap={portfolioDataMap} />

        {/* 4. Optimized Portfolio Section */}
        <OptimizedPortfolio
          dataMap={portfolioDataMap}
          optimizationResult={optimizationResult}
          latestQuotes={latestQuotes}
          isRefreshingQuotes={isRefreshingQuotes}
          quoteRefreshProgress={quoteRefreshProgress}
          quoteRefreshSummary={quoteRefreshSummary}
          hasTwelveDataKey={hasTwelveDataKey}
          onRefreshLatestPrices={handleRefreshLatestPrices}
        />

        {/* 5. Portfolio Analytics Section (Cumulative Line Chart, Weights Bar Chart, Signal Donut, Correlation Heatmap) */}
        <PortfolioAnalytics
          optimizationResult={optimizationResult}
          screeningItems={screeningItems}
        />

        {/* 6. Executive Commentary Section */}
        <ExecutiveCommentary
          apiKeys={apiKeys}
          onUpdateKeys={handleUpdateKeys}
          portfolioDataMap={portfolioDataMap}
          screeningItems={screeningItems}
          optimizationResult={optimizationResult}
          latestQuotes={latestQuotes}
          quoteRefreshSummary={quoteRefreshSummary}
        />

        {/* 7. Methodology and Limitations Section */}
        <MethodologySection />
      </main>

      {/* Institutional Footer */}
      <footer id="app-footer" className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-medium text-slate-700">
            Experience Economy Momentum Portfolio • Quantitative Minimum-Variance Research Framework
          </p>
          <p className="mt-1 text-slate-400">
            Convex quadratic portfolio optimization with box constraints &bull; Base-100 Cumulative Index &bull; Historical In-Memory Cache
          </p>
        </div>
      </footer>
    </div>
  );
}
