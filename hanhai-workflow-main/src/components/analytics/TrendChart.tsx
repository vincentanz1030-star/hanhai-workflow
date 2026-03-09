'use client';

import { useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface TrendChartProps {
  data: Array<{
    month: string;
    projects: number;
    completedTasks: number;
  }>;
}

export default function TrendChart({ data }: TrendChartProps) {
  const chartRef = useRef<ReactECharts>(null);

  const option: EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: {
      data: ['项目数', '完成任务数'],
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
      data: data.map(item => item.month),
      axisLabel: {
        fontSize: 12,
      },
    },
    yAxis: {
      type: 'value',
      name: '数量',
      axisLabel: {
        fontSize: 12,
      },
    },
    series: [
      {
        name: '项目数',
        type: 'bar',
        data: data.map(item => item.projects),
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
        name: '完成任务数',
        type: 'line',
        data: data.map(item => item.completedTasks),
        smooth: true,
        itemStyle: {
          color: '#10b981',
        },
        lineStyle: {
          width: 3,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' },
            ],
          },
        },
      },
    ],
  };

  return (
    <ReactECharts
      ref={chartRef}
      option={option}
      style={{ height: '100%', width: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
}
