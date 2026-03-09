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

const supabase = getSupabaseClient();

// GET /api/product-center/product-trials/[id] - 获取单个商品试用记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('product_trials')
      .select(`
        *,
        product_feedbacks (
          id,
          product_sku,
          rating,
          comment,
          is_positive,
          created_at,
          status
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({
        success: false,
        error: '商品试用记录不存在',
      }, { status: 404 });
    }

    // 映射字段名
    const mappedData = {
      ...data,
      feedbacks: data.product_feedbacks || [],
    };

    return NextResponse.json({
      success: true,
      data: mappedData,
    });
  } catch (error: any) {
    console.error('获取商品试用失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

// PUT /api/product-center/product-trials/[id] - 更新商品试用记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { brand, product_name, trial_date } = body;

    // 验证必填字段
    if (!brand || !product_name || !trial_date) {
      return NextResponse.json({
        success: false,
        error: '缺少必填字段：brand, product_name, trial_date',
      }, { status: 400 });
    }

    // 检查记录是否存在
    const { data: existing } = await supabase
      .from('product_trials')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: '商品试用记录不存在',
      }, { status: 404 });
    }

    // 更新记录
    const { data, error } = await supabase
      .from('product_trials')
      .update({
        brand,
        product_name,
        trial_date,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // 获取反馈信息
    const { data: feedbacks } = await supabase
      .from('product_feedbacks')
      .select('*')
      .eq('trial_id', id);

    const mappedData = {
      ...data,
      feedbacks: feedbacks || [],
    };

    return NextResponse.json({
      success: true,
      data: mappedData,
      message: '商品试用更新成功',
    });
  } catch (error: any) {
    console.error('更新商品试用失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

// DELETE /api/product-center/product-trials/[id] - 删除商品试用记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 检查记录是否存在
    const { data: existing } = await supabase
      .from('product_trials')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: '商品试用记录不存在',
      }, { status: 404 });
    }

    // 由于设置了 CASCADE 删除，删除试用记录会自动删除相关反馈
    const { error } = await supabase
      .from('product_trials')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: '商品试用删除成功',
    });
  } catch (error: any) {
    console.error('删除商品试用失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
