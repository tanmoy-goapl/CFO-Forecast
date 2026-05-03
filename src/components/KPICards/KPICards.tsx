import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

interface KPICardsProps {
  currentBalance:  number;
  avgInflow:       number;
  avgOutflow:      number;
  forecastClosing: number;
  forecastLabel:   string;
  historicalMonths: number;
}

interface CardConfig {
  label:    string;
  value:    number;
  sub:      string;
  icon:     React.ReactNode;
  accent?:  string; // tailwind border-l color class
}

export const KPICards: React.FC<KPICardsProps> = ({
  currentBalance,
  avgInflow,
  avgOutflow,
  forecastClosing,
  forecastLabel,
  historicalMonths,
}) => {
  const cards: CardConfig[] = [
    {
      label:  'Current Balance',
      value:  currentBalance,
      sub:    'As of last actual month',
      icon:   <Wallet size={16} className="text-gray-400" />,
    },
    {
      label:  'Avg Monthly Inflow',
      value:  Math.round(avgInflow),
      sub:    `Avg over ${historicalMonths} months`,
      icon:   <TrendingUp size={16} className="text-green-500" />,
    },
    {
      label:  'Avg Monthly Outflow',
      value:  Math.round(avgOutflow),
      sub:    `Avg over ${historicalMonths} months`,
      icon:   <TrendingDown size={16} className="text-red-400" />,
    },
    {
      label:  'Forecast Closing Cash',
      value:  forecastClosing,
      sub:    forecastLabel ? `Projected by ${forecastLabel}` : '—',
      icon:   <Target size={16} className="text-blue-500" />,
      accent: 'border-l-[2.5px] border-l-blue-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {cards.map(card => (
        <div
          key={card.label}
          className={`bg-gray-50 rounded-lg border border-gray-200 px-4 py-3 ${card.accent ?? ''}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10.5px] font-medium text-gray-500 uppercase tracking-wider">
              {card.label}
            </span>
            {card.icon}
          </div>
          <div className="text-[22px] font-medium text-gray-900 tabular-nums leading-tight">
            {formatINR(card.value)}
          </div>
          <div className="text-[11px] text-gray-400 mt-1">{card.sub}</div>
        </div>
      ))}
    </div>
  );
};
