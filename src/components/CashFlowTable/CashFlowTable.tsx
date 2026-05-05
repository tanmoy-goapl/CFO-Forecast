import React from 'react';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CashForecastResponse, FilterState, SeriesEntry } from '../../types/cashForecast';
import { formatINR, formatMonthLong } from '../../utils/formatters';
import { accountColor } from '../../utils/chartHelpers';

/* ─── Row shape ──────────────────────────────────────────────── */

interface TableRow {
  key:              string;
  month:            string;
  monthLabel:       string;
  type:             'actual' | 'forecast';
  /**
   * Net cash flow for the row's month taken directly from total_series.
   * This is what the chart plots and what the user asked to see.
   */
  totalNetCashFlow: number;
  /**
   * Per-account net_cash_flow values (may be null if the account had
   * no activity in this month).
   */
  accounts:         Record<string, number | null>;
}

interface CashFlowTableProps {
  data:    CashForecastResponse;
  filters: FilterState;
}

/* ─── Component ──────────────────────────────────────────────── */

export const CashFlowTable: React.FC<CashFlowTableProps> = ({ data, filters }) => {
  const { accounts, historicalMonths: hN, forecastMonths: fN } = filters;

  // ── Slice to the same window shown in the chart ───────────────
  const actual   = data.total_series.filter(d => d.type === 'actual').slice(-hN);
  const forecast = data.total_series.filter(d => d.type === 'forecast').slice(0, fN);
  const allRows  = [...actual, ...forecast];

  // ── Build rows ────────────────────────────────────────────────
  const rows: TableRow[] = allRows.map(row => {
    const acctMap: Record<string, number | null> = {};

    for (const acc of accounts) {
      const entry: SeriesEntry | undefined =
        data.series[acc]?.find(e => e.month === row.month);
      // ✅ net_cash_flow (monthly delta), not closing_cash
      acctMap[acc] = entry?.net_cash_flow ?? null;
    }

    return {
      key:              row.month,
      month:            row.month,
      monthLabel:       formatMonthLong(row.month),
      type:             row.type,
      // ✅ KEY FIX: comes directly from total_series, not summed from accounts.
      //    Previously the code summed entry.net_cash_flow across accounts AND
      //    separately computed totalInflow − totalOutflow — both producing the
      //    same number and neither matching total_series when accounts had
      //    sparse data or when accounts=[] (all-accounts mode).
      totalNetCashFlow: row.net_cash_flow,
      accounts:         acctMap,
    };
  });

  // ── Columns ───────────────────────────────────────────────────
  const columns: ColumnsType<TableRow> = [
    {
      title:     'Month',
      dataIndex: 'monthLabel',
      key:       'month',
      width:     110,
      fixed:     'left',
      render:    (v: string) => <span>{v}</span>,
    },

    // One column per selected account
    ...accounts.map(acc => ({
      title: (
        <span
          className="text-[12px] font-medium"
          style={{ color: accountColor(acc) }}
          title={acc}
        >
          {/* Truncate long bank names in the header */}
          {acc.length > 28 ? `${acc.slice(0, 26)}…` : acc}
        </span>
      ),
      dataIndex: ['accounts', acc] as unknown as string,
      key:        acc,
      align:      'right' as const,
      width:      130,
      render:     (v: number | null) => (
        <span
          className="tabular-nums text-[12px]"
          style={{ color: v == null ? '#9CA3AF' : v >= 0 ? '#3B6D11' : '#A32D2D' }}
        >
          {v != null ? `${v >= 0 ? '+' : ''}${formatINR(v)}` : '—'}
        </span>
      ),
    })),

    // ✅ Total Net Cash Flow — from total_series.net_cash_flow
    {
      title:     <strong>Total Net Cash Flow</strong>,
      dataIndex: 'totalNetCashFlow',
      key:       'totalNetCashFlow',
      align:     'right',
      width:     150,
      render:    (v: number) => (
        <span
          className="font-semibold tabular-nums text-[12px]"
          style={{ color: v >= 0 ? '#3B6D11' : '#A32D2D' }}
        >
          {v >= 0 ? '+' : ''}{formatINR(v)}
        </span>
      ),
    },

    {
      title:  'Type',
      key:    'type',
      width:  90,
      align:  'center' as const,
      render: (_: unknown, row: TableRow) =>
        row.type === 'actual'
          ? <Tag color="success"     style={{ fontSize: 11 }}>Actual</Tag>
          : <Tag color="processing"  style={{ fontSize: 11 }}>Forecast</Tag>,
    },
  ];

  return (
    <Table<TableRow>
      columns={columns}
      dataSource={rows}
      size="small"
      pagination={false}
      scroll={{ x: 'max-content' }}
      rowClassName={row =>
        row.type === 'forecast' ? 'bg-blue-50/40' : ''
      }
      style={{ fontSize: 13 }}
    />
  );
};