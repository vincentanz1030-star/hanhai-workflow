import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// 蛇形转驼峰
function toCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
    }
  }
  return result;
}

// 获取单个协同合作任务
// 直接从环境变量获取 Supabase 配置
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 环境变量未设置');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });
    const { id } = await params;

    const { data: task, error } = await client
      .from('collaboration_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取协同合作任务失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!task) {
      return NextResponse.json({ error: '协同合作任务不存在' }, { status: 404 });
    }

    return NextResponse.json({ task: toCamelCase(task) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 更新协同合作任务
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });
    const { id } = await params;
    const body = await request.json();
    const {
      requestingRole,
      targetRole,
      taskTitle,
      description,
      deadline,
      progress,
      status,
      priority,
    } = body;

    console.log('=== PUT 更新协同合作任务 ===');
    console.log('id:', id);
    console.log('body:', body);

    // 构建更新数据
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // 只更新提供的字段
    if (requestingRole !== undefined) updateData.requesting_role = requestingRole;
    if (targetRole !== undefined) updateData.target_role = targetRole;
    if (taskTitle !== undefined) updateData.task_title = taskTitle;
    if (description !== undefined) updateData.description = description;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (progress !== undefined) updateData.progress = progress;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;

    console.log('updateData:', updateData);

    const { data: task, error } = await client
      .from('collaboration_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新协同合作任务失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!task) {
      return NextResponse.json({ error: '协同合作任务不存在' }, { status: 404 });
    }

    console.log('更新成功:', task);
    return NextResponse.json({ task: toCamelCase(task) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除协同合作任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });
    const { id } = await params;

    const { error } = await client
      .from('collaboration_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除协同合作任务失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
