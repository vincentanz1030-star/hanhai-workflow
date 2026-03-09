# 通知中心组件文档

## 组件概述

通知中心组件 (`NotificationCenter`) 是一个综合的通知展示面板，集成在数据概览板块和销售目标板块之间，用于展示项目协同、催促提醒、本周工作安排等各类工作通知。

## 文件位置

- 组件：`src/components/NotificationCenter.tsx`
- API：`src/app/api/notifications/dashboard/route.ts`

## 功能特性

### 1. 多维度通知分类
- **协同请求**：展示各岗位之间的协同合作请求
- **催促提醒**：显示逾期或即将到期的任务提醒
- **本周工作安排**：展示本周重点工作内容
- **项目通知**：项目层面的重要提醒

### 2. 优先级管理
- **紧急 (High)**：红色高亮，需要立即处理
- **重要 (Medium)**：橙色标记，需要关注
- **普通 (Low)**：蓝色标记，常规通知

### 3. 智能过滤和排序
- 全部/协同/催促/周计划标签页切换
- 按优先级和时间自动排序
- 逾期任务特殊标记

### 4. 实时状态显示
- 通知数量统计
- 紧急通知计数和闪烁提醒
- 时间格式化（刚刚、X分钟前、X小时前等）

## Props 接口

```typescript
interface Notification {
  id: string;
  type: 'collaboration' | 'reminder' | 'weekly' | 'project';
  title: string;           // 通知标题
  content: string;         // 通知内容
  priority: 'high' | 'medium' | 'low';
  role?: string;           // 关联岗位
  deadline?: string;       // 截止日期（ISO格式）
  createdAt: string;       // 创建时间（ISO格式）
}

interface NotificationCenterProps {
  collaborations?: Notification[];
  reminders?: Notification[];
  weeklyPlans?: Notification[];
  projectNotifications?: Notification[];
}
```

## 使用示例

### 1. 在页面中使用

```tsx
import { NotificationCenter } from '@/components/NotificationCenter';

function Dashboard() {
  const [notifications, setNotifications] = useState({
    collaborations: [],
    reminders: [],
    weeklyPlans: [],
    projectNotifications: [],
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const response = await fetch('/api/notifications/dashboard');
    const data = await response.json();
    setNotifications({
      collaborations: data.collaborations || [],
      reminders: data.reminders || [],
      weeklyPlans: data.weeklyPlans || [],
      projectNotifications: data.projectNotifications || [],
    });
  };

  return (
    <div>
      {/* 统计卡片 */}
      <div>...</div>

      {/* 通知中心 */}
      <NotificationCenter
        collaborations={notifications.collaborations}
        reminders={notifications.reminders}
        weeklyPlans={notifications.weeklyPlans}
        projectNotifications={notifications.projectNotifications}
      />

      {/* 销售目标 */}
      <div>...</div>
    </div>
  );
}
```

### 2. API 返回数据结构

```json
{
  "collaborations": [
    {
      "id": "collab-123",
      "type": "collaboration",
      "title": "协同请求：产品开发",
      "content": "插画 请求 产品 协助完成产品开发",
      "priority": "high",
      "role": "产品",
      "deadline": "2025-01-20",
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "reminders": [
    {
      "id": "task-456",
      "type": "reminder",
      "title": "任务提醒：设计包装",
      "content": "已催促2次，请尽快推进任务",
      "priority": "high",
      "role": "包装",
      "deadline": "2025-01-18",
      "createdAt": "2025-01-10T08:00:00.000Z"
    }
  ],
  "weeklyPlans": [
    {
      "id": "weekly-789",
      "type": "weekly",
      "title": "本周工作：完成产品框架设计...",
      "content": "完成产品框架设计，包括所有品类结构",
      "priority": "high",
      "role": "产品",
      "deadline": "2025-01-19",
      "createdAt": "2025-01-14T09:00:00.000Z"
    }
  ],
  "projectNotifications": [
    {
      "id": "project-101",
      "type": "project",
      "title": "项目提醒：2025春季新品",
      "content": "销售日期还有3天",
      "priority": "medium",
      "deadline": "2025-01-20",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "all": [...]
}
```

## 通知类型说明

### 1. 协同请求 (collaboration)
**触发条件**：
- 某岗位向其他岗位发起协同请求
- 协同任务状态为 pending 或 in_progress

**包含信息**：
- 请求人和目标岗位
- 任务标题和描述
- 截止日期（可选）
- 优先级

### 2. 催促提醒 (reminder)
**触发条件**：
- 任务逾期或即将到期（3天内）
- 已被催促的任务
- 根据用户岗位过滤

**包含信息**：
- 任务名称和岗位
- 催促次数
- 截止日期和剩余天数
- 逾期状态

### 3. 本周工作安排 (weekly)
**触发条件**：
- 本周的工作计划
- 根据用户岗位过滤
- 优先级为紧急或重要

**包含信息**：
- 工作内容描述
- 关联岗位
- 本周截止日期
- 优先级

### 4. 项目通知 (project)
**触发条件**：
- 项目销售日期即将到期（7天内）
- 项目已逾期
- 项目状态为 pending 或 in_progress

**包含信息**：
- 项目名称
- 销售日期
- 剩余天数或逾期天数
- 优先级

## API 实现细节

### 通知数据获取逻辑

