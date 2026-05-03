import type { CashForecastResponse, FilterState } from '../types/cashForecast';

const BASE_URL = 'http://10.10.90.91:8061';

export async function fetchCashForecast(
  filters: FilterState
): Promise<CashForecastResponse> {
  const params = new URLSearchParams({
    company_id: '1',
    history_months: String(filters.historicalMonths),
    forecast_months: String(filters.forecastMonths),
    ma_window: String(filters.maWindow),
    accounts: filters.accounts.join(','),
  });

  const res = await fetch(`${BASE_URL}/api/v1/cash-flow/historical?${params.toString()}`, {
    headers: {
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const data = await res.json();

  return data;
}