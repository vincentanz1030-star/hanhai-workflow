/**
 * 权限模块管理 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.COZE_SUPABASE_URL;
  const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase config');
  return createClient(supabaseUrl, supabaseKey);
}

// GET - 获取所有模块（含权限统计）
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // 获取模块列表
    const { data: modules, error } = await supabase
      .from('permission_modules')
      .select('*')
      .order('sort_order');

    if (error) throw error;

    // 获取每个模块的权限数量
    const { data: permCounts } = await supabase
      .from('permissions_v2')
      .select('module_id');

    const countMap = new Map<string, number>();
    (permCounts || []).forEach(p => {
      const id = p.module_id as string;
      countMap.set(id, (countMap.get(id) || 0) + 1);
    });

    const result = (modules || []).map(m => ({
      ...m,
      permission_count: countMap.get(m.id) || 0,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    );
  }
}

// POST - 创建模块
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { code, name, icon, sort_order } = body;

    if (!code || !name) {
      return NextResponse.json({ success: false, error: '缺少必填字段' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('permission_modules')
      .insert({
        code,
        name,
        icon: icon || 'Folder',
        sort_order: sort_order || 0,
        is_system: false,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data, message: '模块创建成功' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新模块
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { id, name, icon, sort_order, is_active } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少模块ID' }, { status: 400 });
    }

    // 检查是否系统模块
    const { data: existing } = await supabase
      .from('permission_modules')
      .select('is_system')
      .eq('id', id)
      .single();

    if (existing?.is_system) {
      return NextResponse.json({ success: false, error: '系统模块不可修改' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('permission_modules')
      .update({
        name,
        icon,
        sort_order,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data, message: '模块更新成功' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '更新失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除模块
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: '缺少模块ID' }, { status: 400 });
    }

    // 检查是否系统模块
    const { data: existing } = await supabase
      .from('permission_modules')
      .select('is_system')
      .eq('id', id)
      .single();

    if (existing?.is_system) {
      return NextResponse.json({ success: false, error: '系统模块不可删除' }, { status: 403 });
    }

    const { error } = await supabase
      .from('permission_modules')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: '模块删除成功' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除失败' },
      { status: 500 }
    );
  }
}
