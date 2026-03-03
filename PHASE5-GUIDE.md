# 第五批功能：系统管理

## 概述

第五批功能实现了系统管理模块，包括系统配置管理和数据备份与恢复，帮助管理员维护和控制系统运行。

## 功能清单

### 1. 系统配置管理

#### API 端点
- **GET** `/api/system-configs` - 获取系统配置列表
- **PUT** `/api/system-configs` - 更新单个配置
- **POST** `/api/system-configs` - 批量更新配置
- **PATCH** `/api/system-configs` - 初始化默认配置

#### 功能特性
- 按类别分组管理配置
- 支持多种配置类型（字符串、数字、布尔值、JSON）
- 批量保存配置
- 配置变更提醒
- 管理员权限控制

#### 配置类别
1. **通用配置** (`general`)
   - system_name: 系统名称
   - company_name: 公司名称
   - system_version: 系统版本
   - enable_registration: 是否允许注册
   - default_timezone: 默认时区

2. **品牌配置** (`brand`)
   - 品牌列表配置
   - 品牌描述等

3. **岗位配置** (`position`)
   - 岗位列表配置
   - 岗位顺序配置

4. **通知配置** (`notification`)
   - email_enabled: 启用邮件通知
   - email_host: 邮件服务器
   - email_port: 邮件端口
   - email_user: 邮件用户名
   - sms_enabled: 启用短信通知

5. **工作流配置** (`workflow`)
   - default_task_days: 默认任务天数
   - reminder_before_days: 提前提醒天数
   - auto_reminder_enabled: 自动提醒
   - max_reminder_count: 最大提醒次数

#### 数据结构
```typescript
interface SystemConfig {
  key: string;
  value: string;
  category: 'general' | 'brand' | 'position' | 'notification' | 'workflow';
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  updated_at: string;
  updated_by: string;
}
```

### 2. 数据备份与恢复

#### API 端点
- **GET** `/api/backups` - 获取备份列表
- **POST** `/api/backups` - 创建备份
- **PUT** `/api/backups` - 恢复备份
- **DELETE** `/api/backups` - 删除备份

#### 功能特性
- 创建完整数据库备份
- 恢复选定的备份
- 删除过期备份
- 备份详情查看（大小、记录数、表列表）
- 备份历史记录

#### 支持的表
- users - 用户表
- user_roles - 用户角色表
- projects - 项目表
- tasks - 任务表
- weekly_work_plans - 本周工作计划
- collaboration_tasks - 协同合作任务
- sales_targets - 销售目标
- monthly_sales_targets - 月度销售目标
- product_categories - 产品品类
- notifications - 通知
- audit_logs - 审计日志
- system_configs - 系统配置
- data_backups - 备份记录

#### 数据结构
```typescript
interface BackupRecord {
  id: string;
  name: string;
  description: string | null;
  file_size: number;
  record_count: number;
  tables: string[];
  created_by: string;
  created_at: string;
}
```

## 组件使用

### 系统配置管理组件

```tsx
import { SystemConfigManager } from '@/components/SystemConfigManager';

function AdminDashboard() {
  return (
    <div>
      {/* 管理后台 */}
      <SystemConfigManager />
    </div>
  );
}
```

### 备份管理组件

```tsx
import { BackupManager } from '@/components/BackupManager';

function AdminDashboard() {
  return (
    <div>
      {/* 管理后台 */}
      <BackupManager />
    </div>
  );
}
```

## API 使用示例

### 1. 获取系统配置

```bash
GET /api/system-configs
```

```bash
GET /api/system-configs?category=general
```

### 2. 更新配置

```bash
PUT /api/system-configs
Content-Type: application/json

{
  "key": "system_name",
  "value": "新系统名称"
}
```

### 3. 批量更新配置

```bash
POST /api/system-configs
Content-Type: application/json

{
  "configs": [
    { "key": "system_name", "value": "新系统名称" },
    { "key": "email_enabled", "value": "true" }
  ]
}
```

### 4. 初始化默认配置

```bash
PATCH /api/system-configs
```

### 5. 获取备份列表

```bash
GET /api/backups
```

### 6. 创建备份

```bash
POST /api/backups
Content-Type: application/json

{
  "name": "2025-01-20 完整备份",
  "description": "完整数据库备份"
}
```

### 7. 恢复备份

```bash
PUT /api/backups
Content-Type: application/json

{
  "backupId": "backup-id",
  "tables": ["users", "projects", "tasks"]
}
```

### 8. 删除备份

