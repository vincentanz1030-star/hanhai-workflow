import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

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
      // 如果用户已存在，检查是否有管理员角色
      const { data: existingRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', existingUser.id);

      const hasAdminRole = existingRoles?.some(r => r.role === 'admin');

      return NextResponse.json({
        success: true,
        message: hasAdminRole
          ? '✅ 管理员账号已存在\n邮箱: admin@hanhai.com\n密码: admin123'
          : '✅ 用户已存在，已添加管理员角色\n邮箱: admin@hanhai.com\n密码: admin123',
        user: {
          id: existingUser.id,
          email,
          name,
        },
      });
    }

    // 创建用户
    const passwordHash = await hashPassword(password);

    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        name,
        password_hash: passwordHash,
        brand: '瀚海集团',
        status: 'active',
        is_active: true,
      })
      .select('id, email, name, brand, status, is_active')
      .single();

    if (userError) {
      return NextResponse.json({
        success: false,
        error: '创建用户失败',
        details: userError.message
      }, { status: 500 });
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
      return NextResponse.json({
        success: false,
        error: '分配管理员角色失败',
        details: roleError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '✅ 管理员账号创建成功！\n邮箱: admin@hanhai.com\n密码: admin123',
      user: newUser,
    });
  } catch (error) {
    console.error('创建管理员错误:', error);
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
