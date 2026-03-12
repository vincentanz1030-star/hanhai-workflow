/**
 * 权限操作类型管理 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// GET - 获取所有操作类型
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('permission_actions')
      .select('*')
      .order('sort_order');

    // 表不存在时返回空数据
    if (error) {
      if (error.message?.includes('does not exist') ||
          error.message?.includes('not find the table') ||
          error.message?.includes('relation')) {
        return NextResponse.json({ 
          success: true, 
          data: [], 
          notInitialized: true,
          message: '权限系统数据表尚未创建' 
        });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    );
  }
}

// POST - 创建操作类型
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = getSupabaseClient();
    const body = await request.json();
    const { code, name, description, icon, color, sort_order } = body;

    if (!code || !name) {
      return NextResponse.json({ success: false, error: '缺少必填字段' }, { status: 400 });
    }

    // pg-client 的 insert 已经返回插入的数据（RETURNING *）
    const result = await supabase
      .from('permission_actions')
      .insert({
        code,
        name,
        description,
        icon: icon || 'Circle',
        color: color || 'gray',
        sort_order: sort_order || 0,
        is_system: false,
        is_active: true,
      });

    if (result.error) throw result.error;

    return NextResponse.json({ success: true, data: result.data, message: '操作类型创建成功' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    );
  }
}
