-- 更新用户表，添加状态字段
-- 如果不存在 status 字段，则添加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'status'
    ) THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
    END IF;

    -- 如果 status 字段存在但没有默认值，添加默认值
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'status'
    ) THEN
        -- 更新现有用户的 status
        UPDATE users SET status = 'active' WHERE is_active = true;
        UPDATE users SET status = 'suspended' WHERE is_active = false AND status IS NULL;
        UPDATE users SET status = 'active' WHERE status IS NULL;
    END IF;
END $$;

-- 添加状态字段注释
COMMENT ON COLUMN users.status IS '用户状态: pending-待审核, active-已激活, rejected-已拒绝, suspended-已暂停';

-- 创建用户审核日志表
CREATE TABLE IF NOT EXISTS user_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- approve, reject, suspend, activate, role_change
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_user_id ON user_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_admin_id ON user_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_user_audit_logs_created_at ON user_audit_logs(created_at DESC);
