import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取所有年度销售目标
export async function GET() {
  try {
    const client = getSupabaseClient();

    // 获取所有年度目标
    const { data: targets, error } = await client
      .from('annual_sales_targets')
      .select('*')
      .order('year', { ascending: false })
      .order('brand', { ascending: true });

    if (error) {
      console.error('获取年度销售目标失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 获取每个年度目标的月度目标
    const targetsWithMonthly = await Promise.all(
      (targets || []).map(async (target) => {
        const { data: monthlyTargets } = await client
          .from('monthly_sales_targets')
          .select('*')
          .eq('annual_target_id', target.id)
          .order('month', { ascending: true });

        return {
          ...target,
          monthlyTargets: monthlyTargets || [],
        };
      })
    );

    return NextResponse.json({ targets: targetsWithMonthly });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建年度销售目标
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { year, brand, targetAmount, description } = body;

    if (!year || !brand || !targetAmount) {
      return NextResponse.json(
        { error: '年份、品牌和目标金额为必填项' },
        { status: 400 }
      );
    }

    // 创建年度目标
    const { data: target, error: targetError } = await client
      .from('annual_sales_targets')
      .insert({
        year,
        brand,
        target_amount: targetAmount,
        description: description || null,
        actual_amount: 0,
      })
      .select()
      .single();

    if (targetError) {
      console.error('创建年度销售目标失败:', targetError);
      return NextResponse.json({ error: targetError.message }, { status: 500 });
    }

    // 自动创建12个月的月度目标
    const monthlyTargets = [];
    for (let month = 1; month <= 12; month++) {
      const monthlyAmount = Math.round(targetAmount / 12); // 平均分配
      const { data: monthly } = await client
        .from('monthly_sales_targets')
        .insert({
          annual_target_id: target.id,
          month,
          brand,
          year,
          target_amount: monthlyAmount,
          actual_amount: 0,
        })
        .select()
        .single();

      if (monthly) {
        monthlyTargets.push(monthly);
      }
    }

    return NextResponse.json({ target, monthlyTargets });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
