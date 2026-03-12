/**
 * 岗位权限管理 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取岗位权限
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;

    // 获取岗位信息
    const positionResult = await supabase
      .from('positions_v2')
      .select('*')
      .eq('id', id)
      .single();

    if (positionResult.error || !positionResult.data) {
      return NextResponse.json({ success: false, error: '岗位不存在' }, { status: 404 });
    }

    // 获取岗位权限
    const { data: posPerms, error } = await supabase
      .from('position_permissions_v2')
      .select(`
        permission_id,
        granted_at,
        permission:permissions_v2(
          id, code, name, resource,
          module:permission_modules(id, code, name),
          action:permission_actions(id, code, name, color)
        )
      `)
      .eq('position_id', id);

    if (error) throw error;

    const permissions = (posPerms || []).map((p: any) => p.permission);

    return NextResponse.json({
      success: true,
      data: {
        position: positionResult.data,
        permissions,
        permission_ids: (posPerms || []).map((p: any) => p.permission_id),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    );
  }
}

// PUT - 设置岗位权限（全量替换）
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

    // 删除旧权限
    await supabase.from('position_permissions_v2').eq('position_id', id).delete();

    // 插入新权限
    if (permission_ids.length > 0) {
      const inserts = permission_ids.map((permId: string) => ({
        position_id: id,
        permission_id: permId,
        granted_at: new Date().toISOString(),
      }));

      const result = await supabase
        .from('position_permissions_v2')
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
        position_id: id,
        permission_id: permId,
        granted_at: new Date().toISOString(),
      }));

      await supabase
        .from('position_permissions_v2')
        .upsert(inserts);
    }

    // 撤销
    if (revoke && revoke.length > 0) {
      await supabase
        .from('position_permissions_v2')
        .eq('position_id', id)
        .in('permission_id', revoke)
        .delete();
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
