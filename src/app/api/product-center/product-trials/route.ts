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

// GET /api/product-center/product-trials - 获取商品试用列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // 获取试用记录
    let query = supabase
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
      `, { count: 'exact' })
      .order('trial_date', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: trials, error, count } = await query;

    if (error) throw error;

    // 如果有状态筛选，过滤反馈
    let filteredTrials = trials || [];
    if (status && status !== 'all') {
      filteredTrials = filteredTrials.map((trial: any) => ({
        ...trial,
        product_feedbacks: trial.product_feedbacks?.filter((f: any) => f.status === status) || [],
      })).filter((trial: any) => trial.product_feedbacks.length > 0);
    }

    // 映射字段名
    const mappedTrials = filteredTrials.map((trial: any) => ({
      ...trial,
      feedbacks: trial.product_feedbacks || [],
    }));

    return NextResponse.json({
      success: true,
      data: mappedTrials,
      total: count,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('获取商品试用失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

// POST /api/product-center/product-trials - 创建商品试用
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand, product_name, trial_date } = body;

    // 验证必填字段
    if (!brand || !product_name || !trial_date) {
      return NextResponse.json({
        success: false,
        error: '缺少必填字段：brand, product_name, trial_date',
      }, { status: 400 });
    }

    // 插入试用记录
    const { data, error } = await supabase
      .from('product_trials')
      .insert({
        brand,
        product_name,
        trial_date,
        user_id: '00000000-0000-0000-0000-000000000000',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: { ...data, feedbacks: [] },
      message: '商品试用添加成功',
    });
  } catch (error: any) {
    console.error('创建商品试用失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
