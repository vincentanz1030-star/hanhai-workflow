/**
 * 角色权限管理 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.COZE_SUPABASE_URL;
  const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase config');
  return createClient(supabaseUrl, supabaseKey);
}

// GET - 获取角色权限
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;

    // 获取角色信息
    const { data: role, error: roleError } = await supabase
      .from('roles_v2')
      .select('*')
      .eq('id', id)
      .single();

    if (roleError || !role) {
      return NextResponse.json({ success: false, error: '角色不存在' }, { status: 404 });
    }

    // 获取角色权限
    const { data: rolePerms, error } = await supabase
      .from('role_permissions_v2')
      .select(`
        permission_id,
        granted_at,
        permission:permissions_v2(
          id, code, name, resource,
          module:permission_modules(id, code, name),
          action:permission_actions(id, code, name, color)
        )
      `)
      .eq('role_id', id);

    if (error) throw error;

    // 超级管理员特殊处理
    if (role.code === 'super_admin') {
      const { data: allPerms } = await supabase
        .from('permissions_v2')
        .select(`id, code, name, resource, module:permission_modules(id, code, name), action:permission_actions(id, code, name, color)`);

      return NextResponse.json({
        success: true,
        data: {
          role,
          permissions: allPerms || [],
          is_super_admin: true,
        },
      });
    }

    const permissions = (rolePerms || []).map(p => p.permission);

    return NextResponse.json({
      success: true,
      data: {
        role,
        permissions,
        permission_ids: (rolePerms || []).map(p => p.permission_id),
      },
    });
  } catch (error) {
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
    const { data: role } = await supabase
      .from('roles_v2')
      .select('code')
      .eq('id', id)
      .single();

    if (role?.code === 'super_admin') {
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

      const { error } = await supabase
        .from('role_permissions_v2')
        .insert(inserts);

      if (error) throw error;
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
        .upsert(inserts, { onConflict: 'role_id,permission_id' });
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
