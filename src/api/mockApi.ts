import type { CashForecastResponse } from '../types/cashForecast';
import { MOCK_RESPONSE } from '../data/mockData';

export async function fetchCashForecast(): Promise<CashForecastResponse> {
  return MOCK_RESPONSE;
}