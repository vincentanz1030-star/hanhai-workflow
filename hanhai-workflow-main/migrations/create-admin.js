import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  try {
    // 检查管理员账号是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin@example.com')
      .single();

    if (existingUser) {
      console.log('管理员账号已存在');
      return;
    }

    // 创建管理员账号
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: 'admin@example.com',
        password_hash: '$2a$10$N9qo8uLOickgx2ZMRZoMye.IJzVp9Vj4KZ7Y7jF0zKz9XZ3xWq1e', // 密码: admin123
        name: '管理员',
        brand: 'all',
        status: 'active',
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('创建管理员账号失败:', createError);
      return;
    }

    // 分配管理员角色
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newUser.id,
        role: 'admin',
        is_primary: true,
      });

    if (roleError) {
      console.error('分配管理员角色失败:', roleError);
      return;
    }

    console.log('管理员账号创建成功！');
    console.log('邮箱: admin@example.com');
    console.log('密码: admin123');
  } catch (error) {
    console.error('创建管理员账号错误:', error);
  }
}

createAdminUser();
