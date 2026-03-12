import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// PATCH /api/product-center/product-feedback/[id] - 更新反馈
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const { product_sku, rating, comment, images } = body;

    // 验证必填字段
    if (!product_sku || !rating || !comment) {
      return NextResponse.json({
        success: false,
        error: '缺少必填字段：product_sku, rating, comment',
      }, { status: 400 });
    }

    // 检查反馈是否存在
    const { data: existingFeedback, error: checkError } = await supabase
      .from('product_feedbacks')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingFeedback) {
      return NextResponse.json({
        success: false,
        error: '反馈记录不存在',
      }, { status: 404 });
    }

    // 更新反馈数据
    const { data, error } = await supabase
      .from('product_feedbacks')
      .update({
        product_sku,
        rating,
        comment,
        is_positive: rating >= 4,
        images: images !== undefined ? images : existingFeedback.images,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '反馈更新成功',
    });
  } catch (error: any) {
    console.error('更新反馈失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

// DELETE /api/product-center/product-feedback/[id] - 删除反馈
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;

    // 删除反馈记录
    const { error } = await supabase
      .from('product_feedbacks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: '反馈删除成功',
    });
  } catch (error: any) {
    console.error('删除反馈失败:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
