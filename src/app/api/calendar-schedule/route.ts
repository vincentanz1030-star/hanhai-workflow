import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { toCamelCase } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // 计算当月的最后一天（修复4月只有30天的问题）
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;

    const { data: launches, error } = await client
      .from('new_product_launches')
      .select('*')
      .gte('sales_date', startDate)
      .lte('sales_date', endDate)
      .order('sales_date', { ascending: true });

    if (error) {
      console.error('获取新品排期失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 按品牌分组
    const brandGroups: Record<string, any[]> = {};
    const camelLaunches = toCamelCase(launches || []);

    camelLaunches.forEach((launch: any) => {
      if (!brandGroups[launch.brand]) {
        brandGroups[launch.brand] = [];
      }
      brandGroups[launch.brand].push(launch);
    });

    // 为每个排期添加状态字段（用于显示颜色）
    Object.keys(brandGroups).forEach(brand => {
      brandGroups[brand] = brandGroups[brand].map((launch: any) => ({
        ...launch,
        status: 'pending', // 新品排期没有状态，使用 pending 作为默认颜色
      }));
    });

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        daysInMonth,
        brandGroups,
        totalLaunches: camelLaunches.length,
      },
    });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
