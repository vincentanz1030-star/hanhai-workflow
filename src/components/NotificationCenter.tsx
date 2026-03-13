'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Users, 
  AlertCircle, 
  Calendar, 
  Clock,
  CheckCircle,
  Megaphone,
  Info,
  AlertTriangle,
  XCircle,
  Plus,
  Pencil,
  Trash2,
  FileText,
  ClipboardCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

// 公告接口
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

interface Notification {
  id: string;
  type: 'collaboration' | 'reminder' | 'weekly' | 'project' | 'approval' | 'task' | 'campaign' | 'campaign_task';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  role?: string;
  deadline?: string;
  createdAt: string;
  projectId?: string;
  taskId?: string;
  collaborationId?: string;
  approvalId?: string;
  campaignId?: string;
  campaignTaskId?: string;
  feedbackId?: string;
}

interface NotificationCenterProps {
  collaborations?: Notification[];
  reminders?: Notification[];
  weeklyPlans?: Notification[];
  projectNotifications?: Notification[];
  approvalNotifications?: Notification[];
  isAdmin?: boolean;
  userBrand?: string;
}

// 公告类型配置
const announcementTypeConfig = {
  info: { icon: Info, bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600', label: '通知' },
  warning: { icon: AlertTriangle, bgColor: 'bg-gradient-to-br from-amber-500 to-orange-500', label: '警告' },
  success: { icon: CheckCircle, bgColor: 'bg-gradient-to-br from-emerald-500 to-green-500', label: '成功' },
  error: { icon: XCircle, bgColor: 'bg-gradient-to-br from-red-500 to-rose-500', label: '紧急' },
};

export default function NotificationCenter({
  collaborations = [],
  reminders = [],
  weeklyPlans = [],
  projectNotifications = [],
  approvalNotifications = [],
  isAdmin = false,
  userBrand = 'all',
}: NotificationCenterProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // 公告相关状态
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  
  // 对话框状态
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    priority: 1,
  });
  
  // 预览状态
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewAnnouncement, setPreviewAnnouncement] = useState<Announcement | null>(null);
  
  // 读取状态存储
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
    // 从本地存储读取已读公告ID
    const storedReadIds = localStorage.getItem('readAnnouncementIds');
    if (storedReadIds) {
      setReadAnnouncementIds(new Set(JSON.parse(storedReadIds)));
    }
  }, []);

  // 加载公告
  const loadAnnouncements = useCallback(async () => {
    try {
      setIsLoadingAnnouncements(true);
      const response = await fetch('/api/announcements');
      const data = await response.json();
      if (data.success && data.announcements) {
        // 根据品牌过滤
        const filtered = data.announcements.filter((a: Announcement) => 
          a.brand === 'all' || a.brand === userBrand || userBrand === 'all'
        );
        setAnnouncements(filtered.map((a: Announcement) => ({
          ...a,
          isRead: readAnnouncementIds.has(a.id)
        })));
      }
    } catch (error) {
      console.error('加载公告失败:', error);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  }, [userBrand, readAnnouncementIds]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // 标记公告为已读
  const markAsRead = (announcementId: string) => {
    const newReadIds = new Set(readAnnouncementIds);
    newReadIds.add(announcementId);
    setReadAnnouncementIds(newReadIds);
    localStorage.setItem('readAnnouncementIds', JSON.stringify([...newReadIds]));
    setAnnouncements(prev => prev.map(a => 
      a.id === announcementId ? { ...a, isRead: true } : a
    ));
  };

  // 未读公告数
  const unreadAnnouncements = announcements.filter(a => !a.isRead).length;

  // 通知统计
  const totalNotifications = collaborations.length + reminders.length + weeklyPlans.length + projectNotifications.length + approvalNotifications.length;
  const highPriorityCount = [...collaborations, ...reminders, ...weeklyPlans, ...projectNotifications, ...approvalNotifications]
    .filter(n => n.priority === 'high').length;

  // 获取通知图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'collaboration': return <Users className="h-4 w-4" />;
      case 'reminder': return <Clock className="h-4 w-4" />;
      case 'weekly': return <Calendar className="h-4 w-4" />;
      case 'project': return <FileText className="h-4 w-4" />;
      case 'approval': return <ClipboardCheck className="h-4 w-4" />;
      case 'task': return <CheckCircle className="h-4 w-4" />;
      case 'campaign': return <Megaphone className="h-4 w-4" />;
      case 'campaign_task': return <CheckCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  };

  // 打开公告预览
  const openAnnouncementPreview = (announcement: Announcement) => {
    markAsRead(announcement.id);
    setPreviewAnnouncement(announcement);
    setIsPreviewOpen(true);
  };

  // 添加公告
  const handleAddAnnouncement = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({ title: '', content: '', type: 'info', priority: 1 });
    setIsEditDialogOpen(true);
  };

  // 编辑公告
  const handleEditAnnouncement = (announcement: Announcement, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingAnnouncement(announcement);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content || '',
      type: announcement.type,
      priority: announcement.priority,
    });
    setIsEditDialogOpen(true);
  };

  // 保存公告
  const handleSaveAnnouncement = async () => {
    try {
      const url = editingAnnouncement 
        ? `/api/announcements/${editingAnnouncement.id}`
        : '/api/announcements';
      const method = editingAnnouncement ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...announcementForm,
          brand: userBrand === 'all' ? 'all' : userBrand,
          is_active: true,
        }),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        loadAnnouncements();
      }
    } catch (error) {
      console.error('保存公告失败:', error);
    }
  };

  // 删除公告
  const handleDeleteAnnouncement = async () => {
    if (!deletingAnnouncement) return;
    try {
      const response = await fetch(`/api/announcements/${deletingAnnouncement.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setDeletingAnnouncement(null);
        loadAnnouncements();
      }
    } catch (error) {
      console.error('删除公告失败:', error);
    }
  };

  // 点击通知
  const handleNotificationClick = (notification: Notification) => {
    if (notification.projectId) {
      router.push(`/?tab=projects&project=${notification.projectId}`);
    } else if (notification.taskId) {
      router.push(`/?tab=tasks&task=${notification.taskId}`);
    }
  };

  if (!mounted) {
    return (
      <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-muted/20">
        <div className="h-[280px]" />
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-muted/20">
      <div className="grid grid-cols-2 divide-x divide-border/50">
        {/* 左侧：公告区 */}
        <div className="flex flex-col">
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Megaphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-semibold text-base">公告</span>
                {unreadAnnouncements > 0 && (
                  <Badge variant="destructive" className="ml-2 text-[10px] h-4 px-1.5">
                    {unreadAnnouncements}
                  </Badge>
                )}
              </div>
            </div>
            {isAdmin && (
              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={handleAddAnnouncement}>
                <Plus className="h-3.5 w-3.5" />发布
              </Button>
            )}
          </div>
          
          {/* 内容区 - 固定高度 */}
          <ScrollArea className="h-[220px]">
            {isLoadingAnnouncements ? (
              <div className="flex items-center justify-center h-full">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                <Megaphone className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">暂无公告</p>
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                {announcements.map((announcement) => {
                  const config = announcementTypeConfig[announcement.type];
                  const IconComponent = config.icon;
                  return (
                    <div 
                      key={announcement.id} 
                      className={cn(
                        'p-2.5 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors group',
                        !announcement.isRead && 'bg-primary/5'
                      )}
                      onClick={() => openAnnouncementPreview(announcement)}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={cn('shrink-0 h-7 w-7 rounded-lg flex items-center justify-center', config.bgColor)}>
                          <IconComponent className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={cn('text-sm font-medium truncate', !announcement.isRead && 'font-semibold')}>
                              {announcement.title}
                            </span>
                            {!announcement.isRead && (
                              <Badge variant="secondary" className="text-[9px] h-3.5 px-1 shrink-0">新</Badge>
                            )}
                          </div>
                          {announcement.content && (
                            <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">{announcement.content}</p>
                          )}
                        </div>
                        {isAdmin && (
                          <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => handleEditAnnouncement(announcement, e)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeletingAnnouncement(announcement); setIsDeleteDialogOpen(true); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* 右侧：通知区 */}
        <div className="flex flex-col">
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-semibold text-base">通知</span>
                {totalNotifications > 0 && (
                  <Badge variant="secondary" className="ml-2 text-[10px] h-4 px-1.5">
                    {totalNotifications}
                  </Badge>
                )}
              </div>
            </div>
            {highPriorityCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5 px-2">
                {highPriorityCount} 紧急
              </Badge>
            )}
          </div>
          
          {/* 内容区 - 固定高度 */}
          <ScrollArea className="h-[220px]">
            {totalNotifications === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                <CheckCircle className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">暂无通知</p>
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                {[...collaborations, ...reminders, ...weeklyPlans, ...projectNotifications, ...approvalNotifications]
                  .sort((a, b) => {
                    if (a.priority === 'high' && b.priority !== 'high') return -1;
                    if (a.priority !== 'high' && b.priority === 'high') return 1;
                    return 0;
                  })
                  .map((notification) => {
                    const isOverdue = notification.deadline && new Date(notification.deadline) < new Date();

                    return (
                      <div 
                        key={notification.id} 
                        className={cn(
                          'p-2.5 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors',
                          notification.priority === 'high' && 'bg-destructive/5',
                          isOverdue && notification.priority !== 'high' && 'bg-amber-500/5'
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={cn(
                            'shrink-0 h-7 w-7 rounded-lg flex items-center justify-center',
                            notification.priority === 'high' 
                              ? 'bg-gradient-to-br from-red-500 to-rose-500' 
                              : isOverdue 
                                ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                                : 'bg-gradient-to-br from-slate-400 to-slate-500'
                          )}>
                            <div className="text-white">
                              {getTypeIcon(notification.type)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              <span className="text-sm font-medium truncate">{notification.title}</span>
                              {notification.priority === 'high' && (
                                <Badge variant="destructive" className="text-[9px] h-3.5 px-1">紧急</Badge>
                              )}
                              {isOverdue && (
                                <Badge variant="outline" className="text-[9px] h-3.5 px-1 text-amber-600 border-amber-300">逾期</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{notification.content}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
      
      {/* 公告预览对话框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {previewAnnouncement && (() => {
                const config = announcementTypeConfig[previewAnnouncement.type];
                const IconComponent = config.icon;
                return (
                  <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', config.bgColor)}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                );
              })()}
              <div>
                <DialogTitle className="text-base">{previewAnnouncement?.title}</DialogTitle>
                <DialogDescription>
                  {previewAnnouncement?.created_at && mounted && (
                    <span>{new Date(previewAnnouncement.created_at).toLocaleString('zh-CN')}</span>
                  )}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <div className="py-4 pr-4">
              <p className="text-sm whitespace-pre-wrap">{previewAnnouncement?.content}</p>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-2">
            {isAdmin && previewAnnouncement && (
              <>
                <Button size="sm" variant="outline" onClick={() => { setIsPreviewOpen(false); handleEditAnnouncement(previewAnnouncement); }}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />编辑
                </Button>
                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => { setIsPreviewOpen(false); setDeletingAnnouncement(previewAnnouncement); setIsDeleteDialogOpen(true); }}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />删除
                </Button>
              </>
            )}
            <Button size="sm" onClick={() => setIsPreviewOpen(false)}>关闭</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑公告对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? '编辑公告' : '发布公告'}</DialogTitle>
            <DialogDescription>
              {editingAnnouncement ? '修改公告内容' : '发布新公告通知团队成员'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>标题</Label>
              <Input
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                placeholder="请输入公告标题"
              />
            </div>
            <div className="space-y-2">
              <Label>类型</Label>
              <Select
                value={announcementForm.type}
                onValueChange={(value) => setAnnouncementForm({ ...announcementForm, type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">通知</SelectItem>
                  <SelectItem value="warning">警告</SelectItem>
                  <SelectItem value="success">成功</SelectItem>
                  <SelectItem value="error">紧急</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>内容</Label>
              <Textarea
                value={announcementForm.content}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                placeholder="请输入公告内容"
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)}>取消</Button>
            <Button size="sm" onClick={handleSaveAnnouncement} disabled={!announcementForm.title}>
              {editingAnnouncement ? '保存' : '发布'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除公告「{deletingAnnouncement?.title}」吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteAnnouncement}>删除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
