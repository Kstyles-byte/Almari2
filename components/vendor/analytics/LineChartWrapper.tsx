"use client";
import React from 'react';
import LineChartClient from '@/components/charts/LineChartClient';

interface Props {
  labels: string[];
  data: number[];
  label?: string;
}

export default function LineChartWrapper({ labels, data, label }: Props) {
  return <LineChartClient labels={labels} data={data} label={label} />;
} 