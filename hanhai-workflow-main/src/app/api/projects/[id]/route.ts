import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

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

// 获取单个项目详情
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

    // 获取项目详情
    const { data: project, error } = await client
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取项目详情失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 获取项目的所有任务
    const { data: tasks } = await client
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('role', { ascending: true })
      .order('task_order', { ascending: true });

    return NextResponse.json({
      project: toCamelCase({
        ...project,
        tasks: tasks || [],
      }),
    });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 更新项目
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await client
      .from('projects')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新项目失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ project: data });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除项目
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });
    const { id } = await params;

    const { error } = await client
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除项目失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
