import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';
import { isAdmin, getUserRoles } from '@/lib/permissions';
import { disableInProduction } from '@/lib/diagnostic-guard';

// 安全警告：此接口需要管理员权限
export async function GET(request: NextRequest) {
  // 生产环境禁用
  const disabledResponse = disableInProduction(request);
  if (disabledResponse) return disabledResponse;
  
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // 使用统一的权限检查函数
  const admin = await isAdmin(authResult.userId);
  if (!admin) {
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

    // 使用统一的权限模块查询用户角色
    const roles = await getUserRoles(user.id);

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
      roles: roles,
      rolesCount: roles.length,
    });

  } catch (error: any) {
    return NextResponse.json({
      error: '诊断失败',
      details: error?.message || '未知错误',
    }, { status: 500 });
  }
}
