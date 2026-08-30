import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Re-export immutable configuration objects & client functions
export { PORTFOLIO_UNIVERSE, BENCHMARK } from './config.ts';
export { fetchDailyHistory } from './services/twelveData.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

