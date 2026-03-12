/**
 * 角色权限管理 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// GET - 获取角色权限
export async function GET(
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

    // 获取角色信息
    const roleResult = await supabase
      .from('roles_v2')
      .select('*')
      .eq('id', id)
      .single();

    if (roleResult.error || !roleResult.data) {
      return NextResponse.json({ success: false, error: '角色不存在' }, { status: 404 });
    }

    // 获取角色权限关联
    const { data: rolePerms, error } = await supabase
      .from('role_permissions_v2')
      .select('permission_id, granted_at')
      .eq('role_id', id);

    if (error) throw error;

    const permissionIds = (rolePerms || []).map((p: any) => p.permission_id);

    // 如果没有权限，直接返回
    if (permissionIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          role: roleResult.data,
          permissions: [],
          permission_ids: [],
        },
      });
    }

    // 获取权限详情
    const { data: permissions } = await supabase
      .from('permissions_v2')
      .select('id, code, name, resource, module_id, action_id')
      .in('id', permissionIds);

    // 获取模块
    const moduleIds = [...new Set((permissions || []).map((p: any) => p.module_id).filter(Boolean))];
    const { data: modules } = moduleIds.length > 0 
      ? await supabase.from('permission_modules').select('id, code, name').in('id', moduleIds)
      : { data: [] };

    // 获取动作
    const actionIds = [...new Set((permissions || []).map((p: any) => p.action_id).filter(Boolean))];
    const { data: actions } = actionIds.length > 0
      ? await supabase.from('permission_actions').select('id, code, name, color').in('id', actionIds)
      : { data: [] };

    // 组装数据
    const moduleMap = new Map((modules || []).map((m: any) => [m.id, m]));
    const actionMap = new Map((actions || []).map((a: any) => [a.id, a]));

    const formattedPermissions = (permissions || []).map((p: any) => ({
      ...p,
      module: moduleMap.get(p.module_id) || null,
      action: actionMap.get(p.action_id) || null,
    }));

    // 超级管理员特殊处理
    if (roleResult.data.code === 'super_admin') {
      const { data: allPerms } = await supabase
        .from('permissions_v2')
        .select('id, code, name, resource, module_id, action_id');

      const allModuleIds = [...new Set((allPerms || []).map((p: any) => p.module_id).filter(Boolean))];
      const allActionIds = [...new Set((allPerms || []).map((p: any) => p.action_id).filter(Boolean))];
      
      const { data: allModules } = allModuleIds.length > 0
        ? await supabase.from('permission_modules').select('id, code, name').in('id', allModuleIds)
        : { data: [] };
      
      const { data: allActions } = allActionIds.length > 0
        ? await supabase.from('permission_actions').select('id, code, name, color').in('id', allActionIds)
        : { data: [] };

      const allModuleMap = new Map((allModules || []).map((m: any) => [m.id, m]));
      const allActionMap = new Map((allActions || []).map((a: any) => [a.id, a]));

      const formattedAllPerms = (allPerms || []).map((p: any) => ({
        ...p,
        module: allModuleMap.get(p.module_id) || null,
        action: allActionMap.get(p.action_id) || null,
      }));

      return NextResponse.json({
        success: true,
        data: {
          role: roleResult.data,
          permissions: formattedAllPerms,
          is_super_admin: true,
          permission_ids: (allPerms || []).map((p: any) => p.id),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        role: roleResult.data,
        permissions: formattedPermissions,
        permission_ids: permissionIds,
      },
    });
  } catch (error) {
    console.error('[角色权限API] 错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    );
  }
}

// PUT - 设置角色权限（全量替换）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { permission_ids } = body;

    if (!Array.isArray(permission_ids)) {
      return NextResponse.json({ success: false, error: '权限ID列表格式错误' }, { status: 400 });
    }

    // 检查角色
    const roleResult = await supabase
      .from('roles_v2')
      .select('code')
      .eq('id', id)
      .single();

    if (roleResult.data?.code === 'super_admin') {
      return NextResponse.json({ success: false, error: '超级管理员权限不可修改' }, { status: 403 });
    }

    // 删除旧权限
    await supabase.from('role_permissions_v2').delete().eq('role_id', id);

    // 插入新权限
    if (permission_ids.length > 0) {
      const inserts = permission_ids.map((permId: string) => ({
        role_id: id,
        permission_id: permId,
        granted_at: new Date().toISOString(),
      }));

      const result = await supabase
        .from('role_permissions_v2')
        .insert(inserts);

      if (result.error) throw result.error;
    }

    return NextResponse.json({
      success: true,
      message: '权限设置成功',
      count: permission_ids.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '设置失败' },
      { status: 500 }
    );
  }
}

// PATCH - 增量更新权限
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { grant, revoke } = body;

    // 授权
    if (grant && grant.length > 0) {
      const inserts = grant.map((permId: string) => ({
        role_id: id,
        permission_id: permId,
        granted_at: new Date().toISOString(),
      }));

      await supabase
        .from('role_permissions_v2')
        .upsert(inserts);
    }

    // 撤销
    if (revoke && revoke.length > 0) {
      await supabase
        .from('role_permissions_v2')
        .delete()
        .eq('role_id', id)
        .in('permission_id', revoke);
    }

    return NextResponse.json({
      success: true,
      message: '权限更新成功',
      granted: grant?.length || 0,
      revoked: revoke?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新失败' },
      { status: 500 }
    );
  }
}
