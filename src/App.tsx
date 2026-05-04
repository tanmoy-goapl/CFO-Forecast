import { useState, useEffect, useCallback } from 'react';
import { Divider, Spin, Alert } from 'antd';
import { BarChart2 } from 'lucide-react';

import type { CashForecastResponse, FilterState } from './types/cashForecast';
import { computeKPIs } from './utils/chartHelpers';
import { formatMonth } from './utils/formatters';

import { FilterBar } from './components/FilterBar/FilterBar';
import { KPICards } from './components/KPICards/KPICards';
import { CashFlowChart } from './components/CashFlowChart/CashFlowChart';
import { CashFlowTable } from './components/CashFlowTable/CashFlowTable';

import { fetchCashForecast, fetchAccounts } from './api/cashflowApi';

/* ─────────────────────────────────────────────────────────── */

const DEFAULT_FILTERS: FilterState = {
  accounts: [],
  historicalMonths: 12,
  forecastMonths: 3,
  maWindow: 3,
};

function App() {
  const [data, setData] = useState<CashForecastResponse | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ─── Load Accounts (ONCE) ─────────────────────────────── */

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const res = await fetchAccounts(1);

        setAvailableAccounts(res.accounts);

        // default select all
        setFilters(prev =>
          prev.accounts.length === 0
            ? { ...prev, accounts: res.accounts.slice(0, 3) }
            : prev
        );
      } catch (e) {
        console.error('Failed to load accounts', e);
        setError('Failed to load accounts');
      }
    };

    loadAccounts();
  }, []);

  /* ─── Load Forecast ────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetchCashForecast(filters);
      setData(res);
    } catch (e) {
      console.error(e);
      setError('Failed to load cash forecast data.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [filters, load]);

  const effectiveAccounts =
    filters.accounts.length > 0
      ? filters.accounts
      : data?.meta.accounts_selected ?? [];

  /* ─── KPIs ─────────────────────────────────────────────── */

  const kpis = data ? computeKPIs(data, {
    ...filters,
    accounts: effectiveAccounts
  }) : null;

  /* ─── Period Label ─────────────────────────────────────── */

  const periodLabel = (() => {
    if (!data) return '';

    const act = data.total_series
      .filter(d => d.type === 'actual')
      .slice(-filters.historicalMonths);

    const fct = data.total_series
      .filter(d => d.type === 'forecast')
      .slice(0, filters.forecastMonths);

    if (!act.length) return '';

    const end = fct.length
      ? fct[fct.length - 1].month
      : act[act.length - 1].month;

    return `${formatMonth(act[0].month)} – ${formatMonth(end)}`;
  })();

  /* ─────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <BarChart2 size={20} className="text-blue-600 mt-0.5" />
            <div>
              <h1 className="text-[17px] font-medium text-gray-900">
                Cash Flow Forecast
              </h1>
              <p className="text-xs text-gray-400">{periodLabel}</p>
            </div>
          </div>

          {data?.meta.as_of_date && (
            <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 rounded px-2.5 py-1">
              As of {data.meta.as_of_date}
            </span>
          )}
        </div>

        {/* Error */}
        {error && <Alert type="error" message={error} className="mb-4" />}

        {/* Filters */}
        <FilterBar
          availableAccounts={availableAccounts}
          filters={filters}
          onChange={setFilters}
          onGenerate={load}
          loading={loading}
        />

        {/* KPIs */}
        {kpis && (
          <KPICards
            currentBalance={kpis.currentBalance}
            avgInflow={kpis.avgInflow}
            avgOutflow={kpis.avgOutflow}
            forecastClosing={kpis.forecastClosing}
            forecastLabel={kpis.forecastLabel}
            historicalMonths={filters.historicalMonths}
          />
        )}

        {/* Loading */}
        {loading && !data && (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        )}

        {/* Chart + Table */}
        {data && (
          <>
            <div className="bg-white border border-gray-200 rounded-lg px-5 py-4">
              <CashFlowChart data={data} filters={{ ...filters, accounts: effectiveAccounts }} isAllAccounts={filters.accounts.length === 0}
              />
            </div>

            <Divider className="my-5" />

            <CashFlowTable data={data} filters={{ ...filters, accounts: effectiveAccounts }}
            />
          </>
        )}

        {/* Empty State */}
        {/* {!filters.accounts.length && (
          <div className="text-center text-gray-400 py-16 text-sm">
            Select at least one account to view the forecast.
          </div>
        )} */}
      </div>
    </div>
  );
}

export default App;