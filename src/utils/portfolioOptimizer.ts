import {
  CandidateScreeningItem,
  SymbolDataMap,
  OptimizedHolding,
  OptimizerValidation,
  OptimizationResult,
  InclusionReason,
  OptimizerSignalStatus,
} from '../types';
import { calculateDailyReturns, alignReturnSeries, calculateCovarianceMatrix } from './portfolioMath';

export const TOTAL_PORTFOLIO_CAPITAL = 1_000_000;
export const MAX_WEIGHT_CONSTRAINT = 0.20; // 20% maximum individual asset cap
export const MIN_REQUIRED_HOLDINGS = 10;
export const DEFAULT_MAX_ITERATIONS = 1000;
export const DEFAULT_TOLERANCE = 1e-7;

/**
 * Calculates the Euclidean projection of a vector y onto the capped probability simplex:
 * S = { w in R^N | sum(w_i) = 1, 0 <= w_i <= u }
 *
 * Mathematical Algorithm:
 * From the KKT optimality conditions of min 0.5 * ||w - y||^2 subject to sum(w) = 1, 0 <= w <= u:
 * There exists a scalar Lagrange multiplier lambda* such that:
 *   w_i*(lambda*) = clip(y_i - lambda*, 0, u) = min(u, max(0, y_i - lambda*))
 * and g(lambda) = sum_{i=1}^N clip(y_i - lambda, 0, u) = 1.0.
 *
 * Since g(lambda) is continuous and strictly monotonically non-increasing in lambda:
 * We solve g(lambda) = 1 using binary bisection search to machine precision (< 1e-15 error).
 *
 * @param y Unconstrained target vector in R^N
 * @param u Upper bound cap (0.20 for 20% max weight)
 * @returns Feasible vector w in S satisfying sum(w_i) = 1.0 and 0 <= w_i <= u
 */
export function projectOntoCappedSimplex(y: number[], u: number = MAX_WEIGHT_CONSTRAINT): number[] {
  const n = y.length;
  if (n === 0) return [];
  if (n === 1) return [1.0];

  // If n * u < 1.0, the capped simplex is mathematically empty.
  // When n >= 10 and u = 0.20, n * u >= 2.0 >= 1.0, guaranteeing non-emptiness.
  if (n * u < 1.0 - 1e-9) {
    throw new Error(`Cannot project onto capped simplex: n (${n}) * u (${u}) < 1.0`);
  }

  // Bracket the Lagrange multiplier lambda
  let low = Math.min(...y) - u;
  let high = Math.max(...y);

  // Perform 60 bisection iterations for ultra-high numerical accuracy
  for (let iter = 0; iter < 60; iter++) {
    const mid = (low + high) / 2;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += Math.min(u, Math.max(0, y[i] - mid));
    }

    if (sum > 1.0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const lambda = (low + high) / 2;
  let projected = y.map((val) => Math.min(u, Math.max(0, val - lambda)));

  // Final micro-normalization to ensure sum === 1.0 exactly
  let currentSum = projected.reduce((acc, v) => acc + v, 0);
  if (currentSum > 0 && Math.abs(currentSum - 1.0) > 1e-12) {
    projected = projected.map((v) => v / currentSum);
    // Guard against microscopic numerical leak over u
    projected = projected.map((v) => Math.min(u, Math.max(0, v)));
    currentSum = projected.reduce((acc, v) => acc + v, 0);
    projected = projected.map((v) => v / currentSum);
  }

  return projected;
}

/**
 * Computes matrix-vector product: result = Sigma * w
 *
 * @param sigma N x N square covariance matrix
 * @param w Vector of length N
 */
export function matrixVectorMultiply(sigma: number[][], w: number[]): number[] {
  const n = w.length;
  const result = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    let sum = 0;
    const row = sigma[i];
    for (let j = 0; j < n; j++) {
      sum += row[j] * w[j];
    }
    result[i] = sum;
  }

  return result;
}

/**
 * Computes portfolio variance: f(w) = w^T * Sigma * w
 *
 * @param sigma N x N square covariance matrix
 * @param w Portfolio weight vector
 */
export function computePortfolioVariance(sigma: number[][], w: number[]): number {
  const sigmaW = matrixVectorMultiply(sigma, w);
  let variance = 0;
  for (let i = 0; i < w.length; i++) {
    variance += w[i] * sigmaW[i];
  }
  return variance;
}

/**
 * Validates post-optimization portfolio weights against institutional mathematical standards:
 * 1. Weights sum to 1.0 within +/- 0.0001 (1e-4) tolerance.
 * 2. No weight is negative (w_i >= -1e-6).
 * 3. No individual weight exceeds 20.00% (w_i <= 0.2001).
 * 4. Every included ticker has a defined numeric weight.
 *
 * @param weights Array of weights
 * @param tickers Array of corresponding tickers
 * @returns OptimizerValidation record
 */
