import React from 'react';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CashForecastResponse, FilterState, SeriesEntry } from '../../types/cashForecast';
import { formatINR, formatMonthLong } from '../../utils/formatters';
import { accountColor } from '../../utils/chartHelpers';

interface TableRow {
  key:        string;
  month:      string;
  monthLabel: string;
  type:       'actual' | 'forecast';
  totalCash:  number;
  netFlow:    number;
  accounts:   Record<string, number | null>;
}

interface CashFlowTableProps {
  data:    CashForecastResponse;
  filters: FilterState;
}

export const CashFlowTable: React.FC<CashFlowTableProps> = ({ data, filters }) => {
  const { accounts, historicalMonths: hN, forecastMonths: fN } = filters;

  // Build rows
  const actual   = data.total_series.filter(d => d.type === 'actual').slice(-hN);
  const forecast = data.total_series.filter(d => d.type === 'forecast').slice(0, fN);
  const allRows  = [...actual, ...forecast];

  const rows: TableRow[] = allRows.map(row => {
    const acctMap: Record<string, number | null> = {};
    let totalCash = 0;
    let totalInflow = 0;
    let totalOutflow = 0;

    for (const acc of accounts) {
      const entry: SeriesEntry | undefined = data.series[acc]?.find(e => e.month === row.month);
      acctMap[acc] = entry?.closing_cash ?? null;
      if (entry) {
        totalCash    += entry.closing_cash;
        totalInflow  += entry.inflow;
        totalOutflow += entry.outflow;
      }
    }

    return {
      key:        row.month,
      month:      row.month,
      monthLabel: formatMonthLong(row.month),
      type:       row.type,
      totalCash,
      netFlow:    totalInflow - totalOutflow,
      accounts:   acctMap,
    };
  });

  // Build columns
  const columns: ColumnsType<TableRow> = [
    {
      title:     'Month',
      dataIndex: 'monthLabel',
      key:       'month',
      width:     100,
      fixed:     'left',
      render:    (v: string, row) => (
        <span style={{ fontWeight: row.type === 'actual' ? 400 : 400 }}>{v}</span>
      ),
    },
    ...accounts.map(acc => ({
      title: (
        <span style={{ color: accountColor(acc) }}>{acc}</span>
      ),
      dataIndex: ['accounts', acc] as unknown as string,
      key:       acc,
      align:     'right' as const,
      width:     110,
      render:    (v: number | null) => (
        <span className="tabular-nums">{v != null ? formatINR(v) : '—'}</span>
      ),
    })),
    {
      title:     <strong>Total Cash</strong>,
      dataIndex: 'totalCash',
      key:       'totalCash',
      align:     'right',
      width:     120,
      render:    (v: number) => (
        <span className="font-medium tabular-nums">{formatINR(v)}</span>
      ),
    },
    {
      title:     'Net Flow',
      dataIndex: 'netFlow',
      key:       'netFlow',
      align:     'right',
      width:     110,
      render:    (v: number) => (
        <span
          className="tabular-nums font-medium"
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
      scroll={{ x: 'max-content' }}
      rowClassName={row => row.type === 'forecast' ? 'text-gray-400' : ''}
      style={{ fontSize: 13 }}
    />
  );
};
