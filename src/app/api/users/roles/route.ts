/**
 * 获取用户角色列表API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取角色列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('user_roles_v2')
      .select('role')
      .order('role', { ascending: true });

    if (error) throw error;

    // 提取去重的角色列表
    const roles = Array.from(new Set(data?.map((item: { role: string }) => item.role).filter(Boolean) || []));

    return NextResponse.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error('[Roles API] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取角色列表失败' },
      { status: 500 }
    );
  }
}
