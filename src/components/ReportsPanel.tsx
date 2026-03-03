'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, TrendingUp, CheckCircle, AlertCircle, Clock, Download, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getPositionName } from '@/lib/config';

interface ReportSummary {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  delayedProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalUsers: number;
  activeUsers: number;
  averageTaskProgress: number;
  onTimeCompletionRate: number;
}

interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  summary: ReportSummary;
  projects: {
    total: number;
    completed: number;
    byStatus: { [key: string]: number };
    byBrand: { [key: string]: number };
  };
  tasks: {
    total: number;
    completed: number;
    byRole: { [key: string]: number };
    byStatus: { [key: string]: number };
    overdueByRole: { [key: string]: number };
  };
  collaboration: {
    total: number;
    completed: number;
  };
  weeklyPlans: {
    total: number;
    completed: number;
    byPosition: { [key: string]: number };
  };
}

interface MonthlyReport {
  year: number;
  month: number;
  summary: ReportSummary;
  projects: {
    total: number;
    completed: number;
    byStatus: { [key: string]: number };
    byBrand: { [key: string]: number };
  };
  tasks: {
    total: number;
    completed: number;
    byRole: { [key: string]: number };
    byStatus: { [key: string]: number };
    completionRateByRole: { [key: string]: number };
  };
  salesTargets: {
    monthlyTarget: number;
    monthlyActual: number;
    completionRate: number;
    byBrand: { [key: string]: { target: number; actual: number } };
  };
  weeklyTrends: Array<{
    weekStart: string;
    completedTasks: number;
    completedProjects: number;
  }>;
}

