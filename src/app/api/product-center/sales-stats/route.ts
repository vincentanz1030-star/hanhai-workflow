/**
 * 商品中心 - 商品销售统计API
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

// GET - 获取商品销售统计
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || '');
    const product_id = searchParams.get('product_id');

    let query = supabase.from('product_sales_stats');

    if (product_id) {
      // 获取单个商品的销售统计
      const { data, error } = await query
        .select('*')
        .eq('product_id', product_id)
        .eq('year', year)
        .order('month', { ascending: true });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    } else {
      // 获取所有商品的销售统计（按月）
      const monthFilter = month ? `and(month.eq.${month})` : '';
      const { data, error } = await query
        .select(`
          *,
          products(name, sku_code, brand)
        `)
        .eq('year', year)
        .order('month', { ascending: true });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: data || [],
      });
    }
  } catch (error) {
    console.error('[Sales Stats API] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取销售统计失败' },
      { status: 500 }
    );
  }
}

// POST - 更新销售统计
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { product_id, year, month, sales_quantity, sales_amount, order_count } = body;

    // 检查是否已存在该月份的记录
    const { data: existing } = await supabase
      .from('product_sales_stats')
      .select('*')
      .eq('product_id', product_id)
      .eq('year', year)
      .eq('month', month)
      .single();

    if (existing) {
      // 更新现有记录
      const { data, error } = await supabase
        .from('product_sales_stats')
        .update({
          sales_quantity: existing.sales_quantity + sales_quantity,
          sales_amount: parseFloat(existing.sales_amount) + sales_amount,
          order_count: existing.order_count + order_count,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data,
        message: '销售统计更新成功',
      });
    } else {
      // 创建新记录
      const { data, error } = await supabase
        .from('product_sales_stats')
        .insert({
          product_id,
          year,
          month,
          sales_quantity,
          sales_amount,
          order_count,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data,
        message: '销售统计创建成功',
      });
    }
  } catch (error) {
    console.error('[Sales Stats API] Error:', error);
    return NextResponse.json(
      { success: false, error: '更新销售统计失败' },
      { status: 500 }
    );
  }
}
