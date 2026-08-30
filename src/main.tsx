import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Re-export immutable configuration objects, client functions & technical indicators
export { PORTFOLIO_UNIVERSE, BENCHMARK } from './config.ts';
export { fetchDailyHistory } from './services/twelveData.ts';
export { loadPortfolioHistoryBatch, MIN_REQUIRED_DAILY_BARS } from './services/portfolioLoader.ts';
export {
  calculateSMA,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateTrailingReturn,
  calculateAnnualizedVolatility,
  calculateAllTechnicalMetrics,
  screenCandidate,
  screenAllCandidates,
} from './utils/technicalIndicators.ts';
export {
  calculateDailyReturns,
  alignReturnSeries,
  calculateCovarianceMatrix,
  calculateCorrelationMatrix,
  calculateEqualWeightPortfolioReturns,
  calculatePortfolioPerformance,
  alignBenchmarkReturns,
  evaluatePortfolioReadiness,
} from './utils/portfolioMath.ts';
export {
  projectOntoCappedSimplex,
  solveMinimumVariancePGD,
  validateOptimizedWeights,
  runPortfolioOptimizer,
  TOTAL_PORTFOLIO_CAPITAL,
  MAX_WEIGHT_CONSTRAINT,
} from './utils/portfolioOptimizer.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

