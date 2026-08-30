# Experience Economy Momentum & Minimum-Variance Portfolio

A rules-based, educational quantitative portfolio strategy and analytical dashboard modeling travel, leisure, entertainment, and experience-economy equities with a $1,000,000 baseline capital model.

## Overview

- **Universe**: 25 candidate equities across 5 core Experience Economy sectors (Live Events & Ticketing, Travel & Hospitality, Experiential Retail & Wellness, Theme Parks & Cruise Lines, Interactive Media & Streaming).
- **Technical Screening**: 4-rule momentum and trend filter (Price > 200 SMA, 50 SMA > 200 SMA, MACD Line > Signal Line, RSI between 40 and 70).
- **Portfolio Optimization**: Long-only constrained minimum-variance quadratic optimization with a maximum 20.00% single-holding box constraint ($0 \le w_i \le 0.20$, $\sum w_i = 1$) solved via Projected Gradient Descent (PGD).
- **Benchmarking**: Direct comparative analytics against a 1/N Equal-Weight baseline and the SPY (S&P 500 ETF) benchmark.
- **Executive Synthesis**: Human-in-the-loop executive commentary generation powered by OpenRouter.

## Deployment

This application is configured for continuous deployment as a static Single Page Application (SPA) using **GitHub Pages**.

- **Hosting**: Published automatically to GitHub Pages via the official GitHub Actions workflow (`.github/workflows/deploy.yml`) on every push to the `main` branch.
- **Runtime Credentials**: Users must enter their own **Twelve Data** API key (for market data and live quote refreshes) and **OpenRouter** API key (for AI executive commentary synthesis) at runtime in the application UI.
- **Security & Privacy**: No API keys or secrets are stored in the repository, build artifacts, or deployment environment. All keys are held strictly in temporary client session memory.

## Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

## Disclaimer

This dashboard and simulation are provided strictly for educational and research purposes. Nothing within this application constitutes financial advice, investment recommendations, or a fiduciary solicitation.
