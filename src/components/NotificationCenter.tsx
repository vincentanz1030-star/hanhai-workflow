'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Users, 
  AlertCircle, 
  Calendar, 
  Clock,
  TrendingUp,
  CheckCircle,
  ChevronRight,
  MessageSquare,
  ClipboardCheck,
  Megaphone,
  Info,
  AlertTriangle,
  XCircle,
  Eye,
  X
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
  // 关联 ID 字段
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
}

export function NotificationCenter({
  collaborations = [],
  reminders = [],
  weeklyPlans = [],
  projectNotifications = [],
  approvalNotifications = [],
}: NotificationCenterProps) {
  const router = useRouter();
  
  // 公告相关状态
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
  const [previewAnnouncement, setPreviewAnnouncement] = useState<Announcement | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // 客户端挂载
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 获取公告
  const fetchAnnouncements = useCallback(async () => {
    try {
      const response = await fetch('/api/announcements?activeOnly=true');
      const result = await response.json();
      if (result.success) {
        setAnnouncements(result.announcements || []);
        setUnreadAnnouncements(result.unreadCount || 0);
      }
    } catch (error) {
      console.error('获取公告失败:', error);
    }
  }, []);
  
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);
  
  // 标记公告已读
  const markAnnouncementAsRead = async (announcementId: string) => {
    try {
      await fetch('/api/announcements/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcementId }),
      });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === announcementId ? { ...a, isRead: true } : a))
      );
      setUnreadAnnouncements((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };
  
  // 公告类型配置
  const announcementTypeConfig = {
    info: { icon: Info, bgColor: 'bg-blue-500', lightBg: 'bg-blue-50 dark:bg-blue-950/30', borderColor: 'border-blue-200 dark:border-blue-800' },
    warning: { icon: AlertTriangle, bgColor: 'bg-amber-500', lightBg: 'bg-amber-50 dark:bg-amber-950/30', borderColor: 'border-amber-200 dark:border-amber-800' },
    success: { icon: CheckCircle, bgColor: 'bg-emerald-500', lightBg: 'bg-emerald-50 dark:bg-emerald-950/30', borderColor: 'border-emerald-200 dark:border-emerald-800' },
    error: { icon: XCircle, bgColor: 'bg-red-500', lightBg: 'bg-red-50 dark:bg-red-950/30', borderColor: 'border-red-200 dark:border-red-800' },
  };
  
  // 打开公告预览
  const openAnnouncementPreview = (announcement: Announcement) => {
    setPreviewAnnouncement(announcement);
    setIsPreviewOpen(true);
    if (!announcement.isRead) {
      markAnnouncementAsRead(announcement.id);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // 构建基础 URL 参数
    const params = new URLSearchParams();

    // 根据通知类型跳转到对应板块，并添加关联 ID
    switch (notification.type) {
      case 'collaboration':
        params.set('tab', 'collaboration');
        params.set('subtab', 'projects');
        if (notification.collaborationId) {
          params.set('openCollaborationId', notification.collaborationId);
        }
        break;
      case 'reminder':
        params.set('tab', 'projects');
        if (notification.projectId) {
          params.set('openProjectId', notification.projectId);
        }
        break;
      case 'weekly':
        params.set('tab', 'timeline');
        break;
      case 'project':
        params.set('tab', 'projects');
        if (notification.projectId) {
          params.set('openProjectId', notification.projectId);
        }
        break;
      case 'approval':
        params.set('tab', 'collaboration');
        params.set('subtab', 'approval');
        if (notification.approvalId) {
          params.set('openApprovalId', notification.approvalId);
        }
        break;
      case 'task':
        params.set('tab', 'projects');
        if (notification.projectId) {
          params.set('openProjectId', notification.projectId);
        }
        if (notification.taskId) {
          params.set('openTaskId', notification.taskId);
        }
        break;
      case 'campaign':
        params.set('tab', 'marketing');
        if (notification.campaignId) {
          params.set('openCampaignId', notification.campaignId);
        }
        break;
      case 'campaign_task':
        params.set('tab', 'marketing');
        if (notification.campaignTaskId) {
          params.set('openCampaignTaskId', notification.campaignTaskId);
        }
        break;
      default:
        break;
    }

    // 跳转到对应的 URL
    const url = params.toString() ? `/?${params.toString()}` : '/';
    router.push(url);
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500 text-white';
      case 'medium':
        return 'bg-orange-500 text-white';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'collaboration':
        return <Users className="h-4 w-4" />;
      case 'reminder':
        return <AlertCircle className="h-4 w-4" />;
      case 'weekly':
        return <Calendar className="h-4 w-4" />;
      case 'project':
        return <TrendingUp className="h-4 w-4" />;
      case 'approval':
        return <ClipboardCheck className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const totalNotifications = collaborations.length + reminders.length + weeklyPlans.length + projectNotifications.length + approvalNotifications.length;
  const highPriorityCount = [...collaborations, ...reminders, ...weeklyPlans, ...projectNotifications, ...approvalNotifications].filter(n => n.priority === 'high').length;
  const totalAnnouncements = announcements.length;
  const grandTotal = totalNotifications + totalAnnouncements;

  const renderNotificationItem = (notification: Notification) => {
    const { type, priority } = notification;
    const icon = getTypeIcon(type);
    const priorityColor = getPriorityColor(priority);
    const isOverdue = notification.deadline && new Date(notification.deadline) < new Date();

    return (
      <div 
        key={notification.id} 
        className={`p-3 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer ${
          priority === 'high' ? 'border-red-300 bg-red-50 dark:bg-red-900/10' :
          isOverdue ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/10' :
          'border-transparent bg-muted/30'
        }`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${priority === 'high' ? 'text-red-600' : isOverdue ? 'text-orange-600' : 'text-muted-foreground'}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-medium text-sm truncate">{notification.title}</span>
              {notification.role && (
                <Badge variant="outline" className="text-xs">
                  {notification.role}
                </Badge>
              )}
              <Badge className={`${priorityColor} text-xs`}>
                {priority === 'high' ? '紧急' : priority === 'medium' ? '重要' : '普通'}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  已逾期
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{notification.content}</p>
            {notification.deadline && (
              <div className="flex items-center gap-1 text-xs mt-1">
                <Clock className="h-3 w-3" />
                <span className={isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                  {formatTime(notification.deadline)}截止
                </span>
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {formatTime(notification.createdAt)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-muted/20 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                消息中心
                {grandTotal > 0 && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {grandTotal}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                公告、协同、提醒等通知
              </CardDescription>
            </div>
          </div>
          {(highPriorityCount > 0 || unreadAnnouncements > 0) && (
            <Badge variant="destructive" className="animate-pulse text-xs">
              {highPriorityCount + unreadAnnouncements}条待处理
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {grandTotal === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无通知</p>
            <p className="text-xs mt-2">所有工作进展顺利</p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-5 mb-3 shrink-0">
              <TabsTrigger value="all" className="text-xs px-1">
                全部
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                  {grandTotal}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="announcement" className="text-xs px-1">
                公告
                <Badge variant={unreadAnnouncements > 0 ? "destructive" : "secondary"} className="ml-1 text-xs h-4 px-1">
                  {totalAnnouncements}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="collaboration" className="text-xs px-1">
                协同
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                  {collaborations.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="reminder" className="text-xs px-1">
                提醒
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                  {reminders.length + weeklyPlans.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="project" className="text-xs px-1">
                项目
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                  {projectNotifications.length + approvalNotifications.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 flex-1 overflow-y-auto mt-0">
              {/* 公告优先显示 */}
              {announcements.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <Megaphone className="h-3 w-3" />
                    系统公告 ({announcements.length})
                  </h4>
                  <div className="space-y-2">
                    {announcements.slice(0, 3).map((announcement) => {
                      const config = announcementTypeConfig[announcement.type];
                      const IconComponent = config.icon;
                      return (
                        <div 
                          key={announcement.id} 
                          className={cn(
                            'p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all',
                            announcement.isRead ? 'bg-muted/30 border-transparent' : `${config.lightBg} ${config.borderColor} border`
                          )}
                          onClick={() => openAnnouncementPreview(announcement)}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={cn('p-1.5 rounded-md text-white shrink-0', config.bgColor)}>
                              <IconComponent className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn('font-medium text-sm truncate', !announcement.isRead && 'font-semibold')}>
                                  {announcement.title}
                                </span>
                                {!announcement.isRead && (
                                  <Badge variant="secondary" className="text-[10px] h-4">新</Badge>
                                )}
                              </div>
                              {announcement.content && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{announcement.content}</p>
                              )}
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {mounted ? new Date(announcement.created_at).toLocaleString('zh-CN') : ''}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {reminders.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    催促提醒 ({reminders.length})
                  </h4>
                  <div className="space-y-2">
                    {reminders.map(renderNotificationItem)}
                  </div>
                </div>
              )}
              
              {collaborations.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    项目协同 ({collaborations.length})
                  </h4>
                  <div className="space-y-2">
                    {collaborations.map(renderNotificationItem)}
                  </div>
                </div>
              )}

              {weeklyPlans.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    本周工作安排 ({weeklyPlans.length})
                  </h4>
                  <div className="space-y-2">
                    {weeklyPlans.map(renderNotificationItem)}
                  </div>
                </div>
              )}

              {projectNotifications.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    项目通知 ({projectNotifications.length})
                  </h4>
                  <div className="space-y-2">
                    {projectNotifications.map(renderNotificationItem)}
                  </div>
                </div>
              )}

              {approvalNotifications.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <ClipboardCheck className="h-3 w-3" />
                    审批通知 ({approvalNotifications.length})
                  </h4>
                  <div className="space-y-2">
                    {approvalNotifications.map(renderNotificationItem)}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* 公告标签页 */}
            <TabsContent value="announcement" className="flex-1 overflow-y-auto mt-0">
              {announcements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无公告</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {announcements.map((announcement) => {
                    const config = announcementTypeConfig[announcement.type];
                    const IconComponent = config.icon;
                    return (
                      <div 
                        key={announcement.id} 
                        className={cn(
                          'p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all',
                          announcement.isRead ? 'bg-muted/30 border-transparent' : `${config.lightBg} ${config.borderColor} border`
                        )}
                        onClick={() => openAnnouncementPreview(announcement)}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={cn('p-1.5 rounded-md text-white shrink-0', config.bgColor)}>
                            <IconComponent className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn('font-medium text-sm', !announcement.isRead && 'font-semibold')}>
                                {announcement.title}
                              </span>
                              {!announcement.isRead && (
                                <Badge variant="secondary" className="text-[10px] h-4">新</Badge>
                              )}
                            </div>
                            {announcement.content && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{announcement.content}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {mounted ? new Date(announcement.created_at).toLocaleString('zh-CN') : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="collaboration" className="flex-1 overflow-y-auto mt-0">
              {collaborations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无协同请求</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {collaborations.map(renderNotificationItem)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reminder" className="flex-1 overflow-y-auto mt-0">
              {reminders.length === 0 && weeklyPlans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无提醒</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reminders.map(renderNotificationItem)}
                  {weeklyPlans.map(renderNotificationItem)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="project" className="flex-1 overflow-y-auto mt-0">
              {projectNotifications.length === 0 && approvalNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无项目通知</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectNotifications.map(renderNotificationItem)}
                  {approvalNotifications.map(renderNotificationItem)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      
      {/* 公告预览对话框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {previewAnnouncement && (() => {
                const config = announcementTypeConfig[previewAnnouncement.type];
                const IconComponent = config.icon;
                return (
                  <div className={cn('p-2 rounded-lg text-white', config.bgColor)}>
                    <IconComponent className="h-5 w-5" />
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
          <div className="py-4">
            <p className="text-sm whitespace-pre-wrap">{previewAnnouncement?.content}</p>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setIsPreviewOpen(false)}>关闭</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