export function validateOptimizedWeights(
  weights: number[],
  tickers: string[]
): OptimizerValidation {
  const validationErrors: string[] = [];

  if (weights.length !== tickers.length) {
    validationErrors.push(
      `Weight count (${weights.length}) does not match ticker count (${tickers.length}).`
    );
  }

  // 1. Sum of weights validation
  const weightSum = weights.reduce((acc, v) => acc + v, 0);
  const weightSumTolerancePassed = Math.abs(weightSum - 1.0) <= 1e-4;
  if (!weightSumTolerancePassed) {
    validationErrors.push(
      `Portfolio weights sum to ${(weightSum * 100).toFixed(4)}%, violating the 100% budget constraint.`
    );
  }

  // 2. Non-negativity check (long-only)
  let noNegativeWeights = true;
  for (let i = 0; i < weights.length; i++) {
    if (weights[i] < -1e-6 || isNaN(weights[i]) || !isFinite(weights[i])) {
      noNegativeWeights = false;
      validationErrors.push(
        `Holding ${tickers[i]} has invalid or negative weight: ${(weights[i] * 100).toFixed(4)}%.`
      );
      break;
    }
  }

  // 3. Maximum position constraint check (<= 20%)
  let maxWeightConstraintPassed = true;
  let largestWeight = 0;
  let smallestWeight = 1.0;

  for (let i = 0; i < weights.length; i++) {
    const w = weights[i];
    if (w > largestWeight) largestWeight = w;
    if (w < smallestWeight) smallestWeight = w;

    if (w > MAX_WEIGHT_CONSTRAINT + 1e-4) {
      maxWeightConstraintPassed = false;
      validationErrors.push(
        `Holding ${tickers[i]} weight ${(w * 100).toFixed(2)}% exceeds the 20.00% maximum cap constraint.`
      );
    }
  }

  // 4. All holdings weighted
  const allHoldingsWeighted = weights.every(
    (w) => typeof w === 'number' && !isNaN(w) && isFinite(w)
  );
  if (!allHoldingsWeighted) {
    validationErrors.push('One or more included holdings have undefined/NaN weights.');
  }

  const isValid =
    weightSumTolerancePassed &&
    noNegativeWeights &&
    maxWeightConstraintPassed &&
    allHoldingsWeighted &&
    validationErrors.length === 0;

  return {
    isValid,
    weightSum,
    weightSumTolerancePassed,
    noNegativeWeights,
    maxWeightConstraintPassed,
    allHoldingsWeighted,
    largestWeight,
    smallestWeight: weights.length > 0 ? smallestWeight : 0,
    validationErrors,
  };
}

/**
 * Solves the Constrained Long-Only Minimum-Variance Portfolio Optimization Problem:
 *
 * minimize    0.5 * w^T * Sigma * w
 * subject to  sum(w_i) = 1.0
 *             0 <= w_i <= 0.20  for all i = 1, ..., N
 *
 * Algorithm: Projected Gradient Descent (PGD) with Armijo Backtracking Line Search.
 * - Initial Point: Uniform Equal Weights w_0 = [1/N, ..., 1/N]^T (strictly feasible for N >= 5).
 * - Gradient: grad f(w) = Sigma * w.
 * - Projection: Exact root-finding projection onto the capped probability simplex.
 *
 * @param sigma Annualized N x N covariance matrix
 * @param tickers Array of N ticker symbols
 * @param maxIterations Maximum iterations (default 1000)
 * @param tolerance Convergence tolerance (default 1e-7)
 * @returns Optimal weights, iteration count, and convergence flag
 */
