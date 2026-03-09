import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

// 直接从环境变量获取 Supabase 配置
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

// 获取任务评论列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id: taskId } = await params;
    const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });

    const { data: comments, error } = await client
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comments: comments || [] });
  } catch (error) {
    console.error('获取任务评论失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建任务评论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id: taskId } = await params;
    const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 });
    }

    const { data: comment, error } = await client
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: authResult.userId,
        user_name: authResult.email,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('创建任务评论失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
