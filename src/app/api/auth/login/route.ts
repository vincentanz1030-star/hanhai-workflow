import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@storage/database/supabase-client';
import { verifyPassword, generateToken, setTokenCookie } from '@/lib/auth';
import { getPrimaryRole } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 查询用户
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    // 检查用户是否启用
    if (!user.is_active) {
      return NextResponse.json(
        { error: '账号已被禁用' },
        { status: 403 }
      );
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    // 获取用户主角色
    const primaryRole = await getPrimaryRole(user.id);

    // 生成Token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      brand: user.brand,
    });

    // 设置Cookie
    await setTokenCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        brand: user.brand,
        role: primaryRole,
      },
      token,
    });
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
