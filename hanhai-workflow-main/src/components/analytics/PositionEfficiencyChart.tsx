'use client';

import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface PositionEfficiencyChartProps {
  data: Record<string, {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  }>;
}

export default function PositionEfficiencyChart({ data }: PositionEfficiencyChartProps) {
  const positions = Object.keys(data);
  const completedData = positions.map(pos => data[pos].completed);
  const inProgressData = positions.map(pos => data[pos].inProgress);
  const pendingData = positions.map(pos => data[pos].pending);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: ['已完成', '进行中', '待处理'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: positions,
      axisLabel: {
        fontSize: 12,
        rotate: 45,
      },
    },
    yAxis: {
      type: 'value',
      name: '任务数',
      axisLabel: {
        fontSize: 12,
      },
    },
    series: [
      {
        name: '已完成',
        type: 'bar',
        data: completedData,
        itemStyle: {
          color: '#10b981',
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: '#059669',
          },
        },
      },
      {
        name: '进行中',
        type: 'bar',
        data: inProgressData,
        itemStyle: {
          color: '#3b82f6',
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: '#2563eb',
          },
        },
      },
      {
        name: '待处理',
        type: 'bar',
        data: pendingData,
        itemStyle: {
          color: '#6b7280',
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: '#4b5563',
          },
        },
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
