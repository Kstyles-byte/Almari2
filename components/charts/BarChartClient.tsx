"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import React from 'react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  labels: string[];
  data: number[];
  label?: string;
}

export default function BarChartClient({ labels, data, label = 'Count' }: Props) {
  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        backgroundColor: '#4f46e5',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  } as const;

  return <Bar data={chartData} options={options} />;
} 