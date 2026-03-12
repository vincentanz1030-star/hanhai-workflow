import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';

// 辅助函数：将下划线命名转为驼峰命名
const toCamelCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  const result: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = toCamelCase(obj[key]);
  }
  return result;
};

// 获取本周工作安排列表
// 直接从环境变量获取 Supabase 配置

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const weekStart = searchParams.get('weekStart');
    const weekEnd = searchParams.get('weekEnd');

    let query = client
      .from('weekly_work_plans')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });

    if (brand && brand !== 'all') {
      query = query.eq('brand', brand);
    }

    if (weekStart && weekEnd) {
      query = query.eq('week_start', weekStart).eq('week_end', weekEnd);
    }

    const { data: plans, error } = await query;

    if (error) {
      console.error('获取本周工作安排失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plans: toCamelCase(plans || []) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建本周工作安排
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { brand, weekStart, weekEnd, content, priority, position } = body;

    console.log('=== POST 创建本周工作安排 ===');
    console.log('body:', body);

    if (!brand || !weekStart || !weekEnd || !content) {
      return NextResponse.json(
        { error: '品牌、周开始日期、周结束日期和工作内容为必填项' },
        { status: 400 }
      );
    }

    // 创建工作安排
    const { data: plan, error } = await client
      .from('weekly_work_plans')
      .insert({
        brand,
        week_start: weekStart,
        week_end: weekEnd,
        content,
        priority: priority || 'normal',
        position: position || null,
      })
      .select()
      .single();

    if (error) {
      console.error('创建本周工作安排失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('创建成功:', plan);

    return NextResponse.json({ plan: toCamelCase(plan) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
