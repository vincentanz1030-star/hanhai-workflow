/**
 * 权限管理 API（高度自定义版）
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.COZE_SUPABASE_URL;
  const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase config');
  return createClient(supabaseUrl, supabaseKey);
}

// GET - 获取所有权限（支持筛选）
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('module_id');
    const action = searchParams.get('action');

    let query = supabase
      .from('permissions_v2')
      .select(`
        *,
        module:permission_modules(id, code, name, icon),
        action:permission_actions(id, code, name, icon, color)
      `)
      .order('sort_order');

    if (moduleId) query = query.eq('module_id', moduleId);

    const { data, error } = await query;

    // 表不存在时返回空数据
    if (error) {
      if (error.code === '42P01' || 
          error.message?.includes('does not exist') ||
          error.message?.includes('not find the table')) {
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

    // 按模块分组
    const grouped: Record<string, typeof data> = {};
    (data || []).forEach(p => {
      const moduleCode = (p.module as any)?.code || 'other';
      if (!grouped[moduleCode]) grouped[moduleCode] = [];
      grouped[moduleCode].push(p);
    });

    return NextResponse.json({
      success: true,
      data: data || [],
      grouped,
      total: data?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    );
  }
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

    const { data, error } = await supabase
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
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data, message: '权限创建成功' });
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

    const { data: existing } = await supabase
      .from('permissions_v2')
      .select('is_system')
      .eq('id', id)
      .single();

    if (existing?.is_system) {
      return NextResponse.json({ success: false, error: '系统权限不可修改' }, { status: 403 });
    }

    const { data, error } = await supabase
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
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data, message: '权限更新成功' });
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

    const { data: existing } = await supabase
      .from('permissions_v2')
      .select('is_system')
      .eq('id', id)
      .single();

    if (existing?.is_system) {
      return NextResponse.json({ success: false, error: '系统权限不可删除' }, { status: 403 });
    }

    // 先删除关联记录
    await supabase.from('role_permissions_v2').delete().eq('permission_id', id);
    await supabase.from('position_permissions_v2').delete().eq('permission_id', id);
    await supabase.from('user_permissions_v2').delete().eq('permission_id', id);

    const { error } = await supabase
      .from('permissions_v2')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: '权限删除成功' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '删除失败' },
      { status: 500 }
    );
  }
}
