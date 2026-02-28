import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// 获取用户列表（仅管理员）
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const canManageUsers = await hasPermission(currentUser.userId, 'user', 'manage');
    if (!canManageUsers) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const brand = searchParams.get('brand');

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

    // 过滤状态
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 过滤品牌（非管理员只能看自己品牌的用户）
    const userBrand = currentUser.brand;
    const userPrimaryRole = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.userId)
      .eq('is_primary', true)
      .single();

    const isSuperAdmin = userPrimaryRole?.data?.role === 'admin';

    if (!isSuperAdmin && userBrand) {
      query = query.eq('brand', userBrand);
    } else if (brand && brand !== 'all') {
      query = query.eq('brand', brand);
    }

    const { data: users, error } = await query;

    if (error) {
      return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
