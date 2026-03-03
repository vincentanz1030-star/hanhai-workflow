# 第一批UI组件使用指南

本指南说明如何在项目中使用第一批完成的4个UI组件。

---

## 1. TaskAssigneeSelect - 任务分配选择器

### 用途
在项目或任务中选择分配人。

### 使用方法

```tsx
import { TaskAssigneeSelect } from '@/components/TaskAssigneeSelect';

function ProjectForm() {
  const [assignee, setAssignee] = useState('');
  const [brand, setBrand] = useState('he_zhe');

  return (
    <TaskAssigneeSelect
      value={assignee}
      onChange={setAssignee}
      brand={brand}
      disabled={false}
      placeholder="选择分配人"
    />
  );
}
```

### Props
| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| value | string | - | 选中的用户ID |
| onChange | (userId: string) => void | - | 选择回调 |
| brand | string | - | 品牌过滤（可选） |
| disabled | boolean | false | 是否禁用 |
| placeholder | string | "选择分配人" | 占位文本 |

### 集成位置
- ✅ 项目创建/编辑对话框
- ✅ 任务分配表单
- ⏳ 协同合作请求表单

---

## 2. TaskComments - 任务评论组件

### 用途
显示和管理任务的评论。

### 使用方法

```tsx
import { TaskComments } from '@/components/TaskComments';

function ProjectDetail({ projectId }) {
  return (
    <TaskComments 
      taskId={projectId} 
      readOnly={false} 
    />
  );
}
```

### Props
| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| taskId | string | - | 任务ID（必填） |
| readOnly | boolean | false | 是否只读 |

### 功能
- ✅ 查看评论列表
- ✅ 发表新评论
- ✅ 显示发布时间（相对时间）
- ✅ 显示用户头像
- ✅ 只读模式（隐藏输入框）

### 集成位置
- ✅ 项目详情页
- ⏳ 任务详情卡片
- ⏳ 协同合作详情

---

## 3. DataExport - 数据导出组件

### 用途
导出数据为CSV格式。

### 使用方法

```tsx
import { DataExport } from '@/components/DataExport';

function ProjectList() {
  const [brandFilter, setBrandFilter] = useState('all');

  return (
    <div className="flex justify-between items-center">
      <h2>项目列表</h2>
      <DataExport 
        dataType="projects"
        brand={brandFilter}
        buttonVariant="outline"
        buttonSize="sm"
      />
    </div>
  );
}
```

### Props
| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| dataType | 'projects' \| 'tasks' \| 'sales_targets' | - | 数据类型（必填） |
| brand | string | 'all' | 默认品牌过滤 |
| buttonVariant | 'default' \| 'outline' \| 'ghost' \| 'link' | 'outline' | 按钮样式 |
| buttonSize | 'default' \| 'sm' \| 'lg' \| 'icon' | 'sm' | 按钮大小 |

### 功能
- ✅ 导出项目数据
- ✅ 导出任务数据
- ✅ 导出销售目标数据
- ✅ 品牌过滤
- ✅ 日期范围过滤
- ✅ 自动下载CSV文件

### 集成位置
- ✅ 项目列表页
- ✅ 任务列表页
- ✅ 销售目标页
- ⏳ 报表页面

---

## 4. AuditLogsViewer - 操作日志查看器

### 用途
查看系统的操作审计日志。

### 使用方法

```tsx
import { AuditLogsViewer } from '@/components/AuditLogsViewer';

export default function AdminLogsPage() {
  return (
    <div>
      <h1>操作日志</h1>
      <AuditLogsViewer />
    </div>
  );
}
```

### 功能
- ✅ 查看所有操作日志
- ✅ 按操作类型过滤
- ✅ 按资源类型过滤
- ✅ 按用户ID过滤
- ✅ 查看操作详情
- ✅ 分页功能
- ✅ 统计信息

### 集成位置
- ✅ 管理后台 `/admin`
- ⏳ 用户个人中心
- ⏳ 审计报告页面

---

## 集成示例

### 在项目列表页添加导出按钮

```tsx
// src/app/page.tsx

import { DataExport } from '@/components/DataExport';

// 在项目列表的卡片头部
<CardHeader>
  <div className="flex items-center justify-between">
    <div>
      <CardTitle>项目列表</CardTitle>
      <CardDescription>管理所有项目</CardDescription>
    </div>
    <DataExport dataType="projects" brand={brandFilter} />
  </div>
</CardHeader>
```

### 在项目详情添加评论

```tsx
// src/app/projects/[id]/page.tsx

import { TaskComments } from '@/components/TaskComments';

// 在项目详情底部
<div className="mt-6">
  <TaskComments taskId={projectId} />
</div>
```

### 在项目编辑对话框添加分配人选择

```tsx
// src/app/page.tsx

import { TaskAssigneeSelect } from '@/components/TaskAssigneeSelect';

// 在项目创建/编辑对话框中
<div className="grid gap-2">
  <Label>分配人</Label>
  <TaskAssigneeSelect 
    value={newProject.assignee}
    onChange={(userId) => setNewProject({ ...newProject, assignee: userId })}
    brand={newProject.brand}
  />
</div>
```

---

## API端点

### 相关API
- `GET /api/users/list` - 获取用户列表（用于分配人选择）
- `GET /api/tasks/[taskId]/comments` - 获取任务评论
- `POST /api/tasks/[taskId]/comments` - 创建任务评论
- `POST /api/export` - 导出数据
- `GET /api/audit-logs` - 获取审计日志

---

## 注意事项

1. **权限控制**
   - AuditLogsViewer 仅管理员可见
   - DataExport 遵循品牌隔离规则
   - TaskComments 遵循项目权限

2. **性能优化**
   - 评论列表支持虚拟滚动（大数据量时建议）
   - 审计日志默认20条/页
   - 导出功能建议添加异步处理

3. **用户体验**
   - 所有组件支持加载状态
   - 错误处理已内置
   - 空状态提示友好

---

## 下一步

这些组件已经可以直接使用。建议按以下顺序集成：

1. ✅ 在管理后台使用 AuditLogsViewer
2. ⏳ 在项目列表添加 DataExport
3. ⏳ 在项目详情添加 TaskComments
4. ⏳ 在项目编辑添加 TaskAssigneeSelect

---

生成时间：2026-03-03
版本：v1.0.0
