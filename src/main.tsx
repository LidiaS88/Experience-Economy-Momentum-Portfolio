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
} from './utils/technicalIndicators.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

