import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

// 批量导入销售数据
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body;

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: '无效的数据格式' }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        // 验证必填字段
        if (!item.product_name || !item.product_sku || !item.brand || !item.year || !item.month) {
          errors.push(`缺少必填字段: ${item.product_sku || '未知SKU'}`);
          errorCount++;
          continue;
        }

        // 检查产品是否存在
        let productId: string;
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('sku_code', item.product_sku)
          .single();

        if (existingProduct) {
          productId = existingProduct.id;
        } else {
          // 创建新产品
          const { data: newProduct, error: createError } = await supabase
            .from('products')
            .insert({
              name: item.product_name,
              sku_code: item.product_sku,
              brand: item.brand,
              status: 'active',
            })
            .select()
            .single();

          if (createError) {
            throw new Error(`创建产品失败: ${createError.message}`);
          }
          productId = newProduct.id;
        }

        // 检查是否已存在相同产品、年份和月份的数据
        const { data: existing } = await supabase
          .from('sales_statistics')
          .select('id')
          .eq('product_id', productId)
          .eq('year', parseInt(item.year))
          .eq('month', parseInt(item.month))
          .single();

        if (existing) {
          // 更新现有记录
          const { error: updateError } = await supabase
            .from('sales_statistics')
            .update({
              sales_quantity: parseInt(item.sales_quantity) || 0,
              sales_amount: parseFloat(item.sales_amount) || 0,
              launch_date: item.launch_date || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateError) {
            throw new Error(`更新销售数据失败: ${updateError.message}`);
          }
        } else {
          // 插入新记录
          const { error: insertError } = await supabase
            .from('sales_statistics')
            .insert({
              product_id: productId,
              brand: item.brand,
              year: parseInt(item.year),
              month: parseInt(item.month),
              sales_quantity: parseInt(item.sales_quantity) || 0,
              sales_amount: parseFloat(item.sales_amount) || 0,
              order_count: 0,
              launch_date: item.launch_date || null,
            });

          if (insertError) {
            throw new Error(`插入销售数据失败: ${insertError.message}`);
          }
        }

        successCount++;
      } catch (itemError: any) {
        console.error('导入单条数据失败:', itemError, item);
        errors.push(`${item.product_sku || '未知SKU'}: ${itemError.message}`);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `成功导入 ${successCount} 条数据${errorCount > 0 ? `，失败 ${errorCount} 条` : ''}`,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // 最多返回10条错误信息
    });
  } catch (error: any) {
    console.error('批量导入销售数据失败:', error);
    return NextResponse.json(
      { error: '批量导入失败', details: error.message },
      { status: 500 }
    );
  }
}
