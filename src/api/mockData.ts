import type {
  Breakdown,
  Components,
  HistoricalResponse,
  LatestPredictionResponse,
  MonthString,
  PredictionResponse,
  StoreStatusResponse,
  Totals,
} from "../types/cashflow";

// Mirrors the API doc's "current data coverage" table.
export const HISTORICAL_MONTHS: MonthString[] = [
  "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09",
  "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04",
];

export const THREE_MONTH_MONTHS: MonthString[] = HISTORICAL_MONTHS.slice(0, -1); // excludes 2026-04

export const LIVE_MONTH: MonthString = "2026-06";
export const LIVE_TRAINING_CUTOFF = "2026-05-31";

const CUSTOMERS = [
  "Axis Bank Ltd", "Bank of India", "HDFC Ltd", "ICICI Retail",
  "Kotak Enterprises", "SBI Corporate", "Yes Bank Ltd",
];

const VENDORS = [
  "Steel Traders Co", "Logistics Partners", "Office Supplies Inc",
  "Cloud Infra Ltd", "Packaging Solutions", "Facilities Mgmt Co",
];

// Simple deterministic pseudo-random so mock data is stable across reloads.
function seeded(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function buildTotals(index: number): Totals {
  const base = 480_000_000 + seeded(index) * 220_000_000;
  const ap = 40_000_000 + seeded(index + 50) * 25_000_000;
  const ar_inflow = Math.round(base);
  const ap_outflow = Math.round(ap);
  return { ar_inflow, ap_outflow, net_cf: ar_inflow - ap_outflow };
}

function buildComponents(totals: Totals, index: number): Components {
  const arNewShare = 0.05 + seeded(index + 10) * 0.05;
  const apNewShare = 0.06 + seeded(index + 20) * 0.05;
  const ar_new = Math.round(totals.ar_inflow * arNewShare);
  const ap_new = Math.round(totals.ap_outflow * apNewShare);
  return {
    ar_open: totals.ar_inflow - ar_new,
    ar_new,
    ap_open: totals.ap_outflow - ap_new,
    ap_new,
  };
}

function buildParties(names: string[], monthTotal: number, index: number, offset: number): Record<string, Breakdown> {
  const weights = names.map((_, i) => seeded(index * 7 + i + offset) + 0.2);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const result: Record<string, Breakdown> = {};
  names.forEach((name, i) => {
    const total = Math.round((weights[i] / weightSum) * monthTotal);
    const openShare = 0.75 + seeded(index + i + 30) * 0.2;
    const open = Math.round(total * openShare);
    result[name] = { open, new: total - open, total };
  });
  return result;
}

function toPlainAmounts(breakdown: Record<string, Breakdown>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(breakdown).map(([name, v]) => [name, v.total]),
  );
}

export function buildHistoricalResponse(): HistoricalResponse {
  const totals: Record<MonthString, Totals> = {};
  const by_customer: Record<MonthString, Record<string, number>> = {};
  const by_vendor: Record<MonthString, Record<string, number>> = {};
  const components: Record<MonthString, Record<string, never>> = {};

  HISTORICAL_MONTHS.forEach((month, i) => {
    const t = buildTotals(i);
    totals[month] = t;
    by_customer[month] = toPlainAmounts(buildParties(CUSTOMERS, t.ar_inflow, i, 0));
    by_vendor[month] = toPlainAmounts(buildParties(VENDORS, t.ap_outflow, i, 100));
    components[month] = {};
  });

  return {
    generated_at: new Date().toISOString(),
    mode: null,
    months: HISTORICAL_MONTHS,
    totals,
    by_customer,
    by_vendor,
    components,
  };
}

function buildPredictionResponse(months: MonthString[], mode: "1-month" | "3-month", noise: number): PredictionResponse {
  const totals: Record<MonthString, Totals> = {};
  const by_customer: Record<MonthString, Record<string, Breakdown>> = {};
  const by_vendor: Record<MonthString, Record<string, Breakdown>> = {};
  const components: Record<MonthString, Components> = {};

  months.forEach((month, i) => {
    const actual = buildTotals(i);
    const drift = 1 + (seeded(i + noise) - 0.5) * 0.08;
    const ar_inflow = Math.round(actual.ar_inflow * drift);
    const ap_outflow = Math.round(actual.ap_outflow * (1 + (seeded(i + noise + 5) - 0.5) * 0.08));
    const t: Totals = { ar_inflow, ap_outflow, net_cf: ar_inflow - ap_outflow };
    totals[month] = t;
    by_customer[month] = buildParties(CUSTOMERS, t.ar_inflow, i, noise);
    by_vendor[month] = buildParties(VENDORS, t.ap_outflow, i, noise + 100);
    components[month] = buildComponents(t, i);
  });

  return {
    generated_at: new Date().toISOString(),
    mode,
    months,
    totals,
    by_customer,
    by_vendor,
    components,
  };
}

export function build1MonthResponse(): PredictionResponse {
  return buildPredictionResponse(HISTORICAL_MONTHS, "1-month", 200);
}

export function build3MonthResponse(): PredictionResponse {
  return buildPredictionResponse(THREE_MONTH_MONTHS, "3-month", 300);
}

export function buildLatestPredictionResponse(): LatestPredictionResponse {
  const totals: Totals = { ar_inflow: 750_198_884, ap_outflow: 16_640_104, net_cf: 733_558_780 };
  const components = buildComponents(totals, 999);
  return {
    generated_at: new Date().toISOString(),
    mode: "1-month",
    prediction_month: LIVE_MONTH,
    training_cutoff: LIVE_TRAINING_CUTOFF,
    totals,
    components,
    by_customer: buildParties(CUSTOMERS, totals.ar_inflow, 999, 0),
    by_vendor: buildParties(VENDORS, totals.ap_outflow, 999, 100),
  };
}

export function buildStoreStatusResponse(): StoreStatusResponse {
  const now = new Date().toISOString();
  return {
    historical_truths: { generated_at: now, months: HISTORICAL_MONTHS },
    predictions_1month: { generated_at: now, months: HISTORICAL_MONTHS },
    predictions_3month: { generated_at: now, months: THREE_MONTH_MONTHS },
    live_prediction: {
      mode: "1-month",
      prediction_month: LIVE_MONTH,
      training_cutoff: LIVE_TRAINING_CUTOFF,
      generated_at: now,
      totals: { ar_inflow: 750_198_884, ap_outflow: 16_640_104, net_cf: 733_558_780 },
    },
  };
}