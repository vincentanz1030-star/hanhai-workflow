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
    const { year, brand, targetAmount, description, monthlyTargets } = body;

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

    // 创建月度目标（如果有提供）
    const createdMonthlyTargets = [];
    if (monthlyTargets && monthlyTargets.length > 0) {
      for (const mt of monthlyTargets) {
        const { data: monthly } = await client
          .from('monthly_sales_targets')
          .insert({
            annual_target_id: target.id,
            month: mt.month,
            brand,
            year,
            target_amount: mt.targetAmount,
            actual_amount: mt.actualAmount,
          })
          .select()
          .single();

        if (monthly) {
          createdMonthlyTargets.push(monthly);
        }
      }
    } else {
      // 自动创建12个月的月度目标（平均分配）
      for (let month = 1; month <= 12; month++) {
        const monthlyAmount = Math.round(targetAmount / 12);
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
          createdMonthlyTargets.push(monthly);
        }
      }
    }

    return NextResponse.json({ target, monthlyTargets: createdMonthlyTargets });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 更新年度销售目标
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, year, brand, targetAmount, description, monthlyTargets } = body;

    if (!id) {
      return NextResponse.json({ error: '目标ID为必填项' }, { status: 400 });
    }

    // 更新年度目标
    const { data: target, error: targetError } = await client
      .from('annual_sales_targets')
      .update({
        year,
        brand,
        target_amount: targetAmount,
        description: description || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (targetError) {
      console.error('更新年度销售目标失败:', targetError);
      return NextResponse.json({ error: targetError.message }, { status: 500 });
    }

    // 更新月度目标（如果有提供）
    if (monthlyTargets && monthlyTargets.length > 0) {
      for (const mt of monthlyTargets) {
        if (mt.id) {
          // 更新已存在的月度目标
          await client
            .from('monthly_sales_targets')
            .update({
              target_amount: mt.targetAmount,
              actual_amount: mt.actualAmount,
            })
            .eq('id', mt.id);
        } else {
          // 创建新的月度目标
          await client
            .from('monthly_sales_targets')
            .insert({
              annual_target_id: id,
              month: mt.month,
              brand,
              year,
              target_amount: mt.targetAmount,
              actual_amount: mt.actualAmount,
            });
        }
      }
    }

    // 获取更新后的所有月度目标
    const { data: updatedMonthly } = await client
      .from('monthly_sales_targets')
      .select('*')
      .eq('annual_target_id', id)
      .order('month', { ascending: true });

    return NextResponse.json({ target, monthlyTargets: updatedMonthly || [] });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除年度销售目标
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '目标ID为必填项' }, { status: 400 });
    }

    // 先删除关联的月度目标
    const { error: monthlyError } = await client
      .from('monthly_sales_targets')
      .delete()
      .eq('annual_target_id', id);

    if (monthlyError) {
      console.error('删除月度目标失败:', monthlyError);
      return NextResponse.json({ error: monthlyError.message }, { status: 500 });
    }

    // 删除年度目标
    const { error: annualError } = await client
      .from('annual_sales_targets')
      .delete()
      .eq('id', id);

    if (annualError) {
      console.error('删除年度销售目标失败:', annualError);
      return NextResponse.json({ error: annualError.message }, { status: 500 });
    }

    return NextResponse.json({ message: '删除成功' });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
