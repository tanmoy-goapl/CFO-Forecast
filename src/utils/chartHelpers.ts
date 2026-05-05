import type { ChartDataPoint, FilterState, CashForecastResponse, SeriesEntry } from '../types/cashForecast';
import { formatMonth } from './formatters';

/* ─── Colour palette ─────────────────────────────────────────── */

const COLOR_POOL = [
  '#2563EB', // blue
  '#16A34A', // green
  '#DC2626', // red
  '#CA8A04', // yellow (mustard)
  '#7C3AED', // purple
  '#0891B2', // teal
  '#EA580C', // orange
  '#4B5563', // slate (neutral)
  '#BE185D', // rose (deeper than pink)
  '#0F766E', // dark teal (distinct from cyan)
];

export const ACCOUNT_COLORS: Record<string, string> = {
  Total: 'black',
};

export function accountColor(acc: string): string {
  if (acc === 'Total') return ACCOUNT_COLORS.Total;
  if (!ACCOUNT_COLORS[acc]) {
    const idx = Object.keys(ACCOUNT_COLORS).filter(k => k !== 'Total').length;
    ACCOUNT_COLORS[acc] = COLOR_POOL[idx % COLOR_POOL.length];
  }
  return ACCOUNT_COLORS[acc];
}

/* ─── buildChartData ─────────────────────────────────────────── */
/**
 * Build the flat array Recharts consumes.
 *
 * KEY FIX: Total_act / Total_fct always come from total_series.net_cash_flow.
 * Previously they were summed from per-account entries, which:
 *   • returned 0 when accounts=[] (all-accounts mode), and
 *   • diverged from the server total when accounts are selected
 *     (individual series may have sparse / missing months).
 *
 * Per-account keys ({ACC}_act / {ACC}_fct) still read from data.series[acc].
 *
 * Bridge point: the last actual month echoes its value into both
 * _act and _fct so the two line segments visually connect.
 */
export function buildChartData(
  data: CashForecastResponse,
  filters: FilterState,
): ChartDataPoint[] {
  const { accounts, historicalMonths: hN, forecastMonths: fN } = filters;

  const allActual = data.total_series.filter(d => d.type === 'actual').slice(-hN);
  const allForecast = data.total_series.filter(d => d.type === 'forecast').slice(0, fN);
  const allMonths = [...allActual, ...allForecast];

  return allMonths.map((row, idx) => {
    const isForecast = row.type === 'forecast';
    const isLastActual = !isForecast && idx === allActual.length - 1;

    const point: ChartDataPoint = {
      month: row.month,
      label: formatMonth(row.month),
      type: row.type,
    };

    // ── Total: always from total_series.net_cash_flow ──────────
    if (!isForecast) {
      point['Total_act'] = row.net_cash_flow;
      point['Total_fct'] = isLastActual ? row.net_cash_flow : null; // bridge
    } else {
      point['Total_act'] = null;
      point['Total_fct'] = row.net_cash_flow;
    }

    // ── Per-account: from data.series[acc].net_cash_flow ───────
    for (const acc of accounts) {
      const entry: SeriesEntry | undefined =
        data.series[acc]?.find(s => s.month === row.month);
      const val = entry?.net_cash_flow ?? null;

      if (!isForecast) {
        point[`${acc}_act`] = val;
        point[`${acc}_fct`] = isLastActual ? val : null; // bridge
      } else {
        point[`${acc}_act`] = null;
        point[`${acc}_fct`] = val;
      }
    }

    return point;
  });
}

type KPIResult = {
  currentBalance: string;
  avgInflow: string;
  avgOutflow: string;
  forecastClosing: string;
  forecastLabel: string;
};

export function computeKPIs(
  data: CashForecastResponse | null
): KPIResult {
  const loadingText = 'Loading...';
  if (!data) {
    return {
      currentBalance: loadingText,
      avgInflow: loadingText,
      avgOutflow: loadingText,
      forecastClosing: loadingText,
      forecastLabel: loadingText,
    };
  }

  // All-accounts mode → trust server KPIs
  return {
    currentBalance: data.kpis.current_cash_balance_display,
    avgInflow: data.kpis.avg_monthly_inflow_display,
    avgOutflow: data.kpis.avg_monthly_outflow_display,
    forecastClosing: data.kpis.forecast_closing_cash_display,
    forecastLabel: data.kpis.forecast_period_label,
  };
}

/* ─── forecastStartIndex ─────────────────────────────────────── */
/** 0-based index in the chart labels array where the forecast begins */
export function forecastStartIndex(data: CashForecastResponse, hN: number): number {
  return data.total_series.filter(d => d.type === 'actual').slice(-hN).length;
}