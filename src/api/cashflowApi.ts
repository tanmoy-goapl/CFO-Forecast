import type { CashForecastResponse, FilterState } from '../types/cashForecast';
import { MOCK_RESPONSE } from '../data/mockData';

// ─── Config ────────────────────────────────────────────────────────────────
const USE_MOCK   = false;   // ← flip to true to use local mock data
const API_BASE   = 'http://10.10.90.91:8061';
const ENDPOINT   = '/api/v1/cash-flow/historical';

// ─── Main fetch function ────────────────────────────────────────────────────
export async function fetchCashForecast(
  filters?: Partial<FilterState>,
): Promise<CashForecastResponse> {
  if (USE_MOCK) {
    await new Promise(r => setTimeout(r, 500)); // simulate latency
    return MOCK_RESPONSE;
  }

  const params = new URLSearchParams({
    history_months:  String(filters?.historicalMonths ?? 12),
    forecast_months: String(filters?.forecastMonths   ?? 3),
    ma_window:       String(filters?.maWindow         ?? 3),
    // company_id: omitted (not required yet)
    // accounts:   omitted (not filtering by account yet)
  });

  const url = `${API_BASE}${ENDPOINT}?${params.toString()}`;

  const res = await fetch(url, {
    method:  'GET',
    headers: { accept: 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  const json: CashForecastResponse = await res.json();
  return json;
}