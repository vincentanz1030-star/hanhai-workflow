/**
 * 商品中心 - 供应商管理API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// GET - 获取供应商列表
export async function GET(request: NextRequest) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    let query = supabase
      .from('suppliers')
      .select('*', { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,supplier_code.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('rating', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('[Suppliers API] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取供应商列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建供应商
export async function POST(request: NextRequest) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    // 验证必填字段
    if (!body.name || !body.supplier_code) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：name、supplier_code' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '供应商创建成功',
    });
  } catch (error) {
    console.error('[Suppliers API] Error:', error);
    return NextResponse.json(
      { success: false, error: '创建供应商失败' },
      { status: 500 }
    );
  }
}
