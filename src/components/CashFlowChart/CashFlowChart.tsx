import React, { useState, useCallback } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { Checkbox } from 'antd';
import type { ChartDataPoint, CashForecastResponse, FilterState } from '../../types/cashForecast';
import { buildChartData, forecastStartIndex, accountColor, ACCOUNT_COLORS } from '../../utils/chartHelpers';
import { formatINR, formatINRShort } from '../../utils/formatters';

/* ─── Custom Tooltip ──────────────────────────────────────────── */

const CustomTooltip: React.FC<TooltipProps<number, string> & { accounts: string[]; showIndividual: boolean }> = ({
  active, payload, label, accounts, showIndividual,
}) => {
  if (!active || !payload?.length) return null;

  // Deduplicate: only show _act keys (forecast values shown via _fct at bridge)
  const seen = new Set<string>();
  const items: { name: string; value: number; color: string; isForecast: boolean }[] = [];

  payload.forEach(p => {
    if (!p.dataKey || p.value == null) return;
    const key = String(p.dataKey);
    const base = key.replace(/_act$|_fct$/, '');
    if (seen.has(base)) return;
    seen.add(base);
    const isF = key.endsWith('_fct');
    items.push({ name: base === 'Total' ? 'Total (all)' : base, value: p.value as number, color: ACCOUNT_COLORS[base] ?? '#999', isForecast: isF });
  });

  // Sort: Total last
  items.sort((a, b) => (a.name.startsWith('Total') ? 1 : -1) - (b.name.startsWith('Total') ? 1 : -1));

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 text-xs min-w-[160px]">
      <p className="font-medium text-gray-700 mb-2">{label}</p>
      {items.map(it => (
        <div key={it.name} className="flex justify-between items-center gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: it.color }} />
            {it.name}
            {it.isForecast && <span className="text-[9px] text-blue-400 ml-0.5">est.</span>}
          </span>
          <span className="font-medium tabular-nums" style={{ color: it.color }}>
            {formatINR(it.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─── Chart Legend ────────────────────────────────────────────── */

const ChartLegend: React.FC<{ accounts: string[]; showIndividual: boolean }> = ({ accounts, showIndividual }) => (
  <div className="flex flex-wrap gap-4 items-center text-xs text-gray-600">
    {showIndividual && accounts.map(acc => (
      <span key={acc} className="flex items-center gap-1.5">
        <span className="inline-block w-5 h-0.5 rounded" style={{ background: accountColor(acc) }} />
        {acc}
      </span>
    ))}
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-5 rounded" style={{ height: 3, background: ACCOUNT_COLORS.Total }} />
      <strong className="font-medium text-gray-800">Total</strong>
    </span>
    <span className="flex items-center gap-1.5 ml-1">
      <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="#aaa" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
      <span className="text-gray-400">Forecast</span>
    </span>
  </div>
);

/* ─── Main Component ─────────────────────────────────────────── */

interface CashFlowChartProps {
  data: CashForecastResponse;
  filters: FilterState;
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ data, filters }) => {
  const [showIndividual, setShowIndividual] = useState(true);

  const chartData: ChartDataPoint[] = buildChartData(data, filters);
  const fsi = forecastStartIndex(data, filters.historicalMonths);

  // All dataKeys for Lines
  const accLines = showIndividual ? filters.accounts : [];
  const fcastRefMonth = chartData[fsi]?.label;

  const yFormatter = useCallback((v: number) => formatINRShort(v), []);

  return (
    <div>
      {/* Chart header row */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <ChartLegend accounts={filters.accounts} showIndividual={showIndividual} />
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
          <Checkbox
            checked={showIndividual}
            onChange={e => setShowIndividual(e.target.checked)}
          />
          Show individual accounts
        </label>
      </div>

      {/* Chart */}
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />

            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={yFormatter}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              width={54}
            />

            <Tooltip
              content={<CustomTooltip accounts={filters.accounts} showIndividual={showIndividual} />}
              cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }}
            />

            {/* Forecast zone reference line */}
            {fcastRefMonth && (
              <ReferenceLine
                x={fcastRefMonth}
                stroke="#93C5FD"
                strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{
                  value: 'Forecast →',
                  position: 'insideTopRight',
                  fill: '#93C5FD',
                  fontSize: 10,
                  offset: 6,
                }}
              />
            )}

            {/* Per-account lines (actual + forecast pair) */}
            {accLines.map(acc => (
              <React.Fragment key={acc}>
                <Line
                  dataKey={`${acc}_act`}
                  stroke={accountColor(acc)}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                  connectNulls={false}
                  name={acc}
                />
                <Line
                  dataKey={`${acc}_fct`}
                  stroke={accountColor(acc)}
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={false}
                  connectNulls={false}
                  legendType="none"
                />
              </React.Fragment>
            ))}

            {/* Total lines — always shown */}
            <Line
              dataKey="Total_act"
              stroke={ACCOUNT_COLORS.Total}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
              connectNulls={false}
              name="Total"
            />
            <Line
              dataKey="Total_fct"
              stroke={ACCOUNT_COLORS.Total}
              strokeWidth={3}
              strokeDasharray="6 4"
              dot={false}
              activeDot={false}
              connectNulls={false}
              legendType="none"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
