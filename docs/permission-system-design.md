# Ai数据助手 - 高度自定义权限系统设计

## 一、核心设计理念

### 1.1 高度自定义能力

```
┌─────────────────────────────────────────────────────────────────┐
│                        权限系统架构                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ 自定义模块   │  │ 自定义权限   │  │ 自定义角色   │              │
│  │ Module      │  │ Permission  │  │ Role        │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ 自定义岗位   │  │ 权限模板    │  │ 批量授权    │              │
│  │ Position    │  │ Template    │  │ Batch Grant │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 自定义维度

| 维度 | 自定义内容 | 说明 |
|------|-----------|------|
| 模块 | 增删改查权限模块 | 如新增"会员管理"模块 |
| 权限 | 增删改查具体权限 | 如新增"导出报表"权限 |
| 操作 | 自定义操作类型 | 默认5种，可扩展如"审批"、"发布" |
| 角色 | 完全自定义角色 | 名称、描述、权限组合 |
| 岗位 | 完全自定义岗位 | 名称、部门、权限组合 |
| 模板 | 保存权限配置为模板 | 快速复用权限配置 |

---

## 二、数据库表结构

### 2.1 权限模块表 `permission_modules`

```sql
CREATE TABLE permission_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,      -- 模块代码：product, project
  name VARCHAR(100) NOT NULL,            -- 模块名称：商品中心、项目管理
  icon VARCHAR(50),                      -- 图标：Package, FolderOpen
  sort_order INT DEFAULT 0,              -- 排序
  is_active BOOLEAN DEFAULT true,        -- 是否启用
  is_system BOOLEAN DEFAULT false,       -- 是否系统模块（不可删除）
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 权限操作类型表 `permission_actions`

```sql
CREATE TABLE permission_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(30) UNIQUE NOT NULL,      -- 操作代码：view, create, edit
  name VARCHAR(50) NOT NULL,             -- 操作名称：查看、新增、编辑
  description TEXT,                      -- 描述
  icon VARCHAR(50),                      -- 图标：Eye, Plus, Edit
  color VARCHAR(20),                     -- 颜色：blue, green, orange
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.3 权限表 `permissions`

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES permission_modules(id) ON DELETE CASCADE,
  code VARCHAR(100) UNIQUE NOT NULL,     -- 权限代码：product:view, product:create
  name VARCHAR(100) NOT NULL,            -- 权限名称：查看商品、创建商品
  description TEXT,                      -- 权限描述
  action_id UUID REFERENCES permission_actions(id),
  resource VARCHAR(50),                  -- 资源名称（用于API权限检查）
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_permissions_module ON permissions(module_id);
CREATE INDEX idx_permissions_code ON permissions(code);
```

### 2.4 角色表 `roles`

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,      -- 角色代码：admin, product_manager
  name VARCHAR(100) NOT NULL,            -- 角色名称：管理员、产品经理
  description TEXT,                      -- 角色描述
  color VARCHAR(20) DEFAULT 'blue',      -- 标签颜色
  icon VARCHAR(50),                      -- 图标
  is_active BOOLEAN DEFAULT true,        -- 是否启用
  is_system BOOLEAN DEFAULT false,       -- 是否系统角色（不可删除）
  sort_order INT DEFAULT 0,
  user_count INT DEFAULT 0,              -- 关联用户数（缓存字段）
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.5 岗位表 `positions`

```sql
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,      -- 岗位代码：illustration, procurement
  name VARCHAR(100) NOT NULL,            -- 岗位名称：插画、采购
  department VARCHAR(100),               -- 所属部门
  description TEXT,
  color VARCHAR(20) DEFAULT 'green',     -- 标签颜色
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  user_count INT DEFAULT 0,              -- 关联用户数（缓存字段）
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.6 权限模板表 `permission_templates`

```sql
CREATE TABLE permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,      -- 模板代码
  name VARCHAR(100) NOT NULL,            -- 模板名称
  description TEXT,                      -- 模板描述
  type VARCHAR(20) NOT NULL,             -- 类型：role, position, user
  permission_ids JSONB,                  -- 权限ID列表 ["uuid1", "uuid2"]
  is_public BOOLEAN DEFAULT false,       -- 是否公开模板
  created_by UUID,                       -- 创建人
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.7 角色权限关联表 `role_permissions`

```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID,                       -- 授权人
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);
```

### 2.8 岗位权限关联表 `position_permissions`

```sql
CREATE TABLE position_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by UUID,
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(position_id, permission_id)
);
```

