'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Clock, TrendingDown } from 'lucide-react';

interface BottleneckTask {
  taskId: number;
  taskTitle: string;
  position: string;
  status: string;
  deadline: string | null;
  slack: number | null;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  assignee: string | null;
}

interface ProjectCriticalPath {
  projectId: number;
  projectName: string;
  projectType: string;
  salesDate: string | null;
  brand: string;
  status: string;
  criticalPath: any[];
  bottleneckTasks: BottleneckTask[];
  totalProgress: number;
  estimatedCompletion: string | null;
}

interface CriticalPathData {
  projectCriticalPath: ProjectCriticalPath[];
  bottleneckTasks: BottleneckTask[];
  summary: {
    totalProjects: number;
    atRiskProjects: number;
    onTrackProjects: number;
    delayedProjects: number;
  };
}

export default function CriticalPathAnalyzer() {
  const [criticalPath, setCriticalPath] = useState<CriticalPathData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCriticalPath();
  }, []);

  const fetchCriticalPath = async () => {
    try {
      const response = await fetch('/api/critical-path?includeCompleted=false');
      const data = await response.json();
      if (data.success) {
        setCriticalPath(data.criticalPath);
      }
    } catch (error) {
      console.error('获取关键路径失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">加载中...</div>;
  }

  if (!criticalPath) {
    return <div className="p-6">暂无数据</div>;
  }

  const { projectCriticalPath, bottleneckTasks, summary } = criticalPath;

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return <Badge variant="destructive">严重风险</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 hover:bg-orange-600">高风险</Badge>;
      case 'medium':
        return <Badge variant="outline">中等风险</Badge>;
      default:
        return <Badge variant="secondary">低风险</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delayed':
        return <Badge variant="destructive">已延期</Badge>;
      case 'at-risk':
        return <Badge className="bg-orange-500 hover:bg-orange-600">有风险</Badge>;
      case 'on-track':
        return <Badge className="bg-green-500 hover:bg-green-600">正常进行</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delayed':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'at-risk':
        return <TrendingDown className="h-5 w-5 text-orange-500" />;
      case 'on-track':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 汇总统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总项目数</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalProjects}</div>
            <p className="text-xs text-muted-foreground">进行中的项目</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">正常进行</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.onTrackProjects}</div>
            <p className="text-xs text-muted-foreground">
              占比 {summary.totalProjects > 0 ? Math.round((summary.onTrackProjects / summary.totalProjects) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">有风险</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summary.atRiskProjects}</div>
            <p className="text-xs text-muted-foreground">
              占比 {summary.totalProjects > 0 ? Math.round((summary.atRiskProjects / summary.totalProjects) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已延期</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.delayedProjects}</div>
            <p className="text-xs text-muted-foreground">
              占比 {summary.totalProjects > 0 ? Math.round((summary.delayedProjects / summary.totalProjects) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 瓶颈任务 */}
      {bottleneckTasks.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              关键瓶颈任务
            </CardTitle>
            <CardDescription>
              这些任务影响项目整体进度，需要优先处理
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bottleneckTasks.slice(0, 10).map(task => (
                <div key={task.taskId} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{task.taskTitle}</div>
                    <div className="text-sm text-muted-foreground">
                      {task.position} · 负责人: {task.assignee || '未分配'}
                    </div>
                    {task.deadline && (
                      <div className="text-xs text-destructive mt-1">
                        截止日期: {new Date(task.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getRiskBadge(task.riskLevel)}
                  </div>
                </div>
              ))}
              {bottleneckTasks.length > 10 && (
                <div className="text-center text-sm text-muted-foreground">
                  还有 {bottleneckTasks.length - 10} 个瓶颈任务未显示
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 项目关键路径 */}
      <Card>
        <CardHeader>
          <CardTitle>项目关键路径分析</CardTitle>
          <CardDescription>
            识别影响项目整体进度的关键任务和瓶颈
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectCriticalPath.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无进行中的项目
              </div>
            ) : (
              projectCriticalPath.map(project => (
                <div key={project.projectId} className="border rounded-lg p-4 space-y-4">
                  {/* 项目头部 */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{project.projectName}</h3>
                        {getStatusBadge(project.status)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {project.projectType} · {project.brand} · 
                        销售日期: {project.salesDate ? new Date(project.salesDate).toLocaleDateString() : '未设置'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">项目进度</div>
                      <div className="text-2xl font-bold">{project.totalProgress}%</div>
                    </div>
                  </div>

                  {/* 关键任务 */}
                  {project.criticalPath && project.criticalPath.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">关键路径任务</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {project.criticalPath.slice(0, 6).map(task => (
                          <div 
                            key={task.id} 
                            className="p-2 bg-muted rounded text-sm"
                          >
                            <div className="font-medium truncate">{task.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {task.position} · {task.status === 'completed' ? '✓' : '○'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 瓶颈任务 */}
                  {project.bottleneckTasks && project.bottleneckTasks.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        瓶颈任务
                      </div>
                      <div className="space-y-2">
                        {project.bottleneckTasks.map(task => (
                          <div key={task.taskId} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{task.taskTitle}</div>
                              <div className="text-xs text-muted-foreground">
                                {task.position} · 松弛时间: {task.slack !== null ? `${task.slack}天` : '未知'}
                              </div>
                            </div>
                            {getRiskBadge(task.riskLevel)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 预计完成时间 */}
                  {project.estimatedCompletion && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">预计完成时间</span>
                      <span className="font-medium">
                        {new Date(project.estimatedCompletion).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
