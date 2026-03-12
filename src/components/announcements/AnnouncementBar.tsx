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
  Check,
  CheckCheck,
  Sparkles,
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
  isRead?: boolean;
}

interface AnnouncementBarProps {
  isAdmin?: boolean;
  userBrand?: string;
}

const typeConfig = {
  info: {
    icon: Info,
    gradient: 'from-blue-500 via-blue-400 to-cyan-400',
    bgGradient: 'from-blue-50 via-blue-100/50 to-cyan-50 dark:from-blue-950/50 dark:via-blue-900/30 dark:to-cyan-950/50',
    border: 'border-blue-300 dark:border-blue-700',
    glow: 'shadow-blue-500/20 dark:shadow-blue-400/10',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-500',
    ring: 'ring-blue-400/50',
  },
  warning: {
    icon: AlertTriangle,
    gradient: 'from-amber-500 via-orange-400 to-yellow-400',
    bgGradient: 'from-amber-50 via-orange-100/50 to-yellow-50 dark:from-amber-950/50 dark:via-orange-900/30 dark:to-yellow-950/50',
    border: 'border-amber-300 dark:border-amber-700',
    glow: 'shadow-amber-500/20 dark:shadow-amber-400/10',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-500',
    ring: 'ring-amber-400/50',
  },
  success: {
    icon: CheckCircle,
    gradient: 'from-emerald-500 via-green-400 to-teal-400',
    bgGradient: 'from-emerald-50 via-green-100/50 to-teal-50 dark:from-emerald-950/50 dark:via-green-900/30 dark:to-teal-950/50',
    border: 'border-emerald-300 dark:border-emerald-700',
    glow: 'shadow-emerald-500/20 dark:shadow-emerald-400/10',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-500',
    ring: 'ring-emerald-400/50',
  },
  error: {
    icon: XCircle,
    gradient: 'from-red-500 via-rose-400 to-pink-400',
    bgGradient: 'from-red-50 via-rose-100/50 to-pink-50 dark:from-red-950/50 dark:via-rose-900/30 dark:to-pink-950/50',
    border: 'border-red-300 dark:border-red-700',
    glow: 'shadow-red-500/20 dark:shadow-red-400/10',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-500',
    ring: 'ring-red-400/50',
  },
};

