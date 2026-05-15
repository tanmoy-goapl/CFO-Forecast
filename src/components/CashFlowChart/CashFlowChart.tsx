import React, { useState, useCallback, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { TooltipContentProps } from 'recharts';
import { Checkbox } from 'antd';
import type { ChartDataPoint, CashForecastResponse, FilterState } from '../../types/cashForecast';
import {
  buildChartData,
  forecastStartIndex,
  accountColor,
  ACCOUNT_COLORS,
} from '../../utils/chartHelpers';
import { formatINR, formatINRShort } from '../../utils/formatters';
import { Tooltip as AntdTooltip } from 'antd';

/* ─── Tooltip ────────────────────────────────────────────────── */

type CustomTooltipProps = TooltipContentProps<number, string> & {
  showIndividual: boolean;
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  showIndividual,
}) => {
  if (!active || !payload?.length) return null;

  const seen = new Set<string>();

  const items: {
    name: string;
    value: number;
    color: string;
    isForecast: boolean;
    isTotal: boolean;
  }[] = [];

  payload.forEach((p) => {
    if (!p.dataKey || p.value == null) return;

    const key = String(p.dataKey);
    const base = key.replace(/_act$|_fct$/, '');

    if (seen.has(base)) return;
    seen.add(base);

    items.push({
      name: base === 'Total' ? 'Total Net Cash Flow' : base,
      value: Number(p.value),
      color: ACCOUNT_COLORS[base] ?? '#999',
      isForecast: key.endsWith('_fct'),
      isTotal: base === 'Total',
    });
  });

  // Sort: individual accounts first, Total last
  items.sort((a, b) => (a.isTotal ? 1 : 0) - (b.isTotal ? 1 : 0));

  const accountItems = items.filter(it => !it.isTotal);
  const totalItems = items.filter(it => it.isTotal);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 text-xs min-w-[200px]">
      <p className="font-medium text-gray-700 mb-2">{label}</p>

      {showIndividual && accountItems.length > 0 && (
        <>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
            Accounts (left axis)
          </p>
          {accountItems.map((it) => (
            <div key={it.name} className="flex justify-between items-center gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-gray-600 truncate" title={it.name}>
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block flex-shrink-0"
                  style={{ background: it.color }}
                />
                <span className="truncate max-w-[120px]">{it.name}</span>
                {it.isForecast && (
                  <span className="text-[9px] text-blue-400 ml-0.5 flex-shrink-0">est.</span>
                )}
              </span>
              <span
                className="font-semibold tabular-nums flex-shrink-0"
                style={{ color: it.value >= 0 ? '#3B6D11' : '#A32D2D' }}
              >
                {it.value >= 0 ? '+' : ''}
                {formatINR(it.value)}
              </span>
            </div>
          ))}
          {totalItems.length > 0 && (
            <div className="border-t border-gray-100 mt-2 pt-2" />
          )}
        </>
      )}

      {totalItems.length > 0 && (
        <>
          {showIndividual && accountItems.length > 0 && (
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
              Total (right axis)
            </p>
          )}
          {totalItems.map((it) => (
            <div key={it.name} className="flex justify-between items-center gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-gray-600">
                <span
                  className="w-2.5 h-0.5 inline-block flex-shrink-0 rounded"
                  style={{ background: it.color }}
                />
                <strong className="font-medium">{it.name}</strong>
                {it.isForecast && (
                  <span className="text-[9px] text-blue-400 ml-0.5">est.</span>
                )}
              </span>
              <span
                className="font-semibold tabular-nums"
                style={{ color: it.value >= 0 ? '#3B6D11' : '#A32D2D' }}
              >
                {it.value >= 0 ? '+' : ''}
                {formatINR(it.value)}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

/* ─── Legend ─────────────────────────────────────────────────── */

const ChartLegend: React.FC<{ accounts: string[]; showIndividual: boolean }> = ({
  accounts,
  showIndividual,
}) => (
  <div className="flex flex-wrap gap-4 items-center text-xs text-gray-600">
    {showIndividual &&
      accounts?.map(acc => (
        <span key={acc} className="flex items-center gap-1.5" title={acc}>
          {/* Stacked bar swatch */}
          <span
            className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
            style={{ background: accountColor(acc) }}
          />
          <AntdTooltip title={acc}>
            <span className="truncate max-w-[160px] cursor-default">
              {acc}
            </span>
          </AntdTooltip>
        </span>
      ))}

    <span className="flex items-center gap-1.5">
      <span
        className="inline-block w-5 rounded flex-shrink-0"
        style={{ height: 3, background: ACCOUNT_COLORS.Total }}
      />
      <strong className="font-medium text-gray-800">Total Net Cash Flow</strong>
    </span>

    <span className="flex items-center gap-1.5 ml-1">
      <svg width="20" height="10">
        <line
          x1="0" y1="5" x2="20" y2="5"
          stroke="#111111" strokeWidth="1.5" strokeDasharray="4 3"
        />
      </svg>
      <span className="text-gray-800">Forecast</span>
    </span>

    {showIndividual && accounts.length > 0 && (
      <>
        <span className="text-gray-300">|</span>
        <span className="text-[10px] text-gray-400">
          Bars → left axis &nbsp;·&nbsp; Line → right axis
        </span>
      </>
    )}
  </div>
);

/* ─── Main ───────────────────────────────────────────────────── */

interface CashFlowChartProps {
  data: CashForecastResponse;
  filters: FilterState;
  isAllAccounts: boolean;
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({
  data,
  filters,
  isAllAccounts,
}) => {
  const [showIndividual, setShowIndividual] = useState(true);

  useEffect(() => {
    if (isAllAccounts) setShowIndividual(false);
  }, [isAllAccounts]);

  useEffect(() => {
    if (filters.accounts.length > 0) setShowIndividual(true);
  }, [filters.accounts]);

  const chartData: ChartDataPoint[] = buildChartData(data, filters);
  const fsi = forecastStartIndex(data, filters.historicalMonths);
  const fcastRefMonth = chartData[fsi]?.label;

  // When showIndividual is active, accounts go as stacked bars on left axis;
  // Total stays as a line on the right axis. Otherwise, single-axis line chart.
  const useDualAxis = showIndividual && filters.accounts.length > 0;

  const yLeftFormatter = useCallback((v: number) => formatINRShort(v), []);
  const yRightFormatter = useCallback((v: number) => formatINRShort(v), []);

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <ChartLegend accounts={filters.accounts} showIndividual={showIndividual} />

        {!isAllAccounts && (
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
            <Checkbox
              checked={showIndividual}
              onChange={e => setShowIndividual(e.target.checked)}
            />
            Show Individual Accounts
          </label>
        )}
      </div>

      {/* Chart */}
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: useDualAxis ? 64 : 12, bottom: 0, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />

            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />

            {/* Left Y-axis — account bars (or sole axis when not dual) */}
            <YAxis
              yAxisId="left"
              orientation="left"
              tickFormatter={yLeftFormatter}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              width={60}
              label={
                useDualAxis
                  ? {
                    value: 'Accounts',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 10,
                    style: { fontSize: 10, fill: '#9CA3AF' },
                  }
                  : undefined
              }
            />

            {/* Right Y-axis — Total line (only when dual axis mode) */}
            {useDualAxis && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={yRightFormatter}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                tickLine={false}
                axisLine={false}
                width={64}
                label={{
                  value: 'Total',
                  angle: 90,
                  position: 'insideRight',
                  offset: 10,
                  style: { fontSize: 10, fill: '#9CA3AF' },
                }}
              />
            )}

            <Tooltip
              content={(props) => (
                <CustomTooltip
                  {...(props as TooltipContentProps<number, string>)}
                  showIndividual={showIndividual}
                />
              )}
            />

            {/* Forecast divider */}
            {fcastRefMonth && (
              <ReferenceLine
                x={fcastRefMonth}
                yAxisId="left"
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

            {/* ── Stacked bars per account (left axis) ── */}
            {useDualAxis &&
              filters.accounts.map(acc => (
                <React.Fragment key={acc}>
                  {/* Actual segment */}
                  <Bar
                    yAxisId="left"
                    dataKey={`${acc}_act`}
                    name={acc}
                    stackId="accounts"
                    fill={accountColor(acc)}
                    fillOpacity={0.85}
                    radius={0}
                    maxBarSize={28}
                    isAnimationActive={false}
                  />
                  {/* Forecast segment — slightly desaturated / hatched via opacity */}
                  <Bar
                    yAxisId="left"
                    dataKey={`${acc}_fct`}
                    name={`${acc} (est.)`}
                    stackId="accounts"
                    fill={accountColor(acc)}
                    fillOpacity={0.4}
                    radius={0}
                    maxBarSize={28}
                    isAnimationActive={false}
                  />
                </React.Fragment>
              ))}

            {/* ── Total lines — bound to right axis when dual, left axis otherwise ── */}
            <Line
              yAxisId={useDualAxis ? 'right' : 'left'}
              dataKey="Total_act"
              stroke={ACCOUNT_COLORS.Total}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
              connectNulls={false}
              name="Total Net Cash Flow"
            />
            <Line
              yAxisId={useDualAxis ? 'right' : 'left'}
              dataKey="Total_fct"
              stroke={ACCOUNT_COLORS.Total}
              strokeWidth={2.5}
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