```typescript
// 1. 获取协同合作请求
const { data: collaborations } = await client
  .from('collaboration_tasks')
  .select('*')
  .or(`target_role.in.(${userRoleList.join(',')}),requesting_role.in.(${userRoleList.join(',')})`)
  .in('status', ['pending', 'in_progress'])
  .order('created_at', { ascending: false })
  .limit(10);

// 2. 获取需要催促的任务
const { data: tasks } = await client
  .from('tasks')
  .select('*')
  .or(`role.in.(${userRoleList.join(',')})`)
  .not('status', 'eq', 'completed')
  .order('estimated_completion_date', { ascending: true })
  .limit(10);

// 计算优先级
- 逾期任务：high
- 3天内到期：medium
- 已催促任务：high

// 3. 获取本周工作安排
const { data: weeklyPlans } = await client
  .from('weekly_work_plans')
  .select('*')
  .or(`position.in.(${userRoleList.join(',')})`)
  .gte('week_start', weekStartStr)
  .lte('week_end', weekEndStr)
  .order('created_at', { ascending: false })
  .limit(10);

// 4. 获取项目相关通知
const { data: projects } = await client
  .from('projects')
  .select('*')
  .in('status', ['pending', 'in_progress'])
  .order('sales_date', { ascending: true })
  .limit(5);

// 计算优先级
- 已逾期：high
- 7天内到期：medium

// 5. 合并并排序
const allNotifications = [
  ...collaborationNotifications,
  ...reminderNotifications,
  ...weeklyPlanNotifications,
  ...projectNotifications,
].sort((a, b) => {
  // 优先级排序：high > medium > low
  // 同优先级按时间倒序
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return priorityOrder[a.priority] - priorityOrder[b.priority] || 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}).slice(0, 20); // 最多返回20条
```

## 样式定制

### 优先级颜色

```css
/* 紧急 - 红色 */
.priority-high {
  border-color: red;
  background-color: rgb(254 226 226);
  dark: rgb(127 29 29 / 0.1);
}

/* 重要 - 橙色 */
.priority-medium {
  border-color: orange;
  background-color: rgb(255 237 213);
  dark: rgb(124 45 18 / 0.1);
}

/* 普通 - 蓝色 */
.priority-low {
  border-color: blue;
  background-color: rgb(219 234 254);
  dark: rgb(30 58 138 / 0.1);
}
```

### 逾期标记

- 逾期任务：橙色边框 + "已逾期" Badge
- 正常任务：根据优先级显示

## 集成位置

在主页面 (`src/app/page.tsx`) 的数据概览板块中：

```tsx
{/* 数据看板 */}
<TabsContent value="dashboard" className="space-y-6">
  
  {/* 1. 统计卡片 */}
  <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-5">
    {/* ... 统计卡片 ... */}
  </div>

  {/* 2. 通知中心 */}
  <NotificationCenter
    collaborations={notifications.collaborations}
    reminders={notifications.reminders}
    weeklyPlans={notifications.weeklyPlans}
    projectNotifications={notifications.projectNotifications}
  />

  {/* 3. 销售目标 */}
  <Card>
    {/* ... 销售目标 ... */}
  </Card>

</TabsContent>
```

## 最佳实践

### 1. 数据刷新
- 页面加载时自动获取通知
- 品牌筛选时重新加载通知
- 建议配合 SSE 实时推送

### 2. 性能优化
- 限制返回数量（每类最多10条，总计20条）
- 按优先级和时间排序，优先展示重要通知
- 使用卡片懒加载

### 3. 用户体验
- 空状态提示
- 紧急通知闪烁提醒
- 时间格式化显示
- 支持滚动查看更多

### 4. 权限控制
- 根据用户岗位过滤通知
- 未登录用户不显示通知
- 管理员可查看所有通知

## 扩展建议

### 1. 点击跳转
```tsx
onClick={(notification) => {
  switch (notification.type) {
    case 'collaboration':
      navigate(`/collaboration/${notification.id}`);
      break;
    case 'reminder':
      navigate(`/tasks/${notification.id}`);
      break;
    case 'weekly':
      navigate(`/weekly-work/${notification.id}`);
      break;
    case 'project':
      navigate(`/projects/${notification.id}`);
      break;
  }
}}
```

### 2. 标记已读
```tsx
// 点击通知后标记为已读
const handleMarkAsRead = async (notificationId: string) => {
  await fetch(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
  });
  // 重新加载通知
  loadNotifications();
};
```

### 3. 批量操作
```tsx
// 全部标记已读
const handleMarkAllAsRead = async () => {
  await fetch('/api/notifications/mark-all-read', {
    method: 'POST',
  });
  loadNotifications();
};
```

### 4. 通知设置
```tsx
// 用户自定义通知偏好
const notificationSettings = {
  enableCollaboration: true,
  enableReminders: true,
  enableWeeklyPlans: true,
  enableProjectNotifications: true,
  priorityFilter: ['high', 'medium'],
};
```

## 相关文件

- `src/components/NotificationCenter.tsx` - 通知中心组件
- `src/app/api/notifications/dashboard/route.ts` - 通知数据 API
- `src/app/page.tsx` - 主页面集成
- `PHASE3-COMPONENTS-GUIDE.md` - 第三批组件文档

## 注意事项

1. **数据权限**：API 根据用户岗位过滤通知，确保用户只能看到与自己相关的通知
2. **性能考虑**：限制返回数量，避免数据过多影响性能
3. **实时性**：建议配合 SSE 实现实时推送，减少轮询频率
4. **错误处理**：网络错误时显示空状态，不影响其他功能
5. **时间计算**：所有时间计算都在服务端完成，避免客户端时区问题

## 测试场景

### 1. 空状态测试
- 无协同请求
- 无催促提醒
- 无本周工作安排
- 无项目通知

### 2. 优先级测试
- 紧急通知应该排在最前面
- 同优先级按时间倒序
- 逾期任务特殊标记

### 3. 分类过滤测试
- 点击不同标签页显示对应通知
- 全部标签页显示所有通知
- 通知数量统计正确

### 4. 响应式测试
- 移动端布局正常
- 文本不溢出
- 滚动流畅
