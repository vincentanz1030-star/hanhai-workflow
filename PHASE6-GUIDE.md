# 第六批功能：其他功能

## 实施日期
2025-06-18

## 功能概览
实现第六批其他功能，包括：
1. ✅ Excel批量导入功能
2. ✅ 权限细化管理（RBAC增强）
3. ✅ 移动端响应式适配优化

---

## 功能1：Excel批量导入功能

### 1.1 导入API (`src/app/api/import/route.ts`)

#### 支持的导入类型
- **projects**: 项目导入
- **tasks**: 任务导入
- **sales_targets**: 销售目标导入

#### 字段映射

##### 项目导入（projects）
| Excel列名 | 数据库字段 | 说明 | 必填 |
|---------|-----------|------|-----|
| 项目名称 | name | 项目名称 | ✅ |
| 品牌 | brand | 品牌名称（合者/宝宝/爱合/宝登源） | ✅ |
| 类型 | category | 项目类型（产品开发/运营活动） | ✅ |
| 销售日期 | sales_date | 销售日期 | ✅ |
| 确认日期 | project_confirm_date | 项目确认日期 | ❌ |
| 预计完成日期 | overall_completion_date | 预计完成日期 | ❌ |
| 描述 | description | 项目描述 | ❌ |

##### 任务导入（tasks）
| Excel列名 | 数据库字段 | 说明 | 必填 |
|---------|-----------|------|-----|
| 项目ID | project_id | 项目ID（UUID） | ✅ |
| 任务名称 | task_name | 任务名称 | ✅ |
| 岗位 | role | 岗位名称（插画/产品/详情/文案/采购/包装/财务/客服/仓储/运营） | ✅ |
| 顺序 | task_order | 任务顺序 | ❌ |
| 描述 | description | 任务描述 | ❌ |
| 进度 | progress | 任务进度（0-100） | ❌ |
| 预计完成日期 | estimated_completion_date | 预计完成日期 | ❌ |
| 状态 | status | 任务状态 | ❌ |

##### 销售目标导入（sales_targets）
| Excel列名 | 数据库字段 | 说明 | 必填 |
|---------|-----------|------|-----|
| 品牌 | brand | 品牌名称（合者/宝宝/爱合/宝登源） | ✅ |
| 年份 | year | 年份（数字） | ✅ |
| 月份 | month | 月份（1-12） | ❌ |
| 月度目标 | target_amount | 月度目标金额 | ✅ |
| 实际完成 | actual_amount | 实际完成金额 | ❌ |
| 描述 | description | 描述 | ❌ |

#### API端点

**导入数据**
```
POST /api/import
Content-Type: multipart/form-data

参数：
- file: Excel文件（.xlsx或.xls）
- type: 导入类型（projects/tasks/sales_targets）

响应：
{
  "success": true,
  "result": {
    "success": true,
    "imported": 10,
    "failed": 2,
    "errors": [
      { "row": 3, "message": "缺少必填字段" }
    ]
  }
}
```

**下载模板**
```
GET /api/import?type=projects

响应：Excel文件下载
```

#### 权限要求
- 仅管理员可以导入数据
- 导入操作会记录到审计日志

### 1.2 导入组件 (`src/components/DataImportManager.tsx`)

#### 功能特性
- 支持三种导入类型的标签页切换
- 下载Excel模板功能
- 文件上传验证（仅支持Excel文件）
- 导入结果展示（成功/失败数量）
- 错误详情展示（行号+错误信息）
- 文件格式说明（列名列表）

#### UI组件
- `ImportSection`: 单个导入类型的上传区域
- 支持文件拖拽上传
- 实时显示选中的文件名
- 导入进度提示

---

## 功能2：权限细化管理（RBAC增强）

### 2.1 角色定义

| 角色ID | 角色名称 | 描述 |
|--------|---------|------|
| admin | 管理员 | 系统管理员，拥有所有权限 |
| manager | 项目经理 | 负责项目管理和协调 |
| illustration | 插画师 | 负责插画设计工作 |
| product_design | 产品设计师 | 负责产品设计工作 |
| detail_design | 详情设计师 | 负责详情页设计 |
| copywriting | 文案师 | 负责文案撰写 |
| procurement | 采购专员 | 负责采购工作 |
| packaging_design | 包装设计师 | 负责包装设计 |
| finance | 财务 | 负责财务管理 |
| customer_service | 客服 | 负责客户服务 |
| warehouse | 仓储 | 负责仓储管理 |
| operations | 运营 | 负责运营工作 |

