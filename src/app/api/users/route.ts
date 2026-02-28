import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@storage/database/supabase-client';
import { checkPermission, canViewAllBrands } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    // 验证用户登录
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 检查权限
    const hasPermission = await checkPermission(currentUser.userId, 'user', 'view');
    if (!hasPermission) {
      return NextResponse.json(
        { error: '无权限查看用户列表' },
        { status: 403 }
      );
    }

    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const brand = searchParams.get('brand');

    // 检查是否可以查看所有品牌
    const canViewAll = await canViewAllBrands(currentUser.userId);

    // 构建查询
    let query = supabase
      .from('users')
      .select(`
        *,
        user_roles (
          role,
          is_primary
        )
      `)
      .order('created_at', { ascending: false });

    // 品牌过滤
    if (!canViewAll && currentUser.brand !== 'all') {
      query = query.eq('brand', currentUser.brand);
    }

    if (brand && brand !== 'all') {
      query = query.eq('brand', brand);
    }

    const { data: users, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: '获取用户列表失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
