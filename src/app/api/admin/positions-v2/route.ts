/**
 * 岗位管理 API（高度自定义版）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// GET - 获取所有岗位
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = getSupabaseClient();

    const { data: positions, error } = await supabase
      .from('positions_v2')
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

    // 获取每个岗位的权限数量
    const { data: permCounts } = await supabase
      .from('position_permissions_v2')
      .select('position_id');

    const countMap = new Map<string, number>();
    (permCounts || []).forEach((p: any) => {
      countMap.set(p.position_id, (countMap.get(p.position_id) || 0) + 1);
    });

    const result = (positions || []).map((p: any) => ({
      ...p,
      permission_count: countMap.get(p.id) || 0,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    );
  }
}

// POST - 创建岗位
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { code, name, department, description, color, icon, sort_order } = body;

    if (!code || !name) {
      return NextResponse.json({ success: false, error: '缺少必填字段' }, { status: 400 });
    }

    const result = await supabase
      .from('positions_v2')
      .insert({
        code,
        name,
        department,
        description,
        color: color || 'green',
        icon: icon || 'Briefcase',
        sort_order: sort_order || 0,
        is_system: false,
        is_active: true,
      });

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, data: result.data, message: '岗位创建成功' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新岗位
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { id, name, department, description, color, icon, sort_order, is_active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少岗位ID' }, { status: 400 });
    }

    const existingResult = await supabase
      .from('positions_v2')
      .select('is_system')
      .eq('id', id)
      .single();

    const updateData: Record<string, any> = {
      name,
      department,
      description,
      color,
      icon,
      sort_order,
      is_active,
      updated_at: new Date().toISOString(),
    };

    if (existingResult.data?.is_system) {
      delete updateData.is_active;
    }

    const result = await supabase
      .from('positions_v2')
      .eq('id', id)
      .update(updateData);

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, data: result.data?.[0] || result.data, message: '岗位更新成功' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除岗位
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少岗位ID' }, { status: 400 });
    }

    const existingResult = await supabase
      .from('positions_v2')
      .select('is_system')
      .eq('id', id)
      .single();

    if (existingResult.data?.is_system) {
      return NextResponse.json({ success: false, error: '系统岗位不可删除' }, { status: 403 });
    }

    // 检查是否有用户使用此岗位
    const usersResult = await supabase
      .from('user_positions_v2')
      .select('id')
      .eq('position_id', id)
      .limit(1);

    if (usersResult.data && usersResult.data.length > 0) {
      return NextResponse.json({ success: false, error: '该岗位已被用户使用，无法删除' }, { status: 400 });
    }

    // 删除关联权限
    await supabase.from('position_permissions_v2').eq('position_id', id).delete();

    const result = await supabase
      .from('positions_v2')
      .eq('id', id)
      .delete();

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, message: '岗位删除成功' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除失败' },
      { status: 500 }
    );
  }
}
