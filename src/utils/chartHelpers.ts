import type { SeriesEntry, ChartDataPoint, FilterState, CashForecastResponse } from '../types/cashForecast';
import { formatMonth } from './formatters';

export const ACCOUNT_COLORS: Record<string, string> = {
  HDFC:  '#185FA5',
  ICICI: '#3B6D11',
  SBI:   '#854F0B',
  Total: '#1a1a1a',
};

/** Default fallback color if an account isn't in the map */
export function accountColor(acc: string): string {
  return ACCOUNT_COLORS[acc] ?? '#6B7280';
}

/**
 * Build the flat array that recharts consumes.
 *
 * For each month we produce keys:
 *   {ACC}_act   → closing_cash for actual months (null for forecast)
 *   {ACC}_fct   → closing_cash for forecast months (null for actual,
 *                  EXCEPT the last actual month which is echoed in both
 *                  to create a seamless visual join)
 *   Total_act / Total_fct → same but summed across selected accounts
 */
export function buildChartData(
  data: CashForecastResponse,
  filters: FilterState,
): ChartDataPoint[] {
  const { accounts, historicalMonths: hN, forecastMonths: fN } = filters;

  const allActual  = data.total_series.filter(d => d.type === 'actual').slice(-hN);
  const allForecast = data.total_series.filter(d => d.type === 'forecast').slice(0, fN);
  const allMonths   = [...allActual, ...allForecast];

  return allMonths.map((row, idx) => {
    const isForecast     = row.type === 'forecast';
    const isLastActual   = idx === allActual.length - 1;

    const point: ChartDataPoint = {
      month: row.month,
      label: formatMonth(row.month),
      type:  row.type,
    };

    let totalActVal = 0;
    let totalFctVal = 0;

    for (const acc of accounts) {
      const entry: SeriesEntry | undefined = data.series[acc]?.find(s => s.month === row.month);
      const val = entry?.closing_cash ?? null;

      if (!isForecast) {
        point[`${acc}_act`] = val;
        point[`${acc}_fct`] = isLastActual ? val : null; // bridge point
        if (val) totalActVal += val;
      } else {
        point[`${acc}_act`] = null;
        point[`${acc}_fct`] = val;
        if (val) totalFctVal += val;
      }
    }

    if (!isForecast) {
      point['Total_act'] = totalActVal || null;
      point['Total_fct'] = isLastActual ? (totalActVal || null) : null;
    } else {
      point['Total_act'] = null;
      point['Total_fct'] = totalFctVal || null;
    }

    return point;
  });
}

/**
 * Compute KPI values dynamically from the selected accounts + period.
 */
export function computeKPIs(data: CashForecastResponse, filters: FilterState) {
  const { accounts, historicalMonths: hN, forecastMonths: fN } = filters;

  let currentBalance  = 0;
  let totalInflow     = 0;
  let totalOutflow    = 0;
  let forecastClosing = 0;
  let nMonths         = 0;

  for (const acc of accounts) {
    const s = data.series[acc] ?? [];
    const actual   = s.filter(d => d.type === 'actual').slice(-hN);
    const forecast = s.filter(d => d.type === 'forecast').slice(0, fN);

    if (actual.length) currentBalance += actual[actual.length - 1].closing_cash;
    actual.forEach(d => { totalInflow += d.inflow; totalOutflow += d.outflow; });
    if (nMonths === 0) nMonths = actual.length; // assume all accounts have same n
    if (forecast.length) forecastClosing += forecast[forecast.length - 1].closing_cash;
  }

  const avgInflow  = nMonths ? totalInflow  / nMonths : 0;
  const avgOutflow = nMonths ? totalOutflow / nMonths : 0;

  // Label for the last forecast month
  const allForecast = data.total_series.filter(d => d.type === 'forecast').slice(0, fN);
  const forecastLabel = allForecast.length
    ? formatMonth(allForecast[allForecast.length - 1].month)
    : '';

  return { currentBalance, avgInflow, avgOutflow, forecastClosing, forecastLabel, nMonths: hN };
}

/** Index (0-based) in the chart labels array where the forecast begins */
export function forecastStartIndex(data: CashForecastResponse, hN: number): number {
  return data.total_series.filter(d => d.type === 'actual').slice(-hN).length;
}
