'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, PieChart, FileText, Download, RefreshCw, Calendar, Filter, ArrowUp, ArrowDown, Activity, LayoutDashboard } from 'lucide-react';
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
  const [userRole, setUserRole] = useState<{ isAdmin: boolean; brand: string }>({ isAdmin: false, brand: 'all' });

  // 获取用户信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const result = await response.json();
        if (result.success && result.user) {
          const roles = result.user.roles || [];
          const isAdmin = roles.some((r: { role: string }) => 
            r.role === 'admin' || r.role === 'super_admin'
          );
          setUserRole({
            isAdmin,
            brand: result.user.brand || 'all'
          });
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      }
    };
    fetchUserInfo();
  }, []);

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
          <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
            <TabsTrigger value="dashboard">
              <BarChart3 className="mr-2 h-4 w-4" />
              数据概览
            </TabsTrigger>
            <TabsTrigger value="bi">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              BI分析
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

          {/* BI数据分析 */}
          <TabsContent value="bi" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5" />
                  BI数据分析中心
                </CardTitle>
                <CardDescription>多维度数据洞察与可视化分析，支持自定义仪表盘和丰富的图表类型</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                      <CardContent className="pt-6">
                        <BarChart3 className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">项目分析</h3>
                        <p className="text-sm text-muted-foreground">项目状态、品牌分布、趋势分析</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                      <CardContent className="pt-6">
                        <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">任务分析</h3>
                        <p className="text-sm text-muted-foreground">任务效率、岗位效能、完成趋势</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                      <CardContent className="pt-6">
                        <PieChart className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                        <h3 className="font-semibold mb-2">产品&营销</h3>
                        <p className="text-sm text-muted-foreground">产品销量、库存状态、营销ROI</p>
                      </CardContent>
                    </Card>
                  </div>
                  <a
                    href="/analytics/bi"
                    className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity text-lg font-medium"
                  >
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    进入BI数据分析中心
                  </a>
                  <p className="text-muted-foreground mt-4 text-sm">
                    支持5大分析模块：项目分析、任务分析、产品分析、营销分析、团队效能
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KPI大屏 */}
          <TabsContent value="kpi" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>KPI监控大屏</CardTitle>
                <CardDescription>实时监控关键绩效指标，自动刷新数据</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <a
                    href="/analytics/kpi"
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Activity className="mr-2 h-5 w-5" />
                    打开KPI监控大屏
                  </a>
                  <p className="text-muted-foreground mt-4 text-sm">
                    点击按钮打开全屏KPI监控大屏，享受沉浸式数据可视化体验
                  </p>
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
