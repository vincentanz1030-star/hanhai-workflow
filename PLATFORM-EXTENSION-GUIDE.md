# 瀚海集团管理中台 - 新增模块说明

## 概述

本文档说明新增的三大模块：商品中心、营销中台、企业协同平台。

---

## 一、商品中心

### 功能模块

#### 1. 商品管理
- **商品基本信息**：SKU编码、商品名称、描述、分类、品牌、图片、视频
- **商品属性**：规格、参数、标签
- **价格管理**：成本价、批发价、零售价、价格策略
- **库存管理**：多仓库库存、安全库存
- **商品状态**：active（上架）、inactive（下架）、draft（草稿）、deleted（已删除）
- **生命周期**：new（新品）、hot（热卖）、sale（促销）、clearance（清仓）、offline（下架）

#### 2. 供应商管理
- **供应商档案**：供应商编码、名称、联系人、电话、邮箱、地址
- **供应商评级**：质量、交付、服务、价格四个维度（1-5星）
- **评分记录**：记录每次评分详情

#### 3. 采购管理
- **采购订单**：采购单号、供应商、商品、数量、单价、总价
- **订单状态**：pending（待审核）、approved（已批准）、shipped（已发货）、received（已收货）、cancelled（已取消）
- **日期管理**：采购日期、预计到货日期、实际到货日期

#### 4. 销售统计
- **月度统计**：年份、月份、销售数量、销售金额、订单数
- **自动聚合**：支持自动汇总月度数据

#### 5. 商品反馈
- **反馈类型**：quality（质量）、usage（使用）、suggestion（建议）、complaint（投诉）
- **反馈状态**：pending（待处理）、processing（处理中）、resolved（已解决）、closed（已关闭）
- **评分**：1-5星评分

### API接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 商品列表 | GET/POST | /api/product-center/products | 获取/创建商品 |
| 供应商列表 | GET/POST | /api/product-center/suppliers | 获取/创建供应商 |
| 采购订单 | GET/POST | /api/product-center/purchase-orders | 获取/创建采购订单 |
| 销售统计 | GET/POST | /api/product-center/sales-stats | 获取/更新销售统计 |
| 商品反馈 | GET/POST | /api/product-center/feedbacks | 获取/创建商品反馈 |

### 数据表

| 表名 | 说明 |
|------|------|
| products | 商品主表 |
| product_prices | 商品价格表 |
| product_inventory | 商品库存表 |
| suppliers | 供应商档案表 |
| supplier_ratings | 供应商评分表 |
| purchase_orders | 采购订单表 |
| product_sales_stats | 商品销售统计表 |
| product_feedbacks | 商品反馈表 |

---

## 二、营销中台

### 功能模块

#### 1. 活动策划
- **活动基本信息**：活动编码、名称、类型（618、双11、品牌日、节日等）
- **活动时间**：开始日期、结束日期
- **活动预算**：预算、实际花费、目标GMV、实际GMV
- **活动状态**：draft（草稿）、pending（待审批）、approved（已批准）、ongoing（进行中）、completed（已完成）、cancelled（已取消）
- **活动配置**：渠道列表、品牌列表、商品列表

#### 2. 活动任务
- **任务管理**：任务名称、类型、描述、负责人
- **任务进度**：状态、优先级、进度百分比
- **日期管理**：截止日期

#### 3. 活动执行
- **执行记录**：执行日期、渠道、内容
- **效果追踪**：曝光量、点击量、花费、转化数、收入

#### 4. 活动复盘
- **复盘内容**：活动总结、成果亮点、问题分析、经验教训、改进建议

### API接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 活动列表 | GET/POST | /api/marketing/campaigns | 获取/创建活动 |
| 活动任务 | GET/POST | /api/marketing/campaign-tasks | 获取/创建活动任务 |

### 数据表

| 表名 | 说明 |
|------|------|
| marketing_campaigns | 活动策划表 |
| campaign_tasks | 活动任务表 |
| campaign_executions | 活动执行记录表 |
| campaign_reviews | 活动复盘表 |

---

## 三、企业协同平台

### 功能模块

#### 1. 知识库
- **文章管理**：标题、内容、分类、标签、附件
- **版本管理**：版本号、历史记录
- **文章状态**：draft（草稿）、published（已发布）、archived（已归档）
- **互动功能**：浏览次数、点赞次数、置顶

