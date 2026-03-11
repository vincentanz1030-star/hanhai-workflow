'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Activity,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  ArrowUp,
  ArrowDown,
  Target,
  Users,
  Package,
  ShoppingCart,
  Megaphone,
  Clock,
  Zap,
  Eye,
  FileText,
  LayoutDashboard,
  ChevronRight
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import Link from 'next/link';

interface BIDashboardData {
  overview: {
    totalProjects: number;
    totalTasks: number;
    totalProducts: number;
    totalOrders: number;
    completionRate: number;
    overdueRate: number;
    avgCompletionDays: number;
    monthlyGrowth: number;
  };
  projectAnalysis: {
    byStatus: Array<{ name: string; value: number; color: string }>;
    byBrand: Array<{ name: string; value: number }>;
    trend: Array<{ month: string; newProjects: number; completed: number }>;
  };
  taskAnalysis: {
    byStatus: Array<{ name: string; value: number; color: string }>;
    byPosition: Array<{ name: string; total: number; completed: number; rate: number }>;
    trend: Array<{ date: string; completed: number; overdue: number }>;
    efficiency: Array<{ name: string; value: number }>;
  };
  productAnalysis: {
    categoryDistribution: Array<{ name: string; value: number }>;
    inventoryStatus: Array<{ name: string; value: number; color: string }>;
    topProducts: Array<{ name: string; sales: number; stock: number }>;
  };
  marketingAnalysis: {
    campaignPerformance: Array<{ name: string; roi: number; budget: number; revenue: number }>;
    channelDistribution: Array<{ name: string; value: number }>;
    conversionFunnel: Array<{ name: string; value: number }>;
  };
  teamPerformance: {
    memberStats: Array<{ 
      name: string; 
      position: string; 
      tasksCompleted: number; 
      tasksInProgress: number;
      efficiency: number;
    }>;
    weeklyTrend: Array<{ week: string; completed: number; created: number }>;
  };
}

const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  gray: '#6b7280',
};

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  'in-progress': '#3b82f6',
  pending: '#f59e0b',
  overdue: '#ef4444',
  cancelled: '#6b7280',
};

