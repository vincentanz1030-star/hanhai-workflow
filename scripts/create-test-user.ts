/**
 * 创建测试用户脚本
 * 运行方式: npx tsx scripts/create-test-user.ts
 */

import bcrypt from 'bcryptjs';

// 测试用户配置
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test@123456',
  name: '测试用户',
  brand: 'all', // 'all' 表示管理员，可查看所有品牌数据
  role: 'admin', // 管理员角色
};

async function createTestUser() {
  console.log('=== 开始创建测试用户 ===\n');
  
  try {
    // 动态导入以支持 ES Module
    const { getSupabaseClient, loadEnv } = await import('../src/storage/database/supabase-client');
    
    // 加载环境变量
    loadEnv();
    
    const supabase = getSupabaseClient();
    
    // 1. 检查用户是否已存在
    console.log('1. 检查用户是否存在...');
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, name, brand, is_active')
      .eq('email', TEST_USER.email)
      .single();
    
    if (existingUser) {
      console.log('用户已存在:', existingUser);
      console.log('\n更新用户状态...');
      
      // 更新用户状态为激活
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_active: true,
          status: 'approved',
          brand: TEST_USER.brand,
        })
        .eq('id', existingUser.id);
      
      if (updateError) {
        console.error('更新用户失败:', updateError);
        return;
      }
      
      console.log('用户状态已更新');
      return;
    }
    
    // 2. 创建新用户
    console.log('2. 创建新用户...');
    const passwordHash = await bcrypt.hash(TEST_USER.password, 10);
    
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: TEST_USER.email,
        password_hash: passwordHash,
        name: TEST_USER.name,
        brand: TEST_USER.brand,
        // 不设置 status，使用数据库默认值
        is_active: true, // 已激活
      })
      .select()
      .single();
    
    if (createError) {
      console.error('创建用户失败:', createError);
      return;
    }
    
    console.log('用户创建成功:', {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      brand: newUser.brand,
    });
    
    // 3. 分配角色
    console.log('3. 分配角色...');
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newUser.id,
        role: TEST_USER.role,
        is_primary: true,
      });
    
    if (roleError) {
      console.warn('分配角色失败 (可能已存在):', roleError.message);
    } else {
      console.log('角色分配成功:', TEST_USER.role);
    }
    
    // 4. 同时分配 user_roles_v2 (新版权限系统)
    console.log('4. 检查新版权限系统...');
    
    // 获取管理员角色ID
    const { data: adminRole } = await supabase
      .from('roles_v2')
      .select('id, code, name')
      .eq('code', 'admin')
      .single();
    
    if (adminRole) {
      const { error: roleV2Error } = await supabase
        .from('user_roles_v2')
        .insert({
          user_id: newUser.id,
          role_id: adminRole.id,
          is_primary: true,
        });
      
      if (roleV2Error) {
        console.warn('分配新版权色失败:', roleV2Error.message);
      } else {
        console.log('新版权色分配成功:', adminRole.name);
      }
    } else {
      console.log('新版权限系统未初始化，跳过角色分配');
    }
    
    console.log('\n=== 测试用户创建完成 ===');
    console.log('----------------------------------------');
    console.log('邮箱:', TEST_USER.email);
    console.log('密码:', TEST_USER.password);
    console.log('品牌:', TEST_USER.brand);
    console.log('角色:', TEST_USER.role);
    console.log('----------------------------------------');
    console.log('\n请使用以上账号登录系统进行测试');
    
  } catch (error) {
    console.error('脚本执行失败:', error);
    process.exit(1);
  }
}

createTestUser();
