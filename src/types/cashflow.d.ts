export type MonthString = `${number}-${number}${number}`; // YYYY-MM

export type ForecastMode = "historical" | "1month" | "3month" | "live" | "live3";

export interface Totals {
  ar_inflow: number;
  ap_outflow: number;
  net_cf: number;
}

export interface Breakdown {
  open: number;
  new: number;
  total: number;
}

export interface Components {
  ar_open: number;
  ar_new: number;
  ap_open: number;
  ap_new: number;
}

export interface AverageStats {
  avg_ar_inflow: number;
  avg_ap_outflow: number;
  avg_net_cf: number;
  n_months: number
}

export interface NoDataResponse {
  status: "no_data";
  message: string;
  requested_month: MonthString;
}

export interface HistoricalResponse {
  generated_at: string;
  mode: null;

  months: MonthString[];

  totals: Record<MonthString, Totals>;

  by_customer: Record<MonthString, Record<string, number>>;

  by_vendor: Record<MonthString, Record<string, number>>;

  components: Record<MonthString, Record<string, never>>;

  average: AverageStats;
}

export interface PredictionResponse {
  generated_at: string;

  mode: "1-month" | "3-month";

  months: MonthString[];

  totals: Record<MonthString, Totals>;

  by_customer: Record<MonthString, Record<string, Breakdown>>;

  by_vendor: Record<MonthString, Record<string, Breakdown>>;

  components: Record<MonthString, Components>;

    average: AverageStats;

}

export interface LatestPredictionResponse {
  generated_at: string;
  mode: "1-month" | "3-month";

  prediction_month: MonthString;
  training_cutoff: string;

  totals: Totals;

  components: Components;

  by_customer: Record<string, Breakdown>;

  by_vendor: Record<string, Breakdown>;

  average: AverageStats;
}

export interface LatestPredictionNotFound {
  detail: string;
}

export interface LivePredictionRequest {
  mode?: "1-month" | "3-month";
  month?: MonthString;
}

export interface StoreStatusResponse {
  historical_truths: { generated_at: string; months: MonthString[] };
  predictions_1month: { generated_at: string; months: MonthString[] };
  predictions_3month: { generated_at: string; months: MonthString[] };
  live_prediction: {
    mode: "1-month" | "3-month";
    prediction_month: MonthString;
    training_cutoff: string;
    generated_at: string;
    totals: Totals;
  } | null;
}

export interface Live3ForecastMonth {
  totals: Totals;
  components: Components;
  by_customer: Record<string, Breakdown>;
  by_vendor: Record<string, Breakdown>;
}

export interface Latest3PredictionResponse {
  generated_at: string;
  mode: "3-month";
  training_cutoff: string;
  start_month: MonthString;
  months: MonthString[];
  forecasts: Record<MonthString, Live3ForecastMonth>;

  average: AverageStats;
}

export interface Latest3NotFound {
  detail: string;
}