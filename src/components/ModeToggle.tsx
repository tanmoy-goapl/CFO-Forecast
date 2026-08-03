import { Segmented } from "antd";
import type { ForecastMode } from "../types/cashflow";

interface ModeToggleProps {
  mode: ForecastMode;
  onChange: (mode: ForecastMode) => void;
}

function TabLabel({ text, live }: { text: string; live?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-1.5 h-11 text-sm font-medium text-slate-600">
      {live && <span className="relative flex w-1.5 h-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
      </span>}
      {text}
    </div>
  );
}

const OPTIONS: { label: React.ReactNode; value: ForecastMode }[] = [
  { value: "historical", label: <TabLabel text="Historical" /> },
  { value: "live", label: <TabLabel text="Live" live /> },
  { value: "live3", label: <TabLabel text="Live 3-month" live /> },
];

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="bg-slate-100 border border-slate-200 rounded-xl p-1 mb-4">
      <Segmented
        value={mode}
        onChange={(value) => onChange(value as ForecastMode)}
        options={OPTIONS}
        block
        className="!bg-transparent [&_.ant-segmented-item-label]:!p-0 [&_.ant-segmented-item-label]:!h-11 [&_.ant-segmented-item]:!rounded-lg"
      />
    </div>
  );
}