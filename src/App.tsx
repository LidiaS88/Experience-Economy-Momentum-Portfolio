/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { DataAccessPanel } from './components/DataAccessPanel';
import { PortfolioDataStatus } from './components/PortfolioDataStatus';
import { UniverseSummary } from './components/UniverseSummary';
import { PortfolioOverview } from './components/PortfolioOverview';
import { CandidateScreening } from './components/CandidateScreening';
import { OptimizedPortfolio } from './components/OptimizedPortfolio';
import { PortfolioAnalytics } from './components/PortfolioAnalytics';
import { ExecutiveCommentary } from './components/ExecutiveCommentary';
import { MethodologySection } from './components/MethodologySection';
import { SessionApiKeys, SymbolDataMap } from './types';
import { createInitialSymbolDataMap, loadPortfolioHistoryBatch } from './services/portfolioLoader';

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

        {/* 2. Portfolio Overview Section */}
        <PortfolioOverview />

        {/* 3. Candidate Screening Section */}
        <CandidateScreening />

        {/* 4. Optimized Portfolio Section */}
        <OptimizedPortfolio />

        {/* 5. Portfolio Analytics Section */}
        <PortfolioAnalytics />

        {/* 6. Executive Commentary Section */}
        <ExecutiveCommentary />

        {/* 7. Methodology and Limitations Section */}
        <MethodologySection />
      </main>

      {/* Institutional Footer */}
      <footer id="app-footer" className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-medium text-slate-700">Experience Economy Momentum Portfolio • Educational Quantitative Research Framework</p>
          <p className="mt-1 text-slate-400">All data-driven components are currently in uninitialized placeholder state.</p>
        </div>
      </footer>
    </div>
  );
}
