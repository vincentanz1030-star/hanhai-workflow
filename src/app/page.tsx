'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Users, CheckCircle, AlertCircle, Plus, TrendingUp, FolderOpen, ArrowRight } from 'lucide-react';
import { format, differenceInDays, isBefore, isAfter, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Slider } from '@/components/ui/slider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

// 类型定义
interface Project {
  id: string;
  name: string;
  salesDate: string;
  projectConfirmDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  description: string | null;
  createdAt: string;
  tasks?: Task[];
}

interface Task {
  id: string;
  projectId: string;
  role: 'illustration' | 'product_design' | 'detail_design' | 'copywriting' | 'procurement' | 'packaging_design' | 'finance' | 'customer_service' | 'warehouse';
  taskName: string;
  taskOrder: number;
  description: string | null;
  progress: number;
  imageUrl: string | null;
  customProgressLabels: Record<string, string> | null;
  estimatedCompletionDate: string | null;
  actualCompletionDate: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  created_at: string;
  updated_at: string | null;
}

// 岗位映射
const ROLE_NAMES: Record<string, string> = {
  illustration: '插画设计',
  product_design: '产品设计',
  detail_design: '详情页设计',
  copywriting: '文案宣传',
  procurement: '产品采购',
  packaging_design: '包装设计',
  finance: '财务出纳',
  customer_service: '客服培训',
  warehouse: '仓储管理',
};

// 状态映射
const STATUS_NAMES: Record<string, string> = {
  pending: '待开始',
  in_progress: '进行中',
  completed: '已完成',
  delayed: '已延期',
};

// 状态颜色
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  delayed: 'bg-red-500',
};

// 安全的日期格式化函数
function formatDateSafely(dateString: string | null | undefined, formatStr: string = 'yyyy-MM-dd'): string {
  if (!dateString || dateString.trim() === '') {
    return '';
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    return format(date, formatStr, { locale: zhCN });
  } catch (error) {
    console.error('日期格式化失败:', dateString, error);
    return '';
  }
}

// 计算剩余天数
function getRemainingDays(targetDate: string | null): { days: number; isOverdue: boolean } {
  if (!targetDate) return { days: 0, isOverdue: false };
  try {
    const now = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { days: diffDays, isOverdue: diffDays < 0 };
  } catch {
    return { days: 0, isOverdue: false };
  }
}

