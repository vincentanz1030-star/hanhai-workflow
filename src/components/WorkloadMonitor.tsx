'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock, TrendingUp, Users } from 'lucide-react';

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
  totalTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageWorkload: number;
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总任务数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              进行中: {summary.inProgressTasks}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成任务</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              完成率: {summary.totalTasks > 0 ? Math.round((summary.completedTasks / summary.totalTasks) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">逾期任务</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              需要立即处理
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均工作负载</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averageWorkload}</div>
            <p className="text-xs text-muted-foreground">
              工作负载评分
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 超负荷预警 */}
      {overloadedUsers.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              工作负载预警
            </CardTitle>
            <CardDescription>
              以下员工工作负载过高，建议调整任务分配
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overloadedUsers.map(user => (
                <div key={user.userId} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{user.nickname || user.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.brand} · 进行中: {user.inProgressTasks} · 逾期: {user.overdueTasks}
                    </div>
                  </div>
                  <Badge variant="destructive">超负荷</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 按员工统计 */}
      <Card>
        <CardHeader>
          <CardTitle>员工工作负载</CardTitle>
          <CardDescription>
            按员工查看任务分配和工作负载情况
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {byUser.map(user => (
              <div key={user.userId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{user.nickname || user.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.brand} · 总任务: {user.totalTasks} · 
                      进行中: {user.inProgressTasks} · 
                      待处理: {user.pendingTasks} · 
                      已完成: {user.completedTasks}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {user.overdueTasks > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        逾期 {user.overdueTasks}
                      </Badge>
                    )}
                    {user.isOverloaded ? (
                      <Badge variant="destructive">超负荷</Badge>
                    ) : (
                      <Badge variant="outline">正常</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>工作负载评分</span>
                    <span>{user.workloadScore} / 15</span>
                  </div>
                  <Progress 
                    value={Math.min((user.workloadScore / 15) * 100, 100)} 
                    className={user.workloadScore >= 15 ? "bg-destructive/20" : ""}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 按岗位统计 */}
      <Card>
        <CardHeader>
          <CardTitle>岗位工作负载</CardTitle>
          <CardDescription>
            按岗位查看任务分配情况
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {byPosition.map(position => (
              <div key={position.position} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{position.position}</div>
                    <div className="text-sm text-muted-foreground">
                      总任务: {position.totalTasks} · 
                      进行中: {position.inProgressTasks} · 
                      待处理: {position.pendingTasks} · 
                      已完成: {position.completedTasks}
                    </div>
                  </div>
                  {position.overdueTasks > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      逾期 {position.overdueTasks}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>平均工作负载</span>
                    <span>{position.averageWorkload.toFixed(1)}</span>
                  </div>
                  <Progress value={(position.averageWorkload / 15) * 100} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