export default function BIDashboardPage() {
  const [data, setData] = useState<BIDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedModule, setSelectedModule] = useState('overview');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshCountdown, setRefreshCountdown] = useState(60);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/bi/dashboard?period=${selectedPeriod}&brand=${selectedBrand}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('获取BI数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod, selectedBrand]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 自动刷新
  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          fetchData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isAutoRefresh, fetchData]);

  // 概览卡片
  const renderOverviewCards = () => {
    if (!data) return null;
    const { overview } = data;

    const cards = [
      { 
        title: '总项目数', 
        value: overview.totalProjects, 
        icon: LayoutDashboard, 
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 dark:bg-blue-950/30',
        trend: overview.monthlyGrowth,
      },
      { 
        title: '总任务数', 
        value: overview.totalTasks, 
        icon: Target, 
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-950/30',
        trend: 5.2,
      },
      { 
        title: '产品数量', 
        value: overview.totalProducts, 
        icon: Package, 
        color: 'text-purple-500',
        bgColor: 'bg-purple-50 dark:bg-purple-950/30',
        trend: 3.8,
      },
      { 
        title: '订单数量', 
        value: overview.totalOrders, 
        icon: ShoppingCart, 
        color: 'text-orange-500',
        bgColor: 'bg-orange-50 dark:bg-orange-950/30',
        trend: 12.5,
      },
      { 
        title: '完成率', 
        value: `${overview.completionRate}%`, 
        icon: TrendingUp, 
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
        trend: 2.1,
      },
      { 
        title: '逾期率', 
        value: `${overview.overdueRate}%`, 
        icon: Clock, 
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        trend: -1.5,
        invertTrend: true,
      },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  {card.trend !== undefined && (
                    <div className={`flex items-center gap-1 mt-1 text-xs ${
                      card.invertTrend 
                        ? (card.trend < 0 ? 'text-green-500' : 'text-red-500')
                        : (card.trend > 0 ? 'text-green-500' : 'text-red-500')
                    }`}>
                      {card.trend > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      <span>{Math.abs(card.trend)}%</span>
                    </div>
                  )}
                </div>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // 项目分析图表
  const renderProjectCharts = () => {
    if (!data) return null;
    const { projectAnalysis } = data;

    // 项目状态分布饼图
    const statusPieOption: EChartsOption = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: '5%', left: 'center' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: projectAnalysis.byStatus.map(item => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: item.color },
        })),
      }],
    };

    // 品牌分布柱状图
    const brandBarOption: EChartsOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: projectAnalysis.byBrand.map(b => b.name),
        axisLabel: { rotate: 30, fontSize: 11 },
      },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: projectAnalysis.byBrand.map(b => b.value),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#60a5fa' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      }],
    };

    // 项目趋势折线图
    const trendLineOption: EChartsOption = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['新增项目', '完成项目'], bottom: '0%' },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: projectAnalysis.trend.map(t => t.month) },
      yAxis: { type: 'value' },
      series: [
        {
          name: '新增项目',
          type: 'line',
          smooth: true,
          data: projectAnalysis.trend.map(t => t.newProjects),
          areaStyle: { opacity: 0.1 },
          itemStyle: { color: '#3b82f6' },
        },
        {
          name: '完成项目',
          type: 'line',
          smooth: true,
          data: projectAnalysis.trend.map(t => t.completed),
          areaStyle: { opacity: 0.1 },
          itemStyle: { color: '#22c55e' },
        },
      ],
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              项目状态分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={statusPieOption} style={{ height: 280 }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              品牌项目分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={brandBarOption} style={{ height: 280 }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              项目趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={trendLineOption} style={{ height: 280 }} />
          </CardContent>
        </Card>
      </div>
    );
  };

  // 任务分析图表
  const renderTaskCharts = () => {
    if (!data) return null;
    const { taskAnalysis } = data;

    // 任务状态分布
    const statusOption: EChartsOption = {
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '45%'],
        data: taskAnalysis.byStatus.map(item => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: item.color },
        })),
        label: { formatter: '{b}\n{d}%' },
      }],
    };

    // 岗位效率雷达图
    const radarOption: EChartsOption = {
      tooltip: {},
      radar: {
        indicator: taskAnalysis.efficiency.map(e => ({
          name: e.name,
          max: 100,
        })),
        center: ['50%', '55%'],
        radius: '65%',
      },
      series: [{
        type: 'radar',
        data: [{
          value: taskAnalysis.efficiency.map(e => e.value),
          name: '完成率',
          areaStyle: { opacity: 0.3 },
          lineStyle: { color: '#3b82f6' },
          itemStyle: { color: '#3b82f6' },
        }],
      }],
    };

    // 岗位任务完成柱状图
    const positionBarOption: EChartsOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['总任务', '已完成'], bottom: '0%' },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: taskAnalysis.byPosition.map(p => p.name),
        axisLabel: { rotate: 30, fontSize: 10 },
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: '总任务',
          type: 'bar',
          data: taskAnalysis.byPosition.map(p => p.total),
          itemStyle: { color: '#94a3b8', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: '已完成',
          type: 'bar',
          data: taskAnalysis.byPosition.map(p => p.completed),
          itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };

    // 任务趋势
    const trendOption: EChartsOption = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['完成', '逾期'], bottom: '0%' },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: taskAnalysis.trend.map(t => t.date) },
      yAxis: { type: 'value' },
      series: [
        {
          name: '完成',
          type: 'line',
          smooth: true,
          data: taskAnalysis.trend.map(t => t.completed),
          areaStyle: { opacity: 0.1 },
          itemStyle: { color: '#22c55e' },
        },
        {
          name: '逾期',
          type: 'line',
          smooth: true,
          data: taskAnalysis.trend.map(t => t.overdue),
          areaStyle: { opacity: 0.1 },
          itemStyle: { color: '#ef4444' },
        },
      ],
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">任务状态</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={statusOption} style={{ height: 240 }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">岗位效率雷达</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={radarOption} style={{ height: 240 }} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">岗位任务统计</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={positionBarOption} style={{ height: 240 }} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">任务完成趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={trendOption} style={{ height: 200 }} />
          </CardContent>
        </Card>
      </div>
    );
  };

  // 产品分析图表
  const renderProductCharts = () => {
    if (!data) return null;
    const { productAnalysis } = data;

    // 产品分类分布
    const categoryOption: EChartsOption = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', right: '5%', top: 'center' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        data: productAnalysis.categoryDistribution,
        itemStyle: { borderRadius: 8 },
        label: { show: false },
      }],
    };

    // 库存状态
    const inventoryOption: EChartsOption = {
      tooltip: { trigger: 'item' },
      series: [{
        type: 'pie',
        radius: ['35%', '60%'],
        center: ['50%', '50%'],
        data: productAnalysis.inventoryStatus.map(item => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: item.color },
        })),
        label: { formatter: '{b}\n{c}' },
      }],
    };

    // Top产品
    const topProductsOption: EChartsOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['销量', '库存'], bottom: '0%' },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '5%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: productAnalysis.topProducts.map(p => p.name),
        axisLabel: { rotate: 20, fontSize: 10 },
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: '销量',
          type: 'bar',
          data: productAnalysis.topProducts.map(p => p.sales),
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: '库存',
          type: 'bar',
          data: productAnalysis.topProducts.map(p => p.stock),
          itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              产品分类分布
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={categoryOption} style={{ height: 280 }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              库存状态
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={inventoryOption} style={{ height: 280 }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Top产品销量/库存
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={topProductsOption} style={{ height: 280 }} />
          </CardContent>
        </Card>
      </div>
    );
  };

  // 营销分析图表
  const renderMarketingCharts = () => {
    if (!data) return null;
    const { marketingAnalysis } = data;

    // 活动ROI
    const roiOption: EChartsOption = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['预算', '收入'], bottom: '0%' },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: marketingAnalysis.campaignPerformance.map(c => c.name),
        axisLabel: { rotate: 20, fontSize: 10 },
      },
      yAxis: [
        { type: 'value', name: '金额' },
        { type: 'value', name: 'ROI (%)', position: 'right' },
      ],
      series: [
        {
          name: '预算',
          type: 'bar',
          data: marketingAnalysis.campaignPerformance.map(c => c.budget),
          itemStyle: { color: '#94a3b8', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: '收入',
          type: 'bar',
          data: marketingAnalysis.campaignPerformance.map(c => c.revenue),
          itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: 'ROI',
          type: 'line',
          yAxisIndex: 1,
          data: marketingAnalysis.campaignPerformance.map(c => c.roi),
          itemStyle: { color: '#8b5cf6' },
          lineStyle: { width: 3 },
        },
      ],
    };

    // 渠道分布
    const channelOption: EChartsOption = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: '5%', left: 'center' },
      series: [{
        type: 'pie',
        radius: ['30%', '60%'],
        center: ['50%', '45%'],
        data: marketingAnalysis.channelDistribution,
        itemStyle: { borderRadius: 6 },
        label: { show: true, formatter: '{b}' },
      }],
    };

    // 转化漏斗
    const funnelOption: EChartsOption = {
      tooltip: { trigger: 'item', formatter: '{b}: {c}' },
      series: [{
        type: 'funnel',
        left: '10%',
        top: '10%',
        bottom: '10%',
        width: '80%',
        min: 0,
        max: 100,
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: { show: true, position: 'inside' },
        labelLine: { length: 10, lineStyle: { width: 1, type: 'solid' } },
        itemStyle: { borderColor: '#fff', borderWidth: 1 },
        emphasis: { label: { fontSize: 14 } },
        data: marketingAnalysis.conversionFunnel.map((item, index) => ({
          name: item.name,
          value: item.value,
          itemStyle: { 
            color: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444'][index] 
          },
        })),
      }],
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              活动ROI分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={roiOption} style={{ height: 300 }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">渠道分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={channelOption} style={{ height: 300 }} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              营销转化漏斗
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={funnelOption} style={{ height: 200 }} />
          </CardContent>
        </Card>
      </div>
    );
  };

  // 团队效能
  const renderTeamPerformance = () => {
    if (!data) return null;
    const { teamPerformance } = data;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              团队成员效能
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">成员</th>
                    <th className="text-left py-2 px-3">岗位</th>
                    <th className="text-center py-2 px-3">已完成</th>
                    <th className="text-center py-2 px-3">进行中</th>
                    <th className="text-center py-2 px-3">效率</th>
                  </tr>
                </thead>
                <tbody>
                  {teamPerformance.memberStats.map((member, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium">{member.name}</td>
                      <td className="py-2 px-3 text-muted-foreground">{member.position}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant="secondary">{member.tasksCompleted}</Badge>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant="outline">{member.tasksInProgress}</Badge>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full" 
                              style={{ width: `${member.efficiency}%` }}
                            />
                          </div>
                          <span className="text-xs">{member.efficiency}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">周度趋势</CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts 
              option={{
                tooltip: { trigger: 'axis' },
                legend: { data: ['完成', '新建'], bottom: '0%' },
                grid: { left: '3%', right: '4%', bottom: '15%', top: '5%', containLabel: true },
                xAxis: { type: 'category', data: teamPerformance.weeklyTrend.map(w => w.week) },
                yAxis: { type: 'value' },
                series: [
                  {
                    name: '完成',
                    type: 'bar',
                    data: teamPerformance.weeklyTrend.map(w => w.completed),
                    itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] },
                  },
                  {
                    name: '新建',
                    type: 'bar',
                    data: teamPerformance.weeklyTrend.map(w => w.created),
                    itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
                  },
                ],
              }} 
              style={{ height: 280 }} 
            />
          </CardContent>
        </Card>
      </div>
    );
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载BI数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">BI数据分析中心</h1>
                <p className="text-sm text-muted-foreground">多维度数据洞察与可视化分析</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 时间筛选 */}
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[130px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">本周</SelectItem>
                  <SelectItem value="month">本月</SelectItem>
                  <SelectItem value="quarter">本季度</SelectItem>
                  <SelectItem value="year">本年</SelectItem>
                </SelectContent>
              </Select>

              {/* 品牌筛选 */}
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部品牌</SelectItem>
                  <SelectItem value="brand_a">品牌A</SelectItem>
                  <SelectItem value="brand_b">品牌B</SelectItem>
                  <SelectItem value="brand_c">品牌C</SelectItem>
                </SelectContent>
              </Select>

              {/* 自动刷新 */}
              <Button
                variant={isAutoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              >
                <Zap className="mr-2 h-4 w-4" />
                {isAutoRefresh ? `${refreshCountdown}s` : '自动刷新'}
              </Button>

              {/* 手动刷新 */}
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>

              {/* 导出 */}
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                导出报表
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 快捷导航 */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-4 text-sm">
            <Link href="/analytics" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Activity className="h-4 w-4" />
              数据分析
            </Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">BI中心</span>
            <Link href="/analytics/kpi" className="text-muted-foreground hover:text-foreground ml-4">
              KPI仪表盘
            </Link>
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <div className="container mx-auto px-4 py-6">
        {/* 刷新时间提示 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            最后更新: {lastRefresh.toLocaleTimeString('zh-CN')}
          </p>
        </div>

        {/* 概览卡片 */}
        <div className="mb-6">
          {renderOverviewCards()}
        </div>

        {/* 模块选项卡 */}
        <Tabs value={selectedModule} onValueChange={setSelectedModule} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">项目分析</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">任务分析</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">产品分析</span>
            </TabsTrigger>
            <TabsTrigger value="marketing" className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              <span className="hidden sm:inline">营销分析</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">团队效能</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {renderProjectCharts()}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            {renderTaskCharts()}
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            {renderProductCharts()}
          </TabsContent>

          <TabsContent value="marketing" className="space-y-6">
            {renderMarketingCharts()}
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            {renderTeamPerformance()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
