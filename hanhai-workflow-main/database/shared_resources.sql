-- 集团公司资源共享平台 - 数据库设计
-- 创建时间：2026-03-06

-- ============================================
-- 1. 供应商资源共享
-- ============================================

-- 共享供应商库
CREATE TABLE shared_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基本信息
  supplier_name VARCHAR(255) NOT NULL,
  supplier_type VARCHAR(100), -- 供应商类型：生产、设计、物流等
  contact_person VARCHAR(100),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  address TEXT,
  
  -- 合作信息
  cooperation_brands TEXT[], -- 合作品牌数组
  main_products TEXT[], -- 主要产品
  cooperation_start_date DATE,
  
  -- 评价信息
  quality_score DECIMAL(3,2), -- 质量评分 0-5
  price_score DECIMAL(3,2), -- 价格评分 0-5
  delivery_score DECIMAL(3,2), -- 交期评分 0-5
  service_score DECIMAL(3,2), -- 服务评分 0-5
  overall_score DECIMAL(3,2), -- 综合评分 0-5
  
  -- 状态
  status VARCHAR(50) DEFAULT 'active', -- active/inactive/blacklist
  verified BOOLEAN DEFAULT false, -- 是否已验证
  
  -- 共享设置
  shared_by UUID REFERENCES users(id),
  shared_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  
  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 索引优化
  INDEX idx_supplier_type (supplier_type),
  INDEX idx_supplier_score (overall_score),
  INDEX idx_supplier_status (status)
);

-- 供应商评价记录
CREATE TABLE shared_supplier_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES shared_suppliers(id) ON DELETE CASCADE,
  
  -- 评价人信息
  reviewer_id UUID REFERENCES users(id),
  reviewer_brand VARCHAR(50),
  
  -- 评价内容
  quality_score DECIMAL(3,2),
  price_score DECIMAL(3,2),
  delivery_score DECIMAL(3,2),
  service_score DECIMAL(3,2),
  review_content TEXT,
  
  -- 合作项目
  project_name VARCHAR(255),
  cooperation_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_review_supplier (supplier_id),
  INDEX idx_review_reviewer (reviewer_id)
);

-- ============================================
-- 2. 设计资源共享
-- ============================================

-- 设计素材库
CREATE TABLE shared_design_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基本信息
  asset_name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(100), -- 图片/图标/字体/视频/音频
  category VARCHAR(100), -- 分类：主图/详情页/海报/视频等
  tags TEXT[],
  
  -- 文件信息
  file_url TEXT,
  file_key VARCHAR(500), -- 对象存储 key
  file_size INTEGER,
  file_format VARCHAR(50),
  width INTEGER,
  height INTEGER,
  
  -- 预览图
  preview_url TEXT,
  preview_key VARCHAR(500),
  
  -- 使用信息
  usage_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  -- 评分
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- 共享信息
  shared_by UUID REFERENCES users(id),
  shared_brand VARCHAR(50),
  is_public BOOLEAN DEFAULT true,
  
  -- 元数据
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_asset_type (asset_type),
  INDEX idx_asset_category (category),
  INDEX idx_asset_shared_by (shared_by)
);

-- 设计模板库
CREATE TABLE shared_design_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基本信息
  template_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(100), -- 主图/详情页/海报/包装等
  category VARCHAR(100),
  description TEXT,
  tags TEXT[],
  
  -- 文件信息
  file_url TEXT,
  file_key VARCHAR(500),
  preview_url TEXT,
  preview_key VARCHAR(500),
  
  -- 使用信息
  usage_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  -- 适用品牌
  applicable_brands TEXT[], -- 适用的品牌
  
  -- 评分
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- 共享信息
  shared_by UUID REFERENCES users(id),
  shared_brand VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_template_type (template_type),
  INDEX idx_template_category (category)
);

-- ============================================
-- 3. 营销案例共享
-- ============================================

CREATE TABLE shared_marketing_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基本信息
  case_name VARCHAR(255) NOT NULL,
  case_type VARCHAR(100), -- 大促/新品/节日/日常等
  campaign_type VARCHAR(100), -- 促销/品牌/会员等
  
  -- 品牌信息
  brand VARCHAR(50),
  
  -- 活动时间
  start_date DATE,
  end_date DATE,
  
  -- 活动内容
  objective TEXT, -- 活动目标
  strategy TEXT, -- 活动策略
  execution TEXT, -- 执行过程
  results TEXT, -- 活动结果
  lessons TEXT, -- 经验教训
  
  -- 数据指标
  roi DECIMAL(10,2), -- 投资回报率
  gmv DECIMAL(12,2), -- 成交金额
  traffic INTEGER, -- 流量
  conversion_rate DECIMAL(5,2), -- 转化率
  
  -- 附件
  attachments TEXT[], -- 附件URL数组
  images TEXT[], -- 图片URL数组
  
  -- 评分
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- 共享信息
  shared_by UUID REFERENCES users(id),
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_case_type (case_type),
  INDEX idx_case_brand (brand),
  INDEX idx_case_date (start_date, end_date)
);

