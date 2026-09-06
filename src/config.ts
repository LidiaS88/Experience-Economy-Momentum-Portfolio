import { StockCandidate, BenchmarkConfig } from './types';

/**
 * Immutable configuration object defining the 20 stocks in the Experience Economy universe.
 */
export const PORTFOLIO_UNIVERSE: readonly StockCandidate[] = Object.freeze([
  // Airlines
  { ticker: 'DAL', company: 'Delta Air Lines', category: 'Airlines' },
  { ticker: 'UAL', company: 'United Airlines', category: 'Airlines' },
  { ticker: 'LUV', company: 'Southwest Airlines', category: 'Airlines' },
  { ticker: 'ALK', company: 'Alaska Air Group', category: 'Airlines' },

  // Hotels, Lodging and Resorts
  { ticker: 'MAR', company: 'Marriott International', category: 'Hotels, Lodging and Resorts' },
  { ticker: 'HLT', company: 'Hilton Worldwide Holdings', category: 'Hotels, Lodging and Resorts' },
  { ticker: 'H', company: 'Hyatt Hotels', category: 'Hotels, Lodging and Resorts' },
  { ticker: 'MGM', company: 'MGM Resorts International', category: 'Hotels, Lodging and Resorts' },

  // Booking and Travel Platforms
  { ticker: 'BKNG', company: 'Booking Holdings', category: 'Booking and Travel Platforms' },
  { ticker: 'EXPE', company: 'Expedia Group', category: 'Booking and Travel Platforms' },
  { ticker: 'ABNB', company: 'Airbnb', category: 'Booking and Travel Platforms' },
  { ticker: 'TRIP', company: 'Tripadvisor', category: 'Booking and Travel Platforms' },

  // Cruises, Events, and Leisure
  { ticker: 'RCL', company: 'Royal Caribbean Group', category: 'Cruises, Events, and Leisure' },
  { ticker: 'CCL', company: 'Carnival Corporation', category: 'Cruises, Events, and Leisure' },
  { ticker: 'NCLH', company: 'Norwegian Cruise Line Holdings', category: 'Cruises, Events, and Leisure' },
  { ticker: 'LYV', company: 'Live Nation Entertainment', category: 'Cruises, Events, and Leisure' },

  // Entertainment, Dining, and Payments
  { ticker: 'DIS', company: 'The Walt Disney Company', category: 'Entertainment, Dining, and Payments' },
  { ticker: 'MCD', company: "McDonald's", category: 'Entertainment, Dining, and Payments' },
  { ticker: 'SBUX', company: 'Starbucks', category: 'Entertainment, Dining, and Payments' },
  { ticker: 'V', company: 'Visa', category: 'Entertainment, Dining, and Payments' },
]);

/**
 * Benchmark configuration object for S&P 500 index proxy (SPY).
 */
export const BENCHMARK: Readonly<BenchmarkConfig> = Object.freeze({
  ticker: 'SPY',
  name: 'SPDR S&P 500 ETF Trust',
  description: 'Broad Market Equity Benchmark',
});

/**
 * Derived list of unique categories.
 */
export const UNIVERSE_CATEGORIES: readonly string[] = Object.freeze(
  Array.from(new Set(PORTFOLIO_UNIVERSE.map((s) => s.category)))
);
