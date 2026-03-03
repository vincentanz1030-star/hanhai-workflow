# 第二批组件使用文档 - 数据可视化增强

## 概述

本批次包含4个核心数据可视化组件，用于增强项目管理和数据分析能力。

## 组件列表

### 1. ProjectGanttChart - 项目甘特图

**文件路径**: `src/components/ProjectGanttChart.tsx`

**功能特性**:
- 📊 可视化展示项目任务时间线和依赖关系
- 🎯 支持缩放控制（50% - 200%）
- 📍 任务悬停显示详细信息
- 🎨 基于任务状态的彩色编码
- 📅 自动计算日期范围和时间轴

**Props 接口**:
```typescript
interface GanttTask {
  id: string;
  name: string;          // 任务名称
  startDate: string;     // 开始日期 (ISO格式)
  endDate: string;       // 结束日期 (ISO格式)
  progress: number;      // 进度百分比 (0-100)
  status: string;        // 状态: pending | in_progress | completed | delayed
  role?: string;         // 岗位名称
  dependencies?: string[]; // 依赖的任务ID列表
}

interface ProjectGanttChartProps {
  tasks: GanttTask[];
  projectName?: string;  // 项目名称（可选）
}
```

**使用示例**:
```tsx
import { ProjectGanttChart } from '@/components/ProjectGanttChart';

const tasks = [
  {
    id: '1',
    name: '插画设计',
    startDate: '2025-01-15',
    endDate: '2025-01-20',
    progress: 80,
    status: 'in_progress',
    role: '插画',
    dependencies: []
  },
  {
    id: '2',
    name: '产品开发',
    startDate: '2025-01-18',
    endDate: '2025-01-25',
    progress: 40,
    status: 'in_progress',
    role: '产品',
    dependencies: ['1']
  },
];

<ProjectGanttChart 
  tasks={tasks} 
  projectName="2025春季新品开发" 
/>
```

**集成到项目详情页**:
```tsx
// 在项目详情页面添加甘特图
<ProjectGanttChart 
  tasks={projectTasks.map(task => ({
    id: task.id,
    name: task.task_name,
    startDate: task.start_date,
    endDate: task.estimated_completion_date,
    progress: task.progress || 0,
    status: task.status,
    role: task.role,
  }))}
  projectName={project.name}
/>
```

---

### 2. BurndownChart - 燃尽图

**文件路径**: `src/components/BurndownChart.tsx`

**功能特性**:
- 📈 可视化显示项目进度和剩余工作量
- 🎯 理想燃尽线 vs 实际燃尽线对比
- 📊 实时统计：总任务数、已完成、剩余
- 🚦 智能状态提示（提前完成、进度良好、需加快、严重滞后）
- 📱 响应式设计，自适应容器大小

**Props 接口**:
```typescript
interface BurndownData {
  date: string;      // 日期 (ISO格式)
  remaining: number; // 剩余任务数
  ideal: number;     // 理想剩余任务数
  completed: number; // 已完成任务数
}

interface BurndownChartProps {
  data: BurndownData[];
  totalTasks?: number;  // 总任务数（可选，用于计算完成率）
  sprintName?: string;  // 冲刺名称（可选）
}
```

**使用示例**:
```tsx
import { BurndownChart } from '@/components/BurndownChart';

const burndownData = [
  { date: '2025-01-15', remaining: 10, ideal: 10, completed: 0 },
  { date: '2025-01-16', remaining: 8, ideal: 8, completed: 2 },
  { date: '2025-01-17', remaining: 6, ideal: 6, completed: 4 },
  { date: '2025-01-18', remaining: 4, ideal: 4, completed: 6 },
  { date: '2025-01-19', remaining: 2, ideal: 2, completed: 8 },
  { date: '2025-01-20', remaining: 0, ideal: 0, completed: 10 },
];

<BurndownChart 
  data={burndownData} 
  totalTasks={10}
  sprintName="Week 3 Sprint"
/>
```

