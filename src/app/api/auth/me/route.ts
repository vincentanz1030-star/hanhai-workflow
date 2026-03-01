import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/auth';
import { getUserRoles, getPrimaryRole } from '@/lib/permissions';

// 直接从环境变量获取 Supabase 配置
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Auth/Me] Supabase 环境变量未设置');
}

export async function GET(request: NextRequest) {
  try {
    // 获取当前用户，传入request对象以支持Authorization header
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: 'public' as const }
    });

    // 查询用户详细信息
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.userId)
      .single();

    if (error || !userData) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 获取用户角色
    const roles = await getUserRoles(user.userId);
    const primaryRole = await getPrimaryRole(user.userId);

    // 获取用户权限
    const { data: permissions } = await supabase
      .from('role_permissions')
      .select(`
        permission_id,
        permissions (
          resource,
          action,
          description
        )
      `)
      .in('role', roles.map(r => r.role));

    const permissionList = permissions?.map(p => ({
      resource: (p.permissions as any).resource,
      action: (p.permissions as any).action,
      description: (p.permissions as any).description,
    })) || [];

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        brand: userData.brand,
        isActive: userData.is_active,
        roles: roles,
        primaryRole: primaryRole,
        permissions: permissionList,
      },
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
