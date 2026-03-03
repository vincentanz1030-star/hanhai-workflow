'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, PieChart, FileText, Download, RefreshCw, Calendar, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import TrendChart from '@/components/analytics/TrendChart';
import BrandDistributionChart from '@/components/analytics/BrandDistributionChart';
import PositionEfficiencyChart from '@/components/analytics/PositionEfficiencyChart';
import TaskStatusChart from '@/components/analytics/TaskStatusChart';

interface AnalyticsData {
  stats: {
    projects: {
      total: number;
      inProgress: number;
      completed: number;
      pending: number;
    };
    tasks: {
      total: number;
      completed: number;
      inProgress: number;
      pending: number;
      overdue: number;
    };
    completionRate: number;
  };
  brandDistribution: Record<string, number>;
  positionStats: Record<string, {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  }>;
  trendData: Array<{
    month: string;
    projects: number;
    completedTasks: number;
  }>;
}

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics?period=${selectedPeriod}&brand=${selectedBrand}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, selectedBrand]);

  const handleRefresh = async () => {
    await fetchData();
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  const { stats, brandDistribution, positionStats, trendData } = data;

  return (
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">数据分析中心</h1>
              <p className="text-muted-foreground mt-1">实时监控和分析项目数据</p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">本周</SelectItem>
                  <SelectItem value="month">本月</SelectItem>
                  <SelectItem value="quarter">本季度</SelectItem>
                  <SelectItem value="year">本年度</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部品牌</SelectItem>
                  <SelectItem value="brand1">品牌 A</SelectItem>
                  <SelectItem value="brand2">品牌 B</SelectItem>
                  <SelectItem value="brand3">品牌 C</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
            <TabsTrigger value="dashboard">
              <BarChart3 className="mr-2 h-4 w-4" />
              数据概览
            </TabsTrigger>
            <TabsTrigger value="kpi">
              <TrendingUp className="mr-2 h-4 w-4" />
              KPI大屏
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="mr-2 h-4 w-4" />
              报表中心
            </TabsTrigger>
          </TabsList>

          {/* 数据概览 */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* 核心指标卡片 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">项目总数</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.projects.total}</div>
                  <p className="text-xs text-muted-foreground">
                    进行中 {stats.projects.inProgress} · 完成 {stats.projects.completed}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">任务总数</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.tasks.total}</div>
                  <p className="text-xs text-muted-foreground">
                    完成 {stats.tasks.completed} · 逾期 {stats.tasks.overdue}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">完成率</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completionRate}%</div>
                  <div className="flex items-center text-xs">
                    <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-muted-foreground">较上月 +2.5%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">逾期任务</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.tasks.overdue}</div>
                  <div className="flex items-center text-xs">
                    <ArrowDown className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-muted-foreground">较上月 -8</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 图表区域 */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* 项目趋势图 */}
              <Card>
                <CardHeader>
                  <CardTitle>项目趋势分析</CardTitle>
                  <CardDescription>近6个月项目数量变化趋势</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <TrendChart data={trendData} />
                  </div>
                </CardContent>
              </Card>

              {/* 品牌分布图 */}
              <Card>
                <CardHeader>
                  <CardTitle>品牌项目分布</CardTitle>
                  <CardDescription>各品牌项目数量占比</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <BrandDistributionChart data={brandDistribution} />
                  </div>
                </CardContent>
              </Card>

              {/* 岗位效率图 */}
              <Card>
                <CardHeader>
                  <CardTitle>岗位效率分析</CardTitle>
                  <CardDescription>各岗位任务完成情况</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <PositionEfficiencyChart data={positionStats} />
                  </div>
                </CardContent>
              </Card>

              {/* 任务状态分布 */}
              <Card>
                <CardHeader>
                  <CardTitle>任务状态分布</CardTitle>
                  <CardDescription>任务完成进度分析</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <TaskStatusChart data={stats.tasks} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 快捷操作 */}
            <Card>
              <CardHeader>
                <CardTitle>快捷操作</CardTitle>
                <CardDescription>常用分析功能入口</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Button variant="outline" className="justify-start">
                    <Download className="mr-2 h-4 w-4" />
                    导出报表
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    创建自定义报表
                  </Button>
                  <Button variant="outline" className="justify-start" onClick={handleRefresh}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    刷新数据
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KPI大屏 */}
          <TabsContent value="kpi" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>KPI监控大屏</CardTitle>
                <CardDescription>实时监控关键绩效指标</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] flex items-center justify-center bg-muted/20 rounded">
                  <div className="text-center">
                    <div className="animate-pulse rounded-full h-12 w-12 border-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">KPI监控大屏功能正在开发中...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 报表中心 */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>报表中心</CardTitle>
                <CardDescription>创建和管理自定义报表</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] flex items-center justify-center bg-muted/20 rounded">
                  <div className="text-center">
                    <div className="animate-pulse rounded-full h-12 w-12 border-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">报表中心功能正在开发中...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
