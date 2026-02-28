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

async function testLoginLogic() {
  loadEnv();

  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('环境变量未设置');
    process.exit(1);
  }

  const supabase = createClient(url, anonKey, {
    db: { schema: 'public' }
  });

  const email = 'admin@hanhai.com';
  const password = 'admin123';

  console.log('测试登录逻辑...');
  console.log('邮箱:', email);
  console.log('密码:', password);

  // 查询用户
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.error('❌ 查询用户失败:', error.message);
    process.exit(1);
  }

  if (!user) {
    console.error('❌ 用户不存在');
    process.exit(1);
  }

  console.log('✅ 用户查询成功');
  console.log('用户信息:');
  console.log('  ID:', user.id);
  console.log('  邮箱:', user.email);
  console.log('  姓名:', user.name);
  console.log('  状态:', user.status);
  console.log('  是否激活:', user.is_active);

  // 验证密码
  console.log('\n验证密码...');
  console.log('密码哈希:', user.password_hash.substring(0, 30) + '...');

  const isValid = await bcrypt.compare(password, user.password_hash);
  console.log('密码验证结果:', isValid ? '✅ 正确' : '❌ 错误');

  if (!isValid) {
    console.error('\n❌ 密码验证失败');
    process.exit(1);
  }

  console.log('\n✅ 登录逻辑测试通过！');
  process.exit(0);
}

testLoginLogic().catch(console.error);
