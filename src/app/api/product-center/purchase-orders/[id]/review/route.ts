/**
 * 商品中心 - 采购订单审核API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// PATCH - 审核采购订单
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { id } = await params;
    const { reviewer_id, review_notes, action } = body;

    if (!reviewer_id || !action) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：审核人或审核动作' },
        { status: 400 }
      );
    }

    // 确定新状态
    const newStatus = action === 'approve' ? 'approved' : 'cancelled';

    // 更新订单状态
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({
        status: newStatus,
        reviewer_id,
        review_notes,
        review_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: action === 'approve' ? '订单已批准' : '订单已拒绝',
    });
  } catch (error) {
    console.error('[Purchase Order Review API] Error:', error);
    return NextResponse.json(
      { success: false, error: '审核采购订单失败' },
      { status: 500 }
    );
  }
}