### 2.9 用户角色关联表 `user_roles`

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,      -- 主角色
  granted_by UUID,
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);
```

### 2.10 用户岗位关联表 `user_positions`

```sql
CREATE TABLE user_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  granted_by UUID,
  granted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, position_id)
);
```

### 2.11 用户个人权限表 `user_permissions`

```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  is_granted BOOLEAN DEFAULT true,       -- true=授权, false=拒绝
  granted_by UUID,
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,                  -- 过期时间
  remark TEXT,
  UNIQUE(user_id, permission_id)
);
```

### 2.12 权限变更日志表 `permission_audit_logs`

```sql
CREATE TABLE permission_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL,             -- 操作人
  target_type VARCHAR(20) NOT NULL,      -- 目标类型：role, position, user
  target_id UUID,                        -- 目标ID
  action VARCHAR(20) NOT NULL,           -- 操作：grant, revoke, create, delete
  permission_id UUID,                    -- 权限ID
  permission_code VARCHAR(100),          -- 权限代码（冗余）
  old_value JSONB,                       -- 旧值
  new_value JSONB,                       -- 新值
  remark TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 三、API 接口设计

### 3.1 权限模块管理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/permission-modules` | GET | 获取所有模块列表 |
| `/api/admin/permission-modules` | POST | 创建新模块 |
| `/api/admin/permission-modules/[id]` | PUT | 更新模块 |
| `/api/admin/permission-modules/[id]` | DELETE | 删除模块 |

### 3.2 权限操作类型管理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/permission-actions` | GET | 获取所有操作类型 |
| `/api/admin/permission-actions` | POST | 创建新操作类型 |
| `/api/admin/permission-actions/[id]` | PUT | 更新操作类型 |
| `/api/admin/permission-actions/[id]` | DELETE | 删除操作类型 |

### 3.3 权限管理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/permissions` | GET | 获取所有权限（支持按模块筛选） |
| `/api/admin/permissions` | POST | 创建新权限 |
| `/api/admin/permissions/[id]` | PUT | 更新权限 |
| `/api/admin/permissions/[id]` | DELETE | 删除权限 |
| `/api/admin/permissions/batch` | POST | 批量创建权限 |

### 3.4 角色管理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/roles` | GET | 获取所有角色 |
| `/api/admin/roles` | POST | 创建角色 |
| `/api/admin/roles/[id]` | PUT | 更新角色 |
| `/api/admin/roles/[id]` | DELETE | 删除角色 |
| `/api/admin/roles/[id]/permissions` | GET | 获取角色权限 |
| `/api/admin/roles/[id]/permissions` | PUT | 设置角色权限（全量替换） |
| `/api/admin/roles/[id]/permissions` | PATCH | 增量更新角色权限 |
| `/api/admin/roles/[id]/users` | GET | 获取角色下的用户列表 |

### 3.5 岗位管理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/positions` | GET | 获取所有岗位 |
| `/api/admin/positions` | POST | 创建岗位 |
| `/api/admin/positions/[id]` | PUT | 更新岗位 |
| `/api/admin/positions/[id]` | DELETE | 删除岗位 |
| `/api/admin/positions/[id]/permissions` | GET | 获取岗位权限 |
| `/api/admin/positions/[id]/permissions` | PUT | 设置岗位权限 |
| `/api/admin/positions/[id]/users` | GET | 获取岗位下的用户列表 |

### 3.6 用户权限管理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/users/[id]/permissions` | GET | 获取用户所有权限（合并角色+岗位+个人） |
| `/api/admin/users/[id]/permissions` | PUT | 设置用户个人权限 |
| `/api/admin/users/[id]/permissions/[permId]` | DELETE | 移除用户个人权限 |
| `/api/admin/users/[id]/roles` | GET/PUT | 用户角色管理 |
| `/api/admin/users/[id]/positions` | GET/PUT | 用户岗位管理 |

### 3.7 权限模板管理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/permission-templates` | GET | 获取权限模板列表 |
| `/api/admin/permission-templates` | POST | 创建权限模板 |
| `/api/admin/permission-templates/[id]` | PUT | 更新模板 |
| `/api/admin/permission-templates/[id]` | DELETE | 删除模板 |
| `/api/admin/permission-templates/[id]/apply` | POST | 应用模板到角色/岗位/用户 |

### 3.8 批量操作

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/permissions/batch-grant` | POST | 批量授权 |
| `/api/admin/permissions/batch-revoke` | POST | 批量撤销 |
| `/api/admin/permissions/copy-from` | POST | 从角色/岗位复制权限 |

### 3.9 权限检查

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/my-permissions` | GET | 获取当前用户权限列表 |
| `/api/auth/check-permission` | POST | 检查单个权限 |
| `/api/auth/check-permissions` | POST | 批量检查权限 |

---

## 四、前端界面设计

### 4.1 权限管理主界面

