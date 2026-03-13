/**
 * 用户权限管理 API
 * 支持查看用户合并权限、设置个人权限、分配角色和岗位
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth, isAuthUser } from '@/lib/api-auth';

// 类型定义
interface RoleData {
  id: string;
  code: string;
  name: string;
  color: string;
  icon: string;
}

interface PositionData {
  id: string;
  code: string;
  name: string;
  department: string;
  color: string;
  icon: string;
}

interface UserRoleResult {
  is_primary: boolean;
  role: RoleData;
}

interface UserPositionResult {
  is_primary: boolean;
  position: PositionData;
}

interface PermissionData {
  id: string;
  code: string;
  name: string;
  resource: string;
  module: { id: string; code: string; name: string } | null;
  action: { id: string; code: string; name: string; color: string } | null;
}

interface UserPermissionResult {
  is_granted: boolean;
  expires_at: string | null;
  remark: string | null;
  granted_at: string;
  permission: PermissionData | null;
}

// GET - 获取用户完整权限信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    const authResult = await requireAuth(request);
    if (!isAuthUser(authResult)) {
      return authResult;
    }

    const supabase = getSupabaseClient();
    const { id } = await params;

    // 1. 获取用户角色
    const { data: userRoles } = await supabase
      .from('user_roles_v2')
      .select(`
        is_primary,
        role:roles_v2(id, code, name, color, icon)
      `)
      .eq('user_id', id) as { data: UserRoleResult[] | null };

    // 2. 获取用户岗位
    const { data: userPositions } = await supabase 
      .from('user_positions_v2')
      .select(`
        is_primary,
        position:positions_v2(id, code, name, department, color, icon)
      `)
      .eq('user_id', id) as { data: UserPositionResult[] | null };

    // 3. 获取用户个人权限
    const { data: userPerms } = await supabase
      .from('user_permissions_v2')
      .select(`
        is_granted, expires_at, remark, granted_at,
        permission:permissions_v2(
          id, code, name, resource,
          module:permission_modules(id, code, name),
          action:permission_actions(id, code, name, color)
        )
      `)
      .eq('user_id', id) as { data: UserPermissionResult[] | null };

    // 4. 获取角色权限ID集合
    const roleIds = (userRoles || []).map((r) => r.role?.id).filter(Boolean);
    let rolePermissionIds: string[] = [];
    
    if (roleIds.length > 0) {
      // 检查是否超级管理员
      const superAdminResult = await supabase
        .from('roles_v2')
        .select('id')
        .eq('code', 'super_admin')
        .in('id', roleIds)
        .single();

      if (superAdminResult.data) {
        // 超级管理员有所有权限
        const { data: allPerms } = await supabase
          .from('permissions_v2')
          .select('id');
        rolePermissionIds = (allPerms || []).map((p: { id: string }) => p.id);
      } else {
        const { data: rolePerms } = await supabase
          .from('role_permissions_v2')
          .select('permission_id')
          .in('role_id', roleIds);
        rolePermissionIds = [...new Set((rolePerms || []).map((p: { permission_id: string }) => p.permission_id))] as string[];
      }
    }

    // 5. 获取岗位权限ID集合
    const positionIds = (userPositions || []).map((p) => p.position?.id).filter(Boolean);
    let positionPermissionIds: string[] = [];
    
    if (positionIds.length > 0) {
      const { data: posPerms } = await supabase
        .from('position_permissions_v2')
        .select('permission_id')
        .in('position_id', positionIds);
      positionPermissionIds = [...new Set((posPerms || []).map((p: { permission_id: string }) => p.permission_id))] as string[];
    }

    // 6. 合并权限（角色 + 岗位）
    const mergedPermissionIds = new Set([...rolePermissionIds, ...positionPermissionIds]);

    // 7. 应用个人权限覆盖
    const grantedIds = new Set(mergedPermissionIds);
    const deniedIds = new Set<string>();

    (userPerms || []).forEach((up) => {
      const permId = up.permission?.id;
      if (!permId) return;
      
      // 检查过期时间
      if (up.expires_at && new Date(up.expires_at) < new Date()) return;

      if (up.is_granted) {
        grantedIds.add(permId);
        deniedIds.delete(permId);
      } else {
        grantedIds.delete(permId);
        deniedIds.add(permId);
      }
    });

    // 8. 获取权限详情
    const allPermIds = [...grantedIds, ...deniedIds];
    let mergedPermissions: any[] = [];
    
    if (allPermIds.length > 0) {
      const { data: perms } = await supabase
        .from('permissions_v2')
        .select(`
          id, code, name, resource,
          module:permission_modules(id, code, name),
          action:permission_actions(id, code, name, color)
        `)
        .in('id', allPermIds);
      
      mergedPermissions = (perms || []).map((p: any) => ({
        ...p,
        is_granted: grantedIds.has(p.id),
        is_denied: deniedIds.has(p.id),
      }));
    }

    return NextResponse.json({
      success: true,
      data: {
        roles: (userRoles || []).map((r: any) => r.role),
        positions: (userPositions || []).map((p: any) => p.position),
        personal_permissions: userPerms || [],
        merged_permissions: mergedPermissions,
        stats: {
          role_count: userRoles?.length || 0,
          position_count: userPositions?.length || 0,
          granted_count: grantedIds.size,
          denied_count: deniedIds.size,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    );
  }
}

// PUT - 设置用户角色/岗位/权限
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { type, role_ids, position_ids, permissions, grant, revoke, permission_ids } = body;

    // 设置角色
    if (type === 'roles' && Array.isArray(role_ids)) {
      await supabase.from('user_roles_v2').delete().eq('user_id', id);
      
      if (role_ids.length > 0) {
        const inserts = role_ids.map((roleId: string, index: number) => ({
          user_id: id,
          role_id: roleId,
          is_primary: index === 0,
          granted_at: new Date().toISOString(),
        }));
        await supabase.from('user_roles_v2').insert(inserts);
      }
      
      return NextResponse.json({ success: true, message: '角色设置成功' });
    }

    // 设置岗位
    if (type === 'positions' && Array.isArray(position_ids)) {
      await supabase.from('user_positions_v2').delete().eq('user_id', id);
      
      if (position_ids.length > 0) {
        const inserts = position_ids.map((posId: string, index: number) => ({
          user_id: id,
          position_id: posId,
          is_primary: index === 0,
          granted_at: new Date().toISOString(),
        }));
        await supabase.from('user_positions_v2').insert(inserts);
      }
      
      return NextResponse.json({ success: true, message: '岗位设置成功' });
    }

    // 设置个人权限 - 支持多种格式
    // 格式1: { type: 'permissions', permissions: [{ permission_id, is_granted }] }
    // 格式2: { grant: [...], revoke: [...] }
    // 格式3: { permission_ids: [...] } - 直接设置权限列表
    if (type === 'permissions' && Array.isArray(permissions)) {
      // 格式1
      for (const perm of permissions) {
        await supabase
          .from('user_permissions_v2')
          .upsert({
            user_id: id,
            permission_id: perm.permission_id,
            is_granted: perm.is_granted ?? true,
            expires_at: perm.expires_at,
            remark: perm.remark,
            granted_at: new Date().toISOString(),
          });
      }
      
      return NextResponse.json({ success: true, message: '权限设置成功' });
    }

    // 格式2: grant/revoke 模式
    if (grant !== undefined || revoke !== undefined) {
      // 先删除所有现有权限
      await supabase.from('user_permissions_v2').delete().eq('user_id', id);
      
      // 添加授权的权限
      if (Array.isArray(grant) && grant.length > 0) {
        const inserts = grant.map((permId: string) => ({
          user_id: id,
          permission_id: permId,
          is_granted: true,
          granted_at: new Date().toISOString(),
        }));
        const { error: grantError } = await supabase.from('user_permissions_v2').insert(inserts);
        if (grantError) {
          console.error('授权权限失败:', grantError);
          return NextResponse.json({ success: false, error: grantError.message }, { status: 500 });
        }
      }
      
      // 添加拒绝的权限（is_granted = false）
      if (Array.isArray(revoke) && revoke.length > 0) {
        const inserts = revoke.map((permId: string) => ({
          user_id: id,
          permission_id: permId,
          is_granted: false,
          granted_at: new Date().toISOString(),
        }));
        await supabase.from('user_permissions_v2').insert(inserts);
      }
      
      return NextResponse.json({ success: true, message: '权限设置成功' });
    }

    // 格式3: permission_ids 模式 - 直接替换
    if (permission_ids !== undefined && Array.isArray(permission_ids)) {
      // 先删除所有现有权限
      await supabase.from('user_permissions_v2').delete().eq('user_id', id);
      
      // 添加新的权限
      if (permission_ids.length > 0) {
        const inserts = permission_ids.map((permId: string) => ({
          user_id: id,
          permission_id: permId,
          is_granted: true,
          granted_at: new Date().toISOString(),
        }));
        const { error: insertError } = await supabase.from('user_permissions_v2').insert(inserts);
        if (insertError) {
          console.error('设置权限失败:', insertError);
          return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
        }
      }
      
      return NextResponse.json({ success: true, message: '权限设置成功' });
    }

    return NextResponse.json({ success: false, error: '无效的请求参数' }, { status: 400 });
  } catch (error) {
    console.error('权限设置错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '设置失败' },
      { status: 500 }
    );
  }
}

// DELETE - 移除用户个人权限
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get('permission_id');

    if (!permissionId) {
      return NextResponse.json({ success: false, error: '缺少权限ID' }, { status: 400 });
    }

    const result = await supabase
      .from('user_permissions_v2')
      .delete()
      .eq('user_id', id)
      .eq('permission_id', permissionId);

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, message: '权限已移除' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除失败' },
      { status: 500 }
    );
  }
}
