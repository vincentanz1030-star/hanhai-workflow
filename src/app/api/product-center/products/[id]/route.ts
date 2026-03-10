/**
 * 商品中心 - 商品管理API (单个商品操作)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// PUT - 更新商品
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少商品ID' },
        { status: 400 }
      );
    }

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
      status,
      lifecycle_stage,
      updated_by,
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

    // 更新商品
    const { data: product, error: productError } = await supabase
      .from('products')
      .update({
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
        status,
        lifecycle_stage,
        updated_by,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (productError) throw productError;

    // 更新价格记录（如果存在）
    if (cost_price || wholesale_price || retail_price) {
      const { error: priceError } = await supabase
        .from('product_prices')
        .upsert({
          product_id: id,
          cost_price,
          wholesale_price,
          retail_price,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'product_id'
        });

      if (priceError) throw priceError;
    }

    return NextResponse.json({
      success: true,
      data: product,
      message: '商品更新成功',
    });
  } catch (error) {
    console.error('[Products API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '更新商品失败',
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除商品
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少商品ID' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 先删除关联的价格记录
    await supabase.from('product_prices').delete().eq('product_id', id);

    // 删除商品
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: '商品删除成功',
    });
  } catch (error) {
    console.error('[Products API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '删除商品失败',
      },
      { status: 500 }
    );
  }
}
