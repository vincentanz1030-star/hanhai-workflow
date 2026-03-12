/**
 * 商品中心 - 商品反馈API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';
import { canViewAllBrands, canManageAllBrands } from '@/lib/permissions';

// GET - 获取商品反馈列表
export async function GET(request: NextRequest) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const user = authResult;

  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const product_id = searchParams.get('product_id');
    const status = searchParams.get('status');
    const feedback_type = searchParams.get('feedback_type');

    const offset = (page - 1) * limit;

    // 品牌隔离检查
    const canViewAll = await canViewAllBrands(user.userId, user.brand);

    let query = supabase
      .from('product_feedbacks')
      .select(`
        *,
        products(name, sku_code, brand)
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

    // 品牌过滤（在应用层过滤，因为 product_feedbacks 表没有直接的 brand 字段）
    let filteredData = data || [];
    if (!canViewAll) {
      filteredData = filteredData.filter((item: any) => 
        item.products && item.products.brand === user.brand
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
      pagination: {
        page,
        limit,
        total: canViewAll ? (count || 0) : filteredData.length,
        totalPages: Math.ceil((canViewAll ? (count || 0) : filteredData.length) / limit),
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
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const user = authResult;

  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    // 验证必填字段
    if (!body.product_id || !body.title || !body.content) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：product_id、title、content' },
        { status: 400 }
      );
    }

    // 检查商品是否属于用户品牌
    const canManageAll = await canManageAllBrands(user.brand);
    if (!canManageAll) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('brand')
        .eq('id', body.product_id)
        .single();

      if (productError || !product) {
        return NextResponse.json(
          { success: false, error: '商品不存在' },
          { status: 404 }
        );
      }

      if (product.brand !== user.brand) {
        return NextResponse.json(
          { success: false, error: '无权限为该商品创建反馈' },
          { status: 403 }
        );
      }
    }

    const { data, error } = await supabase
      .from('product_feedbacks')
      .insert({
        ...body,
        created_by: user.userId,
      })
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
