/**
 * 角色管理 API（高度自定义版）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// GET - 获取所有角色
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = getSupabaseClient();

    const { data: roles, error } = await supabase
      .from('roles_v2')
      .select('*')
      .order('sort_order');

    // 表不存在时返回空数据
    if (error) {
      if (error.message?.includes('does not exist') ||
          error.message?.includes('not find the table') ||
          error.message?.includes('relation')) {
        return NextResponse.json({ success: true, data: [], notInitialized: true });
      }
      throw error;
    }

    // 获取每个角色的权限数量
    const { data: permCounts } = await supabase
      .from('role_permissions_v2')
      .select('role_id');

    const countMap = new Map<string, number>();
    (permCounts || []).forEach((p: any) => {
      countMap.set(p.role_id, (countMap.get(p.role_id) || 0) + 1);
    });

    const result = (roles || []).map((r: any) => ({
      ...r,
      permission_count: countMap.get(r.id) || 0,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    );
  }
}

// POST - 创建角色
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { code, name, description, color, icon, sort_order } = body;

    if (!code || !name) {
      return NextResponse.json({ success: false, error: '缺少必填字段' }, { status: 400 });
    }

    const result = await supabase
      .from('roles_v2')
      .insert({
        code,
        name,
        description,
        color: color || 'blue',
        icon: icon || 'User',
        sort_order: sort_order || 0,
        is_system: false,
        is_active: true,
      });

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, data: result.data, message: '角色创建成功' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新角色
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { id, name, description, color, icon, sort_order, is_active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少角色ID' }, { status: 400 });
    }

    const existingResult = await supabase
      .from('roles_v2')
      .select('is_system, code')
      .eq('id', id)
      .single();

    // 系统角色只能修改部分属性
    const updateData: Record<string, any> = {
      name,
      description,
      color,
      icon,
      sort_order,
      is_active,
      updated_at: new Date().toISOString(),
    };

    if (existingResult.data?.is_system) {
      delete updateData.is_active; // 系统角色不能禁用
    }

    const result = await supabase
      .from('roles_v2')
      .update(updateData)
      .eq('id', id);

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, data: result.data?.[0] || result.data, message: '角色更新成功' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除角色
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少角色ID' }, { status: 400 });
    }

    const existingResult = await supabase
      .from('roles_v2')
      .select('is_system, code')
      .eq('id', id)
      .single();

    if (existingResult.data?.is_system) {
      return NextResponse.json({ success: false, error: '系统角色不可删除' }, { status: 403 });
    }

    // 检查是否有用户使用此角色
    const usersResult = await supabase
      .from('user_roles_v2')
      .select('id')
      .eq('role_id', id)
      .limit(1);

    if (usersResult.data && usersResult.data.length > 0) {
      return NextResponse.json({ success: false, error: '该角色已被用户使用，无法删除' }, { status: 400 });
    }

    // 删除关联权限
    await supabase.from('role_permissions_v2').delete().eq('role_id', id);

    const result = await supabase
      .from('roles_v2')
      .delete()
      .eq('id', id);

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, message: '角色删除成功' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除失败' },
      { status: 500 }
    );
  }
}
