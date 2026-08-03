import { useState } from "react";
import { Button, Card, Empty, Table } from "antd";
import { Building2, ChevronDown, ChevronUp, Users } from "lucide-react";
import { formatCrores } from "../lib/format";
import type {
  Breakdown,
  HistoricalResponse,
  MonthString,
  PredictionResponse,
} from "../types/cashflow";

interface BreakdownTableProps {
  data: HistoricalResponse | PredictionResponse | null;
  month: MonthString | null;
}

interface Row {
  key: string;
  name: string;
  amount: number;
}

const COLLAPSED_COUNT = 8;
const SCROLL_HEIGHT = 288; // shared fixed height so both columns line up once expanded

function normalize(
  raw: Record<string, number> | Record<string, Breakdown> | undefined,
): Row[] {
  if (!raw) return [];
  return Object.entries(raw)
    .map(([name, value]) => ({
      key: name,
      name,
      amount: typeof value === "number" ? value : value.total,
    }))
    .sort((a, b) => b.amount - a.amount);
}

function makeColumns(colorClass: string) {
  return [
    {
      title: <span className="text-xs text-slate-400 font-normal">Name</span>,
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      render: (name: string) => <span className="text-slate-700">{name}</span>,
    },
    {
      title: <span className="text-xs text-slate-400 font-normal">Amount</span>,
      dataIndex: "amount",
      key: "amount",
      align: "right" as const,
      width: 110,
      render: (value: number) => (
        <span className={`font-mono font-medium ${colorClass}`}>{formatCrores(value)}</span>
      ),
    },
  ];
}

export function BreakdownTable({ data, month }: BreakdownTableProps) {
  const [showAll, setShowAll] = useState(false);

  if (!data || !month) {
    return (
      <Card size="small" variant="borderless" className="!bg-white border border-slate-200 rounded-xl mb-6">
        <div className="py-6">
          <Empty
            description={
              <span className="text-sm text-slate-400">Select a month on the chart to see the breakdown</span>
            }
          />
        </div>
      </Card>
    );
  }

  const customers = normalize(data.by_customer[month]);
  const vendors = normalize(data.by_vendor[month]);
  const totalCount = Math.max(customers.length, vendors.length);
  const canExpand = totalCount > COLLAPSED_COUNT;

  const displayedCustomers = showAll ? customers : customers.slice(0, COLLAPSED_COUNT);
  const displayedVendors = showAll ? vendors : vendors.slice(0, COLLAPSED_COUNT);

  return (
    <Card
      size="small"
      variant="borderless"
      className="!bg-white border border-slate-200 rounded-xl mb-6"
      title={
        <span className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users size={14} />
          </span>
          <span className="text-sm font-medium text-slate-700">Top customers and vendors</span>
        </span>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 uppercase tracking-wide mb-2">
            <Users size={12} />
            Customers (AR)
            <span className="text-slate-400 normal-case font-normal">· {customers.length}</span>
          </div>
          <div
            style={showAll ? { maxHeight: SCROLL_HEIGHT, overflowY: "auto" } : undefined}
            className={showAll ? "cf-scroll pr-1" : undefined}
          >
            <Table
              dataSource={displayedCustomers}
              columns={makeColumns("text-emerald-600")}
              size="small"
              pagination={false}
              showHeader={false}
              className="breakdown-table"
              locale={{
                emptyText: <Empty description={<span className="text-sm text-slate-400">No customers</span>} />,
              }}
            />
          </div>
        </div>
        <div className="sm:border-l sm:border-slate-100 sm:pl-6">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-rose-600 uppercase tracking-wide mb-2">
            <Building2 size={12} />
            Vendors (AP)
            <span className="text-slate-400 normal-case font-normal">· {vendors.length}</span>
          </div>
          <div
            style={showAll ? { maxHeight: SCROLL_HEIGHT, overflowY: "auto" } : undefined}
            className={showAll ? "cf-scroll pr-1" : undefined}
          >
            <Table
              dataSource={displayedVendors}
              columns={makeColumns("text-rose-600")}
              size="small"
              pagination={false}
              showHeader={false}
              className="breakdown-table"
              locale={{
                emptyText: <Empty description={<span className="text-sm text-slate-400">No vendors</span>} />,
              }}
            />
          </div>
        </div>
      </div>

      {canExpand && (
        <div className="flex justify-center pt-3 mt-1 border-t border-slate-100">
          <Button
            type="text"
            size="small"
            className="!text-slate-500 hover:!text-slate-700"
            icon={showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Show less" : `Load all (${totalCount})`}
          </Button>
        </div>
      )}
    </Card>
  );
}