'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  MessageSquare
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'collaboration' | 'reminder' | 'weekly' | 'project';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  role?: string;
  deadline?: string;
  createdAt: string;
}

interface NotificationCenterProps {
  collaborations?: Notification[];
  reminders?: Notification[];
  weeklyPlans?: Notification[];
  projectNotifications?: Notification[];
}

export function NotificationCenter({
  collaborations = [],
  reminders = [],
  weeklyPlans = [],
  projectNotifications = [],
}: NotificationCenterProps) {
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

  const totalNotifications = collaborations.length + reminders.length + weeklyPlans.length + projectNotifications.length;
  const highPriorityCount = [...collaborations, ...reminders, ...weeklyPlans, ...projectNotifications].filter(n => n.priority === 'high').length;

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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              工作通知中心
              {totalNotifications > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {totalNotifications}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              项目协同、催促提醒、本周工作安排等通知
            </CardDescription>
          </div>
          {highPriorityCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {highPriorityCount}紧急
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {totalNotifications === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无通知</p>
            <p className="text-xs mt-2">所有工作进展顺利</p>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="all" className="text-xs">
                全部
                <Badge variant="secondary" className="ml-1 text-xs">
                  {totalNotifications}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="collaboration" className="text-xs">
                协同
                <Badge variant="secondary" className="ml-1 text-xs">
                  {collaborations.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="reminder" className="text-xs">
                催促
                <Badge variant="secondary" className="ml-1 text-xs">
                  {reminders.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs">
                周计划
                <Badge variant="secondary" className="ml-1 text-xs">
                  {weeklyPlans.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="project" className="text-xs">
                项目
                <Badge variant="secondary" className="ml-1 text-xs">
                  {projectNotifications.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 max-h-[400px] overflow-y-auto">
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
            </TabsContent>

            <TabsContent value="collaboration" className="max-h-[400px] overflow-y-auto">
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

            <TabsContent value="reminder" className="max-h-[400px] overflow-y-auto">
              {reminders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无催促提醒</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reminders.map(renderNotificationItem)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="weekly" className="max-h-[400px] overflow-y-auto">
              {weeklyPlans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无本周工作安排</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {weeklyPlans.map(renderNotificationItem)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="project" className="max-h-[400px] overflow-y-auto">
              {projectNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无项目通知</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {projectNotifications.map(renderNotificationItem)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
