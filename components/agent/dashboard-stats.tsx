'use client';

import { Package, CheckCircle, ShoppingBag } from 'lucide-react';

interface Props {
  pending?: number;
  ready?: number;
  picked?: number;
}

export function DashboardStats({ pending = 0, ready = 0, picked = 0 }: Props) {
  const cards = [
    { label: 'Pending', value: pending, icon: Package },
    { label: 'Ready', value: ready, icon: ShoppingBag },
    { label: 'Picked Up', value: picked, icon: CheckCircle },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white p-6 rounded-md shadow flex items-center space-x-3">
          <c.icon className="w-6 h-6 text-zervia-600" />
          <div>
            <p className="text-xl font-semibold">{c.value}</p>
            <p className="text-sm text-gray-600">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
} 