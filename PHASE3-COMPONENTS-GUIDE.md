# 第三批组件使用文档 - 通知系统优化

## 概述

本批次包含通知系统优化的核心功能，包括SSE实时推送、邮件通知、通知分类和过滤等功能。

## 功能列表

### 1. SSE实时推送系统

**文件路径**:
- API: `src/app/api/sse/notifications/route.ts`
- Hook: `src/hooks/useSSENotifications.ts`

**功能特性**:
- 🔄 基于 Server-Sent Events (SSE) 的实时通知推送
- 🔌 自动重连机制（连接断开后3秒自动重连）
- 💓 心跳检测（每30秒发送一次心跳保持连接）
- 📱 支持浏览器原生通知（需用户授权）
- 🔒 基于用户ID的个性化通知推送

**使用方式**:

#### 1.1 使用 Hook 接收实时通知

```tsx
'use client';

import { useSSENotifications } from '@/hooks/useSSENotifications';

function Dashboard() {
  const userId = 'user-123'; // 从认证系统获取
  
  const {
    notifications,
    unreadCount,
    isConnected,
    error,
    connect,
    disconnect,
  } = useSSENotifications(userId);

  return (
    <div>
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        通知 ({unreadCount})
        {isConnected ? (
          <Badge variant="outline">已连接</Badge>
        ) : (
          <Badge variant="destructive">未连接</Badge>
        )}
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div className="mt-4">
        {notifications.map(notification => (
          <div key={notification.id}>
            <h3>{notification.title}</h3>
            <p>{notification.content}</p>
            <small>{notification.createdAt}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 1.2 创建通知（在任务更新时触发）

```typescript
// 在 API 路由中创建通知
import { createClient } from '@supabase/supabase-js';

async function createNotification(userId: string, type: string, title: string, content: string) {
  const client = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data, error } = await client
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      content,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error('创建通知失败:', error);
    return null;
  }

  return data;
}

// 示例：任务分配时通知
app.post('/api/tasks/:id/assign', async (req, res) => {
  const { assigneeId } = req.body;
  
  // 创建通知
  await createNotification(
    assigneeId,
    'task_assigned',
    '新任务分配',
    '您有一个新任务已分配给您'
  );

  res.json({ success: true });
});
```

**注意事项**:
- SSE 连接需要保持页面打开状态
- 移动端浏览器可能对 SSE 支持有限
- 浏览器通知需要用户授权（首次使用会弹出请求）
- 心跳检测确保连接活跃状态

---

### 2. 邮件通知功能

**文件路径**:
- API: `src/app/api/notifications/send-email/route.ts`
- 模板: `src/lib/email-templates.ts`

**功能特性**:
- 📧 支持多种通知类型的邮件模板
- 🎨 精美的HTML邮件模板设计
- 📱 响应式邮件布局，支持移动设备
- 🔧 支持自定义发件人和主题
- 🔄 模拟发送模式（用于测试）

**使用方式**:

#### 2.1 使用邮件模板

```typescript
import { 
  getTaskAssignmentTemplate,
  getTaskReminderTemplate,
  getTaskOverdueTemplate,
  getTaskCompletedTemplate,
  getCollaborationRequestTemplate,
  getWeeklyReportTemplate,
} from '@/lib/email-templates';

// 任务分配通知
const assignmentEmail = getTaskAssignmentTemplate({
  taskName: '设计新产品包装',
  projectName: '2025春季新品开发',
  assigneeName: '张三',
  dueDate: '2025-01-20',
  description: '设计一套具有现代感的包装方案',
});

// 发送邮件
await fetch('/api/notifications/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: ['zhangsan@example.com'],
    subject: assignmentEmail.subject,
    htmlContent: assignmentEmail.htmlContent,
    textContent: assignmentEmail.textContent,
  }),
});
```

#### 2.2 任务自动提醒

```typescript
// 定时任务：每天检查即将到期的任务
async function checkDueTasks() {
  const client = createClient(supabaseUrl, supabaseAnonKey);
  
  // 查询3天内到期的任务
  const { data: tasks } = await client
    .from('tasks')
    .select('*')
    .eq('status', 'in_progress')
    .lt('estimated_completion_date', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString());

  for (const task of tasks) {
    const dueDate = new Date(task.estimated_completion_date);
    const remainingDays = Math.ceil((dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    
    // 生成提醒邮件
    const reminderEmail = getTaskReminderTemplate({
      taskName: task.task_name,
      projectName: task.project_name,
      assigneeName: task.assignee_name,
      dueDate: task.estimated_completion_date,
      remainingDays,
    });
    
    // 发送邮件
    await fetch('/api/notifications/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: [task.assignee_email],
        subject: reminderEmail.subject,
        htmlContent: reminderEmail.htmlContent,
        textContent: reminderEmail.textContent,
      }),
    });
  }
}
```

#### 2.3 测试邮件发送

```bash
# 发送测试邮件
GET /api/notifications/send-email?email=test@example.com
```

**邮件模板类型**:

| 模板函数 | 用途 | 触发时机 |
|---------|------|---------|
| `getTaskAssignmentTemplate` | 任务分配 | 新任务创建并分配时 |
| `getTaskReminderTemplate` | 任务提醒 | 任务即将到期（3天内） |
| `getTaskOverdueTemplate` | 任务逾期 | 任务超过截止日期 |
| `getTaskCompletedTemplate` | 任务完成 | 任务标记为完成时 |
| `getCollaborationRequestTemplate` | 协同请求 | 发起协同合作时 |
| `getWeeklyReportTemplate` | 周报 | 每周自动发送工作总结 |

**环境变量配置**:

```env
# 邮件服务开关（默认为 false，模拟发送）
EMAIL_ENABLED=false

