import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CalendarProject {
  id: string;
  name: string;
  brand: string;
  sales_date: string;
  category: string;
  status: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const month = searchParams.get('month') || (new Date().getMonth() + 1).toString();

    // 查询指定月份的项目
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, brand, sales_date, category, status')
      .gte('sales_date', startDate.toISOString())
      .lte('sales_date', endDate.toISOString())
      .order('sales_date', { ascending: true });

    if (error) throw error;

    // 按品牌分组
    const brandGroups = projects?.reduce((acc, project) => {
      if (!acc[project.brand]) {
        acc[project.brand] = [];
      }
      acc[project.brand].push({
        id: project.id,
        name: project.name,
        brand: project.brand,
        sales_date: project.sales_date,
        category: project.category,
        status: project.status,
      });
      return acc;
    }, {} as Record<string, CalendarProject[]>) || {};

    // 获取当月天数
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();

    return NextResponse.json({
      success: true,
      data: {
        year: parseInt(year),
        month: parseInt(month),
        daysInMonth,
        brandGroups,
        totalProjects: projects?.length || 0,
      },
    });
  } catch (error) {
    console.error('获取日历数据失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取数据失败',
    }, { status: 500 });
  }
}