```bash
DELETE /api/backups?id=backup-id
```

## UI 特性

### 系统配置管理
- 标签页切换（通用/品牌/岗位/通知/工作流）
- 实时编辑配置
- 配置类型自适应输入框（文本/数字/开关）
- 未保存更改提醒
- 批量保存功能

### 备份管理
- 备份列表展示
- 创建备份对话框
- 备份详情显示（大小、记录数、表列表）
- 恢复备份确认对话框
- 删除备份确认
- 格式化文件大小显示
- 格式化时间显示

## 权限控制

### 管理员权限验证
所有系统管理功能都需要管理员权限：

```typescript
// 检查用户是否有管理员角色
const { data: userRoles } = await client
  .from('user_roles')
  .select('role')
  .eq('user_id', userId);

const hasAdminRole = userRoles?.some(ur => ur.role === 'admin');
if (!hasAdminRole) {
  return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
}
```

## 注意事项

### 系统配置
1. **配置类型**：确保配置值与配置类型匹配
2. **配置验证**：某些配置可能需要额外验证（如邮箱格式）
3. **配置影响**：修改配置后可能需要重启服务生效
4. **默认配置**：首次使用需要初始化默认配置

### 数据备份
1. **备份频率**：建议定期创建备份（如每周一次）
2. **备份保留**：建议保留最近3-6个月的备份
3. **恢复前备份**：恢复数据前务必创建当前数据的备份
4. **备份大小**：备份文件可能较大，注意存储空间
5. **恢复耗时**：恢复操作可能需要较长时间，请耐心等待

### 安全建议
1. **访问控制**：确保只有授权管理员可以访问系统管理功能
2. **备份加密**：考虑对备份文件进行加密存储
3. **审计日志**：所有系统配置更改和备份操作都应记录日志
4. **敏感信息**：配置中不应包含敏感信息（如密码）

## 相关文件

### API 文件
- `src/app/api/system-configs/route.ts` - 系统配置 API
- `src/app/api/backups/route.ts` - 数据备份 API

### 组件文件
- `src/components/SystemConfigManager.tsx` - 系统配置管理组件
- `src/components/BackupManager.tsx` - 备份管理组件

### 文档
- `PHASE5-GUIDE.md` - 本文档
- `PHASE4-GUIDE.md` - 第四批功能文档
- `PHASE2-PROGRESS.md` - 进度报告

## 技术栈

- **状态管理**: React Hooks (useState, useEffect)
- **UI 组件**: shadcn/ui (Card, Tabs, Dialog, Input, Switch)
- **权限控制**: JWT 认证 + 角色验证
- **数据存储**: Supabase PostgreSQL (JSONB)

## 下一步计划

### 第六批：其他功能
1. 移动端响应式适配优化
2. 数据导入功能（Excel批量导入）
3. 权限细化管理（RBAC增强）

## 扩展建议

### 系统配置扩展
1. **配置验证**：添加配置值的格式验证
2. **配置历史**：记录配置变更历史
3. **配置导入导出**：支持配置的导入和导出
4. **配置模板**：预设配置模板，方便快速部署

### 备份功能扩展
1. **自动备份**：支持定时自动备份
2. **增量备份**：只备份变化的数据，减少备份时间
3. **备份压缩**：压缩备份文件，节省存储空间
4. **云端备份**：支持将备份上传到云存储
5. **备份分享**：支持分享备份给其他管理员

## 测试建议

### 系统配置测试
1. 测试各种配置类型的修改
2. 测试批量保存功能
3. 测试未保存更改提醒
4. 测试权限控制（非管理员用户）

### 备份功能测试
1. 测试创建备份功能
2. 测试恢复备份功能
3. 测试删除备份功能
4. 测试备份列表加载
5. 测试权限控制（非管理员用户）

### 集成测试
1. 测试备份后修改数据，再恢复备份
2. 测试修改配置后重启服务
3. 测试多个管理员同时操作

## 故障排查

### 常见问题

1. **配置保存失败**
   - 检查是否有管理员权限
   - 检查配置值格式是否正确
   - 查看浏览器控制台错误信息

2. **备份创建失败**
   - 检查是否有管理员权限
   - 检查数据库连接是否正常
   - 检查备份名称是否为空

3. **备份恢复失败**
   - 确认备份数据格式是否正确
   - 检查表结构是否匹配
   - 查看服务器日志获取详细错误信息

4. **配置不生效**
   - 检查是否需要重启服务
   - 检查配置是否正确保存
   - 检查前端是否重新加载配置
