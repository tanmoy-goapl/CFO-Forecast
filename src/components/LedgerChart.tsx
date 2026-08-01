import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RectangleProps } from "recharts";
import { Card, Empty, Spin } from "antd";
import { BarChart3 } from "lucide-react";
import { formatMonthLabel, toCrores } from "../lib/format";
import type { HistoricalResponse, MonthString, PredictionResponse } from "../types/cashflow";

const AR_COLOR = "#059669"; // emerald-600
const AP_COLOR = "#e11d48"; // rose-600
const NET_COLOR = "#64748b"; // slate-500

interface LedgerChartProps {
  data: HistoricalResponse | PredictionResponse | null;
  loading: boolean;
  selectedMonth: MonthString | null;
  onSelectMonth: (month: MonthString) => void;
}

interface ChartRow {
  month: string;
  monthKey: MonthString;
  arInflow: number;
  apOutflow: number;
  netCf: number;
}

function buildRows(data: HistoricalResponse | PredictionResponse | null): ChartRow[] {
  if (!data) return [];
  return data.months.map((month) => {
    const t = data.totals[month];
    return {
      month: formatMonthLabel(month),
      monthKey: month,
      arInflow: toCrores(t.ar_inflow),
      apOutflow: -toCrores(t.ap_outflow),
      netCf: toCrores(t.net_cf),
    };
  });
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartRow }[] }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-xs shadow-sm min-w-[140px]">
      <p className="font-medium text-slate-700 mb-1.5">{row.month}</p>
      <div className="space-y-1">
        <Row label="AR" value={`${row.arInflow.toFixed(2)}Cr`} color="text-emerald-600" />
        <Row label="AP" value={`${Math.abs(row.apOutflow).toFixed(2)}Cr`} color="text-rose-600" />
        <Row label="Net" value={`${row.netCf.toFixed(2)}Cr`} color="text-slate-500" />
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <p className="flex items-center justify-between gap-4 m-0">
      <span className="text-slate-400">{label}</span>
      <span className={`font-mono font-medium ${color}`}>{value}</span>
    </p>
  );
}

function makeBarShape(selectedMonth: MonthString | null) {
  return (props: RectangleProps & { payload?: ChartRow }) => {
    const { payload, ...rest } = props;
    const dimmed = Boolean(selectedMonth) && payload?.monthKey !== selectedMonth;
    return <Rectangle {...rest} fillOpacity={dimmed ? 0.35 : 0.9} />;
  };
}

export function LedgerChart({ data, loading, selectedMonth, onSelectMonth }: LedgerChartProps) {
  const rows = buildRows(data);

  return (
    <Card
      size="small"
      variant="borderless"
      className="!bg-white border border-slate-200 rounded-xl mb-6"
      title={
        <span className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center">
            <BarChart3 size={14} />
          </span>
          <span className="text-sm font-medium text-slate-700">Monthly ledger</span>
        </span>
      }
    >
      {loading && (
        <div className="h-64 flex items-center justify-center">
          <Spin />
        </div>
      )}

      {!loading && !rows.length && (
        <div className="h-64 flex items-center justify-center">
          <Empty description={<span className="text-sm text-slate-400">No data available</span>} />
        </div>
      )}

      {!loading && rows.length > 0 && (
        <>
          <div className="flex flex-wrap gap-4 mb-3 text-xs text-slate-500">
            <Legend color={AR_COLOR} label="AR inflow" />
            <Legend color={AP_COLOR} label="AP outflow" />
            <Legend color={NET_COLOR} label="Net cash flow" line />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={rows}>
              <CartesianGrid vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="#94a3b8"
                tickFormatter={(v: number) => `${Math.abs(v)}Cr`}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Bar
                dataKey="arInflow"
                fill={AR_COLOR}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
                cursor="pointer"
                shape={makeBarShape(selectedMonth)}
                onClick={(data) => {
                  if (data.payload) onSelectMonth(data.payload.monthKey);
                }}
              />
              <Bar
                dataKey="apOutflow"
                fill={AP_COLOR}
                radius={[0, 0, 4, 4]}
                maxBarSize={28}
                cursor="pointer"
                shape={makeBarShape(selectedMonth)}
                onClick={(data) => {
                  if (data.payload) onSelectMonth(data.payload.monthKey);
                }}
              />
              <Line type="monotone" dataKey="netCf" stroke={NET_COLOR} strokeWidth={2} dot={{ r: 3.5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </>
      )}
    </Card>
  );
}

function Legend({ color, label, line }: { color: string; label: string; line?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      {line ? (
        <span className="w-2.5 h-0.5 rounded-full" style={{ background: color }} />
      ) : (
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      )}
      {label}
    </span>
  );
}