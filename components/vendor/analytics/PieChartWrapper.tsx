"use client";
import React from 'react';
import PieChartClient from '@/components/charts/PieChartClient';

interface Props {
  labels: string[];
  data: number[];
}

export default function PieChartWrapper({ labels, data }: Props) {
  return <PieChartClient labels={labels} data={data} />;
} 