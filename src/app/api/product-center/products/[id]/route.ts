/**
 * 商品中心 - 商品管理API (单个商品操作)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';
import { canViewAllBrands, canManageAllBrands } from '@/lib/permissions';

// PUT - 更新商品
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const user = authResult;

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

    // 检查原商品是否存在且用户有权限修改
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { success: false, error: '商品不存在' },
        { status: 404 }
      );
    }

    // 品牌权限验证
    const canManageAll = await canManageAllBrands(user.brand);
    if (!canManageAll && existingProduct.brand !== user.brand) {
      return NextResponse.json(
        {
          success: false,
          error: '无权限修改该商品',
        },
        { status: 403 }
      );
    }

    // 如果传入了新的品牌，检查是否有权限操作该品牌
    const newBrand = body.brand || existingProduct.brand;
    if (!canManageAll && newBrand !== user.brand) {
      return NextResponse.json(
        {
          success: false,
          error: '无权限操作该品牌的数据',
        },
        { status: 403 }
      );
    }

    // 构建更新对象，只更新传入的字段，保留原有值
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
      updated_by: user.userId,
    };

    // 基础字段更新（如果传入）
    if (body.sku_code !== undefined) updateData.sku_code = body.sku_code;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category_id !== undefined) updateData.category_id = body.category_id;
    if (body.brand !== undefined) updateData.brand = body.brand;
    if (body.main_image !== undefined) updateData.main_image = body.main_image;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.video_url !== undefined) updateData.video_url = body.video_url;
    if (body.attributes !== undefined) updateData.attributes = body.attributes;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.lifecycle_stage !== undefined) updateData.lifecycle_stage = body.lifecycle_stage;

    // 新增字段更新
    if (body.designer !== undefined) updateData.designer = body.designer;
    if (body.spec_code !== undefined) updateData.spec_code = body.spec_code;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.delivery_days !== undefined) updateData.delivery_days = body.delivery_days;
    if (body.remarks !== undefined) updateData.remarks = body.remarks;

    // 处理 supplier_id：空字符串转为 null
    if (body.supplier_id !== undefined) {
      updateData.supplier_id = body.supplier_id && body.supplier_id.trim() !== '' ? body.supplier_id : null;
    }

    // 更新商品
    const { data: product, error: productError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (productError) {
      console.error('[Products API] Update error:', productError);
      throw productError;
    }

    // 更新价格记录（如果传入了价格信息）
    if (body.cost_price !== undefined || body.cost_with_tax_shipping !== undefined || 
        body.wholesale_price !== undefined || body.retail_price !== undefined) {
      
      try {
        // 先检查是否存在价格记录
        const { data: existingPrice } = await supabase
          .from('product_prices')
          .select('id')
          .eq('product_id', id)
          .limit(1);

        const priceData: Record<string, any> = {
          product_id: id,
          updated_at: new Date().toISOString(),
        };

        if (body.cost_price !== undefined) priceData.cost_price = body.cost_price;
        if (body.cost_with_tax_shipping !== undefined) priceData.cost_with_tax_shipping = body.cost_with_tax_shipping;
        if (body.wholesale_price !== undefined) priceData.wholesale_price = body.wholesale_price;
        if (body.retail_price !== undefined) priceData.retail_price = body.retail_price;

        if (existingPrice && existingPrice.length > 0) {
          // 更新现有记录
          const { error: priceError } = await supabase
            .from('product_prices')
            .update(priceData)
            .eq('id', existingPrice[0].id);
          
          if (priceError) {
            console.error('[Products API] Price update error:', priceError);
          }
        } else {
          // 创建新记录
          const { error: priceError } = await supabase
            .from('product_prices')
            .insert(priceData);
          
          if (priceError) {
            console.error('[Products API] Price insert error:', priceError);
          }
        }
      } catch (priceError) {
        console.error('[Products API] Price operation error:', priceError);
        // 价格更新失败不影响整体更新结果
      }
    }

    // 更新库存记录
    if (body.quantity !== undefined) {
      try {
        // 先检查是否存在库存记录
        const { data: existingInventory } = await supabase
          .from('product_inventory')
          .select('id')
          .eq('product_id', id)
          .limit(1);

        if (existingInventory && existingInventory.length > 0) {
          // 更新现有记录
          const { error: updateError } = await supabase
            .from('product_inventory')
            .update({ 
              quantity: body.quantity,
              last_updated: new Date().toISOString()
            })
            .eq('id', existingInventory[0].id);
          
          if (updateError) {
            console.error('[Products API] Inventory update error:', updateError);
          }
        } else if (body.quantity > 0 || body.quantity === 0) {
          // 创建新记录 (warehouse 是必填字段)
          const { error: insertError } = await supabase
            .from('product_inventory')
            .insert({
              product_id: id,
              quantity: body.quantity,
              warehouse: 'default',
            });
          
          if (insertError) {
            console.error('[Products API] Inventory insert error:', insertError);
          }
        }
      } catch (inventoryError) {
        console.error('[Products API] Inventory update error:', inventoryError);
        // 库存更新失败不影响整体更新结果
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

  const user = authResult;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少商品ID' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 检查商品是否存在且用户有权限删除
    const canManageAll = await canManageAllBrands(user.brand);
    
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, brand')
      .eq('id', id)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json(
        { success: false, error: '商品不存在' },
        { status: 404 }
      );
    }

    if (!canManageAll && existingProduct.brand !== user.brand) {
      return NextResponse.json(
        {
          success: false,
          error: '无权限删除该商品',
        },
        { status: 403 }
      );
    }

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

// GET - 获取单个商品详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const user = authResult;

  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少商品ID' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 获取商品详情
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        product_prices(*),
        product_inventory(*)
      `)
      .eq('id', id)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { success: false, error: '商品不存在' },
        { status: 404 }
      );
    }

    // 品牌权限验证
    const canViewAll = await canViewAllBrands(user.userId, user.brand);
    if (!canViewAll && product.brand !== user.brand) {
      return NextResponse.json(
        {
          success: false,
          error: '无权限查看该商品',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('[Products API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取商品详情失败',
      },
      { status: 500 }
    );
  }
}
