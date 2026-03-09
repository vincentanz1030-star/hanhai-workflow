-- =====================================================
-- 瀚海集团管理中台 - 数据库扩展表结构
-- =====================================================

-- =====================================================
-- 1. 商品中心表
-- =====================================================

-- 商品主表
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_code VARCHAR(50) UNIQUE NOT NULL, -- SKU编码
    name VARCHAR(255) NOT NULL, -- 商品名称
    description TEXT, -- 商品描述
    category_id UUID, -- 关联品类
    brand VARCHAR(50) NOT NULL, -- 品牌
    main_image TEXT, -- 主图
    images JSONB, -- 图片数组
    video_url TEXT, -- 视频链接
    attributes JSONB, -- 商品属性（规格、参数、标签）
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'deleted')), -- 状态
    lifecycle_stage VARCHAR(20) DEFAULT 'new' CHECK (lifecycle_stage IN ('new', 'hot', 'sale', 'clearance', 'offline')), -- 生命周期
    created_by UUID, -- 创建人
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID, -- 更新人
    tags JSONB DEFAULT '[]'::jsonb -- 商品标签
);

-- 商品价格表
CREATE TABLE IF NOT EXISTS product_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    cost_price DECIMAL(10,2), -- 成本价
    wholesale_price DECIMAL(10,2), -- 批发价
    retail_price DECIMAL(10,2), -- 零售价
    price_strategy JSONB, -- 价格策略（会员价、促销价等）
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 商品库存表
CREATE TABLE IF NOT EXISTS product_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    warehouse VARCHAR(50) NOT NULL, -- 仓库
    quantity INTEGER DEFAULT 0, -- 库存数量
    safety_stock INTEGER DEFAULT 0, -- 安全库存
    last_updated TIMESTAMP DEFAULT NOW()
);

-- 供应商档案表
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_code VARCHAR(50) UNIQUE NOT NULL, -- 供应商编码
    name VARCHAR(255) NOT NULL, -- 供应商名称
    contact_person VARCHAR(100), -- 联系人
    contact_phone VARCHAR(20), -- 联系电话
    contact_email VARCHAR(100), -- 联系邮箱
    address TEXT, -- 地址
    category VARCHAR(50), -- 供应商类别
    business_license TEXT, -- 营业执照
    tax_number VARCHAR(50), -- 税号
    bank_name VARCHAR(100), -- 开户行
    bank_account VARCHAR(50), -- 银行账号
    rating DECIMAL(3,2) DEFAULT 0, -- 供应商评级（0-5）
    rating_count INTEGER DEFAULT 0, -- 评分次数
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklist')), -- 状态
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID
);

-- 供应商评分表
CREATE TABLE IF NOT EXISTS supplier_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    rating_type VARCHAR(20) NOT NULL, -- 评分类型（quality, delivery, service, price）
    score INTEGER CHECK (score BETWEEN 1 AND 5), -- 评分（1-5）
    comment TEXT, -- 评价内容
    rated_by UUID, -- 评分人
    rated_at TIMESTAMP DEFAULT NOW()
);

-- 采购记录表
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(50) UNIQUE NOT NULL, -- 采购单号
    supplier_id UUID REFERENCES suppliers(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL, -- 采购数量
    unit_price DECIMAL(10,2), -- 单价
    total_price DECIMAL(12,2), -- 总价
    order_date DATE NOT NULL, -- 采购日期
    expected_date DATE, -- 预计到货日期
    actual_date DATE, -- 实际到货日期
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'shipped', 'received', 'cancelled')), -- 状态
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 商品销售统计表（月销量）
CREATE TABLE IF NOT EXISTS product_sales_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    year INTEGER NOT NULL, -- 年份
    month INTEGER NOT NULL, -- 月份
    sales_quantity INTEGER DEFAULT 0, -- 销售数量
    sales_amount DECIMAL(12,2) DEFAULT 0, -- 销售金额
    order_count INTEGER DEFAULT 0, -- 订单数
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, year, month)
);

