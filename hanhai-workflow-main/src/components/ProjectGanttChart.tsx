'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface GanttTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: string;
  role?: string;
  dependencies?: string[];
}

interface ProjectGanttChartProps {
  tasks: GanttTask[];
  projectName?: string;
}

export function ProjectGanttChart({ tasks, projectName }: ProjectGanttChartProps) {
  const [scale, setScale] = useState(1); // 缩放比例
  const [viewDate, setViewDate] = useState(new Date());

  // 计算日期范围
  const dateRange = useMemo(() => {
    if (tasks.length === 0) return null;

    const startDates = tasks.map(t => new Date(t.startDate));
    const endDates = tasks.map(t => new Date(t.endDate));

    const minDate = new Date(Math.min(...startDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...endDates.map(d => d.getTime())));

    // 前后各加3天缓冲
    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 3);

    return { minDate, maxDate };
  }, [tasks]);

  // 生成日期列表
  const dates = useMemo(() => {
    if (!dateRange) return [];
    
    const dates: Date[] = [];
    const current = new Date(dateRange.minDate);
    const end = new Date(dateRange.maxDate);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }, [dateRange, scale]);

  // 计算任务在时间轴上的位置和宽度
  const getTaskPosition = (task: GanttTask) => {
    if (!dateRange) return { left: 0, width: 0 };

    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const totalDays = dates.length;
    const dayWidth = (100 / totalDays) * scale;

    const startOffset = Math.floor((start.getTime() - dateRange.minDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return {
      left: startOffset * dayWidth,
      width: duration * dayWidth,
    };
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'bg-slate-500',
      in_progress: 'bg-blue-500',
      completed: 'bg-green-500',
      delayed: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            甘特图
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无任务数据</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              项目甘特图
            </CardTitle>
            {projectName && (
              <CardDescription>{projectName}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScale(s => Math.min(2, s + 0.1))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* 时间轴头部 */}
            <div className="flex border-b pb-2 mb-4">
              <div className="w-64 flex-shrink-0 font-medium text-sm text-muted-foreground">
                任务名称
              </div>
              <div className="flex-1 flex">
                {dates.map((date, index) => {
                  const isFirstOfMonth = date.getDate() === 1;
                  return (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger>
                          <div
                            className="flex-shrink-0 text-center text-xs border-r"
                            style={{
                              width: `${(100 / dates.length) * scale}%`,
                              minWidth: '20px',
                              backgroundColor: isFirstOfMonth ? 'rgba(0,0,0,0.05)' : undefined,
                            }}
                          >
                            {date.getDate()}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {formatDate(date)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>

            {/* 任务列表 */}
            <div className="space-y-2">
              {tasks.map((task) => {
                const position = getTaskPosition(task);
                return (
                  <div key={task.id} className="flex items-center gap-2">
                    {/* 任务名称 */}
                    <div className="w-64 flex-shrink-0 text-sm font-medium truncate">
                      {task.name}
                    </div>

                    {/* 甘特图条 */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex-1 relative h-8 bg-muted/30 rounded">
                            {/* 任务条 */}
                            <div
                              className={`absolute h-6 top-1 rounded-md ${getStatusColor(task.status)} hover:opacity-80 transition-opacity cursor-pointer`}
                              style={{
                                left: `${position.left}%`,
                                width: `${position.width}%`,
                                minWidth: '30px',
                              }}
                            >
                              {/* 进度条 */}
                              <div
                                className="absolute top-0 left-0 h-full bg-white/30 rounded-l-md"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="space-y-2">
                            <div className="font-medium">{task.name}</div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3 w-3" />
                              <span>
                                {new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">进度:</span>
                              <Progress value={task.progress} className="w-24 h-2" />
                              <span className="text-sm">{task.progress}%</span>
                            </div>
                            <Badge variant="outline">{task.status}</Badge>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                );
              })}
            </div>

            {/* 图例 */}
            <div className="flex items-center gap-4 mt-6 pt-4 border-t text-sm">
              <span className="font-medium">状态:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-slate-500" />
                <span>待开始</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>进行中</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>已完成</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span>已延期</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
