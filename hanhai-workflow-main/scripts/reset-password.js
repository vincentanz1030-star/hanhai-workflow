#!/usr/bin/env node

/**
 * 重置用户密码
 *
 * 使用方法：
 * node scripts/reset-password.js <email> [password]
 *
 * 示例：
 * node scripts/reset-password.js hhwenhua@outlook.com 123456
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.COZE_SUPABASE_URL;
const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误：未设置环境变量');
  console.error('请设置以下环境变量：');
  console.error('  - COZE_SUPABASE_URL');
  console.error('  - COZE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const email = process.argv[2];
const newPassword = process.argv[3] || '123456';

if (!email) {
  console.error('❌ 错误：未指定邮箱');
  console.error('使用方法：node scripts/reset-password.js <email> [password]');
  console.error('示例：node scripts/reset-password.js hhwenhua@outlook.com 123456');
  process.exit(1);
}

async function resetPassword() {
  try {
    console.log(`📧 正在重置 ${email} 的密码...`);

    const supabase = createClient(supabaseUrl, supabaseKey, {
      db: { schema: 'public' }
    });

    // 查找用户
    console.log('\n1️⃣ 查找用户...');
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (findError) {
      console.error('❌ 查找用户失败:', findError.message);
      process.exit(1);
    }

    if (!user) {
      console.error(`❌ 用户 ${email} 不存在`);
      process.exit(1);
    }

    console.log(`✅ 找到用户: ${user.name || user.email}`);

    // 生成新密码哈希
    console.log('\n2️⃣ 生成新密码哈希...');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log(`✅ 密码哈希已生成 (长度: ${passwordHash.length})`);

    // 更新密码
    console.log('\n3️⃣ 更新密码...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ 更新密码失败:', updateError.message);
      process.exit(1);
    }

    console.log('✅ 密码已成功更新！');

    console.log('\n📋 用户信息:');
    console.log(`   邮箱: ${user.email}`);
    console.log(`   姓名: ${user.name || '未设置'}`);
    console.log(`   新密码: ${newPassword}`);
    console.log(`\n💡 提示: 请使用新密码登录系统`);
    console.log(`⚠️  警告: 为了安全起见，登录后请立即修改密码`);

  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

resetPassword();
