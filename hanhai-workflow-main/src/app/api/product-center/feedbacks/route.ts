/**
 * 商品中心 - 商品反馈API
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

// GET - 获取商品反馈列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const product_id = searchParams.get('product_id');
    const status = searchParams.get('status');
    const feedback_type = searchParams.get('feedback_type');

    const offset = (page - 1) * limit;

    let query = supabase
      .from('product_feedbacks')
      .select(`
        *,
        products(name, sku_code)
      `, { count: 'exact' });

    if (product_id) {
      query = query.eq('product_id', product_id);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (feedback_type && feedback_type !== 'all') {
      query = query.eq('feedback_type', feedback_type);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

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
    console.error('[Product Feedbacks API] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取商品反馈列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建商品反馈
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('product_feedbacks')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '商品反馈创建成功',
    });
  } catch (error) {
    console.error('[Product Feedbacks API] Error:', error);
    return NextResponse.json(
      { success: false, error: '创建商品反馈失败' },
      { status: 500 }
    );
  }
}
