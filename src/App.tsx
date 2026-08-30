/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Header } from './components/Header';
import { PortfolioOverview } from './components/PortfolioOverview';
import { CandidateScreening } from './components/CandidateScreening';
import { OptimizedPortfolio } from './components/OptimizedPortfolio';
import { PortfolioAnalytics } from './components/PortfolioAnalytics';
import { ExecutiveCommentary } from './components/ExecutiveCommentary';
import { MethodologySection } from './components/MethodologySection';

export default function App() {
  return (
    <div id="portfolio-app-root" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. Header with title, subtitle, and educational notice */}
      <Header />

      {/* Main Content Area */}
      <main id="main-dashboard-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
