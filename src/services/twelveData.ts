import { PriceBar, HistoryResult, LatestQuoteResult } from '../types';

/**
 * Parses Retry-After header from response or error payloads.
 * Supports integer seconds or HTTP-Date string.
 */
function parseRetryAfter(response: Response, errorJson?: any): number | null {
  try {
    const headerVal = response.headers?.get('retry-after') || response.headers?.get('Retry-After');
    if (headerVal) {
      const seconds = Number(headerVal);
      if (!isNaN(seconds) && seconds > 0) {
        return Math.min(seconds * 1000, 30000); // cap at 30s
      }
      const parsedDate = Date.parse(headerVal);
      if (!isNaN(parsedDate)) {
        const diffMs = parsedDate - Date.now();
        if (diffMs > 0) {
          return Math.min(diffMs, 30000);
        }
      }
    }

    if (errorJson && typeof errorJson === 'object') {
      const waitField = errorJson.retry_after || errorJson.retryAfter || errorJson.wait;
      if (typeof waitField === 'number' && waitField > 0) {
        return Math.min(waitField * 1000, 30000);
      }
    }
  } catch {
    // Ignore header parse exceptions
  }
  return null;
}

/**
 * Calculates exponential backoff delay with random jitter.
 *
 * @param attempt - Zero-based attempt count (0, 1, 2)
 * @param baseDelayMs - Initial delay base (default 1000ms)
 * @param maxDelayMs - Maximum delay cap (default 10000ms)
 */
function calculateBackoffDelay(attempt: number, baseDelayMs = 1000, maxDelayMs = 10000): number {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 500); // 0-500ms random jitter
  return Math.min(exponential + jitter, maxDelayMs);
}

/**
 * Utility helper to sleep for specified milliseconds.
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetches daily price history for a given symbol from the Twelve Data time_series endpoint.
 * Includes automatic rate-limit (HTTP 429 / API 429) detection, Retry-After header parsing,
 * exponential backoff with jitter, and up to 3 retry attempts per ticker.
 *
 * @param symbol - Ticker symbol (e.g., "DAL")
 * @param apiKey - Twelve Data API Key (kept in memory, never logged)
 * @param onRetryStatus - Optional callback reporting per-symbol retry status
 * @returns Structured result containing symbol, status, sorted data, message, and fetchedAt timestamp
 */
