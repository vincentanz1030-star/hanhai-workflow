import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser } from '@/lib/auth';
import { getUserRoles, getPrimaryRole } from '@/lib/permissions';

// 类型定义
interface UserRole {
  role: string;
  is_primary?: boolean;
}

interface RolePermission {
  permission_id: string;
  permissions?: {
    resource: string;
    action: string;
    description: string;
  };
}

// 直接从环境变量获取 Supabase 配置

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

    const supabase = getSupabaseClient();

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
      .in('role', roles.map((r: UserRole) => r.role));

    const permissionList = permissions?.map((p: RolePermission) => ({
      resource: (p.permissions as { resource: string; action: string; description: string }).resource,
      action: (p.permissions as { resource: string; action: string; description: string }).action,
      description: (p.permissions as { resource: string; action: string; description: string }).description,
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