-- 商品反馈表
CREATE TABLE IF NOT EXISTS product_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID, -- 反馈用户
    feedback_type VARCHAR(20) CHECK (feedback_type IN ('quality', 'usage', 'suggestion', 'complaint')), -- 反馈类型
    rating INTEGER CHECK (rating BETWEEN 1 AND 5), -- 评分
    content TEXT NOT NULL, -- 反馈内容
    images JSONB, -- 反馈图片
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved', 'closed')), -- 状态
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_by UUID, -- 处理人
    resolved_at TIMESTAMP -- 处理时间
);

-- =====================================================
-- 2. 营销中台表
-- =====================================================

-- 活动策划表
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_code VARCHAR(50) UNIQUE NOT NULL, -- 活动编码
    name VARCHAR(255) NOT NULL, -- 活动名称
    campaign_type VARCHAR(20) NOT NULL, -- 活动类型（618、双11、品牌日、节日等）
    description TEXT, -- 活动描述
    start_date DATE NOT NULL, -- 开始日期
    end_date DATE NOT NULL, -- 结束日期
    budget DECIMAL(12,2), -- 预算
    actual_cost DECIMAL(12,2), -- 实际花费
    target_gmv DECIMAL(12,2), -- 目标GMV
    actual_gmv DECIMAL(12,2), -- 实际GMV
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'ongoing', 'completed', 'cancelled')), -- 状态
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')), -- 优先级
    channels JSONB DEFAULT '[]'::jsonb, -- 渠道列表
    brands JSONB DEFAULT '[]'::jsonb, -- 品牌列表
    products JSONB DEFAULT '[]'::jsonb, -- 商品列表
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID
);

-- 活动任务表
CREATE TABLE IF NOT EXISTS campaign_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL, -- 任务名称
    task_type VARCHAR(20), -- 任务类型（设计、运营、采购、客服等）
    description TEXT, -- 任务描述
    assignee UUID, -- 负责人
    due_date DATE, -- 截止日期
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')), -- 状态
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')), -- 优先级
    progress INTEGER DEFAULT 0, -- 进度
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 活动执行记录表
CREATE TABLE IF NOT EXISTS campaign_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    execution_date DATE NOT NULL, -- 执行日期
    channel VARCHAR(50), -- 渠道
    content TEXT, -- 执行内容
    impressions INTEGER DEFAULT 0, -- 曝光量
    clicks INTEGER DEFAULT 0, -- 点击量
    cost DECIMAL(10,2) DEFAULT 0, -- 花费
    conversions INTEGER DEFAULT 0, -- 转化数
    revenue DECIMAL(12,2) DEFAULT 0, -- 收入
    created_at TIMESTAMP DEFAULT NOW()
);

-- 活动复盘表
CREATE TABLE IF NOT EXISTS campaign_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    summary TEXT, -- 活动总结
    achievements TEXT, -- 成果亮点
    issues TEXT, -- 问题分析
    lessons TEXT, -- 经验教训
    suggestions TEXT, -- 改进建议
    reviewed_by UUID, -- 复盘人
    reviewed_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. 企业协同平台表
-- =====================================================

-- 知识库表
CREATE TABLE IF NOT EXISTS knowledge_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL, -- 标题
    content TEXT NOT NULL, -- 内容
    category_id UUID, -- 分类ID
    tags JSONB DEFAULT '[]'::jsonb, -- 标签
    attachments JSONB DEFAULT '[]'::jsonb, -- 附件
    version INTEGER DEFAULT 1, -- 版本号
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')), -- 状态
    view_count INTEGER DEFAULT 0, -- 浏览次数
    like_count INTEGER DEFAULT 0, -- 点赞次数
    is_pinned BOOLEAN DEFAULT false, -- 是否置顶
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,
    published_at TIMESTAMP -- 发布时间
);

