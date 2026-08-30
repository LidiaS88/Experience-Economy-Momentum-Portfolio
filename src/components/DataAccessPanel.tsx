import React, { useState } from 'react';
import {
  KeyRound,
  Shield,
  Trash2,
  CheckCircle2,
  Lock,
  Play,
  Loader2,
  AlertTriangle,
  Calendar,
  Layers,
  DollarSign,
  Clock,
  XCircle,
} from 'lucide-react';
import { SessionApiKeys, HistoryResult } from '../types';
import { fetchDailyHistory } from '../services/twelveData';

interface DataAccessPanelProps {
  apiKeys: SessionApiKeys;
  onUpdateKeys: (keys: Partial<SessionApiKeys>) => void;
  onClearKeys: () => void;
}

export const DataAccessPanel: React.FC<DataAccessPanelProps> = ({
  apiKeys,
  onUpdateKeys,
  onClearKeys,
}) => {
  const [testResult, setTestResult] = useState<HistoryResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const hasTwelveData = Boolean(apiKeys.twelveDataApiKey.trim());
  const hasOpenRouter = Boolean(apiKeys.openRouterApiKey.trim());

  const handleClear = () => {
    onClearKeys();
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await fetchDailyHistory('DAL', apiKeys.twelveDataApiKey);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        symbol: 'DAL',
        status: 'error',
        data: [],
        message: err?.message || 'An unexpected error occurred during connection test.',
        fetchedAt: new Date().toISOString(),
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Derive summary metrics from testResult data
  const earliestDate = testResult?.data && testResult.data.length > 0 ? testResult.data[0].date : null;
  const latestBar = testResult?.data && testResult.data.length > 0 ? testResult.data[testResult.data.length - 1] : null;
  const latestDate = latestBar ? latestBar.date : null;
  const latestClose = latestBar ? latestBar.close : null;
  const barsCount = testResult?.data ? testResult.data.length : 0;

  return (
    <section id="data-access-panel" className="mb-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/75 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-700">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 id="data-access-heading" className="text-base sm:text-lg font-bold text-slate-900">
                Data Access &amp; Session API Configuration
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Memory Only</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter API keys to enable financial market data feeds and quantitative strategy reasoning.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="test-twelve-data-button"
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            title="Fetch DAL 600-day daily price series to verify API connectivity"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Testing DAL Connection...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Test Twelve Data Connection (DAL)</span>
              </>
            )}
          </button>

          <button
            id="clear-keys-button"
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            title="Wipe credentials from JavaScript memory"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear keys</span>
          </button>
        </div>
      </div>

      {/* Inputs Form */}
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Twelve Data Key */}
          <div>
            <label htmlFor="twelve-data-key-input" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>Twelve Data API Key</span>
              {hasTwelveData && (
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Set in memory
                </span>
              )}
            </label>
            <div className="relative">
              <input
                id="twelve-data-key-input"
                name="twelveDataApiKey"
                type="password"
                autoComplete="off"
                placeholder="Enter Twelve Data API key..."
                value={apiKeys.twelveDataApiKey}
                onChange={(e) => onUpdateKeys({ twelveDataApiKey: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Required for equity time series, 200 SMA, and historical prices.
            </p>
          </div>

          {/* OpenRouter Key */}
          <div>
            <label htmlFor="openrouter-key-input" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>OpenRouter API Key</span>
              {hasOpenRouter && (
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Set in memory
                </span>
              )}
            </label>
            <div className="relative">
              <input
                id="openrouter-key-input"
                name="openRouterApiKey"
                type="password"
                autoComplete="off"
                placeholder="Enter OpenRouter API key..."
                value={apiKeys.openRouterApiKey}
                onChange={(e) => onUpdateKeys({ openRouterApiKey: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Required for quantitative committee memo synthesis.
            </p>
          </div>

          {/* OpenRouter Model (Optional) */}
          <div>
            <label htmlFor="openrouter-model-input" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span>OpenRouter Model <span className="font-normal text-slate-400">(Optional)</span></span>
            </label>
            <div className="relative">
              <input
                id="openrouter-model-input"
                name="openRouterModel"
                type="text"
                autoComplete="off"
                placeholder="e.g., anthropic/claude-3.7-sonnet"
                value={apiKeys.openRouterModel}
                onChange={(e) => onUpdateKeys({ openRouterModel: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Leave blank to default to recommended reasoning model.
            </p>
          </div>
        </div>

        {/* Security & Lifecycle Notice */}
        <div id="session-security-notice" className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-slate-800">In-Memory Session Security: </span>
            Keys are held strictly in temporary JavaScript runtime memory during this single page session. They are never written to localStorage, sessionStorage, cookies, log streams, or persistent storage. Refreshing or closing the tab immediately purges them.
          </div>
        </div>

        {/* Test Connection Results Panel */}
        {testResult && (
          <div
            id="twelve-data-test-result-panel"
            className={`mt-4 rounded-lg border p-4 text-xs ${
              testResult.status === 'ok'
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-inherit">
              <div className="flex items-center gap-2">
                {testResult.status === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span className="font-bold text-sm">
                  {testResult.status === 'ok'
                    ? `Twelve Data Connection Verified (${testResult.symbol})`
                    : `Connection Test Failed (${testResult.symbol})`}
                </span>
              </div>
              <span className="text-[11px] opacity-75 font-mono">
                Fetched: {new Date(testResult.fetchedAt).toLocaleTimeString()}
              </span>
            </div>

            {testResult.status === 'ok' ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* Metric 1: Valid Bars */}
                <div className="p-2.5 bg-white/80 rounded border border-emerald-200">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold flex items-center gap-1">
                    <Layers className="w-3 h-3 text-emerald-600" />
                    <span>Daily Bars</span>
                  </div>
                  <div className="text-base font-bold text-emerald-900 mt-0.5">
                    {barsCount} bars
                  </div>
                </div>

                {/* Metric 2: Earliest Date */}
                <div className="p-2.5 bg-white/80 rounded border border-emerald-200">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-600" />
                    <span>Earliest Date</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5 font-mono">
                    {earliestDate || 'N/A'}
                  </div>
                </div>

                {/* Metric 3: Latest Date */}
                <div className="p-2.5 bg-white/80 rounded border border-emerald-200">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-600" />
                    <span>Latest Date</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-800 mt-0.5 font-mono">
                    {latestDate || 'N/A'}
                  </div>
                </div>

                {/* Metric 4: Latest Close */}
                <div className="p-2.5 bg-white/80 rounded border border-emerald-200">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-600" />
                    <span>Latest Close</span>
                  </div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {latestClose !== null ? `$${latestClose.toFixed(2)}` : 'N/A'}
                  </div>
                </div>

                {/* Metric 5: Retrieval Timestamp */}
                <div className="p-2.5 bg-white/80 rounded border border-emerald-200 col-span-2 sm:col-span-1">
                  <div className="text-slate-500 text-[10px] uppercase font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    <span>Timestamp</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-700 mt-0.5">
                    {new Date(testResult.fetchedAt).toLocaleDateString()}{' '}
                    {new Date(testResult.fetchedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white/80 rounded border border-rose-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-rose-900">Diagnosis &amp; Error Details:</div>
                    <p className="text-rose-800 mt-0.5 leading-relaxed font-mono text-[11px]">
                      {testResult.message}
                    </p>
                    <p className="text-slate-500 text-[11px] mt-1.5">
                      Please ensure you have entered a valid Twelve Data API key and that your key is active.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
