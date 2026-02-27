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
  brand: 'he_zhe' | 'baobao' | 'ai_he' | 'bao_deng_yuan' | 'all';
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
  imageUrl2: string | null;
  imageUrl3: string | null;
  customProgressLabels: Record<string, string> | null;
  estimatedCompletionDate: string | null;
  actualCompletionDate: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  created_at: string;
  updated_at: string | null;
}

interface Feedback {
  id: string;
  type: 'suggestion' | 'issue' | 'question' | 'other';
  brand: 'he_zhe' | 'baobao' | 'ai_he' | 'bao_deng_yuan' | 'all';
  role: string | null;
  projectId: string | null;
  title: string;
  content: string;
  status: 'pending' | 'in_review' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string | null;
  resolvedAt: string | null;
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
  customer_service: '客服团队',
  warehouse: '仓储管理',
};

// 品牌映射
const BRAND_NAMES: Record<string, string> = {
  he_zhe: '禾哲',
  baobao: 'BAOBAO',
  ai_he: '爱禾',
  bao_deng_yuan: '宝登源',
  all: '全部',
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

// 反馈类型映射
const FEEDBACK_TYPES: Record<string, string> = {
  suggestion: '建议',
  issue: '问题',
  question: '疑问',
  other: '其他',
};

// 反馈状态映射
const FEEDBACK_STATUS: Record<string, string> = {
  pending: '待处理',
  in_review: '审核中',
  resolved: '已解决',
};

// 优先级映射
const PRIORITY_NAMES: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

// 优先级颜色
const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
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
  const [uploadingTo, setUploadingTo] = useState<1 | 2 | 3>(1); // 上传到哪个图片位置
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, position: 1 | 2 | 3) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadingTo(position);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // 更新任务的图片URL到指定位置
        const updateBody: Record<string, string> = {};
        if (position === 1) updateBody.imageUrl = data.imageUrl;
        if (position === 2) updateBody.imageUrl2 = data.imageUrl;
        if (position === 3) updateBody.imageUrl3 = data.imageUrl;

        const updateResponse = await fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateBody),
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

      {/* 任务图片 - 支持最多3张 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {[1, 2, 3].map((position) => {
          const imageUrl = position === 1 ? task.imageUrl : position === 2 ? task.imageUrl2 : task.imageUrl3;
          return (
            <div key={position} className="space-y-2">
              {imageUrl && (
                <div className="relative group">
                  <img
                    src={imageUrl}
                    alt={`${task.taskName} - 图片${position}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">图片 {position}</span>
                  </div>
                </div>
              )}
              <input
                type="file"
                id={`image-upload-${task.id}-${position}`}
                accept="image/*"
                onChange={(e) => handleImageUpload(e, position as 1 | 2 | 3)}
                disabled={isUploading}
                className="hidden"
              />
              <label
                htmlFor={`image-upload-${task.id}-${position}`}
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors w-full ${
                  isUploading && uploadingTo === position
                    ? 'bg-muted cursor-not-allowed'
                    : 'bg-secondary hover:bg-secondary/80'
                } h-10 px-4 py-2 cursor-pointer`}
              >
                {isUploading && uploadingTo === position ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    上传中...
                  </>
                ) : (
                  <>
                    {imageUrl ? `更换图片${position}` : `上传图片${position}`}
                  </>
                )}
              </label>
            </div>
          );
        })}
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
        <div className="space-y-3 mt-4">
          {isEditingDate ? (
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-300 dark:border-blue-700">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-base font-bold text-blue-700 dark:text-blue-300">编辑预计完成时间</span>
              </div>
              <Input
                type="date"
                value={editingDate}
                onChange={(e) => setEditingDate(e.target.value)}
                className="flex-1 mb-3"
              />
              <div className="flex gap-2">
                <Button onClick={handleDateUpdate} className="flex-1">
                  保存时间
                </Button>
                <Button variant="outline" onClick={() => setIsEditingDate(false)}>
                  取消
                </Button>
              </div>
            </div>
          ) : (
            task.estimatedCompletionDate && task.estimatedCompletionDate.trim() !== '' && (
              <div className={`p-4 rounded-lg border-2 ${
                remaining.isOverdue 
                  ? 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-400 dark:border-red-600' 
                  : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-300 dark:border-blue-600'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className={`h-6 w-6 ${remaining.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                    <div>
                      <div className={`text-sm font-medium ${
                        remaining.isOverdue 
                          ? 'text-red-700 dark:text-red-300' 
                          : 'text-blue-700 dark:text-blue-300'
                      }`}>
                        预计完成时间
                      </div>
                      <div className={`text-2xl font-bold mt-1 ${
                        remaining.isOverdue 
                          ? 'text-red-800 dark:text-red-200' 
                          : 'text-blue-800 dark:text-blue-200'
                      }`}>
                        {formatDateSafely(task.estimatedCompletionDate)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-4 py-2 rounded-lg text-sm font-bold ${
                      remaining.isOverdue 
                        ? 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-100' 
                        : 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-100'
                    }`}>
                      {remaining.days > 0 
                        ? `📅 剩余 ${remaining.days} 天` 
                        : remaining.days === 0 
                          ? '⚠️ 今天截止' 
                          : '🚨 已延期'}
                    </div>
                    <div className={`text-xs mt-2 font-medium ${
                      remaining.isOverdue 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-blue-600 dark:text-blue-400'
                    }`}>
                      {remaining.days > 0 
                        ? '按计划进行' 
                        : remaining.days === 0 
                          ? '务必今日完成' 
                          : `已逾期 ${Math.abs(remaining.days)} 天`}
                    </div>
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
    brand: '' as 'he_zhe' | 'baobao' | 'ai_he' | 'bao_deng_yuan' | 'all',
    salesDate: '',
    description: '',
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // 时间线编辑状态
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingSalesDate, setEditingSalesDate] = useState('');
  const [editingConfirmDate, setEditingConfirmDate] = useState('');
  
  // 反馈相关状态
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [newFeedback, setNewFeedback] = useState({
    type: 'suggestion' as 'suggestion' | 'issue' | 'question' | 'other',
    brand: '' as 'he_zhe' | 'baobao' | 'ai_he' | 'bao_deng_yuan' | 'all',
    role: '' as string,
    projectId: '' as string,
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });
  
  // 品牌筛选状态
  const [selectedBrand, setSelectedBrand] = useState<'all' | 'he_zhe' | 'baobao' | 'ai_he' | 'bao_deng_yuan'>('all');

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
        setNewProject({ 
          name: '', 
          brand: '' as 'he_zhe' | 'baobao' | 'ai_he' | 'bao_deng_yuan' | 'all',
          salesDate: '', 
          description: '' 
        });
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

  // 开始编辑项目日期
  const handleStartEditDates = (project: Project) => {
    setEditingProjectId(project.id);
    setEditingSalesDate(project.salesDate);
    setEditingConfirmDate(project.projectConfirmDate);
  };

  // 取消编辑
  const handleCancelEditDates = () => {
    setEditingProjectId(null);
    setEditingSalesDate('');
    setEditingConfirmDate('');
  };

  // 保存项目日期
  const handleSaveDates = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salesDate: editingSalesDate,
          projectConfirmDate: editingConfirmDate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // 更新本地项目列表
        setProjects(projects.map(p => 
          p.id === projectId ? { ...p, ...data.project } : p
        ));
        setEditingProjectId(null);
      }
    } catch (error) {
      console.error('更新项目日期失败:', error);
      alert('更新失败，请重试');
    }
  };

  // 加载反馈列表
  const loadFeedback = async () => {
    try {
      const response = await fetch('/api/feedback');
      const data = await response.json();
      setFeedbackList(data.feedback || []);
    } catch (error) {
      console.error('加载反馈失败:', error);
    }
  };

  // 创建反馈
  const handleCreateFeedback = async () => {
    if (!newFeedback.title || !newFeedback.content || !newFeedback.brand) {
      alert('标题、内容和品牌不能为空');
      return;
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newFeedback,
          role: newFeedback.role || null,
          projectId: newFeedback.projectId || null,
        }),
      });

      if (response.ok) {
        setIsFeedbackDialogOpen(false);
        setNewFeedback({
          type: 'suggestion',
          brand: '' as 'he_zhe' | 'baobao' | 'ai_he' | 'bao_deng_yuan' | 'all',
          role: '',
          projectId: '',
          title: '',
          content: '',
          priority: 'medium',
        });
        loadFeedback();
      }
    } catch (error) {
      console.error('创建反馈失败:', error);
      alert('创建失败，请重试');
    }
  };

  // 更新反馈状态
  const handleUpdateFeedback = async (feedbackId: string, status: string) => {
    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        loadFeedback();
      }
    } catch (error) {
      console.error('更新反馈失败:', error);
      alert('更新失败，请重试');
    }
  };

  // 删除反馈
  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!confirm('确定要删除这条反馈吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadFeedback();
      }
    } catch (error) {
      console.error('删除反馈失败:', error);
      alert('删除失败，请重试');
    }
  };

  // 按品牌筛选项目
  const getFilteredProjects = () => {
    if (selectedBrand === 'all') {
      return projects;
    }
    return projects.filter(p => p.brand === selectedBrand);
  };

  const filteredProjects = getFilteredProjects();

  // 计算统计数据
  const stats = {
    total: filteredProjects.length,
    pending: filteredProjects.filter(p => p.status === 'pending').length,
    inProgress: filteredProjects.filter(p => p.status === 'in_progress').length,
    completed: filteredProjects.filter(p => p.status === 'completed').length,
    delayed: filteredProjects.filter(p => p.status === 'delayed').length,
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
    loadFeedback();
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
                    <Label htmlFor="brand">选择品牌 *</Label>
                    <select
                      id="brand"
                      value={newProject.brand}
                      onChange={(e) => setNewProject({ ...newProject, brand: e.target.value as any })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">请选择品牌...</option>
                      {Object.keys(BRAND_NAMES).map(key => {
                        if (key === 'all') return null; // 不在创建项目时显示"全部"
                        return (
                          <option key={key} value={key}>{BRAND_NAMES[key]}</option>
                        );
                      })}
                    </select>
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
                  <Button onClick={handleCreateProject} disabled={!newProject.name || !newProject.salesDate || !newProject.brand}>
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
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="dashboard">数据看板</TabsTrigger>
            <TabsTrigger value="projects">项目列表</TabsTrigger>
            <TabsTrigger value="timeline">时间线</TabsTrigger>
            <TabsTrigger value="roles">岗位进度</TabsTrigger>
            <TabsTrigger value="feedback">支持协助</TabsTrigger>
          </TabsList>

          {/* 数据看板 */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* 品牌筛选 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">品牌筛选</CardTitle>
                <CardDescription>选择查看特定品牌或全部品牌的数据</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {Object.keys(BRAND_NAMES).map(brandKey => (
                    <Button
                      key={brandKey}
                      variant={selectedBrand === brandKey ? "default" : "outline"}
                      onClick={() => setSelectedBrand(brandKey as any)}
                      className={selectedBrand === brandKey ? 'gap-2' : 'gap-2'}
                    >
                      {selectedBrand === brandKey && <CheckCircle className="h-4 w-4" />}
                      {BRAND_NAMES[brandKey]}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{project.name}</h3>
                              <Badge variant="outline" className="text-xs">{BRAND_NAMES[project.brand]}</Badge>
                            </div>
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
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                      data={Object.keys(ROLE_NAMES).map(role => {
                        const roleTasks = projects.flatMap(p => p.tasks || []).filter(t => t.role === role);
                        const avgProgress = roleTasks.length > 0
                          ? Math.round(roleTasks.reduce((sum, t) => sum + t.progress, 0) / roleTasks.length)
                          : 0;
                        return {
                          role: ROLE_NAMES[role],
                          roleKey: role,
                          progress: avgProgress,
                          taskCount: roleTasks.length,
                        };
                      })}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="role" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${value}%`,
                          '平均进度'
                        ]}
                        labelFormatter={(label: string, props: any) => {
                          if (props && props.payload) {
                            return `${props.payload.role} (${props.payload.taskCount}个任务)`;
                          }
                          return label;
                        }}
                      />
                      <Bar 
                        dataKey="progress" 
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      >
                        {[...Object.keys(ROLE_NAMES)].map((entry, index) => (
                          <rect 
                            key={`bar-${index}`}
                            fill={index % 2 === 0 ? '#3b82f6' : '#8b5cf6'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  
                  {/* 进度统计表格 */}
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium mb-2">岗位进度详情</h4>
                    {Object.keys(ROLE_NAMES).map((role) => {
                      const roleTasks = projects.flatMap(p => p.tasks || []).filter(t => t.role === role);
                      const avgProgress = roleTasks.length > 0
                        ? Math.round(roleTasks.reduce((sum, t) => sum + t.progress, 0) / roleTasks.length)
                        : 0;
                      const completedTasks = roleTasks.filter(t => t.progress === 100).length;
                      return (
                        <div key={role} className="flex items-center justify-between text-sm">
                          <span className="flex-1">{ROLE_NAMES[role]}</span>
                          <div className="flex items-center gap-2 flex-[2]">
                            <Progress value={avgProgress} className="h-2" />
                            <span className="w-12 text-right font-medium">
                              {avgProgress}%
                            </span>
                          </div>
                          <span className="w-24 text-right text-muted-foreground">
                            {completedTasks}/{roleTasks.length}
                          </span>
                        </div>
                      );
                    })}
                  </div>
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
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{BRAND_NAMES[project.brand]}</Badge>
                          </div>
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
                          <div className="flex items-start justify-between">
                            <h3 className="text-xl font-bold">{project.name}</h3>
                            {editingProjectId === project.id ? (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleSaveDates(project.id)}>
                                  保存
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEditDates}>
                                  取消
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => handleStartEditDates(project)}>
                                编辑日期
                              </Button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                            {editingProjectId === project.id ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="date"
                                      value={editingConfirmDate}
                                      onChange={(e) => setEditingConfirmDate(e.target.value)}
                                      className="w-auto"
                                    />
                                  </div>
                                </div>
                                <ArrowRight className="h-4 w-4" />
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="date"
                                      value={editingSalesDate}
                                      onChange={(e) => setEditingSalesDate(e.target.value)}
                                      className="w-auto"
                                    />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>项目确认: {formatDateSafely(project.projectConfirmDate)}</span>
                                </div>
                                <ArrowRight className="h-4 w-4" />
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-green-600" />
                                  <span className="text-green-600 font-medium">销售日期: {formatDateSafely(project.salesDate)}</span>
                                </div>
                              </>
                            )}
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

          {/* 员工反馈 */}
          <TabsContent value="feedback" className="space-y-6">
            <div className="flex items-center justify-between">
              <Card className="flex-1 mr-4">
                <CardHeader>
                  <CardTitle>支持与协助</CardTitle>
                  <CardDescription>收集和管理团队的支持需求和建议</CardDescription>
                </CardHeader>
              </Card>
              <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    提交反馈
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>提交反馈</DialogTitle>
                    <DialogDescription>请填写您的反馈或需求</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">反馈类型 *</Label>
                      <select
                        id="type"
                        value={newFeedback.type}
                        onChange={(e) => setNewFeedback({ ...newFeedback, type: e.target.value as any })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {Object.keys(FEEDBACK_TYPES).map(key => (
                          <option key={key} value={key}>{FEEDBACK_TYPES[key]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand">选择品牌 *</Label>
                      <select
                        id="brand"
                        value={newFeedback.brand}
                        onChange={(e) => setNewFeedback({ ...newFeedback, brand: e.target.value as any })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">请选择品牌...</option>
                        {Object.keys(BRAND_NAMES).map(key => {
                          if (key === 'all') return null;
                          return (
                            <option key={key} value={key}>{BRAND_NAMES[key]}</option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">关联岗位 (可选)</Label>
                      <select
                        id="role"
                        value={newFeedback.role}
                        onChange={(e) => setNewFeedback({ ...newFeedback, role: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">选择岗位...</option>
                        {Object.keys(ROLE_NAMES).map(key => (
                          <option key={key} value={key}>{ROLE_NAMES[key]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project">关联项目 (可选)</Label>
                      <select
                        id="project"
                        value={newFeedback.projectId}
                        onChange={(e) => setNewFeedback({ ...newFeedback, projectId: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">选择项目...</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">标题 *</Label>
                      <Input
                        id="title"
                        value={newFeedback.title}
                        onChange={(e) => setNewFeedback({ ...newFeedback, title: e.target.value })}
                        placeholder="简要描述反馈内容"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="content">详细内容 *</Label>
                      <Textarea
                        id="content"
                        value={newFeedback.content}
                        onChange={(e) => setNewFeedback({ ...newFeedback, content: e.target.value })}
                        placeholder="请详细描述您的反馈或需求"
                        rows={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">优先级</Label>
                      <select
                        id="priority"
                        value={newFeedback.priority}
                        onChange={(e) => setNewFeedback({ ...newFeedback, priority: e.target.value as any })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {Object.keys(PRIORITY_NAMES).map(key => (
                          <option key={key} value={key}>{PRIORITY_NAMES[key]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCreateFeedback} disabled={!newFeedback.title || !newFeedback.content || !newFeedback.brand}>
                      提交反馈
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* 反馈列表 */}
            <div className="grid gap-4">
              {feedbackList.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">暂无反馈</h3>
                    <p className="text-muted-foreground mb-4">还没有员工提交反馈或需求</p>
                  </CardContent>
                </Card>
              ) : (
                feedbackList.map((feedback) => (
                  <Card key={feedback.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>{FEEDBACK_TYPES[feedback.type]}</Badge>
                            <Badge className={PRIORITY_COLORS[feedback.priority]}>{PRIORITY_NAMES[feedback.priority]}优先级</Badge>
                            <Badge className={feedback.status === 'resolved' ? 'bg-green-500' : feedback.status === 'in_review' ? 'bg-blue-500' : 'bg-gray-500'}>
                              {FEEDBACK_STATUS[feedback.status]}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{feedback.title}</CardTitle>
                        </div>
                        {feedback.status !== 'resolved' && (
                          <div className="flex gap-2 ml-4">
                            {feedback.status === 'pending' && (
                              <Button size="sm" variant="outline" onClick={() => handleUpdateFeedback(feedback.id, 'in_review')}>
                                开始审核
                              </Button>
                            )}
                            {feedback.status === 'in_review' && (
                              <Button size="sm" onClick={() => handleUpdateFeedback(feedback.id, 'resolved')}>
                                标记已解决
                              </Button>
                            )}
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteFeedback(feedback.id)}>
                              删除
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm whitespace-pre-wrap">{feedback.content}</p>
                        
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-3 border-t">
                          {feedback.role && (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>{ROLE_NAMES[feedback.role]}</span>
                            </div>
                          )}
                          {feedback.projectId && (
                            <div className="flex items-center gap-1">
                              <FolderOpen className="h-3 w-3" />
                              <span>{projects.find(p => p.id === feedback.projectId)?.name || '未知项目'}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDateSafely(feedback.createdAt, 'yyyy-MM-dd HH:mm')}</span>
                          </div>
                          {feedback.resolvedAt && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>解决于: {formatDateSafely(feedback.resolvedAt, 'yyyy-MM-dd HH:mm')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
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
