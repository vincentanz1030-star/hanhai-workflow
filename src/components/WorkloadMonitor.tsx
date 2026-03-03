'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Users, ChevronRight, ChevronDown, FileText } from 'lucide-react';

interface WorkloadSummary {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  overloadedCount: number;
  averageWorkload: number;
}

interface UserWorkload {
  userId: string;
  username: string;
  nickname: string;
  brand: string;
  totalTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
  workloadScore: number;
  isOverloaded: boolean;
}

interface PositionWorkload {
  position: string;
  originalPosition?: string;
  totalTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageWorkload: number;
  tasks?: PositionTask[];
}

interface PositionTask {
  id: string;
  taskName: string;
  description: string;
  status: string;
  progress: number;
  estimatedCompletionDate: string;
  actualCompletionDate: string | null;
  projectName: string;
  projectSalesDate: string;
  isOverdue: boolean;
}

interface WorkloadData {
  byUser: UserWorkload[];
  byPosition: PositionWorkload[];
  overloadedUsers: UserWorkload[];
  summary: WorkloadSummary;
}

export default function WorkloadMonitor() {
  const [workload, setWorkload] = useState<WorkloadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);
  const [positionTasks, setPositionTasks] = useState<Record<string, PositionTask[]>>({});
  const [loadingTasks, setLoadingTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchWorkload();
  }, []);

  const fetchWorkload = async () => {
    try {
      const response = await fetch('/api/workload');
      const data = await response.json();
      if (data.success) {
        setWorkload(data.workload);
      }
    } catch (error) {
      console.error('获取工作负载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPositionTasks = async (position: PositionWorkload) => {
    if (!position.originalPosition) return;

    setLoadingTasks(prev => ({ ...prev, [position.position]: true }));

    try {
      const response = await fetch(`/api/workload?position=${position.originalPosition}&includeTasks=true`);
      const data = await response.json();
      if (data.success && data.workload.byPosition) {
        const positionData = data.workload.byPosition.find((p: PositionWorkload) => p.originalPosition === position.originalPosition);
        if (positionData && positionData.tasks) {
          setPositionTasks(prev => ({ ...prev, [position.position]: positionData.tasks }));
        }
      }
    } catch (error) {
      console.error('获取岗位任务详情失败:', error);
    } finally {
      setLoadingTasks(prev => ({ ...prev, [position.position]: false }));
    }
  };

  const handlePositionToggle = async (position: PositionWorkload) => {
    if (expandedPosition === position.position) {
      setExpandedPosition(null);
    } else {
      setExpandedPosition(position.position);
      if (!positionTasks[position.position]) {
        await fetchPositionTasks(position);
      }
    }
  };

  if (loading) {
    return <div className="p-6">加载中...</div>;
  }

  if (!workload) {
    return <div className="p-6">暂无数据</div>;
  }

  const { byUser, byPosition, overloadedUsers, summary } = workload;

  return (
    <div className="space-y-6">
      {/* 汇总统计 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-muted-foreground">总任务数</div>
              <div className="text-2xl font-bold">{summary.totalTasks}</div>
              <div className="text-xs text-muted-foreground">
                进行中: {summary.inProgressTasks}
              </div>
            </div>
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-muted-foreground">已完成</div>
              <div className="text-2xl font-bold">{summary.completedTasks}</div>
              <div className="text-xs text-muted-foreground">
                完成率 {summary.totalTasks > 0 ? Math.round((summary.completedTasks / summary.totalTasks) * 100) : 0}%
              </div>
            </div>
            <CheckCircle className="h-6 w-6 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-muted-foreground">逾期任务</div>
              <div className="text-2xl font-bold text-destructive">{summary.overdueTasks}</div>
              <div className="text-xs text-muted-foreground">
                需立即处理
              </div>
            </div>
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-muted-foreground">平均负载</div>
              <div className="text-2xl font-bold">{summary.averageWorkload}</div>
              <div className="text-xs text-muted-foreground">
                负载评分
              </div>
            </div>
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* 工作负载预警和岗位工作负载 - 并列布局 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 工作负载预警 */}
        {overloadedUsers.length > 0 && (
          <Card className="border-destructive">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-base">工作负载预警</CardTitle>
                <Badge variant="destructive" className="ml-auto">
                  {overloadedUsers.length}人
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {overloadedUsers.map(user => (
                  <div key={user.userId} className="flex items-center justify-between p-3 bg-destructive/10 rounded">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{user.nickname || user.username}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.brand} · 进行中:{user.inProgressTasks} · 逾期:{user.overdueTasks}
                      </div>
                    </div>
                    <Badge variant="destructive">超负荷</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 岗位工作负载 */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">岗位工作负载</CardTitle>
            <CardDescription className="text-xs">点击查看详情</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
          {byPosition.map(position => (
            <div key={position.position} className="space-y-1">
              <div
                className="flex items-center justify-between p-3 rounded border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handlePositionToggle(position)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="text-muted-foreground flex-shrink-0">
                    {expandedPosition === position.position ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{position.position}</div>
                    <div className="text-xs text-muted-foreground">
                      总:{position.totalTasks} · 进行中:{position.inProgressTasks}
                    </div>
                  </div>
                </div>
                {position.overdueTasks > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <AlertCircle className="h-3 w-3" />
                    {position.overdueTasks}
                  </Badge>
                )}
              </div>

              {/* 任务详情 */}
              {expandedPosition === position.position && (
                <div className="pl-8 pr-3 py-3 space-y-2 bg-muted/30 rounded">
                  {loadingTasks[position.position] ? (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      加载中...
                    </div>
                  ) : positionTasks[position.position] && positionTasks[position.position].length > 0 ? (
                    <div className="space-y-2">
                      {positionTasks[position.position].map(task => (
                        <div key={task.id} className="p-3 bg-background rounded border space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              <FileText className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{task.taskName}</div>
                                <div className="text-xs text-muted-foreground">
                                  项目: {task.projectName}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {task.isOverdue ? (
                                <Badge variant="destructive">逾期</Badge>
                              ) : (
                                <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>
                                  {task.status === 'completed' ? '完成' :
                                   task.status === 'in-progress' ? '进行' : '待办'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>进度 {task.progress}%</span>
                            {task.estimatedCompletionDate && (
                              <span>
                                {new Date(task.estimatedCompletionDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                          {task.progress > 0 && (
                            <Progress value={task.progress} className="h-1" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-4">
                      暂无任务
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      </Card>
      </div>
    </div>
  );
}

export { WorkloadMonitor };
