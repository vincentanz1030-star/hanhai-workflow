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
  Eye,
  X,
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

// 扁平化设计配色
const typeConfig = {
  info: {
    icon: Info,
    bgColor: 'bg-blue-500',
    lightBg: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-l-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-500',
    lightBg: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-300',
    borderColor: 'border-l-amber-500',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-emerald-500',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-l-emerald-500',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-500',
    lightBg: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-700 dark:text-red-300',
    borderColor: 'border-l-red-500',
  },
};

export default function AnnouncementBar({ isAdmin = false, userBrand = 'all' }: AnnouncementBarProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 预览对话框
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewAnnouncement, setPreviewAnnouncement] = useState<Announcement | null>(null);

  // 编辑对话框
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

  // 标记已读
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

  // 打开预览
  const openPreview = (announcement: Announcement, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPreviewAnnouncement(announcement);
    setIsPreviewOpen(true);
    if (!announcement.isRead) {
      markAsRead(announcement.id);
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
  const handleAdd = (e?: React.MouseEvent) => {
    e?.stopPropagation();
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
      if (formData.start_time) body.start_time = new Date(formData.start_time).toISOString();
      if (formData.end_time) body.end_time = new Date(formData.end_time).toISOString();

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
      const response = await fetch(`/api/announcements/${deletingAnnouncement.id}`, { method: 'DELETE' });
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
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % announcements.length);

  // 加载中
  if (isLoading) {
    return (
      <div className="px-3 sm:px-4 py-3">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Megaphone className="h-4 w-4 animate-pulse" />
          <span>加载公告...</span>
        </div>
      </div>
    );
  }

  // 无公告
  if (announcements.length === 0) {
    return isAdmin ? (
      <div className="px-3 sm:px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">暂无公告</span>
          <Button size="sm" variant="outline" onClick={() => handleAdd()}>
            <Plus className="h-4 w-4 mr-1" />发布公告
          </Button>
        </div>
      </div>
    ) : null;
  }

  const current = announcements[currentIndex];
  const config = typeConfig[current.type];
  const IconComponent = config.icon;
  const isUnread = !current.isRead;

  return (
    <>
      {/* 公告栏 - 参考通知中心样式 */}
      <div className="px-3 sm:px-4 py-3">
        <div
          className={cn(
            'p-3 rounded-lg border transition-colors',
            isUnread
              ? 'bg-white dark:bg-slate-900 border-primary'
              : 'bg-slate-50 dark:bg-slate-800'
          )}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="flex items-start gap-3">
            {/* 左侧图标 - 圆形背景 */}
            <div className={cn('p-2 rounded-full text-white shrink-0', config.bgColor)}>
              <IconComponent className="h-4 w-4" />
            </div>

            {/* 内容区 */}
            <div className="flex-1 min-w-0">
              {/* 标题行 */}
              <div className="flex items-center justify-between mb-1">
                <h4 className={cn('font-semibold text-sm truncate', isUnread && 'font-bold')}>
                  {current.title}
                </h4>
                <div className="flex items-center gap-1 shrink-0">
                  {!isUnread && (
                    <Check className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  {isUnread && (
                    <Badge variant="secondary" className="text-[10px]">新</Badge>
                  )}
                </div>
              </div>

              {/* 内容 */}
              {current.content && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {current.content}
                </p>
              )}

              {/* 底部：时间 + 操作 */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {new Date(current.created_at).toLocaleString('zh-CN')}
                </p>
                <div className="flex items-center gap-1">
                  {/* 预览按钮 */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => openPreview(current, e)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    详情
                  </Button>

                  {/* 已读/标记已读 */}
                  {isUnread && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={(e) => { e.stopPropagation(); markAsRead(current.id); }}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      已读
                    </Button>
                  )}
                  
                  {/* 管理员操作 */}
                  {isAdmin && (
                    <>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => handleEdit(current, e)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); setDeletingAnnouncement(current); setIsDeleteDialogOpen(true); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 导航区 */}
            {announcements.length > 1 && (
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handlePrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {currentIndex + 1}/{announcements.length}
                </span>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* 管理员发布按钮 */}
          {isAdmin && announcements.length === 1 && (
            <div className="mt-2 pt-2 border-t flex justify-end">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAdd()}>
                <Plus className="h-3 w-3 mr-1" />发布公告
              </Button>
            </div>
          )}
        </div>
        
        {/* 未读数量提示 */}
        {unreadCount > 1 && (
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={markAllAsRead}>
              <CheckCheck className="h-3 w-3 mr-1" />
              全部标为已读 ({unreadCount})
            </Button>
          </div>
        )}
      </div>

      {/* 预览对话框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className={cn('p-2 rounded', config.bgColor)}>
                <IconComponent className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">{previewAnnouncement?.title}</DialogTitle>
                <DialogDescription>
                  {previewAnnouncement?.type === 'info' && '通知'}
                  {previewAnnouncement?.type === 'warning' && '警告'}
                  {previewAnnouncement?.type === 'success' && '成功'}
                  {previewAnnouncement?.type === 'error' && '错误'}
                  {previewAnnouncement?.created_at && (
                    <span className="ml-2">
                      · {new Date(previewAnnouncement.created_at).toLocaleString('zh-CN')}
                    </span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {previewAnnouncement?.content || '暂无详细内容'}
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {previewAnnouncement && !previewAnnouncement.isRead && (
              <Button variant="outline" onClick={() => { markAsRead(previewAnnouncement.id); setIsPreviewOpen(false); }}>
                <Check className="h-4 w-4 mr-1" />标记已读
              </Button>
            )}
            <Button onClick={() => setIsPreviewOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? '编辑公告' : '发布公告'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>标题 *</Label>
              <Input value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} placeholder="请输入公告标题" />
            </div>
            <div className="grid gap-2">
              <Label>内容</Label>
              <Textarea value={formData.content} onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))} placeholder="请输入公告内容" rows={5} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>类型</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData((p) => ({ ...p, type: v as Announcement['type'] }))}>
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
                <Label>优先级</Label>
                <Input type="number" value={formData.priority} onChange={(e) => setFormData((p) => ({ ...p, priority: parseInt(e.target.value) || 0 }))} placeholder="数字越大越靠前" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>开始时间</Label>
                <Input type="datetime-local" value={formData.start_time} onChange={(e) => setFormData((p) => ({ ...p, start_time: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>结束时间</Label>
                <Input type="datetime-local" value={formData.end_time} onChange={(e) => setFormData((p) => ({ ...p, end_time: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>可见范围</Label>
              <Select value={formData.brand} onValueChange={(v) => setFormData((p) => ({ ...p, brand: v }))}>
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
              <Label>启用状态</Label>
              <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData((p) => ({ ...p, is_active: c }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? '提交中...' : editingAnnouncement ? '保存' : '发布'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>确定要删除公告「{deletingAnnouncement?.title}」吗？此操作无法撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>{isSubmitting ? '删除中...' : '确认删除'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