### 2.2 权限定义

#### 项目管理
- `project_create`: 创建项目
- `project_view`: 查看项目
- `project_edit`: 编辑项目
- `project_delete`: 删除项目

#### 任务管理
- `task_create`: 创建任务
- `task_view`: 查看任务
- `task_edit`: 编辑任务
- `task_delete`: 删除任务
- `task_complete`: 完成任务

#### 用户管理
- `user_create`: 创建用户
- `user_view`: 查看用户
- `user_edit`: 编辑用户
- `user_delete`: 删除用户
- `user_approve`: 审核用户

#### 销售管理
- `sales_create`: 创建销售目标
- `sales_view`: 查看销售目标
- `sales_edit`: 编辑销售目标
- `sales_delete`: 删除销售目标

#### 品牌管理
- `brand_view`: 查看品牌
- `brand_edit`: 编辑品牌

#### 报表管理
- `report_view`: 查看报表
- `report_export`: 导出报表

#### 系统管理
- `system_config`: 系统配置
- `system_backup`: 数据备份
- `system_import`: 数据导入

#### 通知管理
- `notification_view`: 查看通知
- `notification_manage`: 管理通知

### 2.3 权限管理组件 (`src/components/PermissionManager.tsx`)

#### 功能特性
- **角色权限管理**:
  - 按类别分组显示权限（项目管理、任务管理等）
  - 使用开关（Switch）快速切换权限
  - 实时保存权限配置

- **用户角色管理**:
  - 显示所有用户列表
  - 为用户分配多个角色
  - 实时保存角色配置

#### UI结构
```
权限管理
├── 标签页：角色权限 / 用户角色
├── 保存按钮
└── 刷新按钮

角色权限
├── 角色卡片（12个）
│   ├── 角色名称和描述
│   └── 权限分类（9个）
│       └── 权限开关列表

用户角色
└── 用户列表
    ├── 用户信息（姓名、邮箱）
    └── 角色分配（12个角色开关）
```

---

## 功能3：移动端响应式适配优化

### 3.1 全局响应式样式 (`src/app/globals.css`)

#### 新增工具类

