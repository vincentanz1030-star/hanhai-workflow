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

// 获取单个本周工作安排
// 直接从环境变量获取 Supabase 配置

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { data: plan, error } = await client
      .from('weekly_work_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取本周工作安排失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!plan) {
      return NextResponse.json({ error: '工作安排不存在' }, { status: 404 });
    }

    return NextResponse.json({ plan: toCamelCase(plan) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 更新本周工作安排
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { brand, weekStart, weekEnd, content, priority, position } = body;

    console.log('=== PUT 更新本周工作安排 ===');
    console.log('id:', id);
    console.log('body:', body);

    // 构建更新数据
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // 只更新提供的字段
    if (brand !== undefined) updateData.brand = brand;
    if (weekStart !== undefined) updateData.week_start = weekStart;
    if (weekEnd !== undefined) updateData.week_end = weekEnd;
    if (content !== undefined) updateData.content = content;
    if (priority !== undefined) updateData.priority = priority;
    if (position !== undefined) updateData.position = position;

    console.log('updateData:', updateData);

    const { data: plan, error } = await client
      .from('weekly_work_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新本周工作安排失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!plan) {
      return NextResponse.json({ error: '工作安排不存在' }, { status: 404 });
    }

    console.log('更新成功:', plan);

    return NextResponse.json({ plan: toCamelCase(plan) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除本周工作安排
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { error } = await client
      .from('weekly_work_plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除本周工作安排失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
