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

// GET /api/product-center/product-feedback - 获取商品反馈列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('product_feedbacks')
      .select(`
        *,
        product_trials (
          id,
          brand,
          product_name,
          trial_date
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // 格式化数据
    const formattedData = (data || []).map((item: any) => ({
      ...item,
      product_name: item.product_trials?.product_name,
      brand: item.product_trials?.brand,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      total: count,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('获取商品反馈失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

// POST /api/product-center/product-feedback - 创建商品反馈
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trial_id, product_sku, rating, comment, is_positive, images } = body;

    // 验证必填字段
    if (!trial_id || !product_sku || !rating || !comment) {
      return NextResponse.json({
        success: false,
        error: '缺少必填字段：trial_id, product_sku, rating, comment',
      }, { status: 400 });
    }

    // 获取试用记录信息
    const { data: trial } = await supabase
      .from('product_trials')
      .select('product_id, brand, product_name')
      .eq('id', trial_id)
      .single();

    if (!trial) {
      return NextResponse.json({
        success: false,
        error: '试用记录不存在',
      }, { status: 404 });
    }

    // 插入反馈数据
    const { data, error } = await supabase
      .from('product_feedbacks')
      .insert({
        trial_id,
        product_id: trial.product_id || trial_id,
        product_sku,
        rating,
        comment,
        is_positive: is_positive !== undefined ? is_positive : rating >= 4,
        images: images || [],
        user_id: '00000000-0000-0000-0000-000000000000',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '商品反馈添加成功',
    });
  } catch (error: any) {
    console.error('创建商品反馈失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
