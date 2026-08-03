import { Alert, Button, Card, Empty, Spin, Tooltip } from "antd";
import { RefreshCw, Zap } from "lucide-react";
import { formatCrores, formatDateTime } from "../lib/format";
import { useLatestPrediction } from "../hooks/useCashflowData";

export function LiveForecastCard() {
  const { data, notFound, loading, error, retraining, retrain } = useLatestPrediction();

  const net = data?.totals.net_cf ?? 0;
  const netColor = net >= 0 ? "text-emerald-600" : "text-rose-600";

  return (
    <Card
      size="small"
      variant="borderless"
      className="!bg-white border border-slate-200 rounded-xl mb-6"
      title={
        <span className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
            <Zap size={14} />
          </span>
          <span className="text-sm font-medium text-slate-700">Live forecast</span>
        </span>
      }
      // extra={
      //   <Tooltip title="Runs the model live on the latest data (~45-50s)">
      //     <Button
      //       size="small"
      //       className="rounded-lg border-slate-200 text-slate-600 hover:!text-slate-900 hover:!border-slate-300"
      //       icon={<RefreshCw size={13} className={retraining ? "animate-spin" : ""} />}
      //       loading={retraining}
      //       onClick={() => retrain("1-month")}
      //     >
      //       Retrain
      //     </Button>
      //   </Tooltip>
      // }
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
              No live prediction yet. Run the monthly job or retrain.
            </span>
          }
        />
      )}

      {!loading && !error && data && (
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-slate-500 m-0 mb-1">
                Forecast for <span className="font-medium text-slate-700">{data.prediction_month}</span>
              </p>
              <p className={`font-mono text-3xl font-medium m-0 ${netColor}`}>
                {formatCrores(net, { showSign: true })}
              </p>
            </div>
            {/* <div className="text-right text-xs text-slate-400 leading-relaxed pt-1">
              <p className="m-0">Trained on {data.training_cutoff}</p>
              <p className="m-0">Generated {formatDateTime(data.generated_at)}</p>
            </div> */}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-100">
            <StatChip label="AR open" value={formatCrores(data.components.ar_open)} tone="emerald" />
            <StatChip label="AR new" value={formatCrores(data.components.ar_new)} tone="emerald" />
            <StatChip label="AP open" value={formatCrores(data.components.ap_open)} tone="rose" />
            <StatChip label="AP new" value={formatCrores(data.components.ap_new)} tone="rose" />
          </div>
        </div>
      )}
    </Card>
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "rose";
}) {
  const dot = tone === "emerald" ? "bg-emerald-400" : "bg-rose-400";
  return (
    <div className="bg-slate-50 rounded-lg px-2.5 py-2">
      <p className="flex items-center gap-1.5 text-[11px] text-slate-500 m-0 mb-0.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        {label}
      </p>
      <p className="font-mono text-sm text-slate-800 m-0">{value}</p>
    </div>
  );
}