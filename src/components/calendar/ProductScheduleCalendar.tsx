'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Package } from 'lucide-react';

interface CalendarProject {
  id: string;
  name: string;
  brand: string;
  sales_date: string;
  category: string;
  status: string;
}

interface CalendarData {
  year: number;
  month: number;
  daysInMonth: number;
  brandGroups: Record<string, CalendarProject[]>;
  totalProjects: number;
}

interface ProductScheduleCalendarProps {
  compact?: boolean;
}

export default function ProductScheduleCalendar({ compact = false }: ProductScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<CalendarData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/calendar-schedule?year=${year}&month=${month}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('获取日历数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const getDayOfWeek = (day: number) => {
    const date = new Date(year, month - 1, day);
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return days[date.getDay()];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">已完成</Badge>;
      case 'in-progress':
        return <Badge variant="default" className="bg-blue-500">进行中</Badge>;
      case 'pending':
        return <Badge variant="outline">待开始</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const getDayIndex = (dateString: string) => {
    const date = new Date(dateString);
    return date.getDate() - 1;
  };

  const isWeekend = (day: number) => {
    const date = new Date(year, month - 1, day);
    return date.getDay() === 0 || date.getDay() === 6;
  };

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>新品排期日历</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { daysInMonth, brandGroups } = data;
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

  return (
    <Card className={`${compact ? '' : 'mb-6'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {year}年{month}月 新品排期日历
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-24 text-center">
              {monthNames[month - 1]}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 图例 */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>已完成</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>进行中</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>待开始</span>
          </div>
        </div>

        {/* 日历网格 */}
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* 日期头 */}
            <div className="grid grid-cols-[200px_repeat(31,minmax(40px,1fr))] gap-0 border-b">
              <div className="p-2 text-xs font-medium bg-muted/50 sticky left-0 z-10">
                品牌 / 产品
              </div>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                return (
                  <div
                    key={day}
                    className={`p-2 text-xs font-medium text-center border-l ${
                      isWeekend(day) ? 'bg-muted/30' : 'bg-muted/50'
                    }`}
                  >
                    <div className="font-bold">{day}</div>
                    <div className="text-muted-foreground">{getDayOfWeek(day)}</div>
                  </div>
                );
              })}
            </div>

            {/* 品牌和产品行 */}
            {Object.entries(brandGroups).length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                本月暂无排期
              </div>
            ) : (
              Object.entries(brandGroups).map(([brand, projects]) => (
                <div key={brand} className="border-b last:border-b-0">
                  {/* 品牌标题行 */}
                  <div className="grid grid-cols-[200px_repeat(31,minmax(40px,1fr))] gap-0 bg-muted/20">
                    <div className="p-2 text-sm font-semibold sticky left-0 z-10 bg-muted/20 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {brand}
                      <Badge variant="outline" className="ml-auto">
                        {projects.length}
                      </Badge>
                    </div>
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <div
                        key={i}
                        className={`p-1 border-l ${isWeekend(i + 1) ? 'bg-muted/10' : ''}`}
                      />
                    ))}
                  </div>

                  {/* 产品行 */}
                  {projects.map((project) => {
                    const dayIndex = getDayIndex(project.sales_date);
                    return (
                      <div
                        key={project.id}
                        className="grid grid-cols-[200px_repeat(31,minmax(40px,1fr))] gap-0 hover:bg-muted/10"
                      >
                        <div className="p-2 text-xs border-l sticky left-0 z-10 bg-background flex items-center gap-2 overflow-hidden">
                          <div
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(project.status)}`}
                          />
                          <span className="truncate" title={project.name}>
                            {project.name}
                          </span>
                        </div>
                        {Array.from({ length: daysInMonth }, (_, i) => (
                          <div
                            key={i}
                            className={`p-1 border-l text-center ${
                              isWeekend(i + 1) ? 'bg-muted/10' : ''
                            } ${i === dayIndex ? 'bg-blue-50' : ''}`}
                          >
                            {i === dayIndex && (
                              <div
                                className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center ${getStatusColor(project.status)} text-white text-xs font-bold`}
                                title={`${project.name}\n日期: ${project.sales_date}\n状态: ${project.status}`}
                              >
                                ✓
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
          <span>本月共 {data.totalProjects} 个新品排期</span>
          <span>共 {Object.keys(brandGroups).length} 个品牌</span>
        </div>
      </CardContent>
    </Card>
  );
}
