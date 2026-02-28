-- 认证和权限系统数据库表结构
-- 执行顺序：按顺序执行即可

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(50) CHECK (brand IN ('he_zhe', 'baobao', 'ai_he', 'bao_deng_yuan', 'all')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 用户角色表（支持一人多岗）
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('illustration', 'product', 'detail', 'copywriting', 'purchasing', 'packaging', 'finance', 'customer_service', 'warehouse', 'operations', 'admin')),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- 3. 权限表
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    UNIQUE(resource, action)
);

-- 4. 角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, permission_id)
);

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_brand ON users(brand);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- 插入基础权限数据
INSERT INTO permissions (resource, action, description) VALUES
-- 项目相关权限
('project', 'view', '查看项目'),
('project', 'create', '创建项目'),
('project', 'edit', '编辑项目'),
('project', 'delete', '删除项目'),
-- 任务相关权限
('task', 'view', '查看任务'),
('task', 'create', '创建任务'),
('task', 'edit', '编辑任务'),
('task', 'delete', '删除任务'),
-- 产品框架权限
('product_framework', 'view', '查看产品框架'),
('product_framework', 'create', '创建产品框架'),
('product_framework', 'edit', '编辑产品框架'),
('product_framework', 'delete', '删除产品框架'),
-- 销售目标权限
('sales_target', 'view', '查看销售目标'),
('sales_target', 'edit', '编辑销售目标'),
-- 协同合作权限
('collaboration', 'view', '查看协同任务'),
('collaboration', 'create', '创建协同任务'),
('collaboration', 'edit', '编辑协同任务'),
('collaboration', 'delete', '删除协同任务'),
-- 用户管理权限
('user', 'view', '查看用户'),
('user', 'create', '创建用户'),
('user', 'edit', '编辑用户'),
('user', 'delete', '删除用户'),
('user', 'assign_role', '分配角色'),
-- 系统管理权限
('system', 'manage', '系统管理'),
('system', 'view_all', '查看所有品牌数据')
ON CONFLICT (resource, action) DO NOTHING;

-- 为不同角色分配基础权限
-- 管理员权限（所有权限）
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- 运营岗位权限
INSERT INTO role_permissions (role, permission_id)
SELECT 'operations', id FROM permissions
WHERE resource IN ('project', 'task', 'sales_target', 'collaboration', 'user', 'system')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 产品岗位权限
INSERT INTO role_permissions (role, permission_id)
SELECT 'product', id FROM permissions
WHERE resource IN ('project', 'task', 'product_framework') AND action IN ('view', 'create', 'edit')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 文案岗位权限
INSERT INTO role_permissions (role, permission_id)
SELECT 'copywriting', id FROM permissions
WHERE resource IN ('project', 'task', 'collaboration') AND action IN ('view', 'create', 'edit')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 插画岗位权限
INSERT INTO role_permissions (role, permission_id)
SELECT 'illustration', id FROM permissions
WHERE resource = 'task' AND action IN ('view', 'edit')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 详情岗位权限
INSERT INTO role_permissions (role, permission_id)
SELECT 'detail', id FROM permissions
WHERE resource = 'task' AND action IN ('view', 'edit')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 采购岗位权限
INSERT INTO role_permissions (role, permission_id)
SELECT 'purchasing', id FROM permissions
WHERE resource = 'task' AND action IN ('view', 'edit')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 包装岗位权限
INSERT INTO role_permissions (role, permission_id)
SELECT 'packaging', id FROM permissions
WHERE resource = 'task' AND action IN ('view', 'edit')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 财务岗位权限
INSERT INTO role_permissions (role, permission_id)
SELECT 'finance', id FROM permissions
WHERE resource IN ('sales_target', 'collaboration') AND action IN ('view', 'edit')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 客服岗位权限
INSERT INTO role_permissions (role, permission_id)
SELECT 'customer_service', id FROM permissions
WHERE resource = 'task' AND action = 'view'
ON CONFLICT (role, permission_id) DO NOTHING;

-- 仓储岗位权限
INSERT INTO role_permissions (role, permission_id)
SELECT 'warehouse', id FROM permissions
WHERE resource = 'task' AND action IN ('view', 'edit')
ON CONFLICT (role, permission_id) DO NOTHING;

COMMENT ON TABLE users IS '用户表';
COMMENT ON TABLE user_roles IS '用户角色关联表';
COMMENT ON TABLE permissions IS '权限表';
COMMENT ON TABLE role_permissions IS '角色权限关联表';
