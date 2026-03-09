/**
 * 快速重置密码脚本
 * 用法: node scripts/quick-reset-password.js <email> <new_password>
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// 从环境变量获取配置
const supabaseUrl = process.env.COZE_SUPABASE_URL;
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 错误: 未设置 Supabase 环境变量');
  console.error('请确保设置了 COZE_SUPABASE_URL 和 COZE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const email = process.argv[2] || 'hhwenhua@outlook.com';
const newPassword = process.argv[3] || 'Hanhai@2024';

async function resetPassword() {
  console.log('========================================');
  console.log('快速密码重置工具');
  console.log('========================================\n');
  console.log(`📧 邮箱: ${email}`);
  console.log(`🔑 新密码: ${newPassword}\n`);

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 生成新的密码哈希
    console.log('⏳ 生成密码哈希...');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log('✅ 密码哈希生成成功\n');

    // 更新用户密码
    console.log('⏳ 更新数据库...');
    const { data, error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('email', email)
      .select();

    if (error) {
      console.error('❌ 更新失败:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.error('❌ 用户不存在:', email);
      process.exit(1);
    }

    console.log('✅ 密码重置成功！\n');
    console.log('========================================');
    console.log('登录信息');
    console.log('========================================');
    console.log(`邮箱: ${email}`);
    console.log(`密码: ${newPassword}`);
    console.log('========================================\n');

  } catch (err) {
    console.error('❌ 发生错误:', err);
    process.exit(1);
  }
}

resetPassword();
