# Ai数据助手 - 细粒度权限系统设计

## 一、权限模型设计

### 1.1 三层权限架构

```
┌─────────────────────────────────────────────────────────────┐
│                     用户最终权限                              │
│  = 用户个人权限 ∪ 岗位权限 ∪ 角色权限（并集，优先级递增）        │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ 合并计算
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
   │ 用户权限 │          │ 岗位权限 │          │ 角色权限 │
   │ (最高)   │          │ (中等)   │          │ (基础)   │
   └─────────┘          └─────────┘          └─────────┘
```

**优先级规则**：
1. 用户个人权限 > 岗位权限 > 角色权限
2. "拒绝"权限优先于"允许"权限
3. 特殊权限（如超级管理员）覆盖所有规则

### 1.2 权限粒度

每个功能模块支持 5 种操作权限：

| 操作 | 说明 | 示例 |
|------|------|------|
| `view` | 查看 | 查看商品列表、详情 |
| `create` | 新增 | 创建新商品 |
| `edit` | 编辑 | 修改商品信息 |
| `delete` | 删除 | 删除商品 |
| `approve` | 审批/特殊操作 | 审批采购订单、导出数据 |

---

## 二、数据库表结构

### 2.1 权限资源表 `permissions`

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(50) NOT NULL,           -- 模块名：product, project, campaign...
  resource VARCHAR(50) NOT NULL,         -- 资源名：product, supplier, order...
  action VARCHAR(20) NOT NULL,           -- 操作：view, create, edit, delete, approve
  name VARCHAR(100) NOT NULL,            -- 权限名称：查看商品、创建商品
  description TEXT,                      -- 权限描述
  UNIQUE(module, resource, action)
);
```

### 2.2 角色表 `roles`

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,      -- 角色代码：admin, product_manager
  name VARCHAR(100) NOT NULL,            -- 角色名称：管理员、产品经理
  description TEXT,                      -- 角色描述
  is_system BOOLEAN DEFAULT false,       -- 是否系统角色（不可删除）
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.3 岗位表 `positions`

```sql
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,      -- 岗位代码：illustration, procurement
  name VARCHAR(100) NOT NULL,            -- 岗位名称：插画、采购
  department VARCHAR(100),               -- 所属部门：设计部、采购部
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.4 角色权限关联表 `role_permissions`

```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);
```

### 2.5 岗位权限关联表 `position_permissions`

```sql
CREATE TABLE position_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(position_id, permission_id)
);
```

