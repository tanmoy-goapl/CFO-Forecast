import { useCallback, useEffect, useState } from "react";
import {
  fetch1MonthPrediction,
  fetch3MonthPrediction,
  fetchHistorical,
  fetchLatest3Prediction,
  fetchLatestPrediction,
  triggerLivePrediction,
} from "../api/cashflowApi";
import type {
  ForecastMode,
  HistoricalResponse,
  Latest3PredictionResponse,
  LatestPredictionResponse,
  MonthString,
  NoDataResponse,
  PredictionResponse,
} from "../types/cashflow";

type SeriesResponse = HistoricalResponse | PredictionResponse | NoDataResponse;

// The live endpoint returns a single flat object (one prediction_month, no
// month-keyed maps), unlike historical/1-month/3-month which are already
// keyed by month. Wrap it into the same shape so LedgerChart and
// BreakdownTable can render it without any special-casing.
function adaptLiveToSeries(live: LatestPredictionResponse): PredictionResponse {
  const month = live.prediction_month;
  return {
    generated_at: live.generated_at,
    mode: live.mode,
    months: [month],
    totals: { [month]: live.totals },
    by_customer: { [month]: live.by_customer },
    by_vendor: { [month]: live.by_vendor },
    components: { [month]: live.components },
    average: live.average,
  };
}

async function fetchLiveSeries(): Promise<SeriesResponse> {
  const result = await fetchLatestPrediction();
  if ("detail" in result) {
    return {
      status: "no_data",
      message: result.detail,
      requested_month: "0000-00" as MonthString,
    };
  }
  return adaptLiveToSeries(result);
}

const fetchers: Record<ForecastMode, () => Promise<SeriesResponse>> = {
  historical: fetchHistorical,
  "1month": fetch1MonthPrediction,
  "3month": fetch3MonthPrediction,
  live: fetchLiveSeries,
  live3: fetchLive3Series,
};

function isNoDataResponse(result: SeriesResponse): result is NoDataResponse {
  return "status" in result && result.status === "no_data";
}

export function useCashFlowData(mode: ForecastMode) {
  const [data, setData] = useState<HistoricalResponse | PredictionResponse | null>(null);
  const [isNoData, setIsNoData] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchers[mode]()
      .then((result) => {
        if (cancelled) return;
        if (isNoDataResponse(result)) {
          setIsNoData(true);
          setData(null);
        } else {
          setIsNoData(false);
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load cash flow data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, isNoData, loading, error, refetch };
}

function adaptLatest3ToSeries(live3: Latest3PredictionResponse): PredictionResponse {
  const totals: PredictionResponse["totals"] = {};
  const by_customer: PredictionResponse["by_customer"] = {};
  const by_vendor: PredictionResponse["by_vendor"] = {};
  const components: PredictionResponse["components"] = {};

  for (const month of live3.months) {
    const f = live3.forecasts[month];
    totals[month] = f.totals;
    by_customer[month] = f.by_customer;
    by_vendor[month] = f.by_vendor;
    components[month] = f.components;
  }

  return { generated_at: live3.generated_at, mode: live3.mode, months: live3.months, totals, by_customer, by_vendor, components, average: live3.average };
}

async function fetchLive3Series(): Promise<SeriesResponse> {
  const result = await fetchLatest3Prediction();
  if ("detail" in result) {
    return { status: "no_data", message: result.detail, requested_month: "0000-00" as MonthString };
  }
  return adaptLatest3ToSeries(result);
}

export function useLatestPrediction() {
  const [data, setData] = useState<LatestPredictionResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetchLatestPrediction()
      .then((result) => {
        if ("detail" in result) {
          setNotFound(true);
          setData(null);
        } else {
          setNotFound(false);
          setData(result);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load latest prediction");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, notFound, loading, error, refetch: load };
}

export function useLatest3Prediction() {
  const [data, setData] = useState<Latest3PredictionResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetchLatest3Prediction()
      .then((result) => {
        if ("detail" in result) {
          setNotFound(true);
          setData(null);
        } else {
          setNotFound(false);
          setData(result);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load 3-month prediction");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, notFound, loading, error, refetch: load };
}