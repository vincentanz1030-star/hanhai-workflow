/**
 * 商品中心 - 商品管理API (单个商品操作)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

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
      // 新增字段
      designer,
      supplier_id,
      spec_code,
      color,
      delivery_days,
      remarks,
      // 价格信息
      cost_price,
      cost_with_tax_shipping,
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

    // 处理空字符串的 supplier_id，转为 null
    const normalizedSupplierId = supplier_id && supplier_id.trim() !== '' ? supplier_id : null;

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
        designer,
        supplier_id: normalizedSupplierId,
        spec_code,
        color,
        delivery_days,
        remarks,
      })
      .eq('id', id)
      .select()
      .single();

    if (productError) throw productError;

    // 更新价格记录（如果存在）
    if (cost_price || cost_with_tax_shipping || wholesale_price || retail_price) {
      const { error: priceError } = await supabase
        .from('product_prices')
        .upsert({
          product_id: id,
          cost_price,
          cost_with_tax_shipping,
          wholesale_price,
          retail_price,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'product_id'
        });

      if (priceError) throw priceError;
    }

    // 更新库存记录
    const quantity = body.quantity;
    if (quantity !== undefined) {
      // 先检查是否存在库存记录
      const { data: existingInventory } = await supabase
        .from('product_inventory')
        .select('id')
        .eq('product_id', id)
        .limit(1);

      if (existingInventory && existingInventory.length > 0) {
        // 更新现有记录
        await supabase
          .from('product_inventory')
          .update({ quantity })
          .eq('id', existingInventory[0].id);
      } else if (quantity > 0) {
        // 创建新记录
        await supabase
          .from('product_inventory')
          .insert({
            product_id: id,
            quantity,
          });
      }
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

    // 先删除关联的销售统计数据
    await supabase.from('sales_statistics').delete().eq('product_id', id);

    // 删除关联的价格记录
    await supabase.from('product_prices').delete().eq('product_id', id);

    // 删除关联的库存记录
    await supabase.from('product_inventory').delete().eq('product_id', id);

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