**隐藏滚动条**
```css
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

**安全区域适配**
```css
.safe-top { padding-top: env(safe-area-inset-top, 0px); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
.safe-left { padding-left: env(safe-area-inset-left, 0px); }
.safe-right { padding-right: env(safe-area-inset-right, 0px); }
```

**触摸优化**
```css
.touch-manipulation { touch-action: manipulation; }
.touch-pan-x { touch-action: pan-x; }
.touch-pan-y { touch-action: pan-y; }
```

#### 移动端断点样式

**小屏幕（< 768px）**
- `.mobile-card`: 移动端卡片样式
- `.mobile-button`: 移动端按钮（最小高度44px）
- `.mobile-input`: 移动端输入框（最小高度44px）
- `.mobile-grid-1`: 单列网格布局
- `.mobile-flex-col`: 垂直Flex布局
- `.mobile-text-sm`: 小号文本
- `.mobile-text-xs`: 超小号文本

**平板端（768px - 1024px）**
- `.tablet-grid-2`: 双列网格布局

**横屏移动端**
- `.landscape-compact`: 横屏紧凑布局

### 3.2 移动端菜单组件 (`src/components/MobileMenu.tsx`)

#### 功能特性
- 侧边抽屉式菜单
- 显示用户头像和邮箱
- 导航菜单项（首页、工作负载、关键路径、系统管理等）
- 退出登录按钮
- 路由高亮显示

#### UI结构
```
MobileMenu
├── 用户信息区域
│   ├── 头像
│   └── 姓名/邮箱
├── 导航菜单
│   └── 菜单项列表
│       ├── 图标
│       └── 标题
└── 底部操作
    └── 退出登录
```

### 3.3 移动端布局组件 (`src/components/MobileLayout.tsx`)

#### 功能特性
- 固定顶部栏（带模糊背景）
- 移动端菜单按钮
- 通知铃铛
- 居中标题
- 安全区域适配
- 底部安全区域预留

#### 响应式策略
- **小屏幕**（< 768px）: 使用移动端布局
- **中等及以上**（≥ 768px）: 使用桌面端布局

### 3.4 响应式设计最佳实践

#### 触摸目标尺寸
- 按钮最小高度：44px
- 输入框最小高度：44px
- 间距最小值：8px

#### 字体大小
- 移动端正文：16px
- 移动端小号文本：14px
- 移动端超小文本：12px

#### 布局策略
- 移动端：单列布局（grid-cols-1）
- 平板端：双列布局（grid-cols-2）
- 桌面端：多列布局（grid-cols-3/4）

#### 性能优化
- 使用 `backdrop-blur` 实现毛玻璃效果
- 使用 `sticky` 定位顶部栏
- 使用 `env(safe-area-inset-*)` 适配刘海屏

---

## 实施步骤

### 步骤1：安装xlsx库
```bash
pnpm add xlsx
```

### 步骤2：创建导入API
- 创建 `src/app/api/import/route.ts`
- 实现POST和GET方法
- 支持三种导入类型

### 步骤3：创建导入组件
- 创建 `src/components/DataImportManager.tsx`
- 实现文件上传和模板下载
- 实现结果展示和错误提示

### 步骤4：创建权限管理组件
- 创建 `src/components/PermissionManager.tsx`
- 实现角色权限管理
- 实现用户角色管理

### 步骤5：更新管理页面
- 在 `src/app/admin/page.tsx` 中添加新Tab
- 集成导入和权限管理组件

### 步骤6：添加移动端响应式样式
- 在 `src/app/globals.css` 中添加响应式工具类
- 定义移动端断点样式

### 步骤7：创建移动端组件
- 创建 `src/components/MobileMenu.tsx`
- 创建 `src/components/MobileLayout.tsx`

### 步骤8：测试和优化
- 测试Excel导入功能
- 测试权限管理功能
- 测试移动端响应式布局

---

## 技术要点

### 1. Excel文件解析
```typescript
import * as XLSX from 'xlsx';

// 读取Excel文件
const arrayBuffer = await file.arrayBuffer();
const workbook = XLSX.read(arrayBuffer, { type: 'array' });
const worksheet = workbook.Sheets[sheetName];
const jsonData = XLSX.utils.sheet_to_json(worksheet);
```

### 2. 生成Excel文件
```typescript
// 创建Excel文件
const worksheet = XLSX.utils.json_to_sheet(templateData);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
```

### 3. 权限数据结构
```typescript
// 角色权限映射
rolePermissions: Record<string, string[]> = {
  'admin': ['project_create', 'project_view', ...],
  'manager': ['project_view', 'task_create', ...],
  ...
}

// 用户角色映射
userRoles: Record<string, string[]> = {
  'user-id-1': ['admin', 'manager'],
  'user-id-2': ['illustration'],
  ...
}
```

### 4. 移动端安全区域
```css
/* 适配刘海屏和Home Indicator */
.safe-top {
  padding-top: env(safe-area-inset-top, 0px);
}
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

---

## 数据库影响

### 无需数据库修改
本批次功能使用现有数据库表：
- `role_permissions`: 角色权限关联表
- `user_roles`: 用户角色关联表
- `projects`: 项目表
- `tasks`: 任务表
- `monthly_sales_targets`: 月度销售目标表

---

## 权限要求

### 导入功能
- 仅管理员可以导入数据
- 需要验证用户角色

### 权限管理
- 仅管理员可以修改权限配置
- 需要验证管理员权限

### 审计日志
- 导入操作会记录到 `audit_logs` 表
- 权限修改会记录到 `audit_logs` 表

---

## 后续优化建议

### 1. 导入功能增强
- 支持更多文件格式（CSV、JSON）
- 支持增量导入（更新已存在数据）
- 添加导入预览功能
- 支持自定义字段映射

### 2. 权限管理增强
- 支持权限组（将多个权限打包）
- 支持自定义权限
- 支持权限继承
- 添加权限变更历史记录

### 3. 移动端体验优化
- 添加移动端原生App壳（PWA）
- 优化触摸手势（滑动、长按）
- 添加离线支持
- 优化图片加载

### 4. 性能优化
- 使用虚拟滚动优化长列表
- 懒加载组件
- 优化Excel文件解析性能
- 减少不必要的重渲染

---

## 已知问题

### 无

---

## 总结

第六批功能成功实现了Excel批量导入、权限细化管理和移动端响应式适配优化，为系统提供了更完善的数据管理、更细粒度的权限控制和更好的移动端体验。

---

**文档版本**: 1.0
**最后更新**: 2025-06-18
**作者**: AI开发团队
