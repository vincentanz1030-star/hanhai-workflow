import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
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

  // 检查是否是管理员
  const isAdmin = authResult.roles?.some((r: { role: string }) => r.role === 'admin');
  if (!isAdmin) {
    return NextResponse.json({ error: '无权限执行此操作，仅限管理员' }, { status: 403 });
  }

  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    let query = supabase.from('users').select('id, email, name, brand, status, is_active, created_at');

    if (email) {
      query = query.eq('email', email);
    }

    const { data: users, error } = await query.limit(10);

    if (error) {
      return NextResponse.json(
        { error: '查询失败', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: users?.length || 0,
      users: users || [],
    });
  } catch (error) {
    console.error('诊断错误:', error);
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
