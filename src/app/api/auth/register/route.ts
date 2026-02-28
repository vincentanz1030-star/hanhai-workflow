import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { hashPassword, generateToken, setTokenCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, brand, role } = body;

    // 验证必填字段
    if (!email || !password || !name || !brand || !role) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 验证品牌
    const validBrands = ['he_zhe', 'baobao', 'ai_he', 'bao_deng_yuan', 'all'];
    if (!validBrands.includes(brand)) {
      return NextResponse.json(
        { error: '无效的品牌' },
        { status: 400 }
      );
    }

    // 验证角色
    const validRoles = ['illustration', 'product', 'detail', 'copywriting', 'purchasing', 'packaging', 'finance', 'customer_service', 'warehouse', 'operations', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: '无效的角色' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 检查邮箱是否已存在
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: '该邮箱已被注册' },
        { status: 400 }
      );
    }

    // 加密密码
    const passwordHash = await hashPassword(password);

    // 创建用户
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        brand,
      })
      .select()
      .single();

    if (createError || !newUser) {
      return NextResponse.json(
        { error: '创建用户失败' },
        { status: 500 }
      );
    }

    // 分配角色
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: newUser.id,
        role,
        is_primary: true,
      });

    if (roleError) {
      // 如果角色分配失败，删除用户
      await supabase.from('users').delete().eq('id', newUser.id);
      return NextResponse.json(
        { error: '分配角色失败' },
        { status: 500 }
      );
    }

    // 生成Token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      brand: newUser.brand,
    });

    // 创建响应并设置Cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        brand: newUser.brand,
        role,
      },
      token,
    });

    // 设置Cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7天
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
