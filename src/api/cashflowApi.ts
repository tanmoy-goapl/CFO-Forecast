import type {
  HistoricalResponse,
  LatestPredictionNotFound,
  LatestPredictionResponse,
  LivePredictionRequest,
  MonthString,
  NoDataResponse,
  PredictionResponse,
  StoreStatusResponse,
} from "../types/cashflow";
import { apiClient } from "./client";
import { USE_MOCK_API } from "../constants/api";
import {
  fetch1MonthPredictionMock,
  fetch3MonthPredictionMock,
  fetchHistoricalMock,
  fetchLatestPredictionMock,
  fetchStoreStatusMock,
  triggerLivePredictionMock,
} from "./mockCashflowApi";

export async function fetchHistorical(month?: MonthString) {
  if (USE_MOCK_API) return fetchHistoricalMock(month);

  const { data } = await apiClient.get<HistoricalResponse | NoDataResponse>(
    "/api/historical",
    { params: month ? { month } : {} },
  );

  return data;
}

export async function fetch1MonthPrediction(month?: MonthString) {
  if (USE_MOCK_API) return fetch1MonthPredictionMock(month);

  const { data } = await apiClient.get<PredictionResponse | NoDataResponse>(
    "/api/predictions/1month",
    { params: month ? { month } : {} },
  );

  return data;
}

export async function fetch3MonthPrediction(month?: MonthString) {
  if (USE_MOCK_API) return fetch3MonthPredictionMock(month);

  const { data } = await apiClient.get<PredictionResponse | NoDataResponse>(
    "/api/predictions/3month",
    { params: month ? { month } : {} },
  );

  return data;
}

export async function fetchLatestPrediction() {
  if (USE_MOCK_API) return fetchLatestPredictionMock();

  const { data } = await apiClient.get<
    LatestPredictionResponse | LatestPredictionNotFound
  >("/api/predictions/latest");

  return data;
}

// Triggers an on-demand retrain (~45-50s on the real backend). Result is the
// same shape as fetchLatestPrediction and is also persisted server-side to
// results/live_prediction.json.
export async function triggerLivePrediction(body: LivePredictionRequest = {}) {
  if (USE_MOCK_API) return triggerLivePredictionMock(body);

  const { data } = await apiClient.post<LatestPredictionResponse>(
    "/api/predict/live",
    body,
  );

  return data;
}

export async function fetchStoreStatus() {
  if (USE_MOCK_API) return fetchStoreStatusMock();

  const { data } = await apiClient.get<StoreStatusResponse>(
    "/api/store/status",
  );

  return data;
}
// V1 code

// const BASE_URL = 'http://10.10.90.91:8061';

// import type { FilterState, CashForecastResponse } from '../types/cashForecast';

// /* ─── Fetch Accounts ───────────────────────────────────────── */

// export async function fetchAccounts(companyId: number) {
//   const res = await fetch(
//     `${BASE_URL}/api/v1/cash-flow/accounts?company_id=${companyId}`
//   );

//   if (!res.ok) throw new Error('Failed to fetch accounts');

//   const data = await res.json();

//   // normalize API response
//   return {
//     company_id: data.company_id,
//     accounts: data.parties ?? [],
//     total: data.total,
//   };
// }

// /* ─── Fetch Forecast ───────────────────────────────────────── */

// export async function fetchCashForecast(
//   filters: FilterState,
//   companyId = 1
// ): Promise<CashForecastResponse> {
//   const params = new URLSearchParams({
//     company_id: String(companyId),
//     history_months: String(filters.historicalMonths),
//     forecast_months: String(filters.forecastMonths),
//     ma_window: String(filters.maWindow),
//   });

//   // Only add accounts if selected
//   if (filters.accounts.length > 0) {
//     params.append('accounts', filters.accounts.join(','));
//   }

//   const res = await fetch(
//     `${BASE_URL}/api/v1/cash-flow/historical?${params.toString()}`
//   );

//   if (!res.ok) throw new Error('Failed to fetch forecast');

//   return res.json();
// }