import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
        products (
          id,
          name,
          sku
        ),
        users (
          id,
          name
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
      product_name: item.products?.name,
      product_sku: item.products?.sku,
      user_name: item.users?.name,
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
    const { product_id, product_name, rating, comment, is_positive, user_id } = body;

    // 验证必填字段
    if (!product_id || !rating || !comment) {
      return NextResponse.json({
        success: false,
        error: '缺少必填字段：product_id, rating, comment',
      }, { status: 400 });
    }

    // 插入数据
    const { data, error } = await supabase
      .from('product_feedbacks')
      .insert({
        product_id,
        rating,
        comment,
        is_positive: is_positive !== undefined ? is_positive : rating >= 4,
        user_id: user_id || '00000000-0000-0000-0000-000000000000',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '商品反馈提交成功',
    });
  } catch (error: any) {
    console.error('创建商品反馈失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