export default function AnnouncementBar({ isAdmin = false, userBrand = 'all' }: AnnouncementBarProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
        setUnreadCount(result.unreadCount || 0);
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
    }, 6000);

    return () => clearInterval(interval);
  }, [announcements.length, isPaused]);

  // 标记当前公告为已读
  const markAsRead = async (announcementId: string) => {
    try {
      await fetch('/api/announcements/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId }),
      });

      setAnnouncements((prev) =>
        prev.map((a) => (a.id === announcementId ? { ...a, isRead: true } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 标记全部已读
  const markAllAsRead = async () => {
    try {
      await fetch('/api/announcements/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      setAnnouncements((prev) => prev.map((a) => ({ ...a, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('标记全部已读失败:', error);
    }
  };

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
  const handleEdit = (announcement: Announcement, e?: React.MouseEvent) => {
    e?.stopPropagation();
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

  // 切换公告
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  // 点击公告处理
  const handleAnnouncementClick = (announcement: Announcement) => {
    if (!announcement.isRead) {
      markAsRead(announcement.id);
    }
  };

  // 加载中
  if (isLoading) {
    return (
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 animate-pulse" />
        <div className="relative px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 animate-spin" />
            <span>加载公告...</span>
          </div>
        </div>
      </div>
    );
  }

  // 无公告
  if (announcements.length === 0) {
    return isAdmin ? (
      <div className="bg-gradient-to-r from-muted/50 to-muted/30 border-b px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Megaphone className="h-4 w-4" />
            <span>暂无公告</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            发布公告
          </Button>
        </div>
      </div>
    ) : null;
  }

  const currentAnnouncement = announcements[currentIndex];
  const config = typeConfig[currentAnnouncement.type];
  const IconComponent = config.icon;
  const isUnread = !currentAnnouncement.isRead;

  return (
    <>
      <div
        className={cn(
          'relative overflow-hidden border-b transition-all duration-500',
          isUnread && 'ring-2 ring-inset animate-pulse-subtle'
        )}
        style={{ animationDuration: '2s' }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* 动态渐变背景 */}
        <div className={cn('absolute inset-0 bg-gradient-to-r opacity-80', config.bgGradient)} />
        
        {/* 装饰性光效 */}
        {isUnread && (
          <div className={cn(
            'absolute inset-0 opacity-30',
            'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))]',
            config.gradient
          )} />
        )}

        <div className="relative container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {/* 左侧导航 */}
            {announcements.length > 1 && (
              <Button
                size="icon"
                variant="ghost"
                className={cn('h-8 w-8 shrink-0 rounded-full', config.text)}
                onClick={handlePrev}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}

            {/* 公告内容 - 可点击 */}
            <div
              className={cn('flex-1 flex items-center gap-4 min-w-0 cursor-pointer group')}
              onClick={() => handleAnnouncementClick(currentAnnouncement)}
            >
              {/* 图标 */}
              <div className={cn(
                'relative shrink-0 p-2.5 rounded-xl bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110',
                config.gradient,
                config.glow
              )}>
                <IconComponent className="h-5 w-5 text-white" />
                {isUnread && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse" />
                )}
              </div>

              {/* 文字内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('font-semibold text-base truncate', config.text, isUnread && 'font-bold')}>
                    {currentAnnouncement.title}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    {isUnread && (
                      <Badge variant="error" className="text-xs animate-pulse">
                        新
                      </Badge>
                    )}
                    <Badge className={cn('text-xs text-white', config.badge)}>
                      {currentAnnouncement.type === 'info' && '通知'}
                      {currentAnnouncement.type === 'warning' && '警告'}
                      {currentAnnouncement.type === 'success' && '成功'}
                      {currentAnnouncement.type === 'error' && '错误'}
                    </Badge>
                  </div>
                </div>
                
                {currentAnnouncement.content && (
                  <p className={cn('text-sm mt-1 line-clamp-1 opacity-75', config.text)}>
                    {currentAnnouncement.content}
                  </p>
                )}
              </div>

              {/* 已读状态 */}
              {currentAnnouncement.isRead ? (
                <div className={cn('hidden sm:flex items-center gap-1 text-xs opacity-60', config.text)}>
                  <CheckCheck className="h-4 w-4" />
                  <span>已读</span>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn('hidden sm:flex gap-1', config.text)}
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(currentAnnouncement.id);
                  }}
                >
                  <Check className="h-4 w-4" />
                  <span>标记已读</span>
                </Button>
              )}
            </div>

            {/* 右侧操作区 */}
            <div className="flex items-center gap-2 shrink-0">
              {/* 未读数量 */}
              {unreadCount > 0 && (
                <Badge variant="error" className="animate-pulse">
                  {unreadCount} 条未读
                </Badge>
              )}

              {/* 全部已读 */}
              {unreadCount > 1 && (
                <Button size="sm" variant="outline" className="text-xs" onClick={markAllAsRead}>
                  <CheckCheck className="h-3 w-3 mr-1" />
                  全部已读
                </Button>
              )}

              {/* 管理员操作 */}
              {isAdmin && (
                <>
                  <div className="w-px h-6 bg-border/50 mx-1" />
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn('h-8 w-8', config.text)}
                    onClick={(e) => handleEdit(currentAnnouncement, e)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingAnnouncement(currentAnnouncement);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleAdd}>
                    <Plus className="h-4 w-4 mr-1" />
                    发布
                  </Button>
                </>
              )}

              {/* 导航和分页 */}
              {announcements.length > 1 && (
                <>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <span className="font-medium">{currentIndex + 1}</span>
                    <span>/</span>
                    <span>{announcements.length}</span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn('h-8 w-8', config.text)}
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-5 w-5" />
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
            <DialogTitle>{editingAnnouncement ? '编辑公告' : '发布公告'}</DialogTitle>
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">📢 通知</SelectItem>
                    <SelectItem value="warning">⚠️ 警告</SelectItem>
                    <SelectItem value="success">✅ 成功</SelectItem>
                    <SelectItem value="error">❌ 错误</SelectItem>
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
                  placeholder="数字越大越靠前"
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="end_time">结束时间</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="brand">可见范围</Label>
              <Select
                value={formData.brand}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, brand: value }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部品牌</SelectItem>
                  <SelectItem value="he_zhe">和哲</SelectItem>
                  <SelectItem value="baobao">包包</SelectItem>
                  <SelectItem value="ai_he">爱和</SelectItem>
                  <SelectItem value="bao_deng_yuan">宝登源</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">启用状态</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
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
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 自定义动画样式 */}
      <style jsx global>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
