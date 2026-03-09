# 数据中台使用指南

## 概述

数据中台为瀚海集团工作流程管理系统提供了统一的数据访问、聚合、缓存能力，旨在提升数据查询性能、减少重复代码、优化系统架构。

## 核心能力

### 1. 统一数据访问

通过 `DataPlatform` 类提供统一的数据访问接口，支持缓存、批量查询等功能。

### 2. 数据聚合

提供预定义的数据聚合器，自动聚合多个数据源的数据。

### 3. 数据缓存

内置缓存机制，提升数据查询性能，减少数据库压力。

## 使用方式

### 方式一：直接使用 DataPlatform 类

```typescript
import { getDataPlatform } from '@/lib/data-platform/core';

const dataPlatform = getDataPlatform();

// 获取项目数据
const projects = await dataPlatform.fetchData('projects', { brand: 'he_zhe' });

// 获取任务数据
const tasks = await dataPlatform.fetchData('tasks', { projectId: 'xxx' });

// 批量获取数据
const results = await dataPlatform.batchFetch([
  { source: 'projects' },
  { source: 'tasks' },
]);
```

### 方式二：使用 React Hooks

```typescript
import { useDataPlatformData } from '@/hooks/useDataPlatform';

function MyComponent() {
  const { data, loading, error, refetch } = useDataPlatformData(
    'projects',
    { brand: 'he_zhe' },
    {
      useCache: true,
      refetchInterval: 30000,
    }
  );

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return <div>{JSON.stringify(data)}</div>;
}
```

### 方式三：使用数据聚合器

```typescript
import { aggregators } from '@/lib/data-platform/aggregators';

// 聚合项目统计
const stats = await aggregators.projectStats();

// 聚合工作负载
const workload = await aggregators.workload();

// 聚合仪表盘数据
const dashboard = await aggregators.dashboard();

// 聚合项目详情
const detail = await aggregators.projectDetail('project-id');
```

## 数据源列表

| 数据源 | 路径 | 说明 |
|--------|------|------|
| projects | /api/projects | 项目数据 |
| tasks | /api/tasks | 任务数据 |
| users | /api/users | 用户数据 |
| collaborations | /api/collaboration-tasks | 协同合作数据 |
| weeklyPlans | /api/weekly-work-plans | 本周工作计划 |
| salesTargets | /api/sales-targets | 销售目标 |
| productCategories | /api/product-categories | 产品分类 |
| feedback | /api/feedback | 用户反馈 |
| notifications | /api/notifications | 通知 |
| reports | /api/reports | 报表 |
| performance | /api/performance | 绩效 |
| efficiency | /api/efficiency | 效率 |
| workload | /api/workload | 工作负载 |
| criticalPath | /api/critical-path | 关键路径 |

## 缓存配置

| 数据类型 | TTL | 说明 |
|---------|-----|------|
| 项目数据 | 2分钟 | 项目列表、项目详情 |
| 任务数据 | 1分钟 | 任务列表、任务详情 |
| 分析数据 | 10分钟 | 报表、统计、分析 |
| 默认 | 5分钟 | 其他数据 |

## API 接口

### 获取缓存统计

```
GET /api/data-platform?action=cache-stats
```

### 清除缓存

```
GET /api/data-platform?action=clear-cache&pattern=projects
```

### 聚合项目统计

```
GET /api/data-platform?action=aggregate-project-stats
```

### 聚合工作负载

```
GET /api/data-platform?action=aggregate-workload
```

### 聚合仪表盘数据

```
GET /api/data-platform?action=aggregate-dashboard
```

### 聚合项目详情

```
GET /api/data-platform?action=aggregate-project-detail&projectId=xxx
```

## 最佳实践

### 1. 使用缓存提升性能

对于不经常变化的数据，启用缓存：

```typescript
const { data } = useDataPlatformData('projects', {}, { useCache: true });
```

### 2. 批量查询减少请求

一次性获取多个数据源的数据：

```typescript
const results = await dataPlatform.batchFetch([
  { source: 'projects' },
  { source: 'tasks' },
  { source: 'users' },
]);
```

### 3. 使用聚合器简化逻辑

使用预定义的聚合器自动聚合数据：

```typescript
const dashboard = await aggregators.dashboard();
```

### 4. 定期清除缓存

数据更新后，及时清除相关缓存：

```typescript
import { useDataPlatformCache } from '@/hooks/useDataPlatform';

function MyComponent() {
  const { clearProjectCache } = useDataPlatformCache();

  const handleUpdateProject = async () => {
    // 更新项目
    await updateProject(data);

    // 清除项目缓存
    clearProjectCache();
  };
}
```

## 监控与调试

### 使用监控组件

在需要的地方引入监控组件：

```typescript
import { DataPlatformMonitor } from '@/components/DataPlatformMonitor';

function AdminPage() {
  return <DataPlatformMonitor />;
}
```

### 查看控制台日志

数据中台会在控制台输出详细的日志：

- `[DataPlatform] Cache hit: xxx` - 缓存命中
- `[DataPlatform] Fetch error: xxx` - 获取数据错误
- `[DataPlatform] Aggregator xxx result: xxx` - 聚合器结果

## 扩展开发

### 添加新的数据源

1. 在 `src/lib/data-platform/core.ts` 的 `DATA_SOURCES` 中添加配置：

```typescript
const DATA_SOURCES = {
  // ... existing sources
  newSource: '/api/new-source',
};
```

2. 使用时直接引用：

```typescript
const data = await dataPlatform.fetchData('newSource');
```

### 添加新的聚合器

1. 在 `src/lib/data-platform/aggregators.ts` 中添加聚合函数：

```typescript
export async function aggregateNewFeature() {
  const dataPlatform = getDataPlatform();

  const result = await dataPlatform.aggregateData(
    ['source1', 'source2'],
    (dataMap) => {
      // 聚合逻辑
      return { /* 聚合结果 */ };
    }
  );

  return result;
}
```

2. 将聚合器导出：

```typescript
export const aggregators = {
  // ... existing aggregators
  newFeature: aggregateNewFeature,
};
```

3. 在 API 路由中添加处理：

```typescript
case 'aggregate-new-feature':
  const newFeature = await aggregators.newFeature();
  return NextResponse.json({ success: true, data: newFeature });
```

## 性能优化建议

1. **合理设置缓存TTL**：根据数据更新频率设置合适的缓存时间
2. **使用批量查询**：减少网络请求次数
3. **选择性清除缓存**：只清除相关的缓存，避免全量清除
4. **监控缓存命中率**：通过监控组件查看缓存使用情况
5. **优化聚合逻辑**：避免在聚合器中进行复杂的计算

## 故障排查

### 缓存未生效

检查：
1. 是否启用了 `useCache: true`
2. 缓存键是否正确（参数是否一致）
3. 缓存是否被清除

### 数据聚合失败

检查：
1. 数据源是否可用
2. 聚合逻辑是否正确
3. 数据格式是否符合预期

### 性能问题

检查：
1. 是否使用了缓存
2. 是否合理设置了TTL
3. 是否存在重复查询

## 联系与支持

如有问题，请联系技术团队或查看项目文档。