# SendGrid 配置（如果使用 SendGrid）
SENDGRID_API_KEY=your_sendgrid_api_key

# 发件人配置
EMAIL_FROM=noreply@example.com

# 应用 URL（用于邮件中的链接）
NEXT_PUBLIC_APP_URL=http://localhost:5000
```

**注意事项**:
- 默认情况下邮件服务为模拟模式，只记录日志不实际发送
- 生产环境需要配置真实的邮件服务（如 SendGrid、Mailgun）
- 邮件发送是异步的，不会阻塞主流程
- 建议设置频率限制，避免发送过多邮件

---

### 3. 通知分类和过滤UI组件

**文件路径**: `src/components/NotificationFilters.tsx`

**功能特性**:
- 📋 全部/未读/已读分类
- 🔍 实时搜索过滤
- ✅ 单个/批量标记已读
- 🗑️ 删除/清空通知
- 🎨 通知类型图标和颜色区分
- 📊 统计未读通知数量

**Props 接口**:

```typescript
interface NotificationFiltersProps {
  notifications: Notification[];      // 通知列表
  onMarkAsRead?: (notificationId: string) => void;  // 标记已读
  onMarkAllAsRead?: () => void;       // 全部标记已读
  onDelete?: (notificationId: string) => void;      // 删除通知
  onClearAll?: () => void;            // 清空所有通知
}

interface Notification {
  id: string;
  userId: string;
  type: string;      // 通知类型
  title: string;     // 通知标题
  content: string;   // 通知内容
  isRead: boolean;   // 是否已读
  readAt?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}
```

**使用示例**:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { NotificationFilters } from '@/components/NotificationFilters';

function NotificationPage() {
  const [notifications, setNotifications] = useState([]);

  // 加载通知列表
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const response = await fetch('/api/notifications');
    const data = await response.json();
    setNotifications(data.notifications || []);
  };

  // 标记已读
  const handleMarkAsRead = async (notificationId: string) => {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
    });

    if (response.ok) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        )
      );
    }
  };

  // 全部标记已读
  const handleMarkAllAsRead = async () => {
    const response = await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
    });

    if (response.ok) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
    }
  };

  // 删除通知
  const handleDelete = async (notificationId: string) => {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  };

  // 清空通知
  const handleClearAll = async () => {
    const response = await fetch('/api/notifications/clear', {
      method: 'DELETE',
    });

    if (response.ok) {
      setNotifications([]);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">通知中心</h1>
      
      <NotificationFilters
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDelete={handleDelete}
        onClearAll={handleClearAll}
      />
    </div>
  );
}
```

**通知类型说明**:

| 类型 | 标签 | 图标 | 颜色 | 用途 |
|------|------|------|------|------|
| `task_assigned` | 任务分配 | ✓ | 蓝色 | 新任务分配给用户 |
| `task_updated` | 任务更新 | ⏰ | 黄色 | 任务状态变更 |
| `task_completed` | 任务完成 | ✓ | 绿色 | 任务标记为完成 |
| `task_reminder` | 任务提醒 | ⚠️ | 橙色 | 任务即将到期 |
| `task_overdue` | 任务逾期 | ✗ | 红色 | 任务已逾期 |
| `collaboration` | 协同请求 | 🔔 | 紫色 | 协同合作请求 |
| `system` | 系统通知 | 🔧 | 灰色 | 系统级通知 |

---

## 集成示例

### 完整的通知系统集成

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useSSENotifications } from '@/hooks/useSSENotifications';
import { NotificationFilters } from '@/components/NotificationFilters';
import { NotificationBell } from '@/components/NotificationBell';

