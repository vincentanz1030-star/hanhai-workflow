import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateToken } from '@/lib/auth';

// 直接从环境变量获取 Supabase 配置

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, name } = body;

    const supabase = getSupabaseClient();

    if (action === 'create_user') {
      // 创建测试用户
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return NextResponse.json({
          success: false,
          error: '用户已存在'
        }, { status: 400 });
      }

      const passwordHash = await hashPassword(password);

      const { data: newUser, error } = await supabase
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

      if (error) {
        return NextResponse.json({
          success: false,
          error: '创建用户失败',
          details: error.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: '测试用户创建成功',
        user: newUser
      });
    } else if (action === 'test_login') {
      // 测试登录
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return NextResponse.json({
          success: false,
          error: '用户不存在'
        }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        message: '用户查询成功',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          brand: user.brand,
          status: user.status,
          is_active: user.is_active,
        },
        loginEligible: user.is_active && user.status === 'active'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: '未知操作'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('测试登录错误:', error);
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
