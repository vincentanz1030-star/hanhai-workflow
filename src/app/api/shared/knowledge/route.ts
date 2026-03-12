import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth, isAuthUser } from '@/lib/api-auth';

;
;

// 获取知识库列表
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const position = searchParams.get('position');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('shared_knowledge')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (position) query = query.contains('applicable_positions', [position]);
    if (search) {
      query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total: count },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 创建知识文档
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const supabase = getSupabaseClient();

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', authResult.userId)
      .single();

    const { data, error } = await supabase
      .from('shared_knowledge')
      .insert({
        title: body.title,
        category: body.category,
        content: body.content,
        tags: body.tags || [],
        author_id: user?.id,
        author_name: user?.name || '匿名',
        status: 'published',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '知识文档发布成功',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