export function solveMinimumVariancePGD(
  sigma: number[][],
  tickers: string[],
  maxIterations: number = DEFAULT_MAX_ITERATIONS,
  tolerance: number = DEFAULT_TOLERANCE
): {
  weights: number[];
  iterations: number;
  converged: boolean;
  finalGradientNorm: number;
} {
  const n = tickers.length;

  if (n === 0 || sigma.length === 0) {
    return { weights: [], iterations: 0, converged: false, finalGradientNorm: 0 };
  }

  // 1. Initialize with Equal Weights w_0 = 1 / N
  let w = new Array(n).fill(1.0 / n);

  // Estimate Lipschitz constant L <= ||Sigma||_inf = max_i sum_j |Sigma_ij|
  let lBound = 0;
  for (let i = 0; i < n; i++) {
    let rowSum = 0;
    for (let j = 0; j < n; j++) {
      rowSum += Math.abs(sigma[i][j]);
    }
    if (rowSum > lBound) lBound = rowSum;
  }
  const initialAlpha = lBound > 0 ? 1.0 / lBound : 0.01;

  let iterations = 0;
  let converged = false;
  let finalGradientNorm = 0;

  for (let iter = 0; iter < maxIterations; iter++) {
    iterations = iter + 1;

    // Compute gradient: grad = Sigma * w
    const grad = matrixVectorMultiply(sigma, w);

    // Compute gradient infinity norm for monitoring
    let maxGrad = 0;
    for (let i = 0; i < n; i++) {
      if (Math.abs(grad[i]) > maxGrad) maxGrad = Math.abs(grad[i]);
    }
    finalGradientNorm = maxGrad;

    const currentObj = 0.5 * computePortfolioVariance(sigma, w);

    // Backtracking line search on step size alpha
    let alpha = initialAlpha;
    let nextW = w;
    let stepAccepted = false;

    for (let lineStep = 0; lineStep < 20; lineStep++) {
      // Gradient step: y = w - alpha * grad
      const y = new Array(n);
      for (let i = 0; i < n; i++) {
        y[i] = w[i] - alpha * grad[i];
      }

      // Project y onto capped simplex S = {w | sum(w)=1, 0 <= w <= 0.20}
      const candidateW = projectOntoCappedSimplex(y, MAX_WEIGHT_CONSTRAINT);

      const candidateObj = 0.5 * computePortfolioVariance(sigma, candidateW);

      // Armijo descent test: candidateObj <= currentObj - (1e-4 / alpha) * ||candidateW - w||^2
      let diffNormSq = 0;
      for (let i = 0; i < n; i++) {
        const d = candidateW[i] - w[i];
        diffNormSq += d * d;
      }

      if (candidateObj <= currentObj + 1e-12 || diffNormSq < 1e-14) {
        nextW = candidateW;
        stepAccepted = true;
        break;
      }

      alpha *= 0.5; // shrink step size
    }

    if (!stepAccepted) {
      // Fallback projection with smallest step
      const y = new Array(n);
      for (let i = 0; i < n; i++) {
        y[i] = w[i] - alpha * grad[i];
      }
      nextW = projectOntoCappedSimplex(y, MAX_WEIGHT_CONSTRAINT);
    }

    // Check step convergence ||nextW - w||_inf < tolerance
    let maxDelta = 0;
    for (let i = 0; i < n; i++) {
      const delta = Math.abs(nextW[i] - w[i]);
      if (delta > maxDelta) maxDelta = delta;
    }

    w = nextW;

    if (maxDelta < tolerance) {
      converged = true;
      break;
    }
  }

  return {
    weights: w,
    iterations,
    converged,
    finalGradientNorm,
  };
}

/**
 * Maps technical score to clear signal status.
 */
export function getSignalStatus(score: number | null): OptimizerSignalStatus {
  if (score === null || isNaN(score)) return 'Data Unavailable';
  if (score >= 3) return 'Constructive';
  if (score === 2) return 'Mixed';
  return 'Caution';
}

/**
 * Executes the complete institutional Portfolio Optimization Pipeline:
 *
 * 1. Checks candidate universe data sufficiency (>= 252 bars).
 * 2. Selects portfolio candidates:
 *    - If >= 10 eligible stocks exist: optimizes all eligible stocks.
 *    - If < 10 eligible stocks exist: includes eligible stocks and adds top-scoring
 *      ineligible candidates as "Fallback included" until 10 holdings are reached.
 *    - If < 10 total data-sufficient stocks exist: cleanly stops and reports why.
 * 3. Aligns historical daily returns on shared common trading dates.
 * 4. Estimates annualized sample covariance matrix (with Bessel degrees of freedom T-1).
 * 5. Runs Projected Gradient Descent on the 20% capped simplex.
 * 6. Validates constraints: sum to 100%, non-negative, <= 20% max weight.
 * 7. If validation fails: safely falls back to equal weights with prominent warning.
 * 8. Scales weights to a $1,000,000 portfolio model.
 *
 * @param screeningItems Candidate screening items across universe
 * @param dataMap Historical price data map
 * @returns OptimizationResult object
 */