**生成燃尽图数据的辅助函数**:
```typescript
// 计算燃尽图数据
function calculateBurndownData(tasks: Task[], startDate: string, endDate: string) {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // 生成日期列表
  while (start <= end) {
    dates.push(start.toISOString().split('T')[0]);
    start.setDate(start.getDate() + 1);
  }

  const totalTasks = tasks.length;
  const data = dates.map((date, index) => {
    const ideal = Math.round(totalTasks - (totalTasks * index) / (dates.length - 1));
    // 这里需要根据实际任务完成情况计算 remaining 和 completed
    // 简化示例：
    return {
      date,
      remaining: Math.max(0, ideal),
      ideal,
      completed: totalTasks - ideal,
    };
  });

  return data;
}
```

---

### 3. RealtimeData - 实时数据更新

**文件路径**: `src/components/RealtimeData.tsx`

**功能特性**:
- 🔄 自动轮询刷新数据（可配置间隔）
- 🖱️ 手动刷新按钮
- 🔴 实时连接状态指示
- ⏱️ 显示最后刷新时间和刷新次数
- ⚠️ 错误提示和重试机制
- 🎛️ 可开关的自动刷新

**Props 接口**:
```typescript
interface RealtimeDataProps {
  autoRefresh?: boolean;      // 是否自动刷新（默认true）
  refreshInterval?: number;   // 刷新间隔（毫秒，默认30000）
  onRefresh?: () => Promise<void>;  // 刷新回调函数
  children?: React.ReactNode; // 子组件
  title?: string;             // 标题
  description?: string;       // 描述
}
```

**使用示例**:
```tsx
import { RealtimeData } from '@/components/RealtimeData';

function ProjectDashboard() {
  const [projects, setProjects] = useState([]);

  const fetchProjects = async () => {
    const response = await fetch('/api/projects');
    const data = await response.json();
    setProjects(data);
  };

  return (
    <RealtimeData
      autoRefresh={true}
      refreshInterval={30000}  // 30秒刷新一次
      onRefresh={fetchProjects}
      title="项目数据"
      description="实时同步最新项目信息"
    >
      {/* 子组件内容 */}
      <ProjectList projects={projects} />
    </RealtimeData>
  );
}
```

**高级用法 - 结合多个数据源**:
```tsx
function Dashboard() {
  const fetchAllData = async () => {
    await Promise.all([
      fetchProjects(),
      fetchTasks(),
      fetchSalesTargets(),
    ]);
  };

  return (
    <RealtimeData
      autoRefresh={true}
      refreshInterval={60000}  // 1分钟
      onRefresh={fetchAllData}
      title="综合数据看板"
    >
      <div className="grid gap-4">
        <ProjectsPanel />
        <TasksPanel />
        <SalesPanel />
      </div>
    </RealtimeData>
  );
}
```

---

### 4. PDFExport - 数据导出

**文件路径**: `src/components/PDFExport.tsx`

**功能特性**:
- 📄 导出为PDF格式（适合打印和正式文档）
- 📊 导出为Excel/CSV格式（适合数据分析和编辑）
- 📝 支持多表格导出
- 🏷️ 包含标题、内容、表格和元数据
- 📦 支持中文（需要额外配置字体）
- 🎨 美观的导出预览

**Props 接口**:
```typescript
interface PDFExportData {
  title: string;
  content: string;
  tables?: Array<{
    headers: string[];
    rows: string[][];
    title?: string;
  }>;
  metadata?: {
    author?: string;
    date?: string;
    version?: string;
  };
}

interface PDFExportProps {
  data: PDFExportData;
  filename?: string;  // 文件名（不含扩展名）
  onExport?: (format: 'pdf' | 'excel') => Promise<void>;
}
```

**使用示例**:
```tsx
import { PDFExport } from '@/components/PDFExport';

const exportData: PDFExportData = {
  title: '项目周报 - 2025年第3周',
  content: '本周项目进展顺利，所有任务按计划推进。主要完成事项包括：1. 插画设计完成90%；2. 产品开发进度达到80%；3. 详情页文案已审核通过。',
  metadata: {
    author: '张三',
    date: '2025-01-17',
    version: 'v1.0',
  },
  tables: [
    {
      title: '任务清单',
      headers: ['任务名称', '负责人', '状态', '进度', '截止日期'],
      rows: [
        ['插画设计', '李四', '进行中', '90%', '2025-01-20'],
        ['产品开发', '王五', '进行中', '80%', '2025-01-22'],
        ['详情页文案', '赵六', '已完成', '100%', '2025-01-18'],
      ],
    },
    {
      title: '销售目标',
      headers: ['月份', '目标（万元）', '实际完成', '完成率'],
      rows: [
        ['1月', '100', '85', '85%'],
        ['2月', '120', '0', '0%'],
      ],
    },
  ],
};

<PDFExport 
  data={exportData} 
  filename="项目周报_2025-W3"
/>
```

