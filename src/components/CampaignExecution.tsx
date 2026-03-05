/**
 * 营销中台 - 执行监控组件
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, TrendingUp, Target, DollarSign, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface Campaign {
  id: string;
  name: string;
  campaign_type: string;
  start_date: string;
  end_date: string;
  budget: number;
  target_gmv: number;
  status: string;
  priority: string;
  channels: string[];
  brands: string[];
}

interface CampaignExecution {
  campaign_id: string;
  campaign_name?: string;
  actual_gmv: number;
  budget_used: number;
  task_completion_rate: number;
  milestone_progress: number;
  roi: number;
  last_updated: string;
  milestones?: Array<{
    name: string;
    target_date: string;
    actual_date?: string;
    status: string;
  }>;
}

export function CampaignExecution() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [executions, setExecutions] = useState<CampaignExecution[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
    loadExecutions();
  }, [selectedCampaign]);

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/marketing/campaigns?page=1&limit=100');
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.data);
      }
    } catch (error) {
      console.error('加载活动失败:', error);
    }
  };

  const loadExecutions = async () => {
    setLoading(true);
    try {
      // 模拟执行数据，实际应该从 API 获取
      const mockExecutions = campaigns.map(campaign => ({
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        actual_gmv: Math.floor(campaign.target_gmv * (Math.random() * 0.8 + 0.2)),
        budget_used: Math.floor(campaign.budget * (Math.random() * 0.7 + 0.3)),
        task_completion_rate: Math.floor(Math.random() * 100),
        milestone_progress: Math.floor(Math.random() * 100),
        roi: Math.random() * 5 + 1,
        last_updated: new Date().toISOString(),
      }));
      setExecutions(mockExecutions);
    } catch (error) {
      console.error('加载执行数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExecutions = executions.filter(exe =>
    selectedCampaign === 'all' || exe.campaign_id === selectedCampaign
  );

  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalTargetGMV = campaigns.reduce((sum, c) => sum + (c.target_gmv || 0), 0);
  const totalActualGMV = executions.reduce((sum, e) => sum + (e.actual_gmv || 0), 0);
  const totalBudgetUsed = executions.reduce((sum, e) => sum + (e.budget_used || 0), 0);
  const gmvAchievementRate = totalTargetGMV > 0 ? ((totalActualGMV / totalTargetGMV) * 100).toFixed(1) : '0';
  const budgetUsageRate = totalBudget > 0 ? ((totalBudgetUsed / totalBudget) * 100).toFixed(1) : '0';

  // 图表数据
  const gmvData = executions.map(exe => ({
    name: exe.campaign_name?.substring(0, 10) || exe.campaign_id.substring(0, 8),
    target: campaigns.find(c => c.id === exe.campaign_id)?.target_gmv || 0,
    actual: exe.actual_gmv || 0,
  }));

  const budgetData = executions.map(exe => ({
    name: exe.campaign_name?.substring(0, 10) || exe.campaign_id.substring(0, 8),
    budget: campaigns.find(c => c.id === exe.campaign_id)?.budget || 0,
    used: exe.budget_used || 0,
  }));

  const statusData = [
    { name: '已完成', value: executions.filter(e => e.task_completion_rate === 100).length },
    { name: '进行中', value: executions.filter(e => e.task_completion_rate > 0 && e.task_completion_rate < 100).length },
    { name: '未开始', value: executions.filter(e => e.task_completion_rate === 0).length },
  ];

  const COLORS = ['#22c55e', '#3b82f6', '#94a3b8'];

  return (
    <div className="space-y-4">
      {/* 筛选器 */}
      <div className="flex items-center justify-between">
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="选择活动" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部活动</SelectItem>
            {campaigns.map((campaign) => (
              <SelectItem key={campaign.id} value={campaign.id}>
                {campaign.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={loadExecutions}>刷新数据</Button>
      </div>

      {/* 总览卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">GMV 目标</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{(totalTargetGMV / 10000).toFixed(1)}万</div>
            <p className="text-xs text-muted-foreground mt-1">
              达成率: {gmvAchievementRate}%
            </p>
            <Progress value={parseFloat(gmvAchievementRate)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">实际GMV</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">¥{(totalActualGMV / 10000).toFixed(1)}万</div>
            <p className="text-xs text-muted-foreground mt-1">
              实际 / 目标
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">预算使用</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{(totalBudgetUsed / 10000).toFixed(1)}万</div>
            <p className="text-xs text-muted-foreground mt-1">
              使用率: {budgetUsageRate}%
            </p>
            <Progress value={parseFloat(budgetUsageRate)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">活动数量</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredExecutions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              在执行的活动
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* GMV 对比图表 */}
        <Card>
          <CardHeader>
            <CardTitle>GMV 达成情况</CardTitle>
            <CardDescription>目标 vs 实际</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gmvData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="target" name="目标" fill="#94a3b8" />
                <Bar dataKey="actual" name="实际" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 预算使用图表 */}
        <Card>
          <CardHeader>
            <CardTitle>预算使用情况</CardTitle>
            <CardDescription>预算 vs 已使用</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="budget" name="预算" fill="#3b82f6" />
                <Bar dataKey="used" name="已使用" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 活动执行列表 */}
      <Card>
        <CardHeader>
          <CardTitle>活动执行详情</CardTitle>
          <CardDescription>各活动的实时执行进度</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredExecutions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">暂无执行数据</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>活动名称</TableHead>
                  <TableHead>实际GMV</TableHead>
                  <TableHead>达成率</TableHead>
                  <TableHead>预算使用</TableHead>
                  <TableHead>任务完成率</TableHead>
                  <TableHead>ROI</TableHead>
                  <TableHead>最后更新</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExecutions.map((execution) => {
                  const campaign = campaigns.find(c => c.id === execution.campaign_id);
                  const gmvRate = campaign && campaign.target_gmv ? ((execution.actual_gmv / campaign.target_gmv) * 100).toFixed(1) : '0';
                  const budgetRate = campaign && campaign.budget ? ((execution.budget_used / campaign.budget) * 100).toFixed(1) : '0';

                  return (
                    <TableRow key={execution.campaign_id}>
                      <TableCell>
                        <div className="font-medium">{execution.campaign_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(campaign?.start_date || ''), 'yyyy-MM-dd')} - {format(new Date(campaign?.end_date || ''), 'yyyy-MM-dd')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">¥{(execution.actual_gmv / 10000).toFixed(2)}万</div>
                        <div className="text-xs text-muted-foreground">目标: ¥{campaign?.target_gmv ? (campaign.target_gmv / 10000).toFixed(2) : '0'}万</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={parseFloat(gmvRate)} className="flex-1" />
                          <span className="text-sm">{gmvRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={parseFloat(budgetRate)} className="flex-1" />
                          <span className="text-sm">{budgetRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={execution.task_completion_rate} className="flex-1" />
                          <span className="text-sm">{execution.task_completion_rate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={execution.roi > 3 ? 'default' : 'secondary'}>
                          {execution.roi.toFixed(2)}x
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(execution.last_updated), 'MM-dd HH:mm')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
