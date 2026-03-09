# 销售目标品牌隔离修复

## 问题描述
销售目标板块的品牌隔离没有做好，不属于这个品牌的账号也能看到其他品牌的销售目标。

## 根本原因
销售目标相关的 API 路由没有实现品牌隔离逻辑：
- `GET /api/sales-targets/annual` - 返回所有品牌的销售目标
- `POST /api/sales-targets/annual` - 没有检查用户品牌权限
- `PUT /api/sales-targets/annual` - 没有检查用户品牌权限
- `DELETE /api/sales-targets/annual` - 没有检查用户品牌权限
- `PATCH /api/sales-targets/monthly` - 没有检查用户品牌权限

## 解决方案

### 修改文件

#### 1. src/app/api/sales-targets/annual/route.ts

**GET 方法 - 查看销售目标**
- ✅ 添加用户认证和权限检查
- ✅ 添加品牌隔离逻辑：
  - 管理员可以看到所有品牌的销售目标
  - 品牌用户只能看到自己品牌的销售目标
  - 用户品牌为 'all' 或未设置时返回空列表

**POST 方法 - 创建销售目标**
- ✅ 添加用户认证和权限检查
- ✅ 添加品牌隔离检查：
  - 管理员可以为任何品牌创建销售目标
  - 品牌用户只能为自己所属的品牌创建销售目标
  - 尝试为其他品牌创建时返回 403 错误

**PUT 方法 - 更新销售目标**
- ✅ 添加用户认证和权限检查
- ✅ 添加品牌隔离检查：
  - 管理员可以更新任何品牌的销售目标
  - 品牌用户只能更新自己品牌的销售目标
  - 非管理员尝试修改品牌时返回 403 错误

**DELETE 方法 - 删除销售目标**
- ✅ 添加用户认证和权限检查
- ✅ 添加品牌隔离检查：
  - 管理员可以删除任何品牌的销售目标
  - 品牌用户只能删除自己品牌的销售目标
  - 尝试删除其他品牌时返回 403 错误

#### 2. src/app/api/sales-targets/monthly/route.ts

**PATCH 方法 - 更新月度销售目标**
- ✅ 添加用户认证和权限检查
- ✅ 添加品牌隔离检查：
  - 管理员可以更新任何品牌的月度目标
  - 品牌用户只能更新自己品牌的月度目标
  - 尝试更新其他品牌时返回 403 错误

## 品牌隔离规则

### 管理员 (admin)
- ✅ 可以查看所有品牌的销售目标
- ✅ 可以创建任何品牌的销售目标
- ✅ 可以更新任何品牌的销售目标
- ✅ 可以删除任何品牌的销售目标

### 品牌用户 (he_zhe, baobao, ai_he, bao_deng_yuan)
- ✅ 只能查看自己品牌的销售目标
- ✅ 只能创建自己品牌的销售目标
- ✅ 只能更新自己品牌的销售目标
- ✅ 只能删除自己品牌的销售目标
- ❌ 无法访问其他品牌的销售目标
- ❌ 无法为其他品牌创建/更新/删除销售目标

### 未设置品牌的用户
- ❌ 无法查看任何销售目标（返回空列表）
- ❌ 无法创建销售目标（被拒绝）

## 代码示例

### GET 方法品牌隔离
```typescript
const isAdmin = authResult.roles.some(r => r.role === 'admin');
const userBrand = authResult.brand;

let query = client.from('annual_sales_targets').select('*');

if (!isAdmin) {
  // 品牌用户只能查看对应品牌的销售目标
  if (!userBrand || userBrand === 'all') {
    return NextResponse.json({ targets: [] });
  }
  query = query.eq('brand', userBrand);
}
```

### POST 方法品牌隔离
```typescript
const isAdmin = authResult.roles.some(r => r.role === 'admin');
const userBrand = authResult.brand;

// 非管理员用户只能创建自己品牌的销售目标
if (!isAdmin && brand !== userBrand) {
  return NextResponse.json(
    { error: '您只能为自己所属的品牌创建销售目标' },
    { status: 403 }
  );
}
```

## 测试验证

### 测试场景

1. **品牌用户查看销售目标**
   - 登录品牌用户（如 he_zhe）
   - 进入数据看板
   - 查看销售目标板块
   - ✅ 只能看到 he_zhe 品牌的销售目标

2. **品牌用户创建销售目标**
   - 登录品牌用户（如 he_zhe）
   - 尝试创建 baobao 品牌的销售目标
   - ❌ 返回 403 错误："您只能为自己所属的品牌创建销售目标"

3. **管理员查看销售目标**
   - 登录管理员账号
   - 查看销售目标板块
   - ✅ 可以看到所有品牌的销售目标

4. **品牌用户更新其他品牌的目标**
   - 登录品牌用户（如 he_zhe）
   - 尝试更新 baobao 品牌的销售目标
   - ❌ 返回 403 错误："您只能修改自己品牌的销售目标"

## 权限说明

### 销售目标相关权限
- `sales_target.view` - 查看销售目标
- `sales_target.create` - 创建销售目标
- `sales_target.edit` - 编辑销售目标
- `sales_target.delete` - 删除销售目标

### 默认权限配置
- **admin** - 拥有所有权限
- **he_zhe, baobao, ai_he, bao_deng_yuan** - 拥有自己品牌的销售目标权限

## 相关文件

- `src/app/api/sales-targets/annual/route.ts` - 年度销售目标 API
- `src/app/api/sales-targets/monthly/route.ts` - 月度销售目标 API
- `src/lib/api-auth.ts` - 认证和权限检查工具

## 后续建议

1. **添加日志记录**
   - 记录用户查看/创建/更新/删除销售目标的操作
   - 记录品牌隔离检查的警告信息

2. **添加审计日志**
   - 记录所有销售目标的变更历史
   - 记录操作用户和时间戳

3. **前端优化**
   - 在前端创建销售目标时，自动选择用户所属的品牌
   - 品牌用户隐藏品牌选择器（只能选择自己品牌）
   - 管理员可以选择任何品牌

4. **测试覆盖**
   - 添加品牌隔离的单元测试
   - 添加集成测试覆盖所有场景

---

**修复日期：** 2026-03-03
**修复内容：** 销售目标 API 路由品牌隔离
**影响范围：** 所有销售目标相关操作
**状态：** ✅ 已修复并部署
