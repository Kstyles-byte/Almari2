'use client';

import { DollarSign, TrendingUp, Users, CreditCard } from 'lucide-react';

interface FinancialOverviewProps {
  stats: {
    totalPayoutsThisMonth: number;
    pendingPayoutAmount: number;
    totalCommissionEarned: number;
    activeVendors: number;
  };
}

export default function FinancialOverview({ stats }: FinancialOverviewProps) {
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const cards = [
    {
      title: 'Pending Payouts',
      value: formatCurrency(stats.pendingPayoutAmount),
      icon: <DollarSign className="h-6 w-6" />,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700'
    },
    {
      title: 'Payouts This Month',
      value: formatCurrency(stats.totalPayoutsThisMonth),
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Commission Earned',
      value: formatCurrency(stats.totalCommissionEarned),
      icon: <CreditCard className="h-6 w-6" />,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Active Vendors',
      value: stats.activeVendors.toString(),
      icon: <Users className="h-6 w-6" />,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={index} className={`${card.bgColor} rounded-lg p-6 border border-gray-100`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${card.textColor}`}>
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {card.value}
              </p>
            </div>
            <div className={`${card.color} p-3 rounded-lg text-white`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