#### 2. 项目协同
- **项目管理**：项目编码、名称、描述、开始日期、结束日期
- **项目状态**：pending（待开始）、in_progress（进行中）、completed（已完成）、cancelled（已取消）
- **项目成员**：项目负责人、项目成员
- **项目进度**：进度百分比

#### 3. 项目任务
- **任务管理**：任务名称、描述、负责人
- **任务层级**：支持父子任务
- **任务状态**：pending（待处理）、in_progress（进行中）、completed（已完成）、blocked（阻塞）
- **工时管理**：预计工时、实际工时

#### 4. 日程管理
- **日程创建**：标题、描述、开始时间、结束时间、地点
- **日程类型**：meeting（会议）、task（任务）、reminder（提醒）、other（其他）
- **重复规则**：支持重复日程
- **提醒功能**：提前提醒（分钟）
- **参与者**：参与人列表

#### 5. 审批流程
- **流程定义**：流程编码、名称、分类、表单结构、审批步骤
- **审批实例**：实例编号、标题、表单数据、发起人
- **审批状态**：pending（待审批）、approved（已批准）、rejected（已拒绝）、cancelled（已取消）、processing（处理中）
- **审批记录**：审批人、操作类型、审批意见

#### 6. 内部沟通
- **消息类型**：direct（私聊）、group（群聊）、system（系统消息）
- **消息类型详情**：text（文本）、image（图片）、file（文件）、voice（语音）
- **互动功能**：回复消息、@提及
- **群组管理**：群组名称、类型、成员列表

### API接口

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 知识库 | GET/POST | /api/collaboration/knowledge | 获取/创建知识文章 |
| 项目列表 | GET/POST | /api/collaboration/projects | 获取/创建项目 |
| 项目任务 | GET/POST | /api/collaboration/project-tasks | 获取/创建项目任务 |
| 日程管理 | GET/POST | /api/collaboration/schedule | 获取/创建日程 |
| 审批流程 | GET/POST | /api/collaboration/approvals | 获取/创建审批实例 |
| 内部消息 | GET/POST | /api/collaboration/messages | 获取/发送消息 |

### 数据表

| 表名 | 说明 |
|------|------|
| knowledge_articles | 知识文章表 |
| knowledge_categories | 知识分类表 |
| collaboration_projects | 项目协同表 |
| project_tasks | 项目任务表 |
| task_comments | 任务评论表 |
| schedule_events | 日程管理表 |
| approval_workflows | 审批流程定义表 |
| approval_instances | 审批实例表 |
| approval_records | 审批记录表 |
| internal_messages | 内部消息表 |
| message_groups | 消息群组表 |

---

## 四、部署说明

### 1. 执行数据库脚本

```bash
# 连接到Supabase数据库
psql -h <host> -U <user> -d <database> -f src/db/schema-extension.sql
```

### 2. 验证表创建

```sql
-- 查看所有新表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'products', 'suppliers', 'purchase_orders',
    'marketing_campaigns', 'campaign_tasks',
    'knowledge_articles', 'collaboration_projects',
    'schedule_events', 'approval_instances', 'internal_messages'
  )
ORDER BY table_name;
```

### 3. API测试

```bash
# 测试商品中心API
curl http://localhost:5000/api/product-center/products

# 测试营销中台API
curl http://localhost:5000/api/marketing/campaigns

# 测试企业协同平台API
curl http://localhost:5000/api/collaboration/knowledge
```

---

## 五、开发计划

### 第一阶段：商品中心（已完成）
- ✅ 数据库表结构设计
- ✅ API接口实现
- ⏳ 前端页面开发（待开始）

### 第二阶段：营销中台（已完成）
- ✅ 数据库表结构设计
- ✅ API接口实现
- ⏳ 前端页面开发（待开始）

### 第三阶段：企业协同平台（已完成）
- ✅ 数据库表结构设计
- ✅ API接口实现
- ⏳ 前端页面开发（待开始）

### 第四阶段：前端页面开发（待开始）
- 商品中心页面
- 营销中台页面
- 企业协同平台页面

---

## 六、后续优化建议

1. **性能优化**
   - 添加索引优化查询性能
   - 实现数据缓存机制
   - 使用数据中台聚合查询

2. **功能增强**
   - 添加数据导出功能
   - 实现批量操作
   - 添加消息通知
   - 集成第三方平台

3. **安全增强**
   - 添加API鉴权
   - 实现数据权限控制
   - 添加操作审计日志

4. **移动端适配**
   - 响应式设计
   - 移动端专用页面
   - 移动端API优化