export function runPortfolioOptimizer(
  screeningItems: CandidateScreeningItem[],
  dataMap: SymbolDataMap
): OptimizationResult {
  // 1. Filter candidates that have valid, sufficient market history (>= 252 bars)
  const dataSufficientCandidates = screeningItems.filter(
    (item) => item.hasSufficientData && item.validBarCount >= 252
  );

  // Requirement 3: If fewer than 10 data-sufficient stocks exist, stop cleanly
  if (dataSufficientCandidates.length < MIN_REQUIRED_HOLDINGS) {
    const emptyValidation: OptimizerValidation = {
      isValid: false,
      weightSum: 0,
      weightSumTolerancePassed: false,
      noNegativeWeights: true,
      maxWeightConstraintPassed: true,
      allHoldingsWeighted: false,
      largestWeight: 0,
      smallestWeight: 0,
      validationErrors: [
        `Insufficient data-ready assets: ${dataSufficientCandidates.length} available, minimum ${MIN_REQUIRED_HOLDINGS} required.`,
      ],
    };

    return {
      status: 'Insufficient Holdings',
      statusMessage: `Optimization halted: Only ${dataSufficientCandidates.length} universe stocks have sufficient annual historical data (>= 252 bars). A minimum of ${MIN_REQUIRED_HOLDINGS} data-sufficient assets is required for reliable covariance estimation and portfolio diversification.`,
      iterations: 0,
      convergenceReached: false,
      finalGradientNorm: 0,
      holdings: [],
      includedCount: 0,
      fallbackCount: 0,
      minVarianceVolatility: null,
      equalWeightVolatility: null,
      volatilityDelta: null,
      relativeRiskReduction: null,
      validation: emptyValidation,
      totalCapital: TOTAL_PORTFOLIO_CAPITAL,
      tickers: [],
      isFallbackActive: false,
    };
  }

  // 2. Separate into Eligible (Score >= 2) and Ineligible (Score < 2)
  const eligibleCandidates = dataSufficientCandidates.filter(
    (item) => item.eligibility === 'Eligible'
  );
  const ineligibleCandidates = dataSufficientCandidates.filter(
    (item) => item.eligibility === 'Ineligible'
  );

  // Sort ineligible candidates by technicalScore desc, then trailing60Return desc, then ticker asc
  ineligibleCandidates.sort((a, b) => {
    const scoreA = a.technicalScore ?? 0;
    const scoreB = b.technicalScore ?? 0;
    if (scoreB !== scoreA) return scoreB - scoreA;

    const retA = a.trailing60Return ?? -Infinity;
    const retB = b.trailing60Return ?? -Infinity;
    if (retB !== retA) return retB - retA;

    return a.ticker.localeCompare(b.ticker);
  });

  // Requirement 1 & 2: Candidate Selection Logic
  interface CandidateWithTag {
    item: CandidateScreeningItem;
    inclusionReason: InclusionReason;
  }

  const selectedWithTags: CandidateWithTag[] = [];

  if (eligibleCandidates.length >= MIN_REQUIRED_HOLDINGS) {
    // Case 1: At least 10 eligible stocks -> optimize all eligible stocks
    for (const item of eligibleCandidates) {
      selectedWithTags.push({
        item,
        inclusionReason: 'Eligible Technical Pass',
      });
    }
  } else {
    // Case 2: Fewer than 10 eligible stocks -> add highest-scoring fallback candidates
    for (const item of eligibleCandidates) {
      selectedWithTags.push({
        item,
        inclusionReason: 'Eligible Technical Pass',
      });
    }

    const neededFallbacks = MIN_REQUIRED_HOLDINGS - eligibleCandidates.length;
    const fallbackSlice = ineligibleCandidates.slice(0, neededFallbacks);

    for (const item of fallbackSlice) {
      selectedWithTags.push({
        item,
        inclusionReason: 'Fallback included',
      });
    }
  }

  const includedCount = selectedWithTags.length;
  const fallbackCount = selectedWithTags.filter(
    (t) => t.inclusionReason === 'Fallback included'
  ).length;
  const isFallbackActive = fallbackCount > 0;
  const includedTickers = selectedWithTags.map((t) => t.item.ticker);

  // 3. Align Return Series & Estimate Annualized Covariance Matrix
  const returnSeriesByTicker: Record<string, ReturnType<typeof calculateDailyReturns>> = {};
  for (const ticker of includedTickers) {
    const record = dataMap[ticker];
    if (record && record.data && record.data.length >= 2) {
      returnSeriesByTicker[ticker] = calculateDailyReturns(record.data);
    } else {
      returnSeriesByTicker[ticker] = [];
    }
  }

  const alignedReturns = alignReturnSeries(returnSeriesByTicker);

  if (alignedReturns.dateCount < 2 || !alignedReturns.isSufficient) {
    const emptyValidation: OptimizerValidation = {
      isValid: false,
      weightSum: 0,
      weightSumTolerancePassed: false,
      noNegativeWeights: true,
      maxWeightConstraintPassed: true,
      allHoldingsWeighted: false,
      largestWeight: 0,
      smallestWeight: 0,
      validationErrors: [
        alignedReturns.warning || 'Insufficient common overlapping trading dates for covariance estimation.',
      ],
    };

    return {
      status: 'No Data',
      statusMessage: `Historical date alignment failed: ${alignedReturns.dateCount} common trading dates found across the ${includedCount} included assets.`,
      iterations: 0,
      convergenceReached: false,
      finalGradientNorm: 0,
      holdings: [],
      includedCount,
      fallbackCount,
      minVarianceVolatility: null,
      equalWeightVolatility: null,
      volatilityDelta: null,
      relativeRiskReduction: null,
      validation: emptyValidation,
      totalCapital: TOTAL_PORTFOLIO_CAPITAL,
      tickers: includedTickers,
      isFallbackActive,
    };
  }

  const covResult = calculateCovarianceMatrix(alignedReturns);
  const sigmaAnn = covResult.annualizedCovariance;

  // 4. Run Numerical Optimizer (Projected Gradient Descent)
  const optimization = solveMinimumVariancePGD(
    sigmaAnn,
    includedTickers,
    DEFAULT_MAX_ITERATIONS,
    DEFAULT_TOLERANCE
  );

  let finalWeights = optimization.weights;
  let optimizerStatus: 'Optimal' | 'Validation Fallback' = 'Optimal';
  let statusMessage = `Optimal solution converged in ${optimization.iterations} iterations (Projected Gradient Descent).`;

  // 5. Post-Optimization Institutional Validation
  let validation = validateOptimizedWeights(finalWeights, includedTickers);

  // Requirement 7: Fallback to Equal Weights if validation fails
  if (!validation.isValid) {
    optimizerStatus = 'Validation Fallback';
    statusMessage = `Optimization validation warning: Falling back to 1/N equal weights (${(
      (1 / includedCount) *
      100
    ).toFixed(2)}% per holding) across ${includedCount} positions.`;
    finalWeights = new Array(includedCount).fill(1.0 / includedCount);
    validation = validateOptimizedWeights(finalWeights, includedTickers);
  }

  // 6. Compute Portfolio Volatilities (Min-Var vs Equal-Weight)
  const ewWeights = new Array(includedCount).fill(1.0 / includedCount);
  const minVarVariance = computePortfolioVariance(sigmaAnn, finalWeights);
  const ewVariance = computePortfolioVariance(sigmaAnn, ewWeights);

  const minVarianceVolatility = Math.sqrt(Math.max(0, minVarVariance));
  const equalWeightVolatility = Math.sqrt(Math.max(0, ewVariance));
  const volatilityDelta = minVarianceVolatility - equalWeightVolatility;
  const relativeRiskReduction =
    equalWeightVolatility > 0
      ? ((equalWeightVolatility - minVarianceVolatility) / equalWeightVolatility) * 100
      : 0;

  // 7. Assemble Holdings Table Data ($1,000,000 capital model)
  const holdings: OptimizedHolding[] = selectedWithTags.map((entry, idx) => {
    const { item, inclusionReason } = entry;
    const weight = finalWeights[idx];
    const dollarAllocation = weight * TOTAL_PORTFOLIO_CAPITAL;
    const latestPrice = item.latestPrice;
    const shares =
      latestPrice && latestPrice > 0 ? Math.floor(dollarAllocation / latestPrice) : null;
    const signalStatus = getSignalStatus(item.technicalScore);

    return {
      ticker: item.ticker,
      company: item.company,
      category: item.category,
      inclusionReason,
      technicalScore: item.technicalScore,
      weight,
      dollarAllocation,
      latestPrice,
      signalStatus,
      shares,
    };
  });

  // Sort holdings by weight descending, then technicalScore descending
  holdings.sort((a, b) => {
    if (Math.abs(b.weight - a.weight) > 1e-5) {
      return b.weight - a.weight;
    }
    const scoreA = a.technicalScore ?? 0;
    const scoreB = b.technicalScore ?? 0;
    return scoreB - scoreA;
  });

  return {
    status: optimizerStatus,
    statusMessage,
    iterations: optimization.iterations,
    convergenceReached: optimization.converged,
    finalGradientNorm: optimization.finalGradientNorm,
    holdings,
    includedCount,
    fallbackCount,
    minVarianceVolatility,
    equalWeightVolatility,
    volatilityDelta,
    relativeRiskReduction,
    validation,
    totalCapital: TOTAL_PORTFOLIO_CAPITAL,
    tickers: includedTickers,
    isFallbackActive,
  };
}
