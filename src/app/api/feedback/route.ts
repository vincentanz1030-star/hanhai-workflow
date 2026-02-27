import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取所有反馈
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const role = searchParams.get('role');

    let query = client
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) {
      console.error('获取反馈失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feedback: data || [] });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建反馈
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { type, brand, role, projectId, title, content, priority } = body;

    if (!title || !content || !brand) {
      return NextResponse.json(
        { error: '标题、内容和品牌不能为空' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('feedback')
      .insert({
        type,
        brand,
        role,
        project_id: projectId,
        title,
        content,
        priority: priority || 'medium',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('创建反馈失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feedback: data });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
