import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('开始执行数据库迁移...');

  try {
    // 添加 status 字段
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
      `
    });

    if (addColumnError) {
      console.log('注意：可能需要手动添加status字段', addColumnError.message);
    }

    // 更新现有用户的 status
    await supabase
      .from('users')
      .update({ status: 'active' })
      .is('is_active', true)
      .is('status', null);

    await supabase
      .from('users')
      .update({ status: 'suspended' })
      .is('is_active', false)
      .is('status', null);

    await supabase
      .from('users')
      .update({ status: 'active' })
      .is('status', null);

    console.log('用户状态字段更新完成');

    // 创建用户审核日志表
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          action VARCHAR(50) NOT NULL,
          old_value JSONB,
          new_value JSONB,
          reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (tableError) {
      console.log('注意：user_audit_logs表可能已存在或需要手动创建', tableError.message);
    }

    console.log('数据库迁移完成');
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
}

runMigration();
