import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

// 将蛇形命名转换为驼峰命名
function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;

  const newObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // 移除所有下划线，并将下划线后的字母大写
      const camelKey = key.split('_').reduce((result, word, index) => {
        if (index === 0) {
          return word;
        }
        return result + word.charAt(0).toUpperCase() + word.slice(1);
      }, '');
      newObj[camelKey] = toCamelCase(obj[key]);
    }
  }
  return newObj;
}

// 更新月度销售目标的实际完成金额
// 直接从环境变量获取 Supabase 配置

export async function PATCH(request: NextRequest) {
  try {
    // 认证和权限检查
    const authResult = await requireAuth(request, 'sales_target', 'edit');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

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

    // 品牌隔离检查
    const isAdmin = authResult.roles && authResult.roles.some((r: any) => r.role === 'admin');
    const userBrand = authResult.brand;

    if (!isAdmin && monthlyTarget.brand !== userBrand) {
      console.warn(`⚠️ 品牌用户 ${authResult.email} 尝试修改品牌 ${monthlyTarget.brand} 的月度目标`);
      return NextResponse.json(
        { error: '您只能修改自己品牌的月度销售目标' },
        { status: 403 }
      );
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

    const totalActualAmount = allMonthly?.reduce((sum: number, m: { actual_amount?: number }) => sum + (m.actual_amount || 0), 0) || 0;

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
      monthlyTarget: toCamelCase(updatedMonthly), 
      annualTarget: toCamelCase(updatedAnnual) 
    });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
