'use client';

import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface TaskStatusChartProps {
  data: {
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
  };
}

export default function TaskStatusChart({ data }: TaskStatusChartProps) {
  const chartData = [
    { name: '已完成', value: data.completed, itemStyle: { color: '#10b981' } },
    { name: '进行中', value: data.inProgress, itemStyle: { color: '#3b82f6' } },
    { name: '待处理', value: data.pending, itemStyle: { color: '#6b7280' } },
    { name: '已逾期', value: data.overdue, itemStyle: { color: '#ef4444' } },
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const percent = ((params.value / total) * 100).toFixed(1);
        return `${params.name}: ${params.value} (${percent}%)`;
      },
    },
    legend: {
      orient: 'vertical',
      right: '10%',
      top: 'center',
      data: chartData.map(item => item.name),
    },
    series: [
      {
        name: '任务状态',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'inside',
          formatter: (params: any) => {
            const value = Number(params.value) || 0;
            const percent = ((value / total) * 100).toFixed(0);
            return Number(percent) > 5 ? `${percent}%` : '';
          },
          fontSize: 14,
          fontWeight: 'bold',
          color: '#fff',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: chartData,
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
}
