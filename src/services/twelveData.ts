import { PriceBar, HistoryResult, LatestQuoteResult } from '../types';

/**
 * Fetches daily price history for a given symbol from the Twelve Data time_series endpoint.
 *
 * @param symbol - Ticker symbol (e.g., "DAL")
 * @param apiKey - Twelve Data API Key (kept in memory, never logged)
 * @returns Structured result containing symbol, status, sorted data, message, and fetchedAt timestamp
 */
export async function fetchDailyHistory(
  symbol: string,
  apiKey: string
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

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    // 1. Check response.ok before parsing
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
      } else if (response.status === 429) {
        httpErrorMsg = 'Twelve Data API rate limit exceeded. Please wait a moment before trying again.';
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

    // 3. Detect and display API error messages returned in the response body
    if (parsedBody && (parsedBody.status === 'error' || parsedBody.code >= 400 || parsedBody.message)) {
      let errorMsg = parsedBody.message || 'Twelve Data returned an error.';
      if (parsedBody.code === 401 || (errorMsg && errorMsg.toLowerCase().includes('api key'))) {
        errorMsg = 'Invalid or inactive Twelve Data API key. Please check your key.';
      } else if (parsedBody.code === 429 || (errorMsg && errorMsg.toLowerCase().includes('limit'))) {
        errorMsg = 'Rate limit exceeded for Twelve Data API (Free tier allows 8 requests/minute).';
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
    // 6. Convert numeric fields to JavaScript numbers
    // 7. Drop rows with invalid dates or invalid close values
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

    // 8. Sort rows in ascending date order (oldest to newest)
    validBars.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 9. Return structured result
    return {
      symbol: cleanSymbol,
      status: 'ok',
      data: validBars,
      fetchedAt,
    };
  } catch (err: any) {
    const errorString = err instanceof Error ? err.message : String(err);
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

/**
 * Fetches the latest available quote/price for a symbol using Twelve Data quote/price endpoint.
 * Accurately reports whether the market is open or closed, previous close, price change,
 * timestamp, and explicit price label.
 *
 * @param symbol Ticker symbol (e.g. "DAL")
 * @param apiKey Twelve Data API key
 */
export async function fetchLatestQuote(
  symbol: string,
  apiKey: string
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

  try {
    const response = await fetch(quoteEndpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

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
      } else if (response.status === 429) {
        httpErrorMsg = 'Twelve Data API rate limit exceeded (Free tier: 8 requests/min).';
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
      let errText = parsed.message || 'Quote request error returned by Twelve Data.';
      if (parsed.code === 429 || errText.toLowerCase().includes('limit')) {
        errText = 'Rate limit exceeded for Twelve Data API (Free tier: 8 requests/min).';
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

    // Respect constraint:
    // If the market is closed, label the result "Latest available price"; do not claim it is live real-time data.
    // Only if is_market_open is explicitly true and recent, label as "Live market price"
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
