import { Card } from "antd";
import { ArrowLeftRight, TrendingDown, TrendingUp, Target } from "lucide-react";
import { formatCrores } from "../lib/format";
import type { Totals } from "../types/cashflow";

interface KpiRowProps {
  totals: Totals | null;
  directionAccuracy?: number | null;
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
    <Card
      size="small"
      variant="borderless"
      className={`!bg-white border ${styles.border} rounded-xl`}
    >
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

export function KpiRow({ totals, directionAccuracy, loading }: KpiRowProps) {
  const net = totals?.net_cf ?? 0;
  const netTone: Tone = net >= 0 ? "profit" : "loss";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <KpiTile
        label="Net cash flow"
        value={formatCrores(net, { showSign: true })}
        icon={<ArrowLeftRight size={14} />}
        tone={netTone}
        loading={loading}
      />
      <KpiTile
        label="AR inflow"
        value={formatCrores(totals?.ar_inflow ?? 0)}
        icon={<TrendingUp size={14} />}
        tone="profit"
        loading={loading}
      />
      <KpiTile
        label="AP outflow"
        value={formatCrores(totals?.ap_outflow ?? 0)}
        icon={<TrendingDown size={14} />}
        tone="loss"
        loading={loading}
      />
      <KpiTile
        label="Direction accuracy"
        value={directionAccuracy != null ? `${directionAccuracy.toFixed(0)}%` : "—"}
        icon={<Target size={14} />}
        tone="neutral"
        loading={loading}
      />
    </div>
  );
}