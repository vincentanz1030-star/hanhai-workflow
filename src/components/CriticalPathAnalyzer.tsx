'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2, Clock, TrendingDown } from 'lucide-react';
import { getPositionName } from '@/lib/config';

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
    <div className="space-y-4">
      {/* 汇总统计 - 紧凑版 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-[11px] font-medium text-muted-foreground">总项目数</div>
              <div className="text-lg font-bold">{summary.totalProjects}</div>
              <div className="text-[10px] text-muted-foreground">进行中</div>
            </div>
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-[11px] font-medium text-muted-foreground">正常进行</div>
              <div className="text-lg font-bold text-green-600">{summary.onTrackProjects}</div>
              <div className="text-[10px] text-muted-foreground">
                占比 {summary.totalProjects > 0 ? Math.round((summary.onTrackProjects / summary.totalProjects) * 100) : 0}%
              </div>
            </div>
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-[11px] font-medium text-muted-foreground">有风险</div>
              <div className="text-lg font-bold text-orange-600">{summary.atRiskProjects}</div>
              <div className="text-[10px] text-muted-foreground">
                占比 {summary.totalProjects > 0 ? Math.round((summary.atRiskProjects / summary.totalProjects) * 100) : 0}%
              </div>
            </div>
            <TrendingDown className="h-3.5 w-3.5 text-orange-500" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-[11px] font-medium text-muted-foreground">已延期</div>
              <div className="text-lg font-bold text-destructive">{summary.delayedProjects}</div>
              <div className="text-[10px] text-muted-foreground">
                占比 {summary.totalProjects > 0 ? Math.round((summary.delayedProjects / summary.totalProjects) * 100) : 0}%
              </div>
            </div>
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
          </div>
        </Card>
      </div>

      {/* 瓶颈任务 - 紧凑版 */}
      {bottleneckTasks.length > 0 && (
        <Card className="border-destructive p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <div className="text-sm font-medium">关键瓶颈任务</div>
            <Badge variant="destructive" className="text-xs ml-auto">
              {bottleneckTasks.length}个
            </Badge>
          </div>
          <div className="space-y-1.5">
            {bottleneckTasks.slice(0, 5).map(task => (
              <div key={task.taskId} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{task.taskTitle}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {getPositionName(task.position)} · {task.assignee || '未分配'}
                  </div>
                  {task.deadline && (
                    <div className="text-[10px] text-destructive mt-0.5">
                      {new Date(task.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {getRiskBadge(task.riskLevel)}
                </div>
              </div>
            ))}
            {bottleneckTasks.length > 5 && (
              <div className="text-center text-[10px] text-muted-foreground py-1">
                还有 {bottleneckTasks.length - 5} 个未显示
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 项目关键路径 - 紧凑版 */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">项目关键路径</h3>
          <span className="text-[10px] text-muted-foreground">{projectCriticalPath.length}个项目</span>
        </div>
        <div className="space-y-3">
          {projectCriticalPath.length === 0 ? (
            <div className="text-center py-4 text-xs text-muted-foreground">
              暂无进行中的项目
            </div>
          ) : (
            projectCriticalPath.map(project => (
              <div key={project.projectId} className="border rounded-lg p-3 space-y-2.5">
                {/* 项目头部 - 紧凑版 */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-semibold truncate">{project.projectName}</h3>
                      {getStatusBadge(project.status)}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {project.projectType} · {project.brand}
                      {project.salesDate && (
                        <span className="ml-1">
                          · {new Date(project.salesDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[10px] text-muted-foreground">进度</div>
                    <div className="text-lg font-bold">{project.totalProgress}%</div>
                  </div>
                </div>

                {/* 关键任务 - 紧凑版 */}
                {project.criticalPath && project.criticalPath.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-medium text-muted-foreground">关键路径任务</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                      {project.criticalPath.slice(0, 6).map(task => (
                        <div
                          key={task.id}
                          className="p-1.5 bg-muted rounded text-[10px]"
                        >
                          <div className="font-medium truncate">{task.title}</div>
                          <div className="text-[9px] text-muted-foreground">
                            {getPositionName(task.position)} · {task.status === 'completed' ? '✓' : '○'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 瓶颈任务 - 紧凑版 */}
                {project.bottleneckTasks && project.bottleneckTasks.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-medium text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      瓶颈任务
                    </div>
                    <div className="space-y-1">
                      {project.bottleneckTasks.map(task => (
                        <div key={task.taskId} className="flex items-center justify-between p-1.5 bg-destructive/10 rounded">
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-medium truncate">{task.taskTitle}</div>
                            <div className="text-[9px] text-muted-foreground">
                              {getPositionName(task.position)} · 松弛:{task.slack !== null ? `${task.slack}天` : '未知'}
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
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">预计完成</span>
                    <span className="font-medium">
                      {new Date(project.estimatedCompletion).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

export { CriticalPathAnalyzer };
