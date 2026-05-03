import React from 'react';
import { Select, Button } from 'antd';
import { RefreshCw } from 'lucide-react';
import type { FilterState } from '../../types/cashForecast';
import { accountColor } from '../../utils/chartHelpers';

const { Option } = Select;

interface FilterBarProps {
  availableAccounts: string[];
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onGenerate: () => void;
  loading?: boolean;
}

const PERIOD_OPTIONS = [3, 6, 12];
const MA_OPTIONS = [3, 6];

export const FilterBar: React.FC<FilterBarProps> = ({
  availableAccounts,
  filters,
  onChange,
  onGenerate,
  loading = false,
}) => {
  const set = <K extends keyof FilterState>(key: K, val: FilterState[K]) =>
    onChange({ ...filters, [key]: val });

  return (
    <div className="flex items-center gap-3 flex-wrap px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 mb-5">

      {/* Account multi-checkboxes */}
      {/* Account multi-select dropdown */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10.5px] font-medium text-gray-500 uppercase tracking-wider">
          Accounts
        </span>

        <Select
          mode="multiple"
          size="small"
          value={filters.accounts}
          onChange={(vals) => set('accounts', vals)}
          style={{ minWidth: 180 }}
          placeholder="Select accounts"
          optionLabelProp="label"
          maxCount={5}
        >
          {availableAccounts.map(acc => (
            <Option key={acc} value={acc} label={acc}>
              <span style={{ fontWeight: 600 }}>
                {acc}
              </span>
            </Option>
          ))}
        </Select>
      </div>
      <div className="w-px h-5 bg-gray-200" />

      {/* Historical period */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10.5px] font-medium text-gray-500 uppercase tracking-wider">
          Historical
        </span>
        <Select
          size="small"
          value={filters.historicalMonths}
          onChange={v => set('historicalMonths', v)}
          style={{ width: 72 }}
        >
          {PERIOD_OPTIONS.map(n => <Option key={n} value={n}>{n}M</Option>)}
        </Select>
      </div>

      {/* Forecast period */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10.5px] font-medium text-gray-500 uppercase tracking-wider">
          Forecast
        </span>
        <Select
          size="small"
          value={filters.forecastMonths}
          onChange={v => set('forecastMonths', v)}
          style={{ width: 72 }}
        >
          {PERIOD_OPTIONS.map(n => <Option key={n} value={n}>{n}M</Option>)}
        </Select>
      </div>

      {/* MA window */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10.5px] font-medium text-gray-500 uppercase tracking-wider">
          MA Window
        </span>
        <Select
          size="small"
          value={filters.maWindow}
          onChange={v => set('maWindow', v)}
          style={{ width: 64 }}
        >
          {MA_OPTIONS.map(n => <Option key={n} value={n}>{n}M</Option>)}
        </Select>
      </div>

      {/* Generate */}
      <Button
        type="primary"
        size="small"
        icon={<RefreshCw size={13} />}
        onClick={onGenerate}
        loading={loading}
        className="ml-auto"
      >
        Generate Forecast
      </Button>
    </div>
  );
};