### 2.6 用户角色关联表 `user_roles`

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                 -- 用户ID
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,      -- 是否主角色
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);
```

### 2.7 用户岗位关联表 `user_positions`

```sql
CREATE TABLE user_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                 -- 用户ID
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,      -- 是否主岗位
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, position_id)
);
```

### 2.8 用户个人权限表 `user_permissions`

```sql
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                 -- 用户ID
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  is_granted BOOLEAN DEFAULT true,       -- true=授权, false=拒绝
  granted_by UUID,                       -- 授权人ID
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,                  -- 过期时间（可选）
  remark TEXT,                           -- 备注
  UNIQUE(user_id, permission_id)
);
```

---

## 三、权限资源清单

### 3.1 完整权限列表

#### 🔐 系统管理模块 (system)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| system | manage_users | 用户管理 | 增删改查用户 |
| system | manage_roles | 角色管理 | 管理角色和权限 |
| system | manage_permissions | 权限管理 | 分配权限 |
| system | view_logs | 查看日志 | 查看操作日志 |
| system | manage_config | 系统配置 | 修改系统设置 |
| system | data_backup | 数据备份 | 备份和恢复数据 |

#### 📁 项目管理模块 (project)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| project | view | 查看项目 | 查看项目列表和详情 |
| project | create | 创建项目 | 新建项目 |
| project | edit | 编辑项目 | 修改项目信息 |
| project | delete | 删除项目 | 删除项目 |
| project | export | 导出项目 | 导出项目数据 |

#### ✅ 任务管理模块 (task)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| task | view | 查看任务 | 查看任务列表和详情 |
| task | create | 创建任务 | 新建任务 |
| task | edit | 编辑任务 | 修改任务信息 |
| task | delete | 删除任务 | 删除任务 |
| task | assign | 分配任务 | 分配任务给他人 |
| task | complete | 完成任务 | 标记任务完成 |

#### 📦 商品中心模块 (product)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| product | view | 查看商品 | 查看商品列表和详情 |
| product | create | 创建商品 | 新建商品 |
| product | edit | 编辑商品 | 修改商品信息 |
| product | delete | 删除商品 | 删除商品 |
| product | manage_price | 管理价格 | 设置商品价格 |
| product | manage_inventory | 管理库存 | 管理库存数量 |
| product | export | 导出商品 | 导出商品数据 |
| product | import | 导入商品 | 批量导入商品 |

#### 🏭 供应商模块 (supplier)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| supplier | view | 查看供应商 | 查看供应商列表和详情 |
| supplier | create | 创建供应商 | 新建供应商 |
| supplier | edit | 编辑供应商 | 修改供应商信息 |
| supplier | delete | 删除供应商 | 删除供应商 |

#### 🛒 采购订单模块 (purchase_order)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| purchase_order | view | 查看采购单 | 查看采购订单列表 |
| purchase_order | create | 创建采购单 | 新建采购订单 |
| purchase_order | edit | 编辑采购单 | 修改采购订单 |
| purchase_order | approve | 审批采购单 | 审批采购订单 |
| purchase_order | cancel | 取消采购单 | 取消采购订单 |

#### 📊 销售统计模块 (sales_stats)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| sales_stats | view | 查看销售统计 | 查看销售数据 |
| sales_stats | create | 录入销售数据 | 录入销售统计 |
| sales_stats | edit | 编辑销售数据 | 修改销售统计 |
| sales_stats | export | 导出销售数据 | 导出销售报表 |

#### 💬 商品反馈模块 (product_feedback)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| product_feedback | view | 查看反馈 | 查看商品反馈 |
| product_feedback | create | 创建反馈 | 提交商品反馈 |
| product_feedback | handle | 处理反馈 | 处理反馈问题 |
| product_feedback | delete | 删除反馈 | 删除反馈记录 |

#### 📢 营销活动模块 (campaign)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| campaign | view | 查看活动 | 查看营销活动 |
| campaign | create | 创建活动 | 新建营销活动 |
| campaign | edit | 编辑活动 | 修改活动信息 |
| campaign | delete | 删除活动 | 删除营销活动 |
| campaign | approve | 审批活动 | 审批营销活动 |

#### 📝 活动任务模块 (campaign_task)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| campaign_task | view | 查看任务 | 查看活动任务 |
| campaign_task | create | 创建任务 | 新建活动任务 |
| campaign_task | edit | 编辑任务 | 修改活动任务 |
| campaign_task | assign | 分配任务 | 分配活动任务 |
| campaign_task | complete | 完成任务 | 标记任务完成 |

#### 🤝 协同项目模块 (collaboration)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| collaboration | view | 查看协同项目 | 查看协同项目 |
| collaboration | create | 创建协同项目 | 新建协同项目 |
| collaboration | edit | 编辑协同项目 | 修改协同项目 |
| collaboration | delete | 删除协同项目 | 删除协同项目 |
| collaboration | manage_members | 管理成员 | 添加/移除项目成员 |

#### 📚 知识库模块 (knowledge)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| knowledge | view | 查看知识库 | 查看知识文章 |
| knowledge | create | 创建文章 | 新建知识文章 |
| knowledge | edit | 编辑文章 | 修改知识文章 |
| knowledge | delete | 删除文章 | 删除知识文章 |

#### 📅 日程管理模块 (schedule)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| schedule | view | 查看日程 | 查看日程安排 |
| schedule | create | 创建日程 | 新建日程 |
| schedule | edit | 编辑日程 | 修改日程 |
| schedule | delete | 删除日程 | 删除日程 |

#### ✅ 审批流程模块 (approval)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| approval | view | 查看审批 | 查看审批记录 |
| approval | create | 发起审批 | 发起审批申请 |
| approval | approve | 审批通过 | 审批通过 |
| approval | reject | 审批拒绝 | 审批拒绝 |

#### 💬 内部消息模块 (message)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| message | view | 查看消息 | 查看消息 |
| message | send | 发送消息 | 发送消息 |
| message | delete | 删除消息 | 删除消息 |

#### 📂 资源共享模块 (shared_resource)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| shared_resource | view | 查看资源 | 查看共享资源 |
| shared_resource | create | 上传资源 | 上传共享资源 |
| shared_resource | edit | 编辑资源 | 修改共享资源 |
| shared_resource | delete | 删除资源 | 删除共享资源 |

#### 💬 客户反馈模块 (feedback)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| feedback | view | 查看反馈 | 查看客户反馈 |
| feedback | create | 创建反馈 | 提交客户反馈 |
| feedback | handle | 处理反馈 | 处理客户反馈 |
| feedback | delete | 删除反馈 | 删除反馈记录 |

#### 📈 数据分析模块 (analytics)
| 资源 | 操作 | 权限名称 | 说明 |
|------|------|---------|------|
| analytics | view | 查看分析 | 查看数据分析 |
| analytics | export | 导出数据 | 导出分析数据 |

---

## 四、预设角色权限

### 4.1 超级管理员 (super_admin)
- **全部权限**

### 4.2 管理员 (admin)
- 系统管理：用户管理、查看日志
- 业务模块：全部 CRUD 权限
- 审批权限：全部审批权限

### 4.3 运营经理 (operations_manager)
| 模块 | 权限 |
|------|------|
| 项目管理 | view, create, edit, export |
| 商品中心 | view, create, edit |
| 营销活动 | 全部权限 |
| 数据分析 | view, export |
| 审批 | view, approve, reject |

### 4.4 商品经理 (product_manager)
| 模块 | 权限 |
|------|------|
| 商品中心 | 全部权限 |
| 供应商 | 全部权限 |
| 采购订单 | view, create, edit |
| 销售统计 | 全部权限 |
| 商品反馈 | 全部权限 |

### 4.5 采购专员 (purchaser)
| 模块 | 权限 |
|------|------|
| 供应商 | view, create, edit |
| 采购订单 | view, create, edit |
| 商品中心 | view |

### 4.6 设计师 (designer)
| 模块 | 权限 |
|------|------|
| 项目管理 | view |
| 任务 | view, edit, complete |
| 商品中心 | view |
| 资源共享 | 全部权限 |
| 知识库 | view, create, edit |

### 4.7 客服 (customer_service)
| 模块 | 权限 |
|------|------|
| 商品中心 | view |
| 客户反馈 | 全部权限 |
| 商品反馈 | view, create |

### 4.8 普通员工 (employee)
| 模块 | 权限 |
|------|------|
| 项目管理 | view |
| 任务 | view, complete |
| 日程 | 全部权限 |
| 消息 | 全部权限 |
| 知识库 | view |

---

## 五、预设岗位权限

| 岗位 | 专属权限 |
|------|---------|
| 插画 | task:view, task:complete, shared_resource:all |
| 产品设计 | task:view, task:complete, product:view |
| 详情设计 | task:view, task:complete, product:view, product:edit |
| 文案撰写 | task:view, task:complete, knowledge:create, knowledge:edit |
| 采购管理 | supplier:all, purchase_order:all |
| 包装设计 | task:view, task:complete, shared_resource:all |
| 财务管理 | sales_stats:view, purchase_order:view, approval:approve |
| 客服培训 | feedback:all, product_feedback:view |
| 仓储管理 | product:view, product:manage_inventory |
| 运营管理 | campaign:all, analytics:view |

---

## 六、权限检查逻辑

```typescript
async function checkUserPermission(userId: string, module: string, resource: string, action: string): Promise<boolean> {
  // 1. 检查是否超级管理员
  if (await isSuperAdmin(userId)) return true;

  // 2. 检查用户个人权限（最高优先级）
  const userPerm = await getUserPermission(userId, resource, action);
  if (userPerm !== null) return userPerm; // 明确授权或拒绝

  // 3. 检查岗位权限
  const positionPerm = await getPositionPermission(userId, resource, action);
  if (positionPerm) return true;

  // 4. 检查角色权限
  const rolePerm = await getRolePermission(userId, resource, action);
  if (rolePerm) return true;

  // 5. 默认拒绝
  return false;
}
```

---

## 七、API 接口设计

### 7.1 权限管理 API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/admin/permissions` | GET | 获取所有权限列表 |
| `/api/admin/roles` | GET/POST | 角色 CRUD |
| `/api/admin/roles/[id]/permissions` | GET/PUT | 角色权限配置 |
| `/api/admin/positions` | GET/POST | 岗位 CRUD |
| `/api/admin/positions/[id]/permissions` | GET/PUT | 岗位权限配置 |
| `/api/admin/users/[id]/permissions` | GET/PUT | 用户个人权限配置 |
| `/api/admin/users/[id]/roles` | GET/PUT | 用户角色分配 |
| `/api/admin/users/[id]/positions` | GET/PUT | 用户岗位分配 |

### 7.2 权限查询 API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/auth/my-permissions` | GET | 获取当前用户所有权限 |
| `/api/auth/check-permission` | POST | 检查是否有某权限 |

---

## 八、前端权限控制

### 8.1 权限组件

```tsx
// 根据权限显示/隐藏内容
<PermissionGuard module="product" action="create">
  <Button>新建商品</Button>
</PermissionGuard>
```

### 8.2 权限 Hook

```tsx
const { hasPermission, permissions } = usePermissions();

if (hasPermission('product', 'create')) {
  // 显示创建按钮
}
```

---

## 九、实施步骤

1. **数据库迁移**：创建新的权限相关表
2. **初始化数据**：插入预设权限、角色、岗位数据
3. **后端实现**：实现权限检查逻辑和 API
4. **前端适配**：添加权限控制和权限管理界面
5. **数据迁移**：迁移现有权限数据到新系统
6. **测试验证**：全面测试权限功能

---

需要我开始实现这个权限系统吗？
