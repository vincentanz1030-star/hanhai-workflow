import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateToken } from '@/lib/auth';
import { getPrimaryRole } from '@/lib/permissions';
import { getSupabaseClient, queryWithRetry } from '@/lib/db-pool';
import { rateLimit, rateLimitPresets } from '@/lib/rate-limit';

// 用户类型定义
interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  brand: string;
  is_active: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function POST(request: NextRequest) {
  // 添加请求 ID 用于追踪
  const requestId = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] [登录API] 收到登录请求`);

  // 解析请求体以获取邮箱（用于更精确的速率限制）
  let email = '';
  try {
    const body = await request.clone().json();
    email = body.email || '';
  } catch {
    // 忽略解析错误
  }

  // 速率限制检查（基于 IP + 邮箱）
  const rateLimitResponse = rateLimit(request, rateLimitPresets.login, email);
  if (rateLimitResponse) {
    console.log(`[${requestId}] [登录API] 速率限制触发: ${email}`);
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    console.log(`[${requestId}] [登录API] 登录邮箱: ${email}`);

    // 验证必填字段
    if (!email || !password) {
      console.log(`[${requestId}] [登录API] 缺少必填字段`);
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }

    // 使用连接池查询用户（带自动重试）
    console.log(`[${requestId}] [登录API] 查询用户信息...`);
    
    const { data: user, error } = await queryWithRetry<User>(async (client) => {
      return await client
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
    }, 5); // 最多重试 5 次

    if (error) {
      console.error(`[${requestId}] [登录API] 查询用户失败:`, {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      // 如果用户不存在，返回友好的错误信息
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: '邮箱或密码错误' },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: '登录失败，请稍后重试' },
        { status: 500 }
      );
    }

    if (!user) {
      console.log(`[${requestId}] [登录API] 用户不存在: ${email}`);
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    console.log(`[${requestId}] [登录API] 用户查询成功:`, {
      email: user.email,
      id: user.id,
      is_active: user.is_active,
      status: user.status,
      has_password_hash: !!user.password_hash,
      password_hash_length: user.password_hash ? user.password_hash.length : 0
    });

    // 验证密码哈希是否存在
    if (!user.password_hash || user.password_hash.length === 0) {
      console.error(`[${requestId}] [登录API] 密码哈希为空或无效:`, {
        email: user.email,
        has_password_hash: false
      });
      return NextResponse.json(
        { error: '账户数据异常，请联系管理员' },
        { status: 500 }
      );
    }

    // 检查用户是否启用
    if (!user.is_active) {
      console.log(`[${requestId}] [登录API] 用户未激活:`, user.status);
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

    // 验证密码（添加详细日志）
    console.log(`[${requestId}] [登录API] 验证密码...`);
    let isPasswordValid = false;
    try {
      isPasswordValid = await verifyPassword(password, user.password_hash);
      console.log(`[${requestId}] [登录API] 密码验证结果:`, isPasswordValid);
    } catch (bcryptError) {
      console.error(`[${requestId}] [登录API] 密码验证异常:`, bcryptError);
      return NextResponse.json(
        { error: '登录验证失败，请联系管理员' },
        { status: 500 }
      );
    }

    if (!isPasswordValid) {
      console.log(`[${requestId}] [登录API] 密码验证失败`);
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    console.log(`[${requestId}] [登录API] 密码验证通过`);

    // 获取用户主角色（使用连接池）
    let primaryRole = null;
    try {
      const client = getSupabaseClient();
      primaryRole = await getPrimaryRole(user.id);
      console.log(`[${requestId}] [登录API] 用户角色:`, primaryRole);
    } catch (roleError) {
      console.error(`[${requestId}] [登录API] 获取用户角色失败:`, roleError);
      // 即使获取角色失败，也允许登录（使用默认角色）
      primaryRole = 'member';
    }

    // 生成Token
    console.log(`[${requestId}] [登录API] 生成Token...`);
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

    console.log(`[${requestId}] [登录API] 登录成功`);
    return response;
  } catch (error) {
    console.error(`[${requestId}] [登录API] 未捕获的错误:`, error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
