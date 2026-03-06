import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPassword, generateToken } from '@/lib/auth';
import { getPrimaryRole } from '@/lib/permissions';

// 直接从环境变量获取 Supabase 配置
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

// 环境变量验证
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[登录API] 致命错误: Supabase 环境变量未设置');
  console.error('[登录API] COZE_SUPABASE_URL:', supabaseUrl ? '已设置' : '未设置');
  console.error('[登录API] COZE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '已设置' : '未设置');
}

export async function POST(request: NextRequest) {
  // 添加请求 ID 用于追踪
  const requestId = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] [登录API] 收到登录请求`);

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

    // 验证环境变量
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(`[${requestId}] [登录API] 致命错误: Supabase 环境变量未设置`);
      return NextResponse.json(
        { error: '服务器配置错误，请联系管理员' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: 'public' as const }
    });

    // 查询用户（添加重试机制）
    console.log(`[${requestId}] [登录API] 查询用户信息...`);
    let user = null;
    let error = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (!userError && userData) {
        user = userData;
        break;
      }

      error = userError;
      retryCount++;

      if (retryCount < maxRetries) {
        console.log(`[${requestId}] [登录API] 查询失败，第 ${retryCount} 次重试...`);
        await new Promise(resolve => setTimeout(resolve, 500)); // 等待 500ms 后重试
      }
    }

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
        password_hash: user.password_hash
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

    // 获取用户主角色
    let primaryRole = null;
    try {
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