export default function ReportsPanel() {
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string>('');

  useEffect(() => {
    loadWeeklyReport();
  }, []);

  useEffect(() => {
    if (reportType === 'weekly') {
      loadWeeklyReport();
    } else {
      loadMonthlyReport();
    }
  }, [reportType]);

  const loadWeeklyReport = async () => {
    setLoading(true);
    try {
      const params = selectedWeek ? `?type=weekly&weekStart=${selectedWeek}` : '?type=weekly';
      const response = await fetch(`/api/reports${params}`);
      const data = await response.json();
      if (data.success) {
        setWeeklyReport(data.report);
      }
    } catch (error) {
      console.error('加载周报失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyReport = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const response = await fetch(`/api/reports?type=monthly&year=${year}&month=${month}`);
      const data = await response.json();
      if (data.success) {
        setMonthlyReport(data.report);
      }
    } catch (error) {
      console.error('加载月报失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (format: 'pdf' | 'word') => {
    // TODO: 实现报表下载功能
    console.log(`下载${format}报表`);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const renderSummary = (summary: ReportSummary) => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      <Card className="p-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-[11px] font-medium text-muted-foreground">总项目数</div>
            <div className="text-lg font-bold">{summary.totalProjects}</div>
            <div className="text-[10px] text-green-600">
              完成 {summary.completedProjects}
            </div>
          </div>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-[11px] font-medium text-muted-foreground">总任务数</div>
            <div className="text-lg font-bold">{summary.totalTasks}</div>
            <div className="text-[10px] text-green-600">
              完成 {summary.completedTasks}
            </div>
          </div>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-[11px] font-medium text-muted-foreground">逾期任务</div>
            <div className="text-lg font-bold text-destructive">{summary.overdueTasks}</div>
            <div className="text-[10px] text-muted-foreground">
              占比 {summary.totalTasks > 0 ? Math.round((summary.overdueTasks / summary.totalTasks) * 100) : 0}%
            </div>
          </div>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </div>
      </Card>

      <Card className="p-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-[11px] font-medium text-muted-foreground">按时完成率</div>
            <div className="text-lg font-bold">{summary.onTimeCompletionRate}%</div>
            <div className="text-[10px] text-muted-foreground">
              平均进度 {summary.averageTaskProgress}%
            </div>
          </div>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </div>
      </Card>
    </div>
  );

  const renderWeeklyContent = () => {
    if (!weeklyReport) return null;

    const { summary, projects, tasks, collaboration, weeklyPlans } = weeklyReport;

    // 准备图表数据
    const tasksByRoleData = Object.entries(tasks.byRole).map(([role, count]) => ({
      name: getPositionName(role),
      value: count,
    }));

    const tasksByStatusData = Object.entries(tasks.byStatus).map(([status, count]) => ({
      name: status === 'completed' ? '已完成' : status === 'in_progress' ? '进行中' : '待处理',
      value: count,
    }));

    const overdueByRoleData = Object.entries(tasks.overdueByRole).map(([role, count]) => ({
      name: getPositionName(role),
      value: count,
    }));

    return (
      <div className="space-y-4">
        {/* 报表标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">周报概览</h3>
            <div className="text-xs text-muted-foreground mt-1">
              {weeklyReport.weekStart} 至 {weeklyReport.weekEnd}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadWeeklyReport}>
              <RefreshCw className="h-3 w-3 mr-1" />
              刷新
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadReport('pdf')}>
              <Download className="h-3 w-3 mr-1" />
              导出PDF
            </Button>
          </div>
        </div>

        {/* 汇总统计 */}
        {renderSummary(summary)}

        {/* 项目统计 */}
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">项目统计</h4>
            <Badge variant="outline" className="text-xs ml-auto">{projects.total}个项目</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-medium text-muted-foreground mb-2">按状态</div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={Object.entries(projects.byStatus).map(([status, count]) => ({
                      name: status === 'completed' ? '已完成' : status === 'in_progress' ? '进行中' : status,
                      value: count,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {Object.entries(projects.byStatus).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="text-[11px] font-medium text-muted-foreground mb-2">按品牌</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={Object.entries(projects.byBrand).map(([brand, count]) => ({ name: brand, value: count }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* 任务统计 */}
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">任务统计</h4>
            <Badge variant="outline" className="text-xs ml-auto">{tasks.total}个任务</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-[11px] font-medium text-muted-foreground mb-2">按岗位</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={tasksByRoleData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="text-[11px] font-medium text-muted-foreground mb-2">按状态</div>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={tasksByStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {tasksByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="text-[11px] font-medium text-destructive mb-2">逾期任务（按岗位）</div>
              {overdueByRoleData.length > 0 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={overdueByRoleData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[150px] text-xs text-muted-foreground">
                  无逾期任务
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* 协同和本周工作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-4 rounded-full bg-blue-500"></div>
              <h4 className="text-sm font-medium">协同合作</h4>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">总数</span>
                <span className="font-medium">{collaboration.total}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">已完成</span>
                <span className="font-medium">{collaboration.completed}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">完成率</span>
                <span className="font-medium">{collaboration.total > 0 ? Math.round((collaboration.completed / collaboration.total) * 100) : 0}%</span>
              </div>
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">本周工作计划</h4>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">总数</span>
                <span className="font-medium">{weeklyPlans.total}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">已完成</span>
                <span className="font-medium">{weeklyPlans.completed}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">完成率</span>
                <span className="font-medium">{weeklyPlans.total > 0 ? Math.round((weeklyPlans.completed / weeklyPlans.total) * 100) : 0}%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderMonthlyContent = () => {
    if (!monthlyReport) return null;

    const { summary, projects, tasks, salesTargets } = monthlyReport;

    const tasksByRoleData = Object.entries(tasks.byRole).map(([role, count]) => ({
      name: getPositionName(role),
      value: count,
    }));

    const completionRateData = Object.entries(tasks.completionRateByRole).map(([role, rate]) => ({
      name: getPositionName(role),
      完成率: rate,
    }));

    return (
      <div className="space-y-4">
        {/* 报表标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">月报概览</h3>
            <div className="text-xs text-muted-foreground mt-1">
              {monthlyReport.year}年{monthlyReport.month}月
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadMonthlyReport}>
              <RefreshCw className="h-3 w-3 mr-1" />
              刷新
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadReport('pdf')}>
              <Download className="h-3 w-3 mr-1" />
              导出PDF
            </Button>
          </div>
        </div>

        {/* 汇总统计 */}
        {renderSummary(summary)}

        {/* 任务统计 */}
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">任务统计</h4>
            <Badge variant="outline" className="text-xs ml-auto">{tasks.total}个任务</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-[11px] font-medium text-muted-foreground mb-2">按岗位分布</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={tasksByRoleData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="text-[11px] font-medium text-muted-foreground mb-2">各岗位完成率</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={completionRateData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="完成率" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* 销售目标 */}
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">销售目标达成</h4>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">月度目标</span>
              <span className="text-sm font-medium">¥{salesTargets.monthlyTarget.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">实际完成</span>
              <span className="text-sm font-medium">¥{salesTargets.monthlyActual.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">达成率</span>
              <span className="text-sm font-medium">{salesTargets.completionRate}%</span>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">报表与统计</h2>
      </div>

      {loading ? (
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">加载报表数据中...</p>
            </div>
          </div>
        </Card>
      ) : (
        <Tabs value={reportType} onValueChange={(value) => setReportType(value as 'weekly' | 'monthly')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="weekly">周报</TabsTrigger>
            <TabsTrigger value="monthly">月报</TabsTrigger>
          </TabsList>
          <TabsContent value="weekly" className="mt-4">
            {renderWeeklyContent()}
          </TabsContent>
          <TabsContent value="monthly" className="mt-4">
            {renderMonthlyContent()}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
