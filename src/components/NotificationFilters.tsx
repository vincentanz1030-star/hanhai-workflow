'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Filter,
  Search,
  MoreVertical,
  Trash2,
  Check,
  X,
  XCircle
} from 'lucide-react';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface NotificationFiltersProps {
  notifications: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (notificationId: string) => void;
  onClearAll?: () => void;
}

export function NotificationFilters({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
}: NotificationFiltersProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 获取未读通知数量
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // 过滤通知
  const filteredNotifications = notifications.filter(notification => {
    // 标签页过滤
    if (activeTab === 'unread' && notification.isRead) return false;
    if (activeTab === 'read' && !notification.isRead) return false;

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.content.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // 获取通知类型图标和颜色
  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
      task_assigned: {
        icon: <CheckCircle2 className="h-4 w-4" />,
        color: 'text-blue-600',
      },
      task_updated: {
        icon: <Clock className="h-4 w-4" />,
        color: 'text-yellow-600',
      },
      task_completed: {
        icon: <Check className="h-4 w-4" />,
        color: 'text-green-600',
      },
      task_reminder: {
        icon: <AlertCircle className="h-4 w-4" />,
        color: 'text-orange-600',
      },
      task_overdue: {
        icon: <XCircle className="h-4 w-4" />,
        color: 'text-red-600',
      },
      collaboration: {
        icon: <Bell className="h-4 w-4" />,
        color: 'text-purple-600',
      },
      system: {
        icon: <Filter className="h-4 w-4" />,
        color: 'text-gray-600',
      },
    };

    return iconMap[type] || {
      icon: <Bell className="h-4 w-4" />,
      color: 'text-gray-600',
    };
  };

  // 获取通知类型标签
  const getNotificationTypeLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      task_assigned: '任务分配',
      task_updated: '任务更新',
      task_completed: '任务完成',
      task_reminder: '任务提醒',
      task_overdue: '任务逾期',
      collaboration: '协同请求',
      system: '系统通知',
    };
    return labelMap[type] || type;
  };

  // 格式化时间
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              通知中心
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}条未读
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              查看和管理您的所有通知
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && onMarkAllAsRead && (
              <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                全部标记已读
              </Button>
            )}
            {notifications.length > 0 && onClearAll && (
              <Button variant="outline" size="sm" onClick={onClearAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                清空通知
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 搜索框 */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索通知..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              全部
              <Badge variant="secondary" className="ml-2">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              未读
              <Badge variant="secondary" className="ml-2">
                {unreadCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="read">
              已读
              <Badge variant="secondary" className="ml-2">
                {notifications.length - unreadCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无通知</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const { icon, color } = getNotificationIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                        notification.isRead
                          ? 'bg-muted/30 border-muted'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* 图标 */}
                        <div className={`mt-0.5 ${color}`}>
                          {icon}
                        </div>

                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="font-medium text-sm">
                                    {notification.title}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {getNotificationTypeLabel(notification.type)}
                                  </Badge>
                                  {!notification.isRead && (
                                    <Badge variant="default" className="text-xs h-5 px-1.5">
                                      未读
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {!notification.isRead && onMarkAsRead && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => onMarkAsRead(notification.id)}
                                      title="标记已读"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {onDelete && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-red-600 hover:text-red-700"
                                      onClick={() => onDelete(notification.id)}
                                      title="删除"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.content}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(notification.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
