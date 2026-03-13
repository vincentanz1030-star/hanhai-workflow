import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPassword } from '@/lib/auth';
import { requireAuth } from '@/lib/api-auth';

// 安全警告：此接口需要管理员权限
export async function POST(request: NextRequest) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // 检查是否是管理员
  const isAdmin = authResult.roles?.some((r: { role: string }) => r.role === 'admin');
  if (!isAdmin) {
    return NextResponse.json({ error: '无权限执行此操作，仅限管理员' }, { status: 403 });
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '缺少 email 或 password 参数' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 查询用户
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, is_active, status')
      .eq('email', email)
      .single();

    if (error) {
      return NextResponse.json({
        error: '查询用户失败',
        details: error.message,
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({
        error: '用户不存在',
        email,
      }, { status: 404 });
    }

    // 验证密码
    let isPasswordValid = false;
    let passwordError = null;

    try {
      isPasswordValid = await verifyPassword(password, user.password_hash);
    } catch (error) {
      passwordError = (error as Error).message;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        is_active: user.is_active,
        status: user.status,
      },
      passwordCheck: {
        hasPasswordHash: !!user.password_hash,
        passwordHashLength: user.password_hash?.length || 0,
        isPasswordValid,
        error: passwordError,
      },
    });

  } catch (error: any) {
    return NextResponse.json({
      error: '诊断失败',
      details: error?.message || '未知错误',
    }, { status: 500 });
  }
}
