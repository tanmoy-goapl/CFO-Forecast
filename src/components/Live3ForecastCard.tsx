import { Alert, Card, Empty, Spin } from "antd";
import { Zap } from "lucide-react";
import { formatCrores } from "../lib/format";
import type { MonthString } from "../types/cashflow";
import { useLatest3Prediction } from "../hooks/useCashflowData";

export function Live3ForecastCard() {
  const { data, notFound, loading, error } = useLatest3Prediction();

  return (
    <Card
      size="small"
      variant="borderless"
      className="!bg-white border border-slate-200 rounded-xl"
      title={
        <span className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
            <Zap size={14} />
          </span>
          <span className="text-sm font-medium text-slate-700">Live forecast (3-month)</span>
        </span>
      }
    >
      {loading && (
        <div className="py-8 flex justify-center">
          <Spin />
        </div>
      )}

      {!loading && error && <Alert type="error" message={error} showIcon className="rounded-lg" />}

      {!loading && !error && notFound && (
        <Empty
          className="py-4"
          description={
            <span className="text-sm text-slate-400">
              No 3-month live forecast yet. Run the monthly job with --mode 3-month or retrain.
            </span>
          }
        />
      )}

      {!loading && !error && data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {data.months.map((month, i) => (
            <MonthColumn
              key={month}
              month={month}
              totals={data.forecasts[month].totals}
              components={data.forecasts[month].components}
              isFirst={i === 0}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function MonthColumn({
  month,
  totals,
  components,
  isFirst,
}: {
  month: MonthString;
  totals: { net_cf: number };
  components: { ar_open: number; ar_new: number; ap_open: number; ap_new: number };
  isFirst: boolean;
}) {
  const netColor = totals.net_cf >= 0 ? "text-emerald-600" : "text-rose-600";

  return (
    <div className={`pt-4 sm:pt-0 ${!isFirst ? "sm:pl-4" : ""}`}>
      <p className="text-xs text-slate-500 m-0 mb-1">{month}</p>
      <p className={`font-mono text-2xl font-medium m-0 mb-3 ${netColor}`}>
        {formatCrores(totals.net_cf, { showSign: true })}
      </p>

      <div className="grid grid-cols-2 gap-1.5">
        <StatChip label="AR open" value={formatCrores(components.ar_open)} tone="emerald" />
        <StatChip label="AR new" value={formatCrores(components.ar_new)} tone="emerald" />
        <StatChip label="AP open" value={formatCrores(components.ap_open)} tone="rose" />
        <StatChip label="AP new" value={formatCrores(components.ap_new)} tone="rose" />
      </div>
    </div>
  );
}

function StatChip({ label, value, tone }: { label: string; value: string; tone: "emerald" | "rose" }) {
  const dot = tone === "emerald" ? "bg-emerald-400" : "bg-rose-400";
  return (
    <div className="bg-slate-50 rounded-lg px-2 py-1.5">
      <p className="flex items-center gap-1 text-[10px] text-slate-500 m-0 mb-0.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {label}
      </p>
      <p className="font-mono text-xs text-slate-800 m-0">{value}</p>
    </div>
  );
}