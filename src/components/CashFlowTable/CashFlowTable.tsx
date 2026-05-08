import React from 'react';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CashForecastResponse, FilterState, SeriesEntry } from '../../types/cashForecast';
import { formatINR, formatMonthLong } from '../../utils/formatters';
import { accountColor } from '../../utils/chartHelpers';

/* ─── Row shape ──────────────────────────────────────────────── */

interface TableRow {
  key: string;
  month: string;
  monthLabel: string;
  type: 'actual' | 'forecast';
  totalNetCashFlow: number;
  selectedTotal: number | null; // sum across selected accounts (null if none selected)
  accounts: Record<string, number | null>;
}

interface CashFlowTableProps {
  data: CashForecastResponse;
  filters: FilterState;
}

/* ─── Component ──────────────────────────────────────────────── */

export const CashFlowTable: React.FC<CashFlowTableProps> = ({ data, filters }) => {
  const { accounts, historicalMonths: hN, forecastMonths: fN } = filters;

  console.log(data);

  const hasSelection = accounts.length > 0;

  // ── Fall back to all series keys when no accounts are selected ─
  const activeAccounts = hasSelection ? accounts : Object.keys(data.series);

  // ── Slice to the same window shown in the chart ───────────────
  const actual = data.total_series.filter(d => d.type === 'actual').slice(-hN);
  const forecast = data.total_series.filter(d => d.type === 'forecast').slice(0, fN);
  const allRows = [...actual, ...forecast];

  // ── Build rows ────────────────────────────────────────────────
  const rows: TableRow[] = allRows.map(row => {
    const acctMap: Record<string, number | null> = {};

    for (const acc of activeAccounts) {
      const entry: SeriesEntry | undefined =
        data.series[acc]?.find(e => e.month === row.month);
      acctMap[acc] = entry?.net_cash_flow ?? null;
    }

    // Sum only when accounts are explicitly selected
    let selectedTotal: number | null = null;
    if (hasSelection) {
      const values = accounts.map(acc => acctMap[acc]);
      const allNull = values.every(v => v == null);
      selectedTotal = allNull
        ? null
        : values.reduce<number>((sum, v) => sum + (v ?? 0), 0);
    }

    return {
      key: row.month,
      month: row.month,
      monthLabel: formatMonthLong(row.month),
      type: row.type,
      totalNetCashFlow: row.net_cash_flow,
      selectedTotal,
      accounts: acctMap,
    };
  });

  // ── Columns ───────────────────────────────────────────────────
  const columns: ColumnsType<TableRow> = [
    {
      title: 'Month',
      dataIndex: 'monthLabel',
      key: 'month',
      width: 110,
      fixed: 'left',
      render: (v: string) => <span>{v}</span>,
    },

    // One column per active account
    ...activeAccounts.map(acc => ({
      title: (
        <span
          className="text-[12px] font-medium"
          style={{ color: accountColor(acc) }}
          title={acc}
        >
          {acc.length > 28 ? `${acc.slice(0, 26)}…` : acc}
        </span>
      ),
      dataIndex: ['accounts', acc] as unknown as string,
      key: acc,
      align: 'right' as const,
      width: 130,
      render: (v: number | null) => (
        <span
          className="tabular-nums text-[12px]"
          style={{ color: v == null ? '#9CA3AF' : v >= 0 ? '#3B6D11' : '#A32D2D' }}
        >
          {v != null ? `${v >= 0 ? '+' : ''}${formatINR(v)}` : '—'}
        </span>
      ),
    })),

    // ── Selected accounts subtotal (only when accounts are chosen) ─
    ...(hasSelection
      ? [
        {
          title: <strong>Selected Total</strong>,
          dataIndex: 'selectedTotal',
          key: 'selectedTotal',
          align: 'right' as const,
          width: 150,
          fixed: 'right' as const,
          render: (v: number | null) =>
            v == null ? (
              <span className="tabular-nums text-[12px]" style={{ color: '#9CA3AF' }}>—</span>
            ) : (
              <span
                className="font-semibold tabular-nums text-[12px]"
                style={{ color: v >= 0 ? '#1D4ED8' : '#9333EA' }}
              >
                {v >= 0 ? '+' : ''}{formatINR(v)}
              </span>
            ),
        },
      ]
      : []),

    // ── Total Net Cash Flow (from total_series) ───────────────────
    {
      title: <strong>Total Net Cash Flow</strong>,
      dataIndex: 'totalNetCashFlow',
      key: 'totalNetCashFlow',
      align: 'right',
      width: 120,
      fixed: 'right',
      render: (v: number) => (
        <span
          className="font-semibold tabular-nums text-[12px]"
          style={{ color: v >= 0 ? '#3B6D11' : '#A32D2D' }}
        >
          {v >= 0 ? '+' : ''}{formatINR(v)}
        </span>
      ),
    },

    // ── Type badge ────────────────────────────────────────────────
    {
      title: 'Type',
      key: 'type',
      width: 90,
      align: 'center' as const,
      fixed: 'right' as const,
      render: (_: unknown, row: TableRow) =>
        row.type === 'actual'
          ? <Tag color="success" style={{ fontSize: 11 }}>Actual</Tag>
          : <Tag color="processing" style={{ fontSize: 11 }}>Forecast</Tag>,
    },
  ];

  return (
    <Table<TableRow>
      columns={columns}
      dataSource={rows}
      size="small"
      pagination={false}
      scroll={{
        x: 'max-content',
        y: 450,
      }}
      sticky // sticky header
      rowClassName={row => (row.type === 'forecast' ? 'bg-blue-50/40' : '')}
      style={{ fontSize: 13 }}
    />
  );
};