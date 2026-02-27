import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 更新月度销售目标的实际完成金额
export async function PATCH(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, actualAmount } = body;

    if (!id || actualAmount === undefined || actualAmount === null) {
      return NextResponse.json(
        { error: 'ID和实际完成金额为必填项' },
        { status: 400 }
      );
    }

    // 获取月度目标
    const { data: monthlyTarget, error: fetchError } = await client
      .from('monthly_sales_targets')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !monthlyTarget) {
      console.error('获取月度销售目标失败:', fetchError);
      return NextResponse.json({ error: '月度销售目标不存在' }, { status: 404 });
    }

    // 更新月度目标
    const { data: updatedMonthly, error: updateError } = await client
      .from('monthly_sales_targets')
      .update({
        actual_amount: actualAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('更新月度销售目标失败:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 重新计算年度实际完成金额
    const { data: allMonthly } = await client
      .from('monthly_sales_targets')
      .select('actual_amount')
      .eq('annual_target_id', monthlyTarget.annual_target_id);

    const totalActualAmount = allMonthly?.reduce((sum, m) => sum + (m.actual_amount || 0), 0) || 0;

    // 更新年度目标
    await client
      .from('annual_sales_targets')
      .update({
        actual_amount: totalActualAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', monthlyTarget.annual_target_id);

    // 获取更新后的年度目标
    const { data: updatedAnnual } = await client
      .from('annual_sales_targets')
      .select('*')
      .eq('id', monthlyTarget.annual_target_id)
      .single();

    return NextResponse.json({ 
      monthlyTarget: updatedMonthly, 
      annualTarget: updatedAnnual 
    });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
