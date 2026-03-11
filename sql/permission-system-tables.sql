-- =====================================================
-- Ai数据助手 - 高度自定义权限系统数据库表
-- =====================================================

-- 1. 权限模块表
CREATE TABLE IF NOT EXISTS permission_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 权限操作类型表
CREATE TABLE IF NOT EXISTS permission_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 权限表
CREATE TABLE IF NOT EXISTS permissions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES permission_modules(id) ON DELETE CASCADE,
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  action_id UUID REFERENCES permission_actions(id),
  resource VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_v2_module ON permissions_v2(module_id);
CREATE INDEX IF NOT EXISTS idx_permissions_v2_code ON permissions_v2(code);

-- 4. 角色表（升级版）
CREATE TABLE IF NOT EXISTS roles_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT 'blue',
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  user_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 岗位表（升级版）
CREATE TABLE IF NOT EXISTS positions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  description TEXT,
  color VARCHAR(20) DEFAULT 'green',
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  user_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 权限模板表
CREATE TABLE IF NOT EXISTS permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL,
  permission_ids JSONB DEFAULT '[]',
  is_public BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 角色权限关联表（升级版）
CREATE TABLE IF NOT EXISTS role_permissions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES roles_v2(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions_v2(id) ON DELETE CASCADE,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- 8. 岗位权限关联表（升级版）
CREATE TABLE IF NOT EXISTS position_permissions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES positions_v2(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions_v2(id) ON DELETE CASCADE,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(position_id, permission_id)
);

-- 9. 用户角色关联表（升级版）
CREATE TABLE IF NOT EXISTS user_roles_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role_id UUID REFERENCES roles_v2(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- 10. 用户岗位关联表（升级版）
CREATE TABLE IF NOT EXISTS user_positions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  position_id UUID REFERENCES positions_v2(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, position_id)
);

-- 11. 用户个人权限表
CREATE TABLE IF NOT EXISTS user_permissions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  permission_id UUID REFERENCES permissions_v2(id) ON DELETE CASCADE,
  is_granted BOOLEAN DEFAULT true,
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  remark TEXT,
  UNIQUE(user_id, permission_id)
);

-- 12. 权限变更日志表
CREATE TABLE IF NOT EXISTS permission_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  target_id UUID,
  action VARCHAR(20) NOT NULL,
  permission_id UUID,
  permission_code VARCHAR(100),
  old_value JSONB,
  new_value JSONB,
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permission_audit_logs_operator ON permission_audit_logs(operator_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_logs_target ON permission_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_logs_created ON permission_audit_logs(created_at);
