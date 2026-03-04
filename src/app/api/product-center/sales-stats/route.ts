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

// GET /api/product-center/sales-stats - 获取销售统计数据
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const brand = searchParams.get('brand');
    const product_id = searchParams.get('product_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('sales_statistics')
      .select(`
        *,
        products (
          id,
          name,
          sku,
          brand
        )
      `, { count: 'exact' })
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .range(offset, offset + limit - 1);

    if (year) {
      query = query.eq('year', parseInt(year));
    }
    if (month && month !== 'all') {
      query = query.eq('month', parseInt(month));
    }
    if (brand && brand !== 'all') {
      query = query.eq('brand', brand);
    }
    if (product_id) {
      query = query.eq('product_id', product_id);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // 格式化数据
    const formattedData = (data || []).map((item: any) => ({
      ...item,
      product_name: item.products?.name,
      product_sku: item.products?.sku,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      total: count,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('获取销售统计失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

// POST /api/product-center/sales-stats - 创建销售统计数据
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      product_name, 
      product_sku, 
      brand, 
      launch_date,
      year, 
      month, 
      sales_quantity, 
      sales_amount 
    } = body;

    // 验证必填字段
    if (!product_name || !product_sku || !brand || !year || !month) {
      return NextResponse.json({
        success: false,
        error: '缺少必填字段：product_name, product_sku, brand, year, month',
      }, { status: 400 });
    }

    // 首先检查产品是否存在，如果不存在则创建
    let productId;
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('sku', product_sku)
      .single();

    if (existingProduct) {
      productId = existingProduct.id;
    } else {
      // 创建新产品
      const { data: newProduct, error: createError } = await supabase
        .from('products')
        .insert({
          name: product_name,
          sku: product_sku,
          brand: brand,
          status: 'active',
        })
        .select()
        .single();

      if (createError) throw createError;
      productId = newProduct.id;
    }

    // 插入销售统计数据
    const { data, error } = await supabase
      .from('sales_statistics')
      .insert({
        product_id: productId,
        brand: brand,
        year: parseInt(year),
        month: parseInt(month),
        sales_quantity: parseInt(sales_quantity) || 0,
        sales_amount: parseFloat(sales_amount) || 0,
        order_count: 0,
        launch_date: launch_date,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '销售统计数据添加成功',
    });
  } catch (error: any) {
    console.error('创建销售统计数据失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