export async function fetchDailyHistory(
  symbol: string,
  apiKey: string,
  onRetryStatus?: (statusText: string) => void
): Promise<HistoryResult> {
  const fetchedAt = new Date().toISOString();
  const trimmedKey = (apiKey || '').trim();
  const cleanSymbol = (symbol || '').trim().toUpperCase();

  // Validate API key presence
  if (!trimmedKey) {
    return {
      symbol: cleanSymbol || symbol,
      status: 'error',
      data: [],
      message: 'Twelve Data API key is missing. Please enter your API key in the Data Access panel above.',
      fetchedAt,
    };
  }

  if (!cleanSymbol) {
    return {
      symbol: '',
      status: 'error',
      data: [],
      message: 'A valid equity symbol is required.',
      fetchedAt,
    };
  }

  const endpoint = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(
    cleanSymbol
  )}&interval=1day&outputsize=600&apikey=${encodeURIComponent(trimmedKey)}`;

  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      // 1. Handle HTTP 429 Rate Limit
      if (response.status === 429) {
        let errorJson: any = null;
        try {
          errorJson = await response.json();
        } catch {
          // ignore
        }

        if (attempt < MAX_RETRIES) {
          const retryAfterMs = parseRetryAfter(response, errorJson);
          const delayMs = retryAfterMs !== null ? retryAfterMs : calculateBackoffDelay(attempt, 1200, 10000);
          const waitSecs = (delayMs / 1000).toFixed(1);
          const retryMsg = `Rate limit reached for ${cleanSymbol}. Retrying in ${waitSecs}s (attempt ${attempt + 1}/${MAX_RETRIES})...`;
          onRetryStatus?.(retryMsg);
          await sleep(delayMs);
          continue; // Retry loop
        } else {
          return {
            symbol: cleanSymbol,
            status: 'error',
            data: [],
            message: `Twelve Data API rate limit exceeded. Retried ${MAX_RETRIES} times without success. Please retry in a few moments.`,
            fetchedAt: new Date().toISOString(),
          };
        }
      }

      // Other non-ok HTTP statuses
      if (!response.ok) {
        let httpErrorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
        try {
          const errorJson = await response.json();
          if (errorJson && errorJson.message) {
            httpErrorMsg = errorJson.message;
          }
        } catch {
          // Fallback to HTTP error status message
        }

        if (response.status === 401 || response.status === 403) {
          httpErrorMsg = 'Invalid API key or unauthorized access. Please verify your Twelve Data API key.';
        }

        return {
          symbol: cleanSymbol,
          status: 'error',
          data: [],
          message: httpErrorMsg,
          fetchedAt,
        };
      }

      // 2. Parse JSON response safely
      let parsedBody: any;
      try {
        parsedBody = await response.json();
      } catch {
        return {
          symbol: cleanSymbol,
          status: 'error',
          data: [],
          message: 'Failed to parse JSON response from Twelve Data API.',
          fetchedAt,
        };
      }

      // 3. Detect API rate limits or errors returned inside HTTP 200 JSON payload
      if (parsedBody && (parsedBody.status === 'error' || parsedBody.code >= 400 || parsedBody.message)) {
        const isRateLimit =
          parsedBody.code === 429 ||
          (typeof parsedBody.message === 'string' &&
            (parsedBody.message.toLowerCase().includes('rate limit') ||
              parsedBody.message.toLowerCase().includes('api call limit') ||
              parsedBody.message.toLowerCase().includes('limit reached')));

        if (isRateLimit && attempt < MAX_RETRIES) {
          const retryAfterMs = parseRetryAfter(response, parsedBody);
          const delayMs = retryAfterMs !== null ? retryAfterMs : calculateBackoffDelay(attempt, 1200, 10000);
          const waitSecs = (delayMs / 1000).toFixed(1);
          const retryMsg = `Rate limit reached for ${cleanSymbol}. Retrying in ${waitSecs}s (attempt ${attempt + 1}/${MAX_RETRIES})...`;
          onRetryStatus?.(retryMsg);
          await sleep(delayMs);
          continue;
        }

        let errorMsg = parsedBody.message || 'Twelve Data returned an error.';
        if (parsedBody.code === 401 || (errorMsg && errorMsg.toLowerCase().includes('api key'))) {
          errorMsg = 'Invalid or inactive Twelve Data API key. Please check your key.';
        } else if (isRateLimit) {
          errorMsg = `Rate limit exceeded for Twelve Data API. Retried ${MAX_RETRIES} times. Please wait a moment and try again.`;
        } else if (parsedBody.code === 400 || (errorMsg && errorMsg.toLowerCase().includes('not found'))) {
          errorMsg = `Symbol ${cleanSymbol} not found or unavailable on Twelve Data.`;
        }

        return {
          symbol: cleanSymbol,
          status: 'error',
          data: [],
          message: errorMsg,
          fetchedAt,
        };
      }

      // 4. Validate that the response contains a values array
      if (!parsedBody || !Array.isArray(parsedBody.values)) {
        return {
          symbol: cleanSymbol,
          status: 'error',
          data: [],
          message: `No price history values returned for ${cleanSymbol}. The symbol may be inactive or unsupported.`,
          fetchedAt,
        };
      }

      const rawValues = parsedBody.values;
      if (rawValues.length === 0) {
        return {
          symbol: cleanSymbol,
          status: 'error',
          data: [],
          message: `Empty time series data returned for ${cleanSymbol}.`,
          fetchedAt,
        };
      }

      // 5. Convert each record into { date, open, high, low, close, volume }
      const validBars: PriceBar[] = [];

      for (const row of rawValues) {
        if (!row || typeof row !== 'object') continue;

        const dateStr = typeof row.datetime === 'string' ? row.datetime.split(' ')[0] : '';
        if (!dateStr || isNaN(Date.parse(dateStr))) {
          continue; // drop row with invalid date
        }

        const open = Number(row.open);
        const high = Number(row.high);
        const low = Number(row.low);
        const close = Number(row.close);
        const volume = Number(row.volume || 0);

        // Validate numeric validity of close and prices
        if (isNaN(close) || close <= 0) {
          continue; // drop row with invalid close
        }

        validBars.push({
          date: dateStr,
          open: isNaN(open) ? close : open,
          high: isNaN(high) ? close : high,
          low: isNaN(low) ? close : low,
          close,
          volume: isNaN(volume) || volume < 0 ? 0 : volume,
        });
      }

      if (validBars.length === 0) {
        return {
          symbol: cleanSymbol,
          status: 'error',
          data: [],
          message: `Insufficient valid price data points found for ${cleanSymbol}.`,
          fetchedAt,
        };
      }

      // 6. Sort rows in ascending date order (oldest to newest)
      validBars.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // 7. Return structured success result
      return {
        symbol: cleanSymbol,
        status: 'ok',
        data: validBars,
        fetchedAt,
      };
    } catch (err: any) {
      const errorString = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_RETRIES && (errorString.toLowerCase().includes('failed to fetch') || errorString.toLowerCase().includes('networkerror'))) {
        const delayMs = calculateBackoffDelay(attempt, 1000, 8000);
        onRetryStatus?.(`Network glitch for ${cleanSymbol}. Retrying in ${(delayMs / 1000).toFixed(1)}s (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await sleep(delayMs);
        continue;
      }

      let userMsg = `Network or request error: ${errorString}`;
      if (errorString.toLowerCase().includes('failed to fetch') || errorString.toLowerCase().includes('networkerror')) {
        userMsg = 'Network connection failed or request was blocked by CORS. Please check your internet connection or try again.';
      }

      return {
        symbol: cleanSymbol,
        status: 'error',
        data: [],
        message: userMsg,
        fetchedAt,
      };
    }
  }

  return {
    symbol: cleanSymbol,
    status: 'error',
    data: [],
    message: 'Request failed after retry attempts.',
    fetchedAt,
  };
}

