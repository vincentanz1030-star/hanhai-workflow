import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// 安全警告：此接口需要管理员权限
export async function GET(request: NextRequest) {
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

  // 从 request 中获取 email 参数
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: '缺少 email 参数' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseClient();

    // 查询用户
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, brand, is_active, status, created_at')
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

    // 查询用户角色
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        brand: user.brand,
        is_active: user.is_active,
        status: user.status,
        created_at: user.created_at,
      },
      roles: roles || [],
      rolesCount: roles?.length || 0,
    });

  } catch (error: any) {
    return NextResponse.json({
      error: '诊断失败',
      details: error?.message || '未知错误',
    }, { status: 500 });
  }
}
