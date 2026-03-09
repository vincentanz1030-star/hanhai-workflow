#!/usr/bin/env node

/**
 * 设置用户为管理员账号
 *
 * 使用方法：
 * node scripts/set-admin.js hhwenhua@outlook.com
 */

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

if (!email) {
  console.error('❌ 错误：未指定邮箱');
  console.error('使用方法：node scripts/set-admin.js <email>');
  process.exit(1);
}

async function setAdmin() {
  try {
    console.log(`📧 正在设置 ${email} 为管理员...`);

    // 1. 查找用户 ID
    console.log('\n1️⃣ 查找用户...');
    const userResponse = await fetch(
      `${supabaseUrl}/rest/v1/users?email=eq.${email}&select=id,email`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!userResponse.ok) {
      console.error('❌ 查找用户失败');
      process.exit(1);
    }

    const users = await userResponse.json();
    if (!users || users.length === 0) {
      console.error(`❌ 用户 ${email} 不存在`);
      process.exit(1);
    }

    const userId = users[0].id;
    console.log(`✅ 找到用户: ${userId}`);

    // 2. 检查是否已经是管理员
    console.log('\n2️⃣ 检查现有角色...');
    const roleResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${userId}&role=eq.admin&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!roleResponse.ok) {
      console.error('❌ 检查角色失败');
      process.exit(1);
    }

    const roles = await roleResponse.json();

    if (roles.length > 0) {
      console.log('✅ 用户已经是管理员');
      console.log(`   用户ID: ${userId}`);
      console.log(`   邮箱: ${email}`);
      console.log(`   角色: ${roles.map(r => r.role).join(', ')}`);
      process.exit(0);
    }

    // 3. 设置为管理员
    console.log('\n3️⃣ 设置为管理员...');
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/user_roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        user_id: userId,
        role: 'admin',
        is_primary: true,
      }),
    });

    if (!insertResponse.ok) {
      const error = await insertResponse.text();
      console.error('❌ 设置管理员失败:', error);
      process.exit(1);
    }

    console.log('✅ 成功设置为管理员！');
    console.log(`\n📋 用户信息:`);
    console.log(`   用户ID: ${userId}`);
    console.log(`   邮箱: ${email}`);
    console.log(`   角色: admin (主管理员)`);
    console.log(`\n💡 提示: 请重新登录以使权限生效`);
  } catch (error) {
    console.error('❌ 错误:', error);
    process.exit(1);
  }
}

setAdmin();