function Layout() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const userId = 'user-123'; // 从认证系统获取

  // 使用 SSE 实时接收通知
  const {
    notifications,
    unreadCount,
    isConnected,
  } = useSSENotifications(userId);

  // 标记已读
  const handleMarkAsRead = async (notificationId: string) => {
    await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  };

  // 全部标记已读
  const handleMarkAllAsRead = async () => {
    await fetch('/api/notifications/mark-all-read', {
      method: 'POST',
    });
  };

  return (
    <div className="min-h-screen">
      {/* 顶部导航栏 */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">瀚海集团工作管理系统</h1>
          
          {/* 通知铃铛 */}
          <div className="relative">
            <NotificationBell
              unreadCount={unreadCount}
              onClick={() => setIsNotificationOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* 通知抽屉/弹窗 */}
      <Dialog open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>通知中心</DialogTitle>
          </DialogHeader>
          
          <NotificationFilters
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
          />
        </DialogContent>
      </Dialog>

      {/* 主内容 */}
      <main>
        {/* 页面内容 */}
      </main>
    </div>
  );
}
```

---

## API 路由说明

### SSE 通知推送

**端点**: `GET /api/sse/notifications?userId={userId}`

**参数**:
- `userId`: 用户ID（必需）

**响应格式**:
```
Content-Type: text/event-stream

data: {"type":"connected","message":"SSE连接成功"}

data: {"type":"initial","data":[...],"unreadCount":3}

data: {"type":"notification","data":{...}}

: heartbeat
```

### 发送邮件通知

**端点**: `POST /api/notifications/send-email`

**请求体**:
```json
{
  "to": ["user@example.com"],
  "subject": "邮件主题",
  "htmlContent": "<html>...</html>",
  "textContent": "纯文本内容"
}
```

**响应**:
```json
{
  "success": true,
  "message": "邮件发送成功",
  "details": {
    "to": ["user@example.com"],
    "subject": "邮件主题",
    "timestamp": "2025-01-15T10:30:00.000Z"
  }
}
```

### 测试邮件发送

**端点**: `GET /api/notifications/send-email?email={email}`

**参数**:
- `email`: 测试邮箱地址（必需）

---

## 最佳实践

### 1. 实时通知与邮件通知结合

```typescript
// 创建通知时，同时发送邮件
async function notifyUser(userId: string, type: string, title: string, content: string) {
  // 1. 创建数据库通知
  const notification = await createNotification(userId, type, title, content);

  // 2. 获取用户邮箱
  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();

  // 3. 发送邮件通知（仅对重要通知）
  if (user?.email && isImportantNotification(type)) {
    await fetch('/api/notifications/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: [user.email],
        subject: title,
        htmlContent: generateEmailContent(title, content),
      }),
    });
  }

  return notification;
}
```

### 2. 通知频率控制

```typescript
// 避免发送过多相同类型的通知
const notificationCache = new Map<string, { lastSent: number }>();

function shouldSendNotification(userId: string, type: string, cooldownMinutes: number = 30) {
  const key = `${userId}-${type}`;
  const last = notificationCache.get(key);
  
  if (!last) {
    notificationCache.set(key, { lastSent: Date.now() });
    return true;
  }
  
  const elapsed = Date.now() - last.lastSent;
  return elapsed > cooldownMinutes * 60 * 1000;
}
```

### 3. 通知优先级处理

```typescript
const notificationPriority = {
  task_overdue: 1,
  task_reminder: 2,
  task_assigned: 3,
  task_completed: 4,
  collaboration: 5,
  system: 6,
};

// 按优先级排序显示通知
const sortedNotifications = notifications.sort((a, b) => {
  const priorityA = notificationPriority[a.type] || 999;
  const priorityB = notificationPriority[b.type] || 999;
  return priorityA - priorityB;
});
```

---

## 注意事项

1. **性能考虑**:
   - SSE 连接在页面关闭时自动断开
   - 避免在单个页面同时打开多个 SSE 连接
   - 邮件发送是异步的，不会阻塞主流程

2. **安全性**:
   - 验证用户权限后再发送通知
   - 邮件内容需要过滤敏感信息
   - SSE 连接需要用户认证

3. **兼容性**:
   - SSE 支持所有现代浏览器
   - 旧版浏览器可能需要 polyfill
   - 移动端浏览器对 SSE 支持良好

4. **扩展性**:
   - 支持添加自定义通知类型
   - 邮件模板可自定义样式
   - 通知过滤条件可扩展

---

## 相关文件

- `src/app/api/sse/notifications/route.ts` - SSE 实时推送 API
- `src/hooks/useSSENotifications.ts` - SSE React Hook
- `src/app/api/notifications/send-email/route.ts` - 邮件发送 API
- `src/lib/email-templates.ts` - 邮件模板库
- `src/components/NotificationFilters.tsx` - 通知过滤组件
- `src/components/NotificationBell.tsx` - 通知铃铛组件
- `PHASE1-COMPONENTS-GUIDE.md` - 第一批组件文档
- `PHASE2-COMPONENTS-GUIDE.md` - 第二批组件文档
- `PHASE2-PROGRESS.md` - 第二阶段进度追踪
