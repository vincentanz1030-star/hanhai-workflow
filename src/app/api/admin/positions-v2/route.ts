/**
 * 岗位管理 API（高度自定义版）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.COZE_SUPABASE_URL;
  const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase config');
  return createClient(supabaseUrl, supabaseKey);
}

// GET - 获取所有岗位
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    const { data: positions, error } = await supabase
      .from('positions_v2')
      .select('*')
      .order('sort_order');

    if (error) throw error;

    // 获取每个岗位的权限数量
    const { data: permCounts } = await supabase
      .from('position_permissions_v2')
      .select('position_id');

    const countMap = new Map<string, number>();
    (permCounts || []).forEach(p => {
      countMap.set(p.position_id, (countMap.get(p.position_id) || 0) + 1);
    });

    const result = (positions || []).map(p => ({
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

    const { data, error } = await supabase
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
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data, message: '岗位创建成功' });
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

    const { data: existing } = await supabase
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

    if (existing?.is_system) {
      delete updateData.is_active;
    }

    const { data, error } = await supabase
      .from('positions_v2')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data, message: '岗位更新成功' });
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

    const { data: existing } = await supabase
      .from('positions_v2')
      .select('is_system')
      .eq('id', id)
      .single();

    if (existing?.is_system) {
      return NextResponse.json({ success: false, error: '系统岗位不可删除' }, { status: 403 });
    }

    // 检查是否有用户使用此岗位
    const { data: users } = await supabase
      .from('user_positions_v2')
      .select('id')
      .eq('position_id', id)
      .limit(1);

    if (users && users.length > 0) {
      return NextResponse.json({ success: false, error: '该岗位已被用户使用，无法删除' }, { status: 400 });
    }

    // 删除关联权限
    await supabase.from('position_permissions_v2').delete().eq('position_id', id);

    const { error } = await supabase
      .from('positions_v2')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: '岗位删除成功' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除失败' },
      { status: 500 }
    );
  }
}
