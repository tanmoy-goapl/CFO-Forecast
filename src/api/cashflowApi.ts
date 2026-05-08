const BASE_URL = 'http://10.10.90.91:8061';

import type { FilterState, CashForecastResponse } from '../types/cashForecast';

/* ─── Fetch Accounts ───────────────────────────────────────── */

export async function fetchAccounts(companyId: number) {
  const res = await fetch(
    `${BASE_URL}/api/v1/cash-flow/accounts?company_id=${companyId}`
  );

  if (!res.ok) throw new Error('Failed to fetch accounts');

  const data = await res.json();

  // normalize API response
  return {
    company_id: data.company_id,
    accounts: data.parties ?? [],
    total: data.total,
  };
}

/* ─── Fetch Forecast ───────────────────────────────────────── */

export async function fetchCashForecast(
  filters: FilterState,
  companyId = 1
): Promise<CashForecastResponse> {
  const params = new URLSearchParams({
    company_id: String(companyId),
    history_months: String(filters.historicalMonths),
    forecast_months: String(filters.forecastMonths),
    ma_window: String(filters.maWindow),
  });

  // Only add accounts if selected
  if (filters.accounts.length > 0) {
    params.append('accounts', filters.accounts.join(','));
  }

  const res = await fetch(
    `${BASE_URL}/api/v1/cash-flow/historical?${params.toString()}`
  );

  if (!res.ok) throw new Error('Failed to fetch forecast');

  return res.json();
}