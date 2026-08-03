import { Card } from "antd";
import { ArrowLeftRight, TrendingDown, TrendingUp } from "lucide-react";
import { formatCrores } from "../lib/format";
import type { AverageStats, Totals } from "../types/cashflow";

interface KpiRowProps {
  average?: AverageStats | null;
  loading?: boolean;
}

type Tone = "profit" | "loss" | "neutral";

const TONE_STYLES: Record<Tone, { border: string; iconBg: string; iconColor: string; valueColor: string }> = {
  profit: {
    border: "border-emerald-200",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    valueColor: "text-emerald-600",
  },
  loss: {
    border: "border-rose-200",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    valueColor: "text-rose-600",
  },
  neutral: {
    border: "border-slate-200",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500",
    valueColor: "text-slate-900",
  },
};

function KpiTile({
  label,
  value,
  icon,
  tone,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: Tone;
  loading?: boolean;
}) {
  const styles = TONE_STYLES[tone];

  return (
    <Card size="small" variant="borderless" className={`!bg-white border ${styles.border} rounded-xl`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">{label}</span>
        <span className={`w-6 h-6 rounded-md flex items-center justify-center ${styles.iconBg} ${styles.iconColor}`}>
          {icon}
        </span>
      </div>
      <p className={`font-mono text-2xl font-medium m-0 ${loading ? "text-slate-400" : styles.valueColor}`}>
        {loading ? "—" : value}
      </p>
    </Card>
  );
}

export function KpiRow({ average, loading }: KpiRowProps) {
  const net = average ? average.avg_net_cf : 0;
  const arInflow = average ? average.avg_ar_inflow : 0;
  const apOutflow = average ? average.avg_ap_outflow : 0;
  const netTone: Tone = net >= 0 ? "profit" : "loss";

  return (
    <div className="mb-6">
      {average && (
        <p className="text-xs text-slate-400 mb-2 m-0">
          Averaged over {average.n_months} month{average.n_months === 1 ? "" : "s"}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiTile
          label={average ? "Avg net cash flow" : "Net cash flow"}
          value={formatCrores(net, { showSign: true })}
          icon={<ArrowLeftRight size={14} />}
          tone={netTone}
          loading={loading}
        />
        <KpiTile
          label={average ? "Avg AR inflow" : "AR inflow"}
          value={formatCrores(arInflow)}
          icon={<TrendingUp size={14} />}
          tone="profit"
          loading={loading}
        />
        <KpiTile
          label={average ? "Avg AP outflow" : "AP outflow"}
          value={formatCrores(apOutflow)}
          icon={<TrendingDown size={14} />}
          tone="loss"
          loading={loading}
        />
      </div>
    </div>
  );
}