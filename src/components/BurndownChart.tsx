'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingDown, Activity } from 'lucide-react';

interface BurndownData {
  date: string;
  remaining: number;
  ideal: number;
  completed: number;
}

interface BurndownChartProps {
  data: BurndownData[];
  totalTasks?: number;
  sprintName?: string;
}

export function BurndownChart({ data, totalTasks, sprintName }: BurndownChartProps) {
  // 计算理想燃尽线
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
  }));

  // 如果没有数据，显示空状态
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            燃尽图
          </CardTitle>
          {sprintName && (
            <CardDescription>{sprintName}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无燃尽图数据</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 计算统计数据
  const lastData = data[data.length - 1];
  const firstData = data[0];
  const totalCompleted = lastData.completed;
  const totalRemaining = lastData.remaining;
  const completionRate = totalTasks ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              燃尽图
            </CardTitle>
            {sprintName && (
              <CardDescription>{sprintName}</CardDescription>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{completionRate}%</div>
            <div className="text-xs text-muted-foreground">完成率</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalTasks || firstData.ideal}</div>
            <div className="text-xs text-muted-foreground">总任务数</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalCompleted}</div>
            <div className="text-xs text-muted-foreground">已完成</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{totalRemaining}</div>
            <div className="text-xs text-muted-foreground">剩余</div>
          </div>
        </div>

        {/* 燃尽图 */}
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                label={{ value: '任务数', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="ideal"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="理想燃尽线"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="remaining"
                stroke="#3b82f6"
                strokeWidth={2}
                name="实际剩余"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#22c55e"
                strokeWidth={2}
                name="已完成"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 状态提示 */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">当前状态：</span>
            {completionRate >= 100 ? (
              <span className="text-sm text-green-600">✓ 已提前完成</span>
            ) : completionRate >= 80 ? (
              <span className="text-sm text-blue-600">→ 进度良好</span>
            ) : completionRate >= 50 ? (
              <span className="text-sm text-yellow-600">⚠ 需要加快进度</span>
            ) : (
              <span className="text-sm text-red-600">✗ 进度严重滞后</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
