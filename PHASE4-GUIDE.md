# 第四批功能：报表与统计

## 概述

第四批功能实现了报表与统计模块，包括自动生成周报/月报、绩效统计和效率分析报告，帮助管理者全面了解团队工作情况和效率。

## 功能清单

### 1. 自动生成周报/月报功能

#### API 端点
- **路由**: `GET /api/reports`
- **参数**:
  - `type`: 报表类型（weekly/monthly）
  - `year`: 年份（仅月报）
  - `month`: 月份（仅月报）
  - `weekStart`: 周开始日期（仅周报）

#### 功能特性
- 支持按周生成周报
- 支持按月生成月报
- 自动计算项目、任务、协同合作、工作计划等统计
- 按品牌、岗位、状态等多维度分析
- 支持导出功能（预留接口）

#### 数据结构
```typescript
interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  summary: ReportSummary;
  projects: {
    total: number;
    completed: number;
    byStatus: { [key: string]: number };
    byBrand: { [key: string]: number };
  };
  tasks: {
    total: number;
    completed: number;
    byRole: { [key: string]: number };
    byStatus: { [key: string]: number };
    overdueByRole: { [key: string]: number };
  };
  collaboration: {
    total: number;
    completed: number;
  };
  weeklyPlans: {
    total: number;
    completed: number;
    byPosition: { [key: string]: number };
  };
}
```

### 2. 绩效统计功能

#### API 端点
- **路由**: `GET /api/performance`
- **参数**:
  - `type`: 统计周期（daily/weekly/monthly/quarterly）
  - `role`: 按岗位筛选（可选）
  - `userId`: 按用户筛选（可选）

#### 功能特性
- 按用户统计绩效指标
- 按岗位统计绩效指标
- 计算绩效评分（0-100分）
- 生成绩效排名
- 提供改进建议

#### 数据结构
```typescript
interface UserPerformance {
  userId: string;
  username: string;
  nickname: string;
  brand: string;
  roles: string[];
  stats: {
    totalProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    averageCompletionTime: number;
    onTimeCompletionRate: number;
    averageRating: number;
    totalReminders: number;
  };
  performanceScore: number;
  ranking: number;
}

interface RolePerformance {
  role: string;
  stats: {
    totalUsers: number;
    totalTasks: number;
    completedTasks: number;
    averageCompletionTime: number;
    onTimeCompletionRate: number;
    overdueRate: number;
    averageRating: number;
  };
  performanceScore: number;
  topPerformers: string[];
}
```

### 3. 效率分析报告

#### API 端点
- **路由**: `GET /api/efficiency`
- **参数**:
  - `type`: 分析周期（weekly/monthly/quarterly）

#### 功能特性
- 计算整体效率评分（A/B/C/D等级）
- 识别工作瓶颈
- 分析各岗位工作流效率
- 提供效率改进建议
- 与上期数据对比

#### 数据结构
```typescript
interface EfficiencyReport {
  period: {
    start: string;
    end: string;
  };
  overallEfficiency: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D';
    change: number;
  };
  metrics: EfficiencyMetric[];
  bottlenecks: BottleneckAnalysis[];
  workflowEfficiency: WorkflowEfficiency[];
  insights: string[];
  recommendations: string[];
}

interface EfficiencyMetric {
  metric: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
}
```

### 4. 报表展示组件

#### 组件位置
- `src/components/ReportsPanel.tsx`

#### 功能特性
- 周报/月报标签页切换
- 紧凑型统计卡片展示
- 多维度图表展示：
  - 按状态饼图
  - 按品牌/岗位柱状图
  - 逾期任务分布
  - 完成率对比
- 支持刷新和导出
- 响应式布局

#### UI 特性
- 紧凑型卡片设计（与工作负载/关键路径优化一致）
- 图表可视化（Recharts）
- 趋势指标显示
- 百分比进度条

## API 使用示例

### 1. 获取周报
```bash
GET /api/reports?type=weekly
```

```bash
GET /api/reports?type=weekly&weekStart=2025-01-20
```

### 2. 获取月报
```bash
GET /api/reports?type=monthly&year=2025&month=1
```

### 3. 获取绩效统计
```bash
GET /api/performance?type=monthly
```

### 4. 获取效率分析
```bash
GET /api/efficiency?type=monthly
```

## 组件使用示例

```tsx
import { ReportsPanel } from '@/components/ReportsPanel';

function Dashboard() {
  return (
    <div>
      {/* 其他内容 */}
      <ReportsPanel />
    </div>
  );
}
```

## UI 优化详情

### 工作负载组件优化
1. **汇总统计卡片**
   - 使用紧凑型 2x2 网格布局
   - 数字字体从 text-2xl 缩小到 text-lg
   - 图标从 h-4 w-4 缩小到 h-3.5 w-3.5
   - 减小 padding 和间距

2. **员工工作负载列表**
   - 每个条目 padding 从 p-3 减小到 p-2
   - 字体大小减小（text-sm -> text-xs）
   - 进度条高度从默认减小到 h-1

3. **岗位工作负载列表**
   - 展开区域 padding 从 pl-8 减小到 pl-6
   - 任务卡片 padding 从 p-3 减小到 p-2
   - 图标和字体整体缩小

