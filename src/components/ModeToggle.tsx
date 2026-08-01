import type { ForecastMode } from "../types/cashflow";

const OPTIONS: { label: string; value: ForecastMode }[] = [
  { label: "Historical", value: "historical" },
  { label: "1-month", value: "1month" },
  { label: "3-month", value: "3month" },
];

interface ModeToggleProps {
  mode: ForecastMode;
  onChange: (mode: ForecastMode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="grid grid-cols-3 gap-1 p-1 mb-2 bg-slate-100 rounded-xl">
      {OPTIONS.map((opt) => {
        const active = opt.value === mode;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`h-11 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 ${
              active
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}