-- ============================================
-- 4. 知识经验共享
-- ============================================

CREATE TABLE shared_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基本信息
  title VARCHAR(500) NOT NULL,
  category VARCHAR(100), -- 培训/操作手册/最佳实践/问题解决
  sub_category VARCHAR(100),
  tags TEXT[],
  
  -- 内容
  content TEXT,
  summary TEXT,
  
  -- 附件
  attachments TEXT[],
  
  -- 适用岗位
  applicable_positions TEXT[],
  
  -- 适用品牌
  applicable_brands TEXT[],
  
  -- 统计
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  -- 评分
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- 作者
  author_id UUID REFERENCES users(id),
  author_brand VARCHAR(50),
  
  -- 状态
  status VARCHAR(50) DEFAULT 'draft', -- draft/published/archived
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_knowledge_category (category),
  INDEX idx_knowledge_author (author_id),
  INDEX idx_knowledge_status (status)
);

-- ============================================
-- 5. 数据分析共享
-- ============================================

CREATE TABLE shared_data_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基本信息
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(100), -- 行业数据/竞品分析/用户洞察/市场机会
  category VARCHAR(100),
  
  -- 数据来源
  data_source VARCHAR(255),
  data_period VARCHAR(100), -- 数据周期
  
  -- 内容
  summary TEXT,
  insights TEXT, -- 洞察
  recommendations TEXT, -- 建议
  
  -- 数据
  data JSONB, -- 存储结构化数据
  
  -- 图表
  charts JSONB, -- 存储图表配置
  
  -- 附件
  attachments TEXT[],
  
  -- 统计
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  -- 共享信息
  shared_by UUID REFERENCES users(id),
  shared_brand VARCHAR(50),
  is_public BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_report_type (report_type),
  INDEX idx_report_shared_by (shared_by)
);

-- ============================================
-- 6. 人才资源共享
-- ============================================

CREATE TABLE shared_talents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基本信息
  name VARCHAR(100),
  gender VARCHAR(10),
  phone VARCHAR(50),
  email VARCHAR(255),
  
  -- 专业信息
  specialty VARCHAR(255), -- 专业特长
  skills TEXT[], -- 技能数组
  experience_years INTEGER, -- 工作年限
  education VARCHAR(100),
  
  -- 工作信息
  current_brand VARCHAR(50),
  current_position VARCHAR(100),
  available_for_borrow BOOLEAN DEFAULT false, -- 是否可借调
  
  -- 项目经验
  project_experience TEXT,
  
  -- 培训记录
  training_records JSONB,
  
  -- 评分
  performance_score DECIMAL(3,2),
  
  -- 推荐
  recommended_by UUID REFERENCES users(id),
  recommendation_note TEXT,
  
  -- 状态
  status VARCHAR(50) DEFAULT 'active',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_talent_brand (current_brand),
  INDEX idx_talent_specialty (specialty),
  INDEX idx_talent_available (available_for_borrow)
);

-- ============================================
-- 7. 工具资源共享
-- ============================================

CREATE TABLE shared_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基本信息
  tool_name VARCHAR(255) NOT NULL,
  tool_type VARCHAR(100), -- 软件/模板/流程图/检查清单
  category VARCHAR(100),
  description TEXT,
  
  -- 文件信息
  file_url TEXT,
  file_key VARCHAR(500),
  file_size INTEGER,
  
  -- 使用说明
  usage_guide TEXT,
  
  -- 适用范围
  applicable_positions TEXT[],
  applicable_brands TEXT[],
  
  -- 统计
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  -- 评分
  rating DECIMAL(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  
  -- 共享信息
  shared_by UUID REFERENCES users(id),
  shared_brand VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_tool_type (tool_type),
  INDEX idx_tool_category (category)
);

-- ============================================
-- 8. 资源评分系统
-- ============================================

CREATE TABLE shared_resource_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 资源信息
  resource_type VARCHAR(100), -- supplier/design/marketing/knowledge/data/talent/tool
  resource_id UUID,
  
  -- 评分人
  rater_id UUID REFERENCES users(id),
  rater_brand VARCHAR(50),
  
  -- 评分
  rating DECIMAL(3,2) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  comment TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(resource_type, resource_id, rater_id),
  INDEX idx_rating_resource (resource_type, resource_id)
);

-- ============================================
-- 9. 资源评论系统
-- ============================================

CREATE TABLE shared_resource_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 资源信息
  resource_type VARCHAR(100),
  resource_id UUID,
  
  -- 评论人
  commenter_id UUID REFERENCES users(id),
  commenter_brand VARCHAR(50),
  
  -- 评论内容
  content TEXT NOT NULL,
  
  -- 回复
  parent_id UUID REFERENCES shared_resource_comments(id),
  
  -- 点赞
  like_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_comment_resource (resource_type, resource_id)
);

-- ============================================
-- 10. 共享统计表
-- ============================================

