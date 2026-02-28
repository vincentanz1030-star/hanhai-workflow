import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPassword, generateToken, setTokenCookie } from '@/lib/auth';
import { getPrimaryRole } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[登录API] 尝试登录:', email);

    // 验证必填字段
    if (!email || !password) {
      console.log('[登录API] 缺少必填字段');
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 查询用户
    console.log('[登录API] 查询用户...');
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('[登录API] 查询用户失败:', error.message);
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    if (!user) {
      console.log('[登录API] 用户不存在');
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    console.log('[登录API] 用户查询成功:', user.email, user.is_active, user.status);

    // 检查用户是否启用
    if (!user.is_active) {
      console.log('[登录API] 用户未激活:', user.status);
      if (user.status === 'pending') {
        return NextResponse.json(
          { error: '账号正在审核中，请耐心等待' },
          { status: 403 }
        );
      } else if (user.status === 'rejected') {
        return NextResponse.json(
          { error: '账号审核未通过' },
          { status: 403 }
        );
      } else if (user.status === 'suspended') {
        return NextResponse.json(
          { error: '账号已被暂停' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: '账号已被禁用' },
        { status: 403 }
      );
    }

    // 验证密码
    console.log('[登录API] 验证密码...');
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    console.log('[登录API] 密码验证结果:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    console.log('[登录API] 密码验证通过');

    // 获取用户主角色
    const primaryRole = await getPrimaryRole(user.id);
    console.log('[登录API] 用户角色:', primaryRole);

    // 生成Token
    console.log('[登录API] 生成Token...');
    const token = generateToken({
      userId: user.id,
      email: user.email,
      brand: user.brand,
    });

    // 创建响应并设置Cookie
    const response = NextResponse.json({
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

    // 设置Cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7天
      path: '/',
    });

    console.log('[登录API] 登录成功');
    return response;
  } catch (error) {
    console.error('[登录API] 登录错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
