const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const bcrypt = require('bcryptjs');

// 加载环境变量
function loadEnv() {
  try {
    require('dotenv').config();
    if (process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY) {
      return;
    }
  } catch {
    // dotenv not available
  }

  try {
    const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;

    const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  } catch {
    // Silently fail
  }
}

// 使用 bcryptjs 进行密码哈希
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function createAdminUser() {
  loadEnv();

  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('环境变量未设置');
    process.exit(1);
  }

  const supabase = createClient(url, anonKey);

  const email = 'admin@hanhai.com';
  const password = 'admin123';
  const name = '管理员';

  // 检查用户是否已存在
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    // 检查是否有管理员角色
    const { data: existingRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', existingUser.id);

    const hasAdminRole = existingRoles?.some(r => r.role === 'admin');

    if (hasAdminRole) {
      console.log('✅ 管理员账号已存在');
      console.log('邮箱: admin@hanhai.com');
      console.log('密码: admin123');
      process.exit(0);
    } else {
      // 添加管理员角色
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: existingUser.id,
          role: 'admin',
        });

      if (roleError) {
        console.error('添加管理员角色失败:', roleError.message);
        process.exit(1);
      }

      console.log('✅ 已为现有用户添加管理员角色');
      console.log('邮箱: admin@hanhai.com');
      console.log('密码: admin123');
      process.exit(0);
    }
  }

  // 创建用户
  const passwordHash = await hashPassword(password);

  const { data: newUser, error: userError } = await supabase
    .from('users')
    .insert({
      email,
      name,
      password_hash: passwordHash,
      brand: 'all',
      status: 'active',
      is_active: true,
    })
    .select('id, email, name, brand, status, is_active')
    .single();

  if (userError) {
    console.error('创建用户失败:', userError.message);
    process.exit(1);
  }

  // 分配管理员角色
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({
      user_id: newUser.id,
      role: 'admin',
    });

  if (roleError) {
    // 如果角色分配失败，删除已创建的用户
    await supabase.from('users').delete().eq('id', newUser.id);
    console.error('分配管理员角色失败:', roleError.message);
    process.exit(1);
  }

  console.log('✅ 管理员账号创建成功！');
  console.log('邮箱: admin@hanhai.com');
  console.log('密码: admin123');
  process.exit(0);
}

createAdminUser().catch(console.error);