**集成到项目详情页**:
```tsx
function ProjectDetailPage({ project }) {
  const exportData = useMemo(() => ({
    title: `项目详情 - ${project.name}`,
    content: `项目创建于 ${project.created_at}，当前状态为 ${project.status}。`,
    metadata: {
      author: project.created_by_name,
      date: new Date().toLocaleDateString(),
    },
    tables: [
      {
        title: '任务列表',
        headers: ['任务名称', '岗位', '负责人', '状态', '进度'],
        rows: project.tasks.map(task => [
          task.task_name,
          task.role,
          task.assignee_name || '未分配',
          task.status,
          `${task.progress || 0}%`,
        ]),
      },
    ],
  }), [project]);

  return (
    <div>
      {/* ...其他内容... */}
      <PDFExport data={exportData} filename={`项目_${project.id}`} />
    </div>
  );
}
```

---

## 安装依赖

在使用这些组件前，需要安装以下依赖：

```bash
pnpm add jspdf
pnpm add recharts
```

## 最佳实践

### 1. 甘特图集成
- 在项目详情页添加甘特图，直观展示任务时间线
- 根据任务状态动态更新进度
- 支持缩放功能，方便查看不同时间跨度

### 2. 燃尽图应用
- 在每周工作安排页面添加燃尽图
- 用于冲刺（Sprint）进度跟踪
- 结合实际任务完成情况生成数据

### 3. 实时数据更新
- 在数据看板页面使用，保持数据最新
- 根据数据更新频率合理设置刷新间隔
- 避免过于频繁的刷新导致性能问题

### 4. 数据导出
- 在项目详情页添加导出功能
- 用于生成周报、月报等正式文档
- 支持用户自定义导出内容

## 注意事项

### PDF中文支持
`jsPDF` 默认不支持中文字符。如需支持中文，需要：
1. 获取中文字体文件（如 `NotoSansCJK-Regular.ttf`）
2. 将字体文件转换为 Base64
3. 在生成PDF前添加字体：

```typescript
import jsPDF from 'jspdf';

const doc = new jsPDF();
const font = '/path/to/noto-sans-cjk-regular-normal.js'; // 转换后的字体文件

doc.addFileToVFS('NotoSansCJK-Regular.ttf', font);
doc.addFont('NotoSansCJK-Regular.ttf', 'NotoSansCJK', 'normal');
doc.setFont('NotoSansCJK');
```

**简化方案**：对于英文环境或不需要复杂排版的场景，可以使用英文标签。

### 性能优化
- 甘特图任务数过多时（>100），考虑分页或虚拟滚动
- 燃尽图数据点过多时（>30），按天聚合数据
- 实时刷新间隔不要设置过短（建议 >= 10秒）

## 后续优化方向

1. **甘特图增强**：
   - 添加任务拖拽功能
   - 支持依赖关系可视化（箭头连线）
   - 添加里程碑标记

2. **燃尽图增强**：
   - 支持多项目对比
   - 添加预测功能（基于当前进度预测完成日期）
   - 支持自定义粒度（按天、按周）

3. **实时更新增强**：
   - 使用 WebSocket 替代轮询
   - 添加数据变化通知（Toast提示）
   - 支持选择性刷新（只刷新变更的数据）

4. **导出增强**：
   - 支持更多格式（Word、图片）
   - 添加导出模板功能
   - 支持批量导出多个项目

## 相关文件

- `src/components/ProjectGanttChart.tsx` - 甘特图组件
- `src/components/BurndownChart.tsx` - 燃尽图组件
- `src/components/RealtimeData.tsx` - 实时数据更新组件
- `src/components/PDFExport.tsx` - PDF导出组件
- `PHASE1-COMPONENTS-GUIDE.md` - 第一批组件文档
- `PHASE2-PROGRESS.md` - 第二阶段进度追踪
