import React, { useState } from 'react';
import {
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  Layers,
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Building,
  Tag,
} from 'lucide-react';
import { SymbolDataMap, SymbolDataRecord, FetchStatus } from '../types';
import { MIN_REQUIRED_DAILY_BARS } from '../services/portfolioLoader';

interface PortfolioDataStatusProps {
  dataMap: SymbolDataMap;
  isLoading: boolean;
  progressText: string;
  hasTwelveDataKey: boolean;
  onLoadData: () => void;
  onRetryFailedData?: () => void;
  onForceReloadAll?: () => void;
}

export const PortfolioDataStatus: React.FC<PortfolioDataStatusProps> = ({
  dataMap,
  isLoading,
  progressText,
  hasTwelveDataKey,
  onLoadData,
  onRetryFailedData,
  onForceReloadAll,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FetchStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const records: SymbolDataRecord[] = Object.values(dataMap);
  const totalCount = records.length;
  const successCount = records.filter((r) => r.status === 'success').length;
  const loadingCount = records.filter((r) => r.status === 'loading').length;
  const insufficientCount = records.filter((r) => r.status === 'insufficient-data').length;
  const failedCount = records.filter((r) => r.status === 'failed').length;
  const pendingCount = records.filter((r) => r.status === 'pending').length;
  const retryableCount = failedCount + insufficientCount;

  const categories = Array.from(new Set(records.map((r) => r.category)));

  // Filtered records for table display
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: FetchStatus) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Success</span>
          </span>
        );
      case 'loading':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin text-emerald-700" />
            <span>Loading</span>
          </span>
        );
      case 'insufficient-data':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-lime-100 text-lime-900 border border-lime-300" title="Fewer than 252 valid daily bars">
            <AlertTriangle className="w-3 h-3 text-lime-700" />
            <span>Insufficient data</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100/90 text-emerald-950 border border-emerald-400">
            <AlertCircle className="w-3 h-3 text-emerald-800" />
            <span>Failed</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <section id="portfolio-historical-data-section" className="mb-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-200 bg-slate-50/75 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="portfolio-data-heading" className="text-base sm:text-lg font-bold text-slate-900">
                  Portfolio Historical Data Engine
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-300 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  <span>20 Stocks + SPY</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Fetches ~600 daily price bars (min. {MIN_REQUIRED_DAILY_BARS} required) with max 3 concurrent API streams.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons & Live Progress */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {progressText && (
            <div
              id="portfolio-load-progress-indicator"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{progressText}</span>
            </div>
          )}

          {/* Retry failed data requests button - only active when failed or insufficient symbols exist */}
          {onRetryFailedData && retryableCount > 0 && (
            <button
              id="retry-failed-data-requests-button"
              type="button"
              onClick={onRetryFailedData}
              disabled={isLoading || !hasTwelveDataKey}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-emerald-950 bg-emerald-200 hover:bg-emerald-300 active:bg-emerald-400 border border-emerald-400 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              title={`Retry only the ${retryableCount} failed or insufficient-data symbols without re-fetching already successful data`}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Retry failed data requests ({retryableCount})</span>
            </button>
          )}

          <button
            id="load-portfolio-history-button"
            type="button"
            onClick={onLoadData}
            disabled={isLoading || !hasTwelveDataKey}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !hasTwelveDataKey
                ? 'Twelve Data API key required. Enter key in Data Access panel above.'
                : 'Fetch daily historical data for all 20 stocks and SPY benchmark'
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading Portfolio Data...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Load Portfolio Historical Data</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Bar / Metrics overview */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
          <div className="text-slate-500 text-[10px] uppercase font-semibold">Total Universe</div>
          <div className="text-base font-bold text-slate-900 mt-0.5">{totalCount} Symbols</div>
        </div>
        <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
          <div className="text-emerald-700 text-[10px] uppercase font-semibold">Success (≥252 bars)</div>
          <div className="text-base font-bold text-emerald-700 mt-0.5">{successCount} / {totalCount}</div>
        </div>
        <div className="p-2.5 bg-white rounded-lg border border-emerald-300">
          <div className="text-emerald-800 text-[10px] uppercase font-semibold">In Flight</div>
          <div className="text-base font-bold text-emerald-800 mt-0.5">{loadingCount} Active</div>
        </div>
        <div className="p-2.5 bg-white rounded-lg border border-lime-300">
          <div className="text-lime-800 text-[10px] uppercase font-semibold">Insufficient Data</div>
          <div className="text-base font-bold text-lime-800 mt-0.5">{insufficientCount}</div>
        </div>
        <div className="p-2.5 bg-white rounded-lg border border-emerald-300 col-span-2 sm:col-span-1">
          <div className="text-emerald-900 text-[10px] uppercase font-semibold">Failed / Error</div>
          <div className="text-base font-bold text-emerald-900 mt-0.5">{failedCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="portfolio-data-search-input"
            type="text"
            placeholder="Search ticker, company, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              id="status-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">All Statuses ({records.length})</option>
              <option value="success">Success ({successCount})</option>
              <option value="loading">Loading ({loadingCount})</option>
              <option value="insufficient-data">Insufficient Data ({insufficientCount})</option>
              <option value="failed">Failed ({failedCount})</option>
              <option value="pending">Pending ({pendingCount})</option>
            </select>
          </div>

          {/* Category Filter */}
          <select
            id="category-filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Historical Data Status Table */}
      <div className="overflow-x-auto">
        <table id="portfolio-data-status-table" className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Ticker</th>
              <th className="py-3 px-4">Company Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Fetch Status</th>
              <th className="py-3 px-4 text-center">Valid Bars</th>
              <th className="py-3 px-4">Earliest Date</th>
              <th className="py-3 px-4">Latest Date</th>
              <th className="py-3 px-4">Diagnostics / Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No symbols matching the selected filters.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => {
                const isBenchmark = record.ticker === 'SPY';
                return (
                  <tr
                    key={record.ticker}
                    id={`data-row-${record.ticker}`}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isBenchmark ? 'bg-emerald-100/40 font-medium' : ''
                    }`}
                  >
                    {/* Ticker */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{record.ticker}</span>
                        {isBenchmark && (
                          <span className="text-[9px] bg-emerald-200 text-emerald-950 font-sans px-1.5 py-0.5 rounded font-semibold">
                            Benchmark
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Company */}
                    <td className="py-3 px-4 text-slate-800">{record.company}</td>

                    {/* Category */}
                    <td className="py-3 px-4 text-slate-600">
                      <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {record.category}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">{getStatusBadge(record.status)}</td>

                    {/* Valid Bar Count */}
                    <td className="py-3 px-4 text-center font-mono font-semibold">
                      {record.validBarCount > 0 ? (
                        <span
                          className={
                            record.validBarCount >= MIN_REQUIRED_DAILY_BARS
                              ? 'text-emerald-700'
                              : 'text-lime-800'
                          }
                        >
                          {record.validBarCount}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Earliest Date */}
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {record.earliestDate || <span className="text-slate-400">-</span>}
                    </td>

                    {/* Latest Date */}
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {record.latestDate || <span className="text-slate-400">-</span>}
                    </td>

                    {/* Diagnostics / Error message */}
                    <td className="py-3 px-4 text-slate-600">
                      {record.errorMessage ? (
                        <span className="text-emerald-950 font-medium text-[11px] leading-tight block max-w-xs sm:max-w-sm">
                          {record.errorMessage}
                        </span>
                      ) : record.status === 'success' ? (
                        <span className="text-emerald-700 text-[11px] flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Complete time series cached in memory</span>
                        </span>
                      ) : record.status === 'loading' ? (
                        <span className="text-emerald-700 text-[11px] flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                          <span>Fetching ~600 daily bars...</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Ready for batch retrieval</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>In-Memory Only: Price data is stored in temporary JavaScript state and never persisted to localStorage.</span>
        </div>
        <div>
          <span>Requirement: 252+ daily trading sessions per asset</span>
        </div>
      </div>
    </section>
  );
};
