"use client"

import React from 'react';
import { Check, Clock, Package as PackageIcon, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PackageProps {
  type: 'standard' | 'express' | 'same-day' | 'pickup';
  selected?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function Package({
  type,
  selected = false,
  onSelect,
  className,
}: PackageProps) {
  const packageTypes = {
    standard: {
      icon: <Truck className="h-4 w-4" />,
      title: 'Standard Delivery',
      description: '3-5 business days',
      price: 'Free',
    },
    express: {
      icon: <PackageIcon className="h-4 w-4" />,
      title: 'Express Delivery',
      description: '1-2 business days',
      price: '$9.99',
    },
    'same-day': {
      icon: <Clock className="h-4 w-4" />,
      title: 'Same Day Delivery',
      description: 'Order by 2pm',
      price: '$14.99',
    },
    pickup: {
      icon: <PackageIcon className="h-4 w-4" />,
      title: 'Store Pickup',
      description: 'Ready in 2 hours',
      price: 'Free',
    },
  };

  const packageInfo = packageTypes[type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 transition-all cursor-pointer',
        selected
          ? 'border-zervia-600 bg-zervia-50'
          : 'border-gray-200 hover:border-gray-300',
        className
      )}
      onClick={onSelect}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          selected ? 'bg-zervia-100 text-zervia-600' : 'bg-gray-100 text-gray-500'
        )}
      >
        {packageInfo.icon}
      </div>

      <div className="flex-grow">
        <div className="flex items-center justify-between">
          <p className="font-medium text-gray-900">{packageInfo.title}</p>
          {selected && <Check className="h-4 w-4 text-zervia-600" />}
        </div>
        <p className="text-sm text-gray-500">{packageInfo.description}</p>
      </div>

      <div className="text-sm font-medium text-gray-900">
        {packageInfo.price}
      </div>
    </div>
  );
} 