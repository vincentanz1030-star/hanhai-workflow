'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  type: 'info' | 'warning' | 'success' | 'error';
  priority: number;
  is_active: boolean;
  start_time: string | null;
  end_time: string | null;
  brand: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface AnnouncementBarProps {
  isAdmin?: boolean;
  userBrand?: string;
}

const typeConfig = {
  info: {
    icon: Info,
    bgClass: 'bg-blue-50 dark:bg-blue-950/30',
    borderClass: 'border-blue-200 dark:border-blue-800',
    textClass: 'text-blue-700 dark:text-blue-300',
    badgeVariant: 'info' as const,
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-50 dark:bg-amber-950/30',
    borderClass: 'border-amber-200 dark:border-amber-800',
    textClass: 'text-amber-700 dark:text-amber-300',
    badgeVariant: 'warning' as const,
  },
  success: {
    icon: CheckCircle,
    bgClass: 'bg-green-50 dark:bg-green-950/30',
    borderClass: 'border-green-200 dark:border-green-800',
    textClass: 'text-green-700 dark:text-green-300',
    badgeVariant: 'success' as const,
  },
  error: {
    icon: XCircle,
    bgClass: 'bg-red-50 dark:bg-red-950/30',
    borderClass: 'border-red-200 dark:border-red-800',
    textClass: 'text-red-700 dark:text-red-300',
    badgeVariant: 'error' as const,
  },
};

export default function AnnouncementBar({ isAdmin = false, userBrand = 'all' }: AnnouncementBarProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // 对话框状态
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info' as Announcement['type'],
    priority: 0,
    is_active: true,
    start_time: '',
    end_time: '',
    brand: 'all',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取公告列表
  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await fetch('/api/announcements?activeOnly=true');
      const result = await response.json();
      if (result.success) {
        setAnnouncements(result.announcements || []);
      }
    } catch (error) {
      console.error('获取公告失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // 自动轮播
  useEffect(() => {
    if (announcements.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [announcements.length, isPaused]);

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'info',
      priority: 0,
      is_active: true,
      start_time: '',
      end_time: '',
      brand: 'all',
    });
    setEditingAnnouncement(null);
  };

  // 打开新增对话框
  const handleAdd = () => {
    resetForm();
    setFormData((prev) => ({ ...prev, brand: userBrand }));
    setIsDialogOpen(true);
  };

  // 打开编辑对话框
  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content || '',
      type: announcement.type,
      priority: announcement.priority,
      is_active: announcement.is_active,
      start_time: announcement.start_time ? announcement.start_time.slice(0, 16) : '',
      end_time: announcement.end_time ? announcement.end_time.slice(0, 16) : '',
      brand: announcement.brand,
    });
    setIsDialogOpen(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('请输入公告标题');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingAnnouncement
        ? `/api/announcements/${editingAnnouncement.id}`
        : '/api/announcements';
      const method = editingAnnouncement ? 'PUT' : 'POST';

      const body: Record<string, unknown> = {
        title: formData.title,
        content: formData.content || null,
        type: formData.type,
        priority: formData.priority,
        is_active: formData.is_active,
        brand: formData.brand,
      };

      if (formData.start_time) {
        body.start_time = new Date(formData.start_time).toISOString();
      }
      if (formData.end_time) {
        body.end_time = new Date(formData.end_time).toISOString();
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      if (result.success) {
        setIsDialogOpen(false);
        resetForm();
        fetchAnnouncements();
      } else {
        alert(result.error || '操作失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 删除公告
  const handleDelete = async () => {
    if (!deletingAnnouncement) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/announcements/${deletingAnnouncement.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        setIsDeleteDialogOpen(false);
        setDeletingAnnouncement(null);
        fetchAnnouncements();
        setCurrentIndex(0);
      } else {
        alert(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 切换到上一条/下一条
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  // 加载中或无公告
  if (isLoading) {
    return (
      <div className="bg-muted/50 border-b px-4 py-2">
        <div className="container mx-auto flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Megaphone className="h-4 w-4 animate-pulse" />
          <span>加载公告...</span>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return isAdmin ? (
      <div className="bg-muted/50 border-b px-4 py-2">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Megaphone className="h-4 w-4" />
            <span>暂无公告</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            新增公告
          </Button>
        </div>
      </div>
    ) : null;
  }

  const currentAnnouncement = announcements[currentIndex];
  const config = typeConfig[currentAnnouncement.type];
  const IconComponent = config.icon;

  return (
    <>
      <div
        className={cn(
          'border-b px-4 py-3 transition-colors',
          config.bgClass,
          config.borderClass
        )}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* 左侧导航 */}
            {announcements.length > 1 && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}

            {/* 公告内容 */}
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <IconComponent className={cn('h-5 w-5 shrink-0', config.textClass)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('font-medium truncate', config.textClass)}>
                    {currentAnnouncement.title}
                  </span>
                  <Badge variant={config.badgeVariant} className="text-xs">
                    {currentAnnouncement.type === 'info' && '通知'}
                    {currentAnnouncement.type === 'warning' && '警告'}
                    {currentAnnouncement.type === 'success' && '成功'}
                    {currentAnnouncement.type === 'error' && '错误'}
                  </Badge>
                </div>
                {currentAnnouncement.content && (
                  <p className={cn('text-sm mt-0.5 line-clamp-1', config.textClass, 'opacity-80')}>
                    {currentAnnouncement.content}
                  </p>
                )}
              </div>

              {/* 时间信息 */}
              {(currentAnnouncement.start_time || currentAnnouncement.end_time) && (
                <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {currentAnnouncement.start_time && (
                    <span>
                      {new Date(currentAnnouncement.start_time).toLocaleDateString()}
                    </span>
                  )}
                  {currentAnnouncement.end_time && (
                    <span>
                      {' - '}
                      {new Date(currentAnnouncement.end_time).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 右侧：管理员操作 + 导航 */}
            <div className="flex items-center gap-2 shrink-0">
              {isAdmin && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => handleEdit(currentAnnouncement)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => {
                      setDeletingAnnouncement(currentAnnouncement);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-4 bg-border mx-1" />
                </>
              )}

              {isAdmin && (
                <Button size="sm" variant="outline" onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-1" />
                  新增
                </Button>
              )}

              {announcements.length > 1 && (
                <>
                  {/* 分页指示器 */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{currentIndex + 1}</span>
                    <span>/</span>
                    <span>{announcements.length}</span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 新增/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? '编辑公告' : '新增公告'}
            </DialogTitle>
            <DialogDescription>
              {editingAnnouncement ? '修改公告内容后点击保存' : '填写公告内容后点击发布'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="请输入公告标题"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">内容</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="请输入公告内容（可选）"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">类型</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, type: value as Announcement['type'] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">通知</SelectItem>
                    <SelectItem value="warning">警告</SelectItem>
                    <SelectItem value="success">成功</SelectItem>
                    <SelectItem value="error">错误</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">优先级</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, priority: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="数字越大优先级越高"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_time">开始时间</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, start_time: e.target.value }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="end_time">结束时间</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, end_time: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="brand">可见范围</Label>
              <Select
                value={formData.brand}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, brand: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部品牌</SelectItem>
                  <SelectItem value="brand1">品牌 A</SelectItem>
                  <SelectItem value="brand2">品牌 B</SelectItem>
                  <SelectItem value="brand3">品牌 C</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">启用状态</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_active: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : editingAnnouncement ? '保存' : '发布'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除公告「{deletingAnnouncement?.title}」吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