### 关键路径组件优化
1. **汇总统计卡片**
   - 使用紧凑型 2x2 网格布局
   - 数字字体从 text-2xl 缩小到 text-lg
   - 图标大小从 h-4 w-4 缩小到 h-3.5 w-3.5
   - 移除 CardHeader，使用内联布局

2. **瓶颈任务列表**
   - 从显示 10 条减少到 5 条
   - 每个条目 padding 从 p-3 减小到 p-2
   - 字体大小减小

3. **项目关键路径**
   - 项目卡片 padding 从 p-4 减小到 p-3
   - 标题字体从 text-lg 减小到 text-sm
   - 关键任务卡片从 3 列减少到 2 列（小屏幕）
   - 整体间距减小

### 报表展示组件优化
1. **统计卡片**
   - 使用与工作负载相同的紧凑型设计
   - 保持视觉一致性

2. **图表区域**
   - 图表高度从 200 减小到 150
   - 图表字体和标签大小适配

3. **信息卡片**
   - 使用简洁的列表展示
   - 减小字体大小和间距

## 绩效评分算法

### 用户绩效评分
```typescript
performanceScore = Math.round(
  (onTimeCompletionRate * 0.4) +
  ((100 - overdueRate) * 0.3) +
  (averageRating * 20 * 0.2) +
  (Math.max(0, 100 - averageCompletionTime * 2) * 0.1)
)
```

### 岗位绩效评分
```typescript
performanceScore = Math.round(
  (onTimeCompletionRate * 0.4) +
  ((100 - overdueRate) * 0.3) +
  (averageRating * 20 * 0.2) +
  (Math.max(0, 100 - averageCompletionTime * 2) * 0.1)
)
```

### 效率评分
```typescript
efficiencyScore = Math.round(
  (completionRate * 0.4) +
  ((100 - overdueRate) * 0.3) +
  (Math.max(0, 100 - averageCompletionTime * 5) * 0.3)
)
```

### 等级划分
- A: 90-100分（优秀）
- B: 75-89分（良好）
- C: 60-74分（合格）
- D: 0-59分（需改进）

## 瓶颈识别规则

### 任务逾期
- **严重**: 逾期率 > 40%
- **高**: 逾期率 > 20%
- **中**: 逾期率 > 10%

### 任务周期
- **高**: 平均完成时间 > 20天
- **中**: 平均完成时间 > 10天

### 完成率
- **高**: 完成率 < 50%
- **中**: 完成率 < 70%

## 建议生成逻辑

### 自动建议触发条件
1. 整体按时完成率 < 80%
2. 逾期任务占比 > 10%
3. 平均任务完成时间 > 7天
4. 效率评分 < 70
5. 效率较上期下降 > 5%

### 洞察生成条件
1. 完成率 > 80%
2. 逾期率 < 10%
3. 平均完成时间 < 5天
4. 效率较上期提升 > 10%

## 数据导出（预留）

### PDF 导出
```typescript
downloadReport('pdf')
```

### Word 导出
```typescript
downloadReport('word')
```

**注意**: 当前为预留接口，后续可集成 jsPDF 和 docx 库实现。

## 相关文件

### API 文件
- `src/app/api/reports/route.ts` - 报表生成 API
- `src/app/api/performance/route.ts` - 绩效统计 API
- `src/app/api/efficiency/route.ts` - 效率分析 API

### 组件文件
- `src/components/ReportsPanel.tsx` - 报表展示组件
- `src/components/WorkloadMonitor.tsx` - 工作负载组件（已优化）
- `src/components/CriticalPathAnalyzer.tsx` - 关键路径组件（已优化）

### 文档
- `PHASE4-GUIDE.md` - 本文档
- `PHASE1-COMPONENTS-GUIDE.md` - 第一批组件文档
- `PHASE2-COMPONENTS-GUIDE.md` - 第二批组件文档
- `PHASE3-COMPONENTS-GUIDE.md` - 第三批组件文档

## 技术栈

- **图表库**: Recharts
- **数据计算**: 原生 JavaScript/TypeScript
- **状态管理**: React Hooks (useState, useEffect)
- **UI 组件**: shadcn/ui (Card, Tabs, Badge, Button)

## 下一步计划

### 第五批：系统管理
- 系统配置管理 UI
- 数据备份与恢复
- 用户权限细化管理

### 第六批：其他功能
- 移动端响应式适配
- 数据导入功能
- 权限细化管理

## 注意事项

1. **性能优化**: 报表数据量较大时，建议添加分页或懒加载
2. **缓存策略**: 报表数据更新不频繁，可考虑添加缓存
3. **权限控制**: 不同角色用户应看到不同的报表数据
4. **时间范围**: 默认使用当前周期，支持用户自定义选择
5. **数据准确性**: 确保数据库中的任务、项目数据完整准确

## 测试建议

### 功能测试
1. 测试周报/月报数据准确性
2. 测试绩效评分计算逻辑
3. 测试效率分析识别瓶颈
4. 测试图表渲染正确性

### 性能测试
1. 测试大数据量下的加载速度
2. 测试图表渲染性能
3. 测试报表导出性能

### 兼容性测试
1. 测试不同浏览器的图表显示
2. 测试移动端布局适配
3. 测试暗色模式适配
