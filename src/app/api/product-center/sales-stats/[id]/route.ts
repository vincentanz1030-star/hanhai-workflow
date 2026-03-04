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

// PATCH /api/product-center/sales-stats/[id] - 更新销售统计数据
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
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

    // 检查销售统计是否存在
    const { data: existingStat, error: checkError } = await supabase
      .from('sales_statistics')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingStat) {
      return NextResponse.json({
        success: false,
        error: '销售统计记录不存在',
      }, { status: 404 });
    }

    // 更新产品信息（如果需要）
    let productId = existingStat.product_id;
    
    // 获取当前产品的 SKU
    const { data: currentProduct } = await supabase
      .from('products')
      .select('sku_code')
      .eq('id', existingStat.product_id)
      .single();

    // 如果 SKU 改变了，需要查找或创建新产品
    if (currentProduct && currentProduct.sku_code !== product_sku) {
      const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('sku_code', product_sku)
        .single();

      if (existingProduct) {
        productId = existingProduct.id;
      } else {
        const { data: newProduct } = await supabase
          .from('products')
          .insert({
            name: product_name,
            sku_code: product_sku,
            brand: brand,
            status: 'active',
          })
          .select()
          .single();
        productId = newProduct.id;
      }
    } else {
      // 更新产品名称和品牌
      await supabase
        .from('products')
        .update({ name: product_name, brand: brand })
        .eq('id', productId);
    }

    // 更新销售统计数据
    const { data, error } = await supabase
      .from('sales_statistics')
      .update({
        product_id: productId,
        brand: brand,
        year: parseInt(year),
        month: parseInt(month),
        sales_quantity: parseInt(sales_quantity) || 0,
        sales_amount: parseFloat(sales_amount) || 0,
        launch_date: launch_date,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '销售统计数据更新成功',
    });
  } catch (error: any) {
    console.error('更新销售统计数据失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

// DELETE /api/product-center/sales-stats/[id] - 删除销售统计数据
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;

    // 删除销售统计记录
    const { error } = await supabase
      .from('sales_statistics')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: '销售统计数据删除成功',
    });
  } catch (error: any) {
    console.error('删除销售统计数据失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