CREATE TABLE shared_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 用户ID
  user_id UUID REFERENCES users(id),
  user_brand VARCHAR(50),
  
  -- 贡献统计
  suppliers_shared INTEGER DEFAULT 0,
  designs_shared INTEGER DEFAULT 0,
  cases_shared INTEGER DEFAULT 0,
  knowledge_shared INTEGER DEFAULT 0,
  tools_shared INTEGER DEFAULT 0,
  
  -- 使用统计
  resources_viewed INTEGER DEFAULT 0,
  resources_downloaded INTEGER DEFAULT 0,
  resources_used INTEGER DEFAULT 0,
  
  -- 互动统计
  ratings_given INTEGER DEFAULT 0,
  comments_made INTEGER DEFAULT 0,
  
  -- 积分
  contribution_points INTEGER DEFAULT 0,
  
  -- 时间周期
  period_type VARCHAR(20), -- daily/weekly/monthly/yearly
  period_value VARCHAR(50), -- 2026-03-06 / 2026-W10 / 2026-03 / 2026
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, period_type, period_value),
  INDEX idx_stats_user (user_id),
  INDEX idx_stats_period (period_type, period_value)
);

-- ============================================
-- 11. 权限控制表
-- ============================================

CREATE TABLE shared_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 资源类型
  resource_type VARCHAR(100),
  resource_id UUID,
  
  -- 品牌
  brand VARCHAR(50),
  
  -- 权限
  can_view BOOLEAN DEFAULT true,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_share BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_permission_resource (resource_type, resource_id),
  INDEX idx_permission_brand (brand)
);

-- ============================================
-- 创建视图
-- ============================================

-- 供应商评分统计视图
CREATE VIEW v_supplier_stats AS
SELECT 
  s.id,
  s.supplier_name,
  s.supplier_type,
  s.overall_score,
  COUNT(r.id) as review_count,
  AVG(r.quality_score) as avg_quality,
  AVG(r.price_score) as avg_price,
  AVG(r.delivery_score) as avg_delivery,
  AVG(r.service_score) as avg_service,
  s.view_count
FROM shared_suppliers s
LEFT JOIN shared_supplier_reviews r ON s.id = r.supplier_id
WHERE s.status = 'active'
GROUP BY s.id;

-- 资源热度排行视图
CREATE VIEW v_resource_hot AS
SELECT 
  'supplier' as type,
  id::text as resource_id,
  supplier_name as name,
  view_count,
  NULL as download_count,
  overall_score as rating
FROM shared_suppliers
WHERE status = 'active'

UNION ALL

SELECT 
  'design' as type,
  id::text as resource_id,
  asset_name as name,
  view_count,
  download_count,
  rating
FROM shared_design_assets

UNION ALL

SELECT 
  'marketing' as type,
  id::text as resource_id,
  case_name as name,
  view_count,
  NULL as download_count,
  rating
FROM shared_marketing_cases

ORDER BY view_count DESC, rating DESC
LIMIT 100;

-- 用户贡献排行视图
CREATE VIEW v_contribution_ranking AS
SELECT 
  u.id,
  u.name,
  u.brand,
  COALESCE(suppliers_shared, 0) as suppliers_shared,
  COALESCE(designs_shared, 0) as designs_shared,
  COALESCE(cases_shared, 0) as cases_shared,
  COALESCE(knowledge_shared, 0) as knowledge_shared,
  COALESCE(contribution_points, 0) as total_points
FROM users u
LEFT JOIN shared_statistics s ON u.id = s.user_id
WHERE s.period_type = 'monthly' 
  AND s.period_value = to_char(NOW(), 'YYYY-MM')
ORDER BY total_points DESC;

-- ============================================
-- 初始化触发器
-- ============================================

-- 更新时间戳触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_shared_suppliers_updated_at BEFORE UPDATE ON shared_suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shared_design_assets_updated_at BEFORE UPDATE ON shared_design_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shared_marketing_cases_updated_at BEFORE UPDATE ON shared_marketing_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shared_knowledge_updated_at BEFORE UPDATE ON shared_knowledge
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shared_data_reports_updated_at BEFORE UPDATE ON shared_data_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shared_talents_updated_at BEFORE UPDATE ON shared_talents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shared_tools_updated_at BEFORE UPDATE ON shared_tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 初始化索引优化
-- ============================================

-- 全文搜索索引
CREATE INDEX idx_supplier_search ON shared_suppliers 
  USING gin(to_tsvector('simple', supplier_name || ' ' || COALESCE(supplier_type, '')));

CREATE INDEX idx_design_search ON shared_design_assets 
  USING gin(to_tsvector('simple', asset_name || ' ' || COALESCE(array_to_string(tags, ' '), '')));

CREATE INDEX idx_knowledge_search ON shared_knowledge 
  USING gin(to_tsvector('simple', title || ' ' || COALESCE(summary, '')));

-- 组合索引
CREATE INDEX idx_supplier_brand_score ON shared_suppliers(status, overall_score DESC);
CREATE INDEX idx_design_type_rating ON shared_design_assets(asset_type, rating DESC);
CREATE INDEX idx_knowledge_cat_status ON shared_knowledge(category, status);
