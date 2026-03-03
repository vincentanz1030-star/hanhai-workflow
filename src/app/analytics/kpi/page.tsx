'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Zap,
  Activity
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface KPIData {
  projects: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
  };
  metrics: {
    completionRate: number;
    overdueRate: number;
    avgCompletionTime: number;
    monthlyNewProjects: number;
    monthlyCompletedTasks: number;
  };
  brandDistribution: Record<string, number>;
  topPositions: Array<{
    name: string;
    completed: number;
    total: number;
    rate: number;
  }>;
  trendData: Array<{
    date: string;
    completed: number;
    overdue: number;
  }>;
}

export default function KPIDashboardPage() {
  const [data, setData] = useState<KPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/kpi/dashboard');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('获取KPI数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 自动刷新倒计时
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          fetchData();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoRefresh, fetchData]);

  const getStatusColor = (value: number, thresholds: { warning: number; danger: number }) => {
    if (value >= thresholds.danger) return 'text-red-500 bg-red-50';
    if (value >= thresholds.warning) return 'text-yellow-500 bg-yellow-50';
    return 'text-green-500 bg-green-50';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getTrendColor = (current: number, previous: number, higherIsBetter: boolean = true) => {
    if (current === previous) return 'text-muted-foreground';
    if (higherIsBetter) {
      return current > previous ? 'text-green-500' : 'text-red-500';
    } else {
      return current < previous ? 'text-green-500' : 'text-red-500';
    }
  };

  // 趋势图配置
  const getTrendChartOption = (): EChartsOption => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data?.trendData.map(d => d.date) || [],
      axisLabel: {
        fontSize: 12,
        color: '#666',
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontSize: 12,
        color: '#666',
      },
    },
    series: [
      {
        name: '完成数',
        type: 'line',
        data: data?.trendData.map(d => d.completed) || [],
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
      {
        name: '逾期数',
        type: 'line',
        data: data?.trendData.map(d => d.overdue) || [],
        smooth: true,
        itemStyle: {
          color: '#ef4444',
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
              { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.05)' },
            ],
          },
        },
      },
    ],
  });

  // 品牌分布图配置
  const getBrandChartOption = (): EChartsOption => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '10%',
      top: 'center',
      textStyle: {
        fontSize: 12,
      },
    },
    series: [
      {
        name: '项目数量',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold',
          },
        },
        data: Object.entries(data?.brandDistribution || {}).map(([name, value]) => ({
          name,
          value,
        })),
      },
    ],
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
  });

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white text-lg">加载KPI数据...</p>
        </div>
      </div>
    );
  }

  const { projects, tasks, metrics, brandDistribution, topPositions } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-6">
      {/* 头部 */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            KPI 监控大屏
          </h1>
          <p className="text-slate-400 mt-1">实时数据监控 · 智能预警</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-slate-300 border-slate-600">
            <RefreshCw className="h-3 w-3 mr-1" />
            {refreshCountdown}s 后刷新
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchData();
              setRefreshCountdown(30);
            }}
            className="text-slate-300 border-slate-600 hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            立即刷新
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className="text-slate-300 border-slate-600 hover:bg-slate-700"
          >
            <Activity className="h-4 w-4 mr-2" />
            {isAutoRefresh ? '停止自动' : '开启自动'}
          </Button>
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 mb-6">
        {/* 项目总数 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-xs font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              项目总数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold text-white">{projects.total}</div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <Badge variant="outline" className="text-blue-400 border-blue-500/50">
                进行中 {projects.inProgress}
              </Badge>
              <Badge variant="outline" className="text-green-400 border-green-500/50">
                完成 {projects.completed}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 完成率 */}
        <Card className={`bg-slate-800/50 border-slate-700 ${getStatusColor(metrics.completionRate, { warning: 50, danger: 30 }).split(' ').pop()}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-xs font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              完成率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold">{metrics.completionRate}%</div>
            <div className={`flex items-center gap-1 mt-2 text-xs ${getTrendColor(metrics.completionRate, 0)}`}>
              {metrics.completionRate >= 70 && <CheckCircle className="h-3 w-3" />}
              {metrics.completionRate < 70 && metrics.completionRate >= 50 && <AlertTriangle className="h-3 w-3" />}
              {metrics.completionRate < 50 && <AlertTriangle className="h-3 w-3 text-red-500" />}
              {metrics.completionRate >= 70 ? '正常' : metrics.completionRate >= 50 ? '需关注' : '危险'}
            </div>
          </CardContent>
        </Card>

        {/* 逾期率 */}
        <Card className={`bg-slate-800/50 border-slate-700 ${getStatusColor(metrics.overdueRate, { warning: 20, danger: 40 }).split(' ').pop()}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              逾期率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold">{metrics.overdueRate}%</div>
            <div className={`flex items-center gap-1 mt-2 text-xs ${getTrendColor(metrics.overdueRate, 100, false)}`}>
              {metrics.overdueRate < 10 && <CheckCircle className="h-3 w-3" />}
              {metrics.overdueRate >= 10 && metrics.overdueRate < 30 && <AlertTriangle className="h-3 w-3" />}
              {metrics.overdueRate >= 30 && <AlertTriangle className="h-3 w-3 text-red-500" />}
              {metrics.overdueRate < 10 ? '良好' : metrics.overdueRate < 30 ? '警告' : '严重'}
            </div>
          </CardContent>
        </Card>

        {/* 平均完成时间 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-xs font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              平均完成时间
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold text-white">{metrics.avgCompletionTime.toFixed(1)}</div>
            <div className="text-xs text-slate-400 mt-2">天</div>
          </CardContent>
        </Card>

        {/* 本月新增项目 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-xs font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              本月新增
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold text-white">{metrics.monthlyNewProjects}</div>
            <div className="text-xs text-slate-400 mt-2">项目</div>
          </CardContent>
        </Card>

        {/* 本月完成任务 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-xs font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              本月完成
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl md:text-4xl font-bold text-white">{metrics.monthlyCompletedTasks}</div>
            <div className="text-xs text-slate-400 mt-2">任务</div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3 mb-6">
        {/* 趋势图 */}
        <Card className="bg-slate-800/50 border-slate-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-lg">完成趋势分析</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ReactECharts option={getTrendChartOption()} style={{ height: '100%', width: '100%' }} />
            </div>
          </CardContent>
        </Card>

        {/* 品牌分布 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">品牌分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ReactECharts option={getBrandChartOption()} style={{ height: '100%', width: '100%' }} />
            </div>
          </CardContent>
        </Card>

        {/* 岗位效率Top 5 */}
        <Card className="bg-slate-800/50 border-slate-700 lg:col-span-2 xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-white text-lg">岗位效率 Top 5</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              {topPositions.slice(0, 5).map((position, index) => (
                <div
                  key={position.name}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-300">{position.name}</span>
                    <Badge variant="outline" className={`text-xs ${
                      index === 0 ? 'border-yellow-500 text-yellow-400' :
                      index === 1 ? 'border-gray-400 text-gray-300' :
                      index === 2 ? 'border-orange-600 text-orange-400' :
                      'border-slate-500 text-slate-400'
                    }`}>
                      #{index + 1}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{position.rate}%</div>
                  <div className="text-xs text-slate-400">
                    完成 {position.completed} / 总计 {position.total}
                  </div>
                  <div className="mt-2 h-2 bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${position.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 底部信息 */}
      <div className="text-center text-slate-500 text-xs">
        <p>最后刷新: {lastRefresh.toLocaleString('zh-CN')}</p>
        <p className="mt-1">数据每30秒自动刷新一次</p>
      </div>
    </div>
  );
}
