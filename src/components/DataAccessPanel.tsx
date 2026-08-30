import React, { useState } from 'react';
import { KeyRound, Shield, Trash2, CheckCircle2, Lock, Cpu, Server } from 'lucide-react';
import { SessionApiKeys } from '../types';

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
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const hasTwelveData = Boolean(apiKeys.twelveDataApiKey.trim());
  const hasOpenRouter = Boolean(apiKeys.openRouterApiKey.trim());

  const handleClear = () => {
    onClearKeys();
    setShowClearConfirm(false);
  };

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

        {/* Clear Keys Button */}
        <div className="flex items-center gap-2">
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
      </div>
    </section>
  );
};