// 任务卡片组件
function TaskCard({ task, onUpdate }: { task: Task; onUpdate: (task: Partial<Task>) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localProgress, setLocalProgress] = useState(task.progress);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editingDate, setEditingDate] = useState('');
  const [isEditingLabels, setIsEditingLabels] = useState(false);
  const [customLabels, setCustomLabels] = useState<Record<string, string>>(task.customProgressLabels || {});

  const handleProgressChange = async (value: number[]) => {
    const newProgress = value[0];
    setLocalProgress(newProgress);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress }),
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate(data.task);
      }
    } catch (error) {
      console.error('更新任务失败:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // 更新任务的图片URL
        const updateResponse = await fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: data.imageUrl }),
        });

        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          onUpdate(updateData.task);
        }
      }
    } catch (error) {
      console.error('图片上传失败:', error);
      alert('图片上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDateUpdate = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimatedCompletionDate: editingDate }),
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate(data.task);
        setIsEditingDate(false);
      }
    } catch (error) {
      console.error('更新日期失败:', error);
      alert('更新日期失败，请重试');
    }
  };

  const handleLabelsUpdate = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customProgressLabels: customLabels }),
      });

      if (response.ok) {
        const data = await response.json();
        onUpdate(data.task);
        setIsEditingLabels(false);
      }
    } catch (error) {
      console.error('更新自定义标签失败:', error);
      alert('更新自定义标签失败，请重试');
    }
  };

  const remaining = getRemainingDays(task.estimatedCompletionDate);

  // 获取自定义进度标签或默认标签
  const getProgressLabel = (progress: number) => {
    if (!customLabels || Object.keys(customLabels).length === 0) {
      // 默认标签
      if (progress === 0) return '📋 待开始';
      if (progress > 0 && progress < 25) return '🚀 已启动';
      if (progress >= 25 && progress < 50) return '🔄 进行中 - 早期阶段';
      if (progress >= 50 && progress < 75) return '⚡ 进行中 - 中期阶段';
      if (progress >= 75 && progress < 100) return '🏁 即将完成';
      if (progress === 100) return '✅ 已完成';
    }

    // 查找最接近的自定义标签
    const keys = Object.keys(customLabels).map(Number).sort((a, b) => Math.abs(a - progress) - Math.abs(b - progress));
    return customLabels[keys[0].toString()] || '';
  };

  return (
    <div className="border rounded-lg p-5 hover:border-primary transition-colors shadow-sm hover:shadow-md">
      {/* 任务头部 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="text-lg px-3 py-1">
              {task.taskOrder}
            </Badge>
            <h4 className="text-lg font-semibold">{task.taskName}</h4>
            <Badge className={`${STATUS_COLORS[task.status]} text-white`}>
              {STATUS_NAMES[task.status]}
            </Badge>
          </div>
          {task.description && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mt-3">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {task.description}
              </p>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingDate(true)}
          >
            <Calendar className="h-4 w-4 mr-1" />
            编辑时间
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingLabels(true)}
          >
            <Users className="h-4 w-4 mr-1" />
            自定义标签
          </Button>
        </div>
      </div>

      {/* 任务图片 */}
      {task.imageUrl && (
        <div className="mb-4">
          <img
            src={task.imageUrl}
            alt={task.taskName}
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}

      {/* 图片上传 */}
      <div className="mb-4">
        <input
          type="file"
          id={`image-upload-${task.id}`}
          accept="image/*"
          onChange={handleImageUpload}
          disabled={isUploading}
          className="hidden"
        />
        <label
          htmlFor={`image-upload-${task.id}`}
          className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
            isUploading
              ? 'bg-muted cursor-not-allowed'
              : 'bg-secondary hover:bg-secondary/80'
          } h-10 px-4 py-2 cursor-pointer`}
        >
          {isUploading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              上传中...
            </>
          ) : (
            <>
              {task.imageUrl ? '更换图片' : '上传图片'}
            </>
          )}
        </label>
      </div>

      {/* 进度控制 */}
      <div className="space-y-4 mt-4">
        {/* 进度百分比和进度条 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">完成进度</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${
                localProgress === 0 ? 'text-muted-foreground' :
                localProgress < 50 ? 'text-blue-600' :
                localProgress < 100 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {localProgress}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Slider
              value={[localProgress]}
              onValueChange={handleProgressChange}
              max={100}
              step={5}
              className="flex-1"
            />
            <div className="w-16 text-right">
              <span className="text-sm font-medium">{localProgress}%</span>
            </div>
          </div>
          {/* 进度阶段描述 */}
          <div className="text-xs text-muted-foreground">
            {getProgressLabel(localProgress)}
          </div>
        </div>

        {/* 时间信息 */}
        <div className="grid gap-2 mt-4">
          {isEditingDate ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <Calendar className="h-4 w-4" />
              <Input
                type="date"
                value={editingDate}
                onChange={(e) => setEditingDate(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={handleDateUpdate}>
                保存
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditingDate(false)}>
                取消
              </Button>
            </div>
          ) : (
            task.estimatedCompletionDate && task.estimatedCompletionDate.trim() !== '' && (
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                remaining.isOverdue 
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                  : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              }`}>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">预计完成时间</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {formatDateSafely(task.estimatedCompletionDate)}
                  </div>
                  <div className={`text-xs font-medium ${
                    remaining.isOverdue 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {remaining.days > 0 
                      ? `剩余 ${remaining.days} 天` 
                      : remaining.days === 0 
                        ? '今天截止' 
                        : `已逾期 ${Math.abs(remaining.days)} 天`}
                  </div>
                </div>
              </div>
            )
          )}

          {task.actualCompletionDate && task.actualCompletionDate.trim() !== '' && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">实际完成时间</span>
              </div>
              <div className="text-sm font-semibold text-green-700 dark:text-green-400">
                {formatDateSafely(task.actualCompletionDate)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 自定义进度标签编辑对话框 */}
      <Dialog open={isEditingLabels} onOpenChange={setIsEditingLabels}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>自定义进度标签</DialogTitle>
            <DialogDescription>
              为不同的进度百分比设置自定义标签名称
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {[0, 25, 50, 75, 100].map((progress) => (
              <div key={progress} className="flex items-center gap-4">
                <span className="w-16 text-sm font-medium">{progress}%</span>
                <Input
                  value={customLabels[progress.toString()] || ''}
                  onChange={(e) => setCustomLabels({ ...customLabels, [progress.toString()]: e.target.value })}
                  placeholder="例如：待开始、进行中..."
                  className="flex-1"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingLabels(false)}>
              取消
            </Button>
            <Button onClick={handleLabelsUpdate}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    salesDate: '',
    description: '',
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // 加载项目列表
  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('加载项目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 创建项目
  const handleCreateProject = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });

      if (response.ok) {
        setIsCreateDialogOpen(false);
        setNewProject({ name: '', salesDate: '', description: '' });
        loadProjects();
      }
    } catch (error) {
      console.error('创建项目失败:', error);
    }
  };

  // 加载项目详情
  const loadProjectDetails = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();
      setSelectedProject(data.project);
    } catch (error) {
      console.error('加载项目详情失败:', error);
    }
  };

  // 计算统计数据
  const stats = {
    total: projects.length,
    pending: projects.filter(p => p.status === 'pending').length,
    inProgress: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    delayed: projects.filter(p => p.status === 'delayed').length,
  };

  // 按岗位计算平均进度
  const getRoleProgress = (tasks: Task[] = []) => {
    const roleProgress: Record<string, number> = {};
    tasks.forEach(task => {
      if (!roleProgress[task.role]) {
        roleProgress[task.role] = 0;
      }
      roleProgress[task.role] += task.progress;
    });

    Object.keys(roleProgress).forEach(role => {
      const roleTasks = tasks.filter(t => t.role === role);
      roleProgress[role] = Math.round(roleProgress[role] / roleTasks.length);
    });

    return roleProgress;
  };

  useEffect(() => {
    loadProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* 头部 */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">电商工作流程管理系统</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">以销售为驱动的项目进度管理</p>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  创建项目
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建新项目</DialogTitle>
                  <DialogDescription>填写项目信息，系统将自动生成各岗位任务</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">项目名称 *</Label>
                    <Input
                      id="name"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      placeholder="例如：夏季新品推广"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salesDate">销售日期 *</Label>
                    <Input
                      id="salesDate"
                      type="date"
                      value={newProject.salesDate}
                      onChange={(e) => setNewProject({ ...newProject, salesDate: e.target.value })}
                    />
                    <p className="text-sm text-muted-foreground">系统将自动向前推3个月作为项目确认时间</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">项目描述</Label>
                    <Textarea
                      id="description"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      placeholder="简要描述项目内容和目标"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateProject} disabled={!newProject.name || !newProject.salesDate}>
                    创建项目
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="dashboard">数据看板</TabsTrigger>
            <TabsTrigger value="projects">项目列表</TabsTrigger>
            <TabsTrigger value="timeline">时间线</TabsTrigger>
            <TabsTrigger value="roles">岗位进度</TabsTrigger>
          </TabsList>

          {/* 数据看板 */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* 统计卡片 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">总项目数</CardTitle>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">当前在管项目</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">待开始</CardTitle>
                  <Clock className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pending}</div>
                  <p className="text-xs text-muted-foreground">等待启动</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">进行中</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.inProgress}</div>
                  <p className="text-xs text-muted-foreground">正在推进</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">已完成</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completed}</div>
                  <p className="text-xs text-muted-foreground">成功交付</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">已延期</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.delayed}</div>
                  <p className="text-xs text-muted-foreground">需要关注</p>
                </CardContent>
              </Card>
            </div>

            {/* 近期项目 */}
            <Card>
              <CardHeader>
                <CardTitle>近期项目</CardTitle>
                <CardDescription>展示最近创建或更新的项目</CardDescription>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无项目，点击上方按钮创建新项目</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.slice(0, 5).map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        onClick={() => {
                          loadProjectDetails(project.id);
                          setSelectedProject(project);
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-3 w-3 rounded-full ${STATUS_COLORS[project.status]}`} />
                          <div>
                            <h3 className="font-medium">{project.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              销售日期: {formatDateSafely(project.salesDate)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{STATUS_NAMES[project.status]}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 图表区域 */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* 项目状态分布饼图 */}
              <Card>
                <CardHeader>
                  <CardTitle>项目状态分布</CardTitle>
                  <CardDescription>各状态项目数量占比</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: '待开始', value: stats.pending, color: '#64748b' },
                          { name: '进行中', value: stats.inProgress, color: '#3b82f6' },
                          { name: '已完成', value: stats.completed, color: '#22c55e' },
                          { name: '已延期', value: stats.delayed, color: '#ef4444' },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: '待开始', value: stats.pending, color: '#64748b' },
                          { name: '进行中', value: stats.inProgress, color: '#3b82f6' },
                          { name: '已完成', value: stats.completed, color: '#22c55e' },
                          { name: '已延期', value: stats.delayed, color: '#ef4444' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* 各岗位进度柱状图 */}
              <Card>
                <CardHeader>
                  <CardTitle>各岗位平均进度</CardTitle>
                  <CardDescription>所有项目中各岗位的平均完成进度</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={Object.keys(ROLE_NAMES).map(role => {
                      const roleTasks = projects.flatMap(p => p.tasks || []).filter(t => t.role === role);
                      const avgProgress = roleTasks.length > 0
                        ? Math.round(roleTasks.reduce((sum, t) => sum + t.progress, 0) / roleTasks.length)
                        : 0;
                      return {
                        role: ROLE_NAMES[role].substring(0, 4),
                        progress: avgProgress,
                      };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="role" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="progress" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 项目列表 */}
          <TabsContent value="projects" className="space-y-6">
            {projects.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">暂无项目</h3>
                  <p className="text-muted-foreground mb-4">创建第一个项目开始管理您的工作流程</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    创建项目
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => loadProjectDetails(project.id)}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {project.description || '暂无描述'}
                          </CardDescription>
                        </div>
                        <Badge className={STATUS_COLORS[project.status]}>
                          {STATUS_NAMES[project.status]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>销售: {formatDateSafely(project.salesDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>确认: {formatDateSafely(project.projectConfirmDate)}</span>
                        </div>
                        <div className="pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">
                            点击查看详细工作流程
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 时间线视图 */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>项目时间线</CardTitle>
                <CardDescription>查看所有项目的时间节点和工作流程</CardDescription>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无项目，创建项目后将显示时间线</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {projects.map((project) => (
                      <div key={project.id} className="border-l-4 border-primary pl-6 pb-8 relative">
                        <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-primary" />
                        <div className="mb-4">
                          <h3 className="text-xl font-bold">{project.name}</h3>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>项目确认: {formatDateSafely(project.projectConfirmDate)}</span>
                            </div>
                            <ArrowRight className="h-4 w-4" />
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-green-600" />
                              <span className="text-green-600 font-medium">销售日期: {formatDateSafely(project.salesDate)}</span>
                            </div>
                          </div>
                        </div>

                        {/* 时间线节点 */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground">前期阶段 (项目确认后)</h4>
                            {['illustration', 'product_design', 'packaging_design'].map((role) => {
                              const roleTasks = (project.tasks || []).filter(t => t.role === role);
                              const avgProgress = roleTasks.length > 0
                                ? Math.round(roleTasks.reduce((sum, t) => sum + t.progress, 0) / roleTasks.length)
                                : 0;
                              return (
                                <div key={role} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm">{ROLE_NAMES[role]}</span>
                                    <span className="text-xs font-medium">{avgProgress}%</span>
                                  </div>
                                  <Progress value={avgProgress} className="h-2" />
                                </div>
                              );
                            })}
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground">中期阶段 (财务支持)</h4>
                            {['finance'].map((role) => {
                              const roleTasks = (project.tasks || []).filter(t => t.role === role);
                              const avgProgress = roleTasks.length > 0
                                ? Math.round(roleTasks.reduce((sum, t) => sum + t.progress, 0) / roleTasks.length)
                                : 0;
                              return (
                                <div key={role} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm">{ROLE_NAMES[role]}</span>
                                    <span className="text-xs font-medium">{avgProgress}%</span>
                                  </div>
                                  <Progress value={avgProgress} className="h-2" />
                                </div>
                              );
                            })}
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground">后期阶段 (销售前3天)</h4>
                            {['detail_design', 'copywriting', 'procurement', 'customer_service', 'warehouse'].map((role) => {
                              const roleTasks = (project.tasks || []).filter(t => t.role === role);
                              const avgProgress = roleTasks.length > 0
                                ? Math.round(roleTasks.reduce((sum, t) => sum + t.progress, 0) / roleTasks.length)
                                : 0;
                              return (
                                <div key={role} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-sm">{ROLE_NAMES[role]}</span>
                                    <span className="text-xs font-medium">{avgProgress}%</span>
                                  </div>
                                  <Progress value={avgProgress} className="h-2" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 岗位进度 */}
          <TabsContent value="roles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>各岗位工作进度概览</CardTitle>
                <CardDescription>查看所有项目中各岗位的平均完成进度和详细信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Object.keys(ROLE_NAMES).map((role) => {
                    const roleTasks = projects.flatMap(p => p.tasks || []).filter(t => t.role === role);
                    const avgProgress = roleTasks.length > 0
                      ? Math.round(roleTasks.reduce((sum, t) => sum + t.progress, 0) / roleTasks.length)
                      : 0;
                    
                    const completedTasks = roleTasks.filter(t => t.progress === 100).length;
                    const inProgressTasks = roleTasks.filter(t => t.progress > 0 && t.progress < 100).length;
                    const pendingTasks = roleTasks.filter(t => t.progress === 0).length;

                    return (
                      <Card key={role} className="border-2 hover:border-primary transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {ROLE_NAMES[role]}
                            </CardTitle>
                            <Badge variant="outline" className="text-lg font-semibold">
                              {avgProgress}%
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* 进度条 */}
                          <div>
                            <Progress value={avgProgress} className="h-3" />
                          </div>

                          {/* 任务统计 */}
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded p-2">
                              <div className="text-green-700 dark:text-green-400 font-semibold">{completedTasks}</div>
                              <div className="text-muted-foreground">已完成</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                              <div className="text-blue-700 dark:text-blue-400 font-semibold">{inProgressTasks}</div>
                              <div className="text-muted-foreground">进行中</div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/20 rounded p-2">
                              <div className="text-gray-700 dark:text-gray-400 font-semibold">{pendingTasks}</div>
                              <div className="text-muted-foreground">待开始</div>
                            </div>
                          </div>

                          {/* 任务数量 */}
                          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                            总计 {roleTasks.length} 个任务
                          </div>

                          {/* 最近的任务 */}
                          {roleTasks.length > 0 && (
                            <div className="pt-2 border-t">
                              <div className="text-xs font-medium mb-2">最近任务:</div>
                              <div className="space-y-1">
                                {roleTasks
                                  .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
                                  .slice(0, 2)
                                  .map(task => (
                                    <div key={task.id} className="flex items-center justify-between text-xs">
                                      <span className="truncate flex-1 mr-2">{task.taskName}</span>
                                      <span className="font-medium whitespace-nowrap">{task.progress}%</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 项目详情弹窗 */}
        {selectedProject && (
          <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedProject.name}</DialogTitle>
                <DialogDescription>
                  销售日期: {formatDateSafely(selectedProject.salesDate, 'yyyy年MM月dd日')} |
                  项目确认: {formatDateSafely(selectedProject.projectConfirmDate, 'yyyy年MM月dd日')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                {Object.keys(ROLE_NAMES).map((role) => {
                  const roleTasks = (selectedProject.tasks || []).filter(t => t.role === role);
                  return (
                    <Card key={role}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {ROLE_NAMES[role]}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {roleTasks.length === 0 ? (
                          <p className="text-sm text-muted-foreground">暂无任务</p>
                        ) : (
                          <div className="space-y-4">
                            {roleTasks.sort((a, b) => a.taskOrder - b.taskOrder).map((task) => (
                              <TaskCard 
                                key={task.id} 
                                task={task} 
                                onUpdate={(updatedTask) => {
                                  setSelectedProject(prev => {
                                    if (!prev) return prev;
                                    return {
                                      ...prev,
                                      tasks: prev.tasks?.map(t => 
                                        t.id === task.id ? { ...t, ...updatedTask } : t
                                      ) || []
                                    };
                                  });
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}
