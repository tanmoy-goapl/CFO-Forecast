export type EntryType = 'actual' | 'forecast';

export interface SeriesEntry {
  month: string; // "YYYY-MM"
  closing_cash: number;
  inflow: number;
  outflow: number;
  type: EntryType;
}

export interface KPIs {
  current_cash_balance: number;
  current_cash_balance_display: string;
  avg_monthly_inflow: number;
  avg_monthly_inflow_display: string;
  avg_monthly_outflow: number;
  avg_monthly_outflow_display: string;
  avg_net_cash_flow: number;
  avg_net_cash_flow_display: string;
  forecast_closing_cash: number;
  forecast_closing_cash_display: string;
  forecast_period_label: string;
  historical_period_label: string;
}

export interface CashForecastMeta {
  accounts_available: string[];
  accounts_selected: string[];
  historical_months: number;
  forecast_months: number;
  ma_window: number;
  as_of_date: string;
  generated_at: string;
  currency: string;
}

export interface CashForecastResponse {
  status: string;
  kpis: KPIs;
  series: Record<string, SeriesEntry[]>;
  total_series: SeriesEntry[];
  meta: CashForecastMeta;
}

export interface FilterState {
  accounts: string[];
  historicalMonths: number;
  forecastMonths: number;
  maWindow: number;
}

/** Flat object used as a single recharts data point */
export interface ChartDataPoint {
  month: string;
  label: string; // formatted month label e.g. "Apr'25"
  type: EntryType;
  [key: string]: string | number | null; // e.g. HDFC_act, HDFC_fct, Total_act, Total_fct
}
