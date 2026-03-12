/**
 * 权限管理 API（高度自定义版）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// GET - 获取所有权限（支持筛选）
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('module_id');

    // 获取权限列表
    let query = supabase
      .from('permissions_v2')
      .select('*')
      .order('sort_order');

    if (moduleId) {
      const result = await query.eq('module_id', moduleId);
      return buildPermissionResponse(supabase, result.data, result.error);
    }

    const { data, error } = await query;

    // 表不存在时返回空数据
    if (error) {
      if (error.message?.includes('does not exist') ||
          error.message?.includes('not find the table') ||
          error.message?.includes('relation')) {
        return NextResponse.json({
          success: true,
          data: [],
          grouped: {},
          total: 0,
          notInitialized: true,
          message: '权限系统数据表尚未创建',
        });
      }
      throw error;
    }

    return buildPermissionResponse(supabase, data, null);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    );
  }
}

// 构建权限响应（包含关联数据）
async function buildPermissionResponse(supabase: any, data: any[] | null, error: any) {
  if (error) throw error;
  if (!data || data.length === 0) {
    return NextResponse.json({
      success: true,
      data: [],
      grouped: {},
      total: 0,
    });
  }

  // 获取模块
  const moduleIds = [...new Set(data.map((p: any) => p.module_id).filter(Boolean))];
  const { data: modules } = moduleIds.length > 0
    ? await supabase.from('permission_modules').select('id, code, name, icon').in('id', moduleIds)
    : { data: [] };

  // 获取动作
  const actionIds = [...new Set(data.map((p: any) => p.action_id).filter(Boolean))];
  const { data: actions } = actionIds.length > 0
    ? await supabase.from('permission_actions').select('id, code, name, icon, color').in('id', actionIds)
    : { data: [] };

  // 组装数据
  const moduleMap = new Map((modules || []).map((m: any) => [m.id, m]));
  const actionMap = new Map((actions || []).map((a: any) => [a.id, a]));

  const formattedData = data.map((p: any) => ({
    ...p,
    module: moduleMap.get(p.module_id) || null,
    action: actionMap.get(p.action_id) || null,
  }));

  // 按模块分组
  const grouped: Record<string, any[]> = {};
  formattedData.forEach((p: any) => {
    const moduleCode = p.module?.code || 'other';
    if (!grouped[moduleCode]) grouped[moduleCode] = [];
    grouped[moduleCode].push(p);
  });

  return NextResponse.json({
    success: true,
    data: formattedData,
    grouped,
    total: formattedData.length,
  });
}

// POST - 创建权限
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { module_id, code, name, description, action_id, resource, sort_order } = body;

    if (!module_id || !code || !name) {
      return NextResponse.json({ success: false, error: '缺少必填字段' }, { status: 400 });
    }

    const result = await supabase
      .from('permissions_v2')
      .insert({
        module_id,
        code,
        name,
        description,
        action_id,
        resource,
        sort_order: sort_order || 0,
        is_system: false,
        is_active: true,
      });

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, data: result.data, message: '权限创建成功' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新权限
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { id, name, description, action_id, resource, sort_order, is_active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少权限ID' }, { status: 400 });
    }

    const existingResult = await supabase
      .from('permissions_v2')
      .select('is_system')
      .eq('id', id)
      .single();

    if (existingResult.data?.is_system) {
      return NextResponse.json({ success: false, error: '系统权限不可修改' }, { status: 403 });
    }

    const result = await supabase
      .from('permissions_v2')
      .update({
        name,
        description,
        action_id,
        resource,
        sort_order,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, data: result.data?.[0] || result.data, message: '权限更新成功' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除权限
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少权限ID' }, { status: 400 });
    }

    const existingResult = await supabase
      .from('permissions_v2')
      .select('is_system')
      .eq('id', id)
      .single();

    if (existingResult.data?.is_system) {
      return NextResponse.json({ success: false, error: '系统权限不可删除' }, { status: 403 });
    }

    // 先删除关联记录
    await supabase.from('role_permissions_v2').delete().eq('permission_id', id);
    await supabase.from('position_permissions_v2').delete().eq('permission_id', id);
    await supabase.from('user_permissions_v2').delete().eq('permission_id', id);

    const result = await supabase
      .from('permissions_v2')
      .delete()
      .eq('id', id);

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, message: '权限删除成功' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除失败' },
      { status: 500 }
    );
  }
}