-- 知识库分类表
CREATE TABLE IF NOT EXISTS knowledge_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL, -- 分类名称
    parent_id UUID REFERENCES knowledge_categories(id), -- 父分类
    description TEXT, -- 描述
    sort_order INTEGER DEFAULT 0, -- 排序
    created_at TIMESTAMP DEFAULT NOW()
);

-- 项目协同任务表（扩展现有协作任务）
CREATE TABLE IF NOT EXISTS collaboration_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code VARCHAR(50) UNIQUE NOT NULL, -- 项目编码
    name VARCHAR(255) NOT NULL, -- 项目名称
    description TEXT, -- 项目描述
    start_date DATE, -- 开始日期
    end_date DATE, -- 结束日期
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')), -- 状态
    priority VARCHAR(20) DEFAULT 'medium', -- 优先级
    progress INTEGER DEFAULT 0, -- 进度
    owner UUID, -- 项目负责人
    members JSONB DEFAULT '[]'::jsonb, -- 项目成员
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 项目任务表
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES collaboration_projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES project_tasks(id), -- 父任务
    task_name VARCHAR(255) NOT NULL, -- 任务名称
    description TEXT, -- 任务描述
    assignee UUID, -- 负责人
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')), -- 状态
    priority VARCHAR(20) DEFAULT 'medium', -- 优先级
    start_date DATE, -- 开始日期
    due_date DATE, -- 截止日期
    estimated_hours DECIMAL(5,2), -- 预计工时
    actual_hours DECIMAL(5,2), -- 实际工时
    progress INTEGER DEFAULT 0, -- 进度
    sort_order INTEGER DEFAULT 0, -- 排序
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 任务评论表
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
    content TEXT NOT NULL, -- 评论内容
    attachments JSONB DEFAULT '[]'::jsonb, -- 附件
    mentioned_users JSONB DEFAULT '[]'::jsonb, -- 提到的用户
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 日程管理表
CREATE TABLE IF NOT EXISTS schedule_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL, -- 标题
    description TEXT, -- 描述
    start_time TIMESTAMP NOT NULL, -- 开始时间
    end_time TIMESTAMP NOT NULL, -- 结束时间
    all_day BOOLEAN DEFAULT false, -- 是否全天
    location VARCHAR(255), -- 地点
    event_type VARCHAR(20) CHECK (event_type IN ('meeting', 'task', 'reminder', 'other')), -- 事件类型
    priority VARCHAR(20) DEFAULT 'medium', -- 优先级
    attendees JSONB DEFAULT '[]'::jsonb, -- 参与者
    remind_before INTEGER DEFAULT 0, -- 提前提醒（分钟）
    recurrence JSONB, -- 重复规则
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')), -- 状态
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 审批流程定义表
CREATE TABLE IF NOT EXISTS approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_code VARCHAR(50) UNIQUE NOT NULL, -- 流程编码
    name VARCHAR(255) NOT NULL, -- 流程名称
    description TEXT, -- 描述
    category VARCHAR(50) NOT NULL, -- 分类（采购、报销、请假等）
    form_schema JSONB NOT NULL, -- 表单结构
    steps JSONB NOT NULL, -- 审批步骤
    is_active BOOLEAN DEFAULT true, -- 是否启用
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 审批实例表
CREATE TABLE IF NOT EXISTS approval_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES approval_workflows(id),
    instance_code VARCHAR(50) UNIQUE NOT NULL, -- 实例编号
    title VARCHAR(255) NOT NULL, -- 审批标题
    form_data JSONB NOT NULL, -- 表单数据
    initiator UUID NOT NULL, -- 发起人
    current_step INTEGER DEFAULT 0, -- 当前步骤
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'processing')), -- 状态
    started_at TIMESTAMP DEFAULT NOW(), -- 开始时间
    completed_at TIMESTAMP, -- 完成时间
    attachments JSONB DEFAULT '[]'::jsonb, -- 附件
    comments TEXT -- 备注
);