```
┌─────────────────────────────────────────────────────────────────┐
│  权限管理                                                        │
├─────────────────────────────────────────────────────────────────┤
│  [模块管理] [操作类型] [权限列表] [角色管理] [岗位管理] [模板]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  左侧：模块树                      右侧：权限矩阵                 │
│  ┌───────────────┐               ┌─────────────────────────────┐│
│  │ ▼ 商品中心    │               │ 权限      │查看│新增│编辑│删除││
│  │   ├ 商品管理  │──────────────▶ │ 商品管理  │ ✓ │ ✓ │ ✓ │ ✓ ││
│  │   ├ 供应商    │               │ 供应商    │ ✓ │ ✓ │ ✓ │ ✗ ││
│  │   └ 采购订单  │               │ 采购订单  │ ✓ │ ✓ │ ✗ │ ✗ ││
│  │ ▼ 项目管理    │               │ ...       │...│...│...│...││
│  │   ├ 项目      │               └─────────────────────────────┘│
│  │   └ 任务      │                                             │
│  │ ▼ 营销中台    │               [全选] [反选] [保存] [另存模板] │
│  └───────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 角色管理界面

```
┌─────────────────────────────────────────────────────────────────┐
│  角色管理                                      [+ 新建角色]      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 管理员          [编辑] [复制] [删除]  用户数: 5           │  │
│  │ 拥有系统所有权限                                          │  │
│  │ 权限数: 80/80  ████████████████████ 100%                 │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ 商品经理        [编辑] [复制] [删除]  用户数: 3           │  │
│  │ 负责商品和供应链管理                                      │  │
│  │ 权限数: 25/80  ████████░░░░░░░░░░░░ 31%                  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ ...                                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 用户权限配置界面

```
┌─────────────────────────────────────────────────────────────────┐
│  用户权限配置 - 张三 (zhangsan@example.com)                      │
├─────────────────────────────────────────────────────────────────┤
│  [基本信息] [角色分配] [岗位分配] [个人权限] [权限预览]           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  当前角色: 商品经理 (主), 采购专员                               │
│  当前岗位: 采购管理 (主)                                        │
│                                                                 │
│  个人权限覆盖:                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 权限           │状态 │ 来源    │过期时间  │操作         │   │
│  │ 项目:删除      │授权 │ 个人    │永久     │[撤销]        │   │
│  │ 商品:导出      │拒绝 │ 个人    │永久     │[撤销]        │   │
│  │ 报表:查看      │授权 │ 个人    │2024-12-31│[撤销]       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [+ 添加个人权限]                                               │
│                                                                 │
│  最终权限预览:                                                   │
│  商品中心: 查看✓ 新增✓ 编辑✓ 删除✓ 价格✓ 库存✓ 导出✗        │
│  项目管理: 查看✓ 新增✓ 编辑✓ 删除✓ (个人授权)                 │
│  ...                                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 五、核心功能特性

### 5.1 高度自定义

| 功能 | 说明 |
|------|------|
| 自定义模块 | 可添加/修改/删除权限模块 |
| 自定义操作 | 可添加新的操作类型（如"发布"、"审批"） |
| 自定义权限 | 可为任意模块添加任意操作的权限 |
| 自定义角色 | 完全自定义角色名称、描述、权限组合 |
| 自定义岗位 | 完全自定义岗位名称、部门、权限组合 |

### 5.2 批量操作

| 功能 | 说明 |
|------|------|
| 批量授权 | 一键为多个用户/角色/岗位授权 |
| 批量撤销 | 一键撤销多个权限 |
| 权限复制 | 从一个角色/岗位复制权限到另一个 |
| 模板应用 | 使用模板快速配置权限 |

### 5.3 权限继承与覆盖

```
用户最终权限计算：
1. 合并所有角色的权限（并集）
2. 合并所有岗位的权限（并集）
3. 应用用户个人权限覆盖（授权或拒绝）
4. 检查过期时间，过滤已过期权限
```

### 5.4 权限模板

| 模板类型 | 说明 |
|---------|------|
| 系统模板 | 预置的权限配置模板 |
| 自定义模板 | 管理员创建的模板 |
| 部门模板 | 按部门预设的权限配置 |
| 项目模板 | 按项目类型预设的权限配置 |

### 5.5 审计与追溯

| 功能 | 说明 |
|------|------|
| 权限变更日志 | 记录所有权限变更 |
| 操作人追溯 | 记录谁在何时做了什么操作 |
| 变更对比 | 显示变更前后的差异 |
| 定期报告 | 权限变更统计报告 |

---

## 六、实现步骤

### Phase 1: 数据库层
- [ ] 创建所有权限相关表
- [ ] 初始化预设数据（模块、操作、权限）
- [ ] 创建必要的索引和约束

### Phase 2: 后端 API
- [ ] 实现权限模块管理 API
- [ ] 实现权限操作类型管理 API
- [ ] 实现权限 CRUD API
- [ ] 实现角色管理 API
- [ ] 实现岗位管理 API
- [ ] 实现用户权限管理 API
- [ ] 实现权限检查逻辑
- [ ] 实现权限模板 API
- [ ] 实现批量操作 API

### Phase 3: 前端界面
- [ ] 权限管理主界面
- [ ] 模块管理界面
- [ ] 角色管理界面
- [ ] 岗位管理界面
- [ ] 用户权限配置界面
- [ ] 权限模板界面

### Phase 4: 集成与测试
- [ ] 权限检查中间件
- [ ] 前端权限组件
- [ ] API 权限保护
- [ ] 全面测试

---

需要我开始实现吗？
