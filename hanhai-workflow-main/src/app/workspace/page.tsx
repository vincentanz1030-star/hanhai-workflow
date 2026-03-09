'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CheckCircle2, Clock, TrendingUp, AlertCircle, Plus, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { TaskBoard } from '@/components/TaskBoard';

interface Task {
  id: string;
  task_name: string;
  role: string;
  status: string;
  progress: number;
  estimated_completion_date: string | null;
  project_id: string;
  project_name?: string;
}

interface Project {
  id: string;
  name: string;
  brand: string;
  status: string;
  progress: number;
}

export default function PersonalWorkspacePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    delayedTasks: 0,
    completionRate: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      // 加载我的任务
      const tasksResponse = await fetch('/api/tasks?limit=50', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (tasksResponse.ok) {
        const data = await tasksResponse.json();
        setMyTasks(data.tasks || []);

        // 计算统计
        const tasks = data.tasks || [];
        const stats = {
          totalTasks: tasks.length,
          completedTasks: tasks.filter((t: Task) => t.status === 'completed').length,
          inProgressTasks: tasks.filter((t: Task) => t.status === 'in_progress').length,
          pendingTasks: tasks.filter((t: Task) => t.status === 'pending').length,
          delayedTasks: tasks.filter((t: Task) => t.status === 'delayed').length,
          completionRate: tasks.length > 0
            ? Math.round((tasks.filter((t: Task) => t.status === 'completed').length / tasks.length) * 100)
            : 0,
        };
        setStats(stats);
      }

      // 加载我的项目
      const projectsResponse = await fetch('/api/projects?limit=20', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (projectsResponse.ok) {
        const data = await projectsResponse.json();
        const projectsWithProgress = (data.projects || []).map((p: any) => ({
          ...p,
          progress: p.tasks && p.tasks.length > 0
            ? Math.round(p.tasks.reduce((sum: number, t: any) => sum + t.progress, 0) / p.tasks.length)
            : 0,
        }));
        setMyProjects(projectsWithProgress);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // 重新加载数据
        loadData();
      }
    } catch (error) {
      console.error('更新任务状态失败:', error);
    }
  };

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      illustration: '插画',
      product_design: '产品',
      detail_design: '详情',
      copywriting: '文案',
      procurement: '采购',
      packaging_design: '包装',
      finance: '财务',
      customer_service: '客服',
      warehouse: '仓储',
      operations: '运营',
    };
    return roleMap[role] || role;
  };

  const getBrandName = (brand: string) => {
    const brandMap: Record<string, string> = {
      he_zhe: '禾哲',
      baobao: 'BAOBAO',
      ai_he: '爱禾',
      bao_deng_yuan: '宝登源',
    };
    return brandMap[brand] || brand;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      pending: { label: '待处理', variant: 'secondary' },
      in_progress: { label: '进行中', variant: 'default' },
      completed: { label: '已完成', variant: 'outline' },
      delayed: { label: '已延期', variant: 'destructive' },
    };
    const { label, variant } = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">个人工作台</h1>
        <p className="text-muted-foreground mt-2">
          欢迎回来，{user?.name || '用户'}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总任务数</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">进行中</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理</CardTitle>
            <Calendar className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">{stats.pendingTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完成率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <Progress value={stats.completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Tabs defaultValue="kanban" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kanban">看板视图</TabsTrigger>
          <TabsTrigger value="list">列表视图</TabsTrigger>
          <TabsTrigger value="projects">我的项目</TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>任务看板</CardTitle>
              <CardDescription>
                拖拽任务卡片来更新状态
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaskBoard tasks={myTasks} onTaskUpdate={handleTaskUpdate} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>我的任务</CardTitle>
              <CardDescription>
                按优先级排序的任务列表
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>暂无任务</p>
                  </div>
                ) : (
                  myTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium">{task.task_name}</h4>
                          {getStatusBadge(task.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{getRoleName(task.role)}</span>
                          <span>•</span>
                          <span>{task.project_name || '未关联项目'}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>进度</span>
                            <span>{task.progress}%</span>
                          </div>
                          <Progress value={task.progress} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>我的项目</CardTitle>
              <CardDescription>
                我参与的项目列表
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myProjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>暂无项目</p>
                  </div>
                ) : (
                  myProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium">{project.name}</h4>
                          {getStatusBadge(project.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{getBrandName(project.brand)}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>进度</span>
                            <span>{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-1.5" />
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/">查看</Link>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>
            常用功能快速入口
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/">
                <Plus className="h-5 w-5" />
                <span>新建项目</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/">
                <Target className="h-5 w-5" />
                <span>查看所有任务</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/admin">
                <Calendar className="h-5 w-5" />
                <span>系统管理</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
              <Link href="/diagnostic/health">
                <AlertCircle className="h-5 w-5" />
                <span>系统诊断</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
