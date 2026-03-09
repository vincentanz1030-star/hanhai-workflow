/**
 * 商品中心 - 商品管理API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 获取Supabase客户端
function getSupabaseClient() {
  const supabaseUrl = process.env.COZE_SUPABASE_URL;
  const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// GET - 获取商品列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const brand = searchParams.get('brand');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const supplier_id = searchParams.get('supplier_id');

    const offset = (page - 1) * limit;

    // 构建查询
    let query = supabase
      .from('products')
      .select(`
        *,
        product_prices(*),
        product_inventory(*)
      `, { count: 'exact' });

    // 添加过滤条件
    if (brand && brand !== 'all') {
      query = query.eq('brand', brand);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }
    if (supplier_id && supplier_id !== 'all') {
      query = query.eq('supplier_id', supplier_id);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku_code.ilike.%${search}%`);
    }

    // 分页
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

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
    console.error('[Products API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取商品列表失败',
      },
      { status: 500 }
    );
  }
}

// POST - 创建商品
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const {
      sku_code,
      name,
      description,
      category_id,
      brand,
      main_image,
      images,
      video_url,
      attributes,
      tags,
      created_by,
      // 价格信息
      cost_price,
      wholesale_price,
      retail_price,
    } = body;

    // 验证必填字段
    if (!sku_code || !name || !brand) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必填字段：sku_code、name、brand',
        },
        { status: 400 }
      );
    }

    // 构建查询
    let query = supabase
      .from('products')
      .select('*')
      .eq('sku_code', sku_code);

    const { data: existingProduct, error: checkError } = await query;

    if (checkError) throw checkError;

    if (existingProduct && existingProduct.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'SKU编码已存在，请使用不同的SKU编码',
        },
        { status: 400 }
      );
    }

    // 创建商品（使用事务）
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        sku_code,
        name,
        description,
        category_id,
        brand,
        main_image,
        images,
        video_url,
        attributes,
        tags,
        created_by,
      })
      .select()
      .single();

    if (productError) throw productError;

    // 创建价格记录
    if (cost_price || wholesale_price || retail_price) {
      const { error: priceError } = await supabase
        .from('product_prices')
        .insert({
          product_id: product.id,
          cost_price,
          wholesale_price,
          retail_price,
        });

      if (priceError) throw priceError;
    }

    return NextResponse.json({
      success: true,
      data: product,
      message: '商品创建成功',
    });
  } catch (error) {
    console.error('[Products API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建商品失败',
      },
      { status: 500 }
    );
  }
}
