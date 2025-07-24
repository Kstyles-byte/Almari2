"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import React from 'react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface Props {
  labels: string[];
  data: number[];
  label?: string;
}

export default function LineChartClient({ labels, data, label = 'Series' }: Props) {
  const chartData = {
    labels,
    datasets: [
      {
        label,
        data,
        borderColor: '#4f46e5', // indigo-600
        backgroundColor: 'rgba(99, 102, 241, 0.3)',
        tension: 0.3,
        fill: true,
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

  return <Line data={chartData} options={options} />;
} 