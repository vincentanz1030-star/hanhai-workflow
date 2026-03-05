/**
 * 营销中台 - 活动任务管理组件
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Calendar, CheckCircle, Clock, PlayCircle, AlertCircle, Edit, Trash2, Eye, Loader2, X, User } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface CampaignTask {
  id: string;
  campaign_id: string;
  campaign_name?: string;
  task_name: string;
  description: string;
  assignee_id: string;
  assignee_name?: string;
  status: string;
  priority: string;
  due_date: string;
  completed_at: string;
  progress: number;
  attachments: any[];
  tags: string[];
  created_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export function CampaignTasks() {
  const [tasks, setTasks] = useState<CampaignTask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTask, setCurrentTask] = useState<CampaignTask | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    campaign_id: '',
    task_name: '',
    description: '',
    assignee_id: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    progress: 0,
  });

  useEffect(() => {
    loadTasks();
    loadUsers();
    loadCampaigns();
  }, [selectedStatus, selectedAssignee, selectedCampaign]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('加载用户失败:', error);
    }
  };

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

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        ...(selectedAssignee !== 'all' && { assignee: selectedAssignee }),
        ...(selectedCampaign !== 'all' && { campaign_id: selectedCampaign }),
      });

      const response = await fetch(`/api/marketing/campaign-tasks?${params}`);
      const data = await response.json();

      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error('加载任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!formData.campaign_id || !formData.task_name || !formData.assignee_id) {
      alert('请填写必填项');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/marketing/campaign-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        alert('任务创建成功！');
        setIsCreateDialogOpen(false);
        resetForm();
        loadTasks();
      } else {
        alert('创建失败：' + data.error);
      }
    } catch (error) {
      console.error('创建任务失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTask = async () => {
    if (!currentTask) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/marketing/campaign-tasks/${currentTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        alert('任务更新成功！');
        setIsEditDialogOpen(false);
        resetForm();
        loadTasks();
      } else {
        alert('更新失败：' + data.error);
      }
    } catch (error) {
      console.error('更新任务失败:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('确定要删除这个任务吗？')) return;

    try {
      const response = await fetch(`/api/marketing/campaign-tasks/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        alert('任务删除成功！');
        loadTasks();
      } else {
        alert('删除失败：' + data.error);
      }
    } catch (error) {
      console.error('删除任务失败:', error);
      alert('网络错误，请稍后重试');
    }
  };

  const openEditDialog = (task: CampaignTask) => {
    setCurrentTask(task);
    setFormData({
      campaign_id: task.campaign_id,
      task_name: task.task_name,
      description: task.description || '',
      assignee_id: task.assignee_id,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || '',
      progress: task.progress || 0,
    });
    setIsEditDialogOpen(true);
  };

  const openDetailDialog = (task: CampaignTask) => {
    setCurrentTask(task);
    setIsDetailDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      campaign_id: '',
      task_name: '',
      description: '',
      assignee_id: '',
      status: 'pending',
      priority: 'medium',
      due_date: '',
      progress: 0,
    });
    setCurrentTask(null);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string; icon: any }> = {
      pending: { label: '待处理', variant: 'secondary', icon: Clock },
      in_progress: { label: '进行中', variant: 'default', icon: PlayCircle },
      completed: { label: '已完成', variant: 'default', icon: CheckCircle },
      overdue: { label: '已逾期', variant: 'destructive', icon: AlertCircle },
    };
    const config = statusMap[status] || { label: status, variant: 'outline', icon: null };
    const Icon = config.icon;
    return (
      <Badge variant={config.variant as any} className="gap-1">
        {Icon && <Icon className="h-3 w-3" />}
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; color: string }> = {
      low: { label: '低', color: 'text-blue-600' },
      medium: { label: '中', color: 'text-yellow-600' },
      high: { label: '高', color: 'text-red-600' },
    };
    const config = priorityMap[priority] || { label: priority, color: 'text-gray-600' };
    return <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>;
  };

  const filteredTasks = tasks.filter(task =>
    task.task_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (task.campaign_name && task.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getUserName = (userId: string): string => {
    if (!userId) return '-';
    const user = users.find(u => u.id === userId);
    return user ? user.name : userId.substring(0, 8);
  };

  const getCampaignName = (campaignId: string): string => {
    if (!campaignId) return '-';
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign ? campaign.name : campaignId.substring(0, 8);
  };

  const isOverdue = (dueDate: string | null): boolean => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="搜索任务名称或活动..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="活动" />
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
        <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="负责人" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部负责人</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待处理</SelectItem>
            <SelectItem value="in_progress">进行中</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新建任务
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>创建活动任务</DialogTitle>
              <DialogDescription>填写任务基本信息</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign">所属活动 *</Label>
                  <Select value={formData.campaign_id} onValueChange={(v) => setFormData({ ...formData, campaign_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择活动" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignee">负责人 *</Label>
                  <Select value={formData.assignee_id} onValueChange={(v) => setFormData({ ...formData, assignee_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择负责人" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taskName">任务名称 *</Label>
                <Input
                  id="taskName"
                  value={formData.task_name}
                  onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">任务描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">截止日期</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">优先级</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择优先级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">低</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">状态</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">待处理</SelectItem>
                      <SelectItem value="in_progress">进行中</SelectItem>
                      <SelectItem value="completed">已完成</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress">进度 ({formData.progress}%)</Label>
                <Input
                  id="progress"
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                取消
              </Button>
              <Button onClick={handleCreateTask} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                创建任务
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 任务列表 */}
      <Card>
        <CardHeader>
          <CardTitle>活动任务</CardTitle>
          <CardDescription>共 {tasks.length} 个任务</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">暂无任务数据</p>
              <p className="text-sm text-muted-foreground mt-2">点击"新建任务"开始添加</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务名称</TableHead>
                  <TableHead>所属活动</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>截止日期</TableHead>
                  <TableHead>进度</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="font-medium">{task.task_name}</div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">{task.description}</div>
                      )}
                    </TableCell>
                    <TableCell>{getCampaignName(task.campaign_id)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {getUserName(task.assignee_id)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className={isOverdue(task.due_date) && task.status !== 'completed' ? 'text-red-600' : ''}>
                          {task.due_date || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{task.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openDetailDialog(task)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(task)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteTask(task.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 编辑任务对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑活动任务</DialogTitle>
            <DialogDescription>修改任务信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-campaign">所属活动</Label>
                <Select value={formData.campaign_id} onValueChange={(v) => setFormData({ ...formData, campaign_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择活动" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-assignee">负责人</Label>
                <Select value={formData.assignee_id} onValueChange={(v) => setFormData({ ...formData, assignee_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择负责人" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-taskName">任务名称</Label>
              <Input
                id="edit-taskName"
                value={formData.task_name}
                onChange={(e) => setFormData({ ...formData, task_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">任务描述</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">截止日期</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-priority">优先级</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">状态</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">待处理</SelectItem>
                    <SelectItem value="in_progress">进行中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-progress">进度 ({formData.progress}%)</Label>
              <Input
                id="edit-progress"
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
              取消
            </Button>
            <Button onClick={handleEditTask} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 任务详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>任务详情</DialogTitle>
                <DialogDescription>查看任务完整信息</DialogDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsDetailDialogOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {currentTask && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground">任务名称</Label>
                  <div className="text-lg font-semibold">{currentTask.task_name}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">所属活动</Label>
                  <div>{getCampaignName(currentTask.campaign_id)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">负责人</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {getUserName(currentTask.assignee_id)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">截止日期</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className={isOverdue(currentTask.due_date) && currentTask.status !== 'completed' ? 'text-red-600' : ''}>
                      {currentTask.due_date || '-'}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">优先级</Label>
                  <div>{getPriorityBadge(currentTask.priority)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">状态</Label>
                  <div>{getStatusBadge(currentTask.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">进度</Label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${currentTask.progress}%` }}
                      />
                    </div>
                    <span className="text-sm">{currentTask.progress}%</span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">创建时间</Label>
                  <div>{new Date(currentTask.created_at).toLocaleString()}</div>
                </div>
              </div>
              {currentTask.description && (
                <div>
                  <Label>任务描述</Label>
                  <Card>
                    <CardContent className="p-4">
                      <div className="whitespace-pre-wrap">{currentTask.description}</div>
                    </CardContent>
                  </Card>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  关闭
                </Button>
                <Button onClick={() => { setIsDetailDialogOpen(false); openEditDialog(currentTask); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑任务
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
