import { useCallback, useEffect, useState } from "react";
import {
  fetch1MonthPrediction,
  fetch3MonthPrediction,
  fetchHistorical,
  fetchLatestPrediction,
  triggerLivePrediction,
} from "../api/cashflowApi";
import type {
  ForecastMode,
  HistoricalResponse,
  LatestPredictionResponse,
  NoDataResponse,
  PredictionResponse,
} from "../types/cashflow";

type SeriesResponse = HistoricalResponse | PredictionResponse | NoDataResponse;

const fetchers: Record<ForecastMode, () => Promise<SeriesResponse>> = {
  historical: fetchHistorical,
  "1month": fetch1MonthPrediction,
  "3month": fetch3MonthPrediction,
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

export function useLatestPrediction() {
  const [data, setData] = useState<LatestPredictionResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
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

  const retrain = useCallback(
    async (mode: "1-month" | "3-month" = "1-month") => {
      setRetraining(true);
      setError(null);
      try {
        const result = await triggerLivePrediction({ mode });
        setData(result);
        setNotFound(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Retrain failed");
      } finally {
        setRetraining(false);
      }
    },
    [],
  );

  return { data, notFound, loading, error, retraining, retrain, refetch: load };
}