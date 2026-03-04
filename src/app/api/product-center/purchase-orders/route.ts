/**
 * 商品中心 - 采购订单管理API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.COZE_SUPABASE_URL;
  const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// GET - 获取采购订单列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const supplier_id = searchParams.get('supplier_id');

    const offset = (page - 1) * limit;

    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers(name),
        products(name, sku_code)
      `, { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('order_date', { ascending: false });

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
    console.error('[Purchase Orders API] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取采购订单列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建采购订单
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('purchase_orders')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '采购订单创建成功',
    });
  } catch (error) {
    console.error('[Purchase Orders API] Error:', error);
    return NextResponse.json(
      { success: false, error: '创建采购订单失败' },
      { status: 500 }
    );
  }
}
