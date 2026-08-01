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
import {
  build1MonthResponse,
  build3MonthResponse,
  buildHistoricalResponse,
  buildLatestPredictionResponse,
  buildStoreStatusResponse,
} from "./mockData";

// Simulates real network latency so loading states are visible while testing CSS.
function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function filterByMonth<T extends HistoricalResponse | PredictionResponse>(
  response: T,
  month?: MonthString,
): T | NoDataResponse {
  if (!month) return response;
  if (!response.months.includes(month)) {
    return {
      status: "no_data",
      message: `No data available for month ${month}. Available months: [${response.months.join(", ")}]`,
      requested_month: month,
    };
  }
  return {
    ...response,
    months: [month],
    totals: { [month]: response.totals[month] } as T["totals"],
    by_customer: { [month]: response.by_customer[month] } as T["by_customer"],
    by_vendor: { [month]: response.by_vendor[month] } as T["by_vendor"],
    components: { [month]: response.components[month] } as T["components"],
  };
}

export async function fetchHistoricalMock(month?: MonthString): Promise<HistoricalResponse | NoDataResponse> {
  return delay(filterByMonth(buildHistoricalResponse(), month));
}

export async function fetch1MonthPredictionMock(month?: MonthString): Promise<PredictionResponse | NoDataResponse> {
  return delay(filterByMonth(build1MonthResponse(), month));
}

export async function fetch3MonthPredictionMock(month?: MonthString): Promise<PredictionResponse | NoDataResponse> {
  return delay(filterByMonth(build3MonthResponse(), month));
}

let liveOverride: LatestPredictionResponse | null = null;

export async function fetchLatestPredictionMock(): Promise<LatestPredictionResponse | LatestPredictionNotFound> {
  return delay(liveOverride ?? buildLatestPredictionResponse());
}

export async function triggerLivePredictionMock(
  body: LivePredictionRequest = {},
): Promise<LatestPredictionResponse> {
  const base = buildLatestPredictionResponse();
  liveOverride = {
    ...base,
    mode: body.mode ?? base.mode,
    prediction_month: body.month ?? base.prediction_month,
    generated_at: new Date().toISOString(),
  };
  // Real endpoint takes ~45-50s; mock uses a shorter delay so retries in dev don't feel broken.
  return delay(liveOverride, 1200);
}

export async function fetchStoreStatusMock(): Promise<StoreStatusResponse> {
  return delay(buildStoreStatusResponse());
}