-- 审批记录表
CREATE TABLE IF NOT EXISTS approval_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES approval_instances(id) ON DELETE CASCADE,
    step INTEGER NOT NULL, -- 步骤
    approver UUID NOT NULL, -- 审批人
    action VARCHAR(20) CHECK (action IN ('approve', 'reject', 'transfer', 'comment')), -- 操作类型
    comment TEXT, -- 审批意见
    processed_at TIMESTAMP DEFAULT NOW(), -- 处理时间
    attachments JSONB DEFAULT '[]'::jsonb -- 附件
);

-- 内部消息表
CREATE TABLE IF NOT EXISTS internal_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('direct', 'group', 'system')), -- 消息类型
    sender UUID NOT NULL, -- 发送者
    receiver UUID, -- 接收者（私聊时使用）
    group_id UUID, -- 群组ID（群聊时使用）
    content TEXT NOT NULL, -- 消息内容
    message_type_detail VARCHAR(20), -- 消息详情类型（text、image、file、voice）
    attachments JSONB DEFAULT '[]'::jsonb, -- 附件
    is_read BOOLEAN DEFAULT false, -- 是否已读
    read_at TIMESTAMP, -- 已读时间
    reply_to UUID REFERENCES internal_messages(id), -- 回复的消息
    created_at TIMESTAMP DEFAULT NOW()
);

-- 消息群组表
CREATE TABLE IF NOT EXISTS message_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name VARCHAR(255) NOT NULL, -- 群组名称
    group_type VARCHAR(20) DEFAULT 'normal' CHECK (group_type IN ('normal', 'department', 'project')), -- 群组类型
    description TEXT, -- 描述
    members JSONB NOT NULL, -- 成员列表
    owner UUID NOT NULL, -- 群主
    is_active BOOLEAN DEFAULT true, -- 是否活跃
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 创建索引
-- =====================================================

-- 商品中心索引
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku_code);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_supplier_ratings_supplier ON supplier_ratings(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_product ON purchase_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_stats_product ON product_sales_stats(product_id);
CREATE INDEX IF NOT EXISTS idx_product_sales_stats_date ON product_sales_stats(year, month);
CREATE INDEX IF NOT EXISTS idx_product_feedbacks_product ON product_feedbacks(product_id);

-- 营销中台索引
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON marketing_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_date ON marketing_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaign_tasks_campaign ON campaign_tasks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_tasks_assignee ON campaign_tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_campaign_executions_campaign ON campaign_executions(campaign_id);

-- 企业协同平台索引
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_category ON knowledge_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_status ON knowledge_articles(status);
CREATE INDEX IF NOT EXISTS idx_collaboration_projects_owner ON collaboration_projects(owner);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assignee ON project_tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_schedule_events_creator ON schedule_events(created_by);
CREATE INDEX IF NOT EXISTS idx_schedule_events_date ON schedule_events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_approval_instances_workflow ON approval_instances(workflow_id);
CREATE INDEX IF NOT EXISTS idx_approval_instances_initiator ON approval_instances(initiator);
CREATE INDEX IF NOT EXISTS idx_approval_records_instance ON approval_records(instance_id);
CREATE INDEX IF NOT EXISTS idx_internal_messages_sender ON internal_messages(sender);
CREATE INDEX IF NOT EXISTS idx_internal_messages_receiver ON internal_messages(receiver);
CREATE INDEX IF NOT EXISTS idx_internal_messages_group ON internal_messages(group_id);

-- =====================================================
-- 创建触发器：自动更新 updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加触发器
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_prices_updated_at BEFORE UPDATE ON product_prices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_tasks_updated_at BEFORE UPDATE ON campaign_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_articles_updated_at BEFORE UPDATE ON knowledge_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaboration_projects_updated_at BEFORE UPDATE ON collaboration_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON project_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_events_updated_at BEFORE UPDATE ON schedule_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at BEFORE UPDATE ON approval_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_groups_updated_at BEFORE UPDATE ON message_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
