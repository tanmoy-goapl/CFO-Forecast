import { useMemo, useState } from "react";
import { Alert, Empty } from "antd";
import { useCashFlowData } from "./hooks/useCashflowData";
import { KpiRow } from "./components/KpiRow";
import { LedgerChart } from "./components/LedgerChart";
import { ModeToggle } from "./components/ModeToggle";
import { BreakdownTable } from "./components/BreakdownTable";
import { LiveForecastCard } from "./components/LiveForecastCard";
import type { ForecastMode, HistoricalResponse, MonthString } from "./types/cashflow";
import { Live3ForecastCard } from "./components/Live3ForecastCard";

// Backtest accuracy from the API docs (section 10). Only 1-month mode has a
// published direction-accuracy figure; swap this for a live value if the
// API starts serving it per-mode.
const DIRECTION_ACCURACY: Partial<Record<ForecastMode, number>> = {
  "1month": 69.2,
};

function App() {
  const [mode, setMode] = useState<ForecastMode>("live");
  const [selectedMonth, setSelectedMonth] = useState<MonthString | null>(null);

  const { data, isNoData, loading, error, refetch } = useCashFlowData(mode);

  const latestMonth = useMemo(() => {
    if (!data?.months.length) return null;
    return data.months[data.months.length - 1] as MonthString;
  }, [data]);

  const activeMonth = selectedMonth ?? latestMonth;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex flex-col gap-2 max-w-5xl mx-auto p-4 sm:p-6">
        <div className="mb-2">
          <h1 className="text-xl font-medium m-0 text-slate-900">Cash flow forecast</h1>
          <p className="text-sm text-slate-500 m-0">
            Accounts receivable and payable, actual vs. model prediction
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-2">
          <LiveForecastCard />
          <Live3ForecastCard />
        </div>

        <ModeToggle
          mode={mode}
          onChange={(next) => {
            setMode(next);
            setSelectedMonth(null);
          }}
        />

        {error && <Alert type="error" message={error} showIcon closable className="mb-4" onClose={refetch} />}

        {!error && isNoData && (
          <div className="py-10 bg-white border border-slate-200 rounded-xl">
            <Empty description="No data available for this view yet" />
          </div>
        )}

        {!error && !isNoData && (
          <>
            <KpiRow
              average={data?.average}
              loading={loading}
            />
            <LedgerChart
              data={data}
              loading={loading}
              selectedMonth={activeMonth}
              onSelectMonth={setSelectedMonth}
            />
            <BreakdownTable data={data} month={activeMonth} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;