/**
 * Fetches the latest available quote/price for a symbol using Twelve Data quote/price endpoint.
 * Includes rate limit retry logic with Retry-After and exponential backoff with jitter.
 *
 * @param symbol Ticker symbol (e.g. "DAL")
 * @param apiKey Twelve Data API key
 * @param onRetryStatus Optional retry status callback
 */
export async function fetchLatestQuote(
  symbol: string,
  apiKey: string,
  onRetryStatus?: (statusText: string) => void
): Promise<LatestQuoteResult> {
  const fetchedAt = new Date().toISOString();
  const trimmedKey = (apiKey || '').trim();
  const cleanSymbol = (symbol || '').trim().toUpperCase();

  if (!trimmedKey) {
    return {
      symbol: cleanSymbol || symbol,
      price: null,
      previousClose: null,
      change: null,
      percentChange: null,
      datetime: null,
      timestamp: null,
      isMarketOpen: null,
      fetchedAt: new Date().toISOString(),
      status: 'error',
      errorMessage: 'Twelve Data API key is missing. Please provide your key in the Data Access Panel.',
      priceLabel: 'Data unavailable',
    };
  }

  if (!cleanSymbol) {
    return {
      symbol: '',
      price: null,
      previousClose: null,
      change: null,
      percentChange: null,
      datetime: null,
      timestamp: null,
      isMarketOpen: null,
      fetchedAt: new Date().toISOString(),
      status: 'error',
      errorMessage: 'A valid ticker symbol is required.',
      priceLabel: 'Data unavailable',
    };
  }

  const quoteEndpoint = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(
    cleanSymbol
  )}&apikey=${encodeURIComponent(trimmedKey)}`;

  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(quoteEndpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.status === 429) {
        let errorJson: any = null;
        try {
          errorJson = await response.json();
        } catch {
          // ignore
        }

        if (attempt < MAX_RETRIES) {
          const retryAfterMs = parseRetryAfter(response, errorJson);
          const delayMs = retryAfterMs !== null ? retryAfterMs : calculateBackoffDelay(attempt, 1200, 10000);
          onRetryStatus?.(`Rate limit for ${cleanSymbol} quote. Retrying in ${(delayMs / 1000).toFixed(1)}s (${attempt + 1}/${MAX_RETRIES})...`);
          await sleep(delayMs);
          continue;
        } else {
          return {
            symbol: cleanSymbol,
            price: null,
            previousClose: null,
            change: null,
            percentChange: null,
            datetime: null,
            timestamp: null,
            isMarketOpen: null,
            fetchedAt: new Date().toISOString(),
            status: 'error',
            errorMessage: 'Twelve Data API rate limit exceeded. Please wait a moment before trying again.',
            priceLabel: 'Data unavailable',
          };
        }
      }

      if (!response.ok) {
        let httpErrorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
        try {
          const errorJson = await response.json();
          if (errorJson && errorJson.message) {
            httpErrorMsg = errorJson.message;
          }
        } catch {
          // use default HTTP error
        }

        if (response.status === 401 || response.status === 403) {
          httpErrorMsg = 'Invalid API key or unauthorized access.';
        }

        return {
          symbol: cleanSymbol,
          price: null,
          previousClose: null,
          change: null,
          percentChange: null,
          datetime: null,
          timestamp: null,
          isMarketOpen: null,
          fetchedAt: new Date().toISOString(),
          status: 'error',
          errorMessage: httpErrorMsg,
          priceLabel: 'Data unavailable',
        };
      }

      let parsed: any;
      try {
        parsed = await response.json();
      } catch {
        return {
          symbol: cleanSymbol,
          price: null,
          previousClose: null,
          change: null,
          percentChange: null,
          datetime: null,
          timestamp: null,
          isMarketOpen: null,
          fetchedAt: new Date().toISOString(),
          status: 'error',
          errorMessage: 'Failed to parse JSON response from Twelve Data Quote API.',
          priceLabel: 'Data unavailable',
        };
      }

      // Check for API-level error returned in JSON payload
      if (parsed && (parsed.status === 'error' || parsed.code >= 400 || (parsed.message && !parsed.close && !parsed.price))) {
        const isRateLimit =
          parsed.code === 429 ||
          (typeof parsed.message === 'string' &&
            (parsed.message.toLowerCase().includes('rate limit') ||
              parsed.message.toLowerCase().includes('api call limit') ||
              parsed.message.toLowerCase().includes('limit reached')));

        if (isRateLimit && attempt < MAX_RETRIES) {
          const retryAfterMs = parseRetryAfter(response, parsed);
          const delayMs = retryAfterMs !== null ? retryAfterMs : calculateBackoffDelay(attempt, 1200, 10000);
          onRetryStatus?.(`Rate limit for ${cleanSymbol} quote. Retrying in ${(delayMs / 1000).toFixed(1)}s (${attempt + 1}/${MAX_RETRIES})...`);
          await sleep(delayMs);
          continue;
        }

        let errText = parsed.message || 'Quote request error returned by Twelve Data.';
        if (isRateLimit) {
          errText = 'Rate limit exceeded for Twelve Data API. Please wait a moment before trying again.';
        }

        return {
          symbol: cleanSymbol,
          price: null,
          previousClose: null,
          change: null,
          percentChange: null,
          datetime: null,
          timestamp: null,
          isMarketOpen: null,
          fetchedAt: new Date().toISOString(),
          status: 'error',
          errorMessage: errText,
          priceLabel: 'Data unavailable',
        };
      }

      // Extract quote values safely
      const rawPrice = parsed.close !== undefined ? parsed.close : parsed.price;
      const priceNum = rawPrice !== undefined && rawPrice !== null ? Number(rawPrice) : NaN;

      if (isNaN(priceNum) || priceNum <= 0) {
        return {
          symbol: cleanSymbol,
          price: null,
          previousClose: null,
          change: null,
          percentChange: null,
          datetime: null,
          timestamp: null,
          isMarketOpen: null,
          fetchedAt: new Date().toISOString(),
          status: 'error',
          errorMessage: `Invalid price quote returned for ${cleanSymbol}.`,
          priceLabel: 'Data unavailable',
        };
      }

      const prevCloseNum = parsed.previous_close !== undefined ? Number(parsed.previous_close) : null;
      const changeNum = parsed.change !== undefined ? Number(parsed.change) : null;
      const percentChangeNum = parsed.percent_change !== undefined ? Number(parsed.percent_change) : null;
      const datetimeStr = typeof parsed.datetime === 'string' ? parsed.datetime : null;
      const timestampNum = typeof parsed.timestamp === 'number' ? parsed.timestamp : null;
      const isMarketOpen = typeof parsed.is_market_open === 'boolean' ? parsed.is_market_open : null;

      const priceLabel: 'Live market price' | 'Latest available price' | 'Data unavailable' =
        isMarketOpen === true ? 'Live market price' : 'Latest available price';

      return {
        symbol: cleanSymbol,
        price: priceNum,
        previousClose: prevCloseNum !== null && !isNaN(prevCloseNum) ? prevCloseNum : null,
        change: changeNum !== null && !isNaN(changeNum) ? changeNum : null,
        percentChange: percentChangeNum !== null && !isNaN(percentChangeNum) ? percentChangeNum : null,
        datetime: datetimeStr,
        timestamp: timestampNum,
        isMarketOpen,
        fetchedAt: new Date().toISOString(),
        status: 'ok',
        priceLabel,
      };
    } catch (err: any) {
      const errorString = err instanceof Error ? err.message : String(err);
      if (attempt < MAX_RETRIES) {
        const delayMs = calculateBackoffDelay(attempt, 1000, 8000);
        onRetryStatus?.(`Retrying ${cleanSymbol} quote in ${(delayMs / 1000).toFixed(1)}s...`);
        await sleep(delayMs);
        continue;
      }

      return {
        symbol: cleanSymbol,
        price: null,
        previousClose: null,
        change: null,
        percentChange: null,
        datetime: null,
        timestamp: null,
        isMarketOpen: null,
        fetchedAt: new Date().toISOString(),
        status: 'error',
        errorMessage: `Network error while fetching quote: ${errorString}`,
        priceLabel: 'Data unavailable',
      };
    }
  }

  return {
    symbol: cleanSymbol,
    price: null,
    previousClose: null,
    change: null,
    percentChange: null,
    datetime: null,
    timestamp: null,
    isMarketOpen: null,
    fetchedAt: new Date().toISOString(),
    status: 'error',
    errorMessage: 'Quote request failed after retry attempts.',
    priceLabel: 'Data unavailable',
  };
}

