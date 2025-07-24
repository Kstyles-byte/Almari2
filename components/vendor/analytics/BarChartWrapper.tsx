"use client";
import React from 'react';
import BarChartClient from '@/components/charts/BarChartClient';

interface Props {
  labels: string[];
  data: number[];
  label?: string;
}

export default function BarChartWrapper({ labels, data, label }: Props) {
  return <BarChartClient labels={labels} data={data} label={label} />;
} 