import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth, isAuthUser } from '@/lib/api-auth';

;
;

// 获取工具资源列表
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!isAuthUser(authResult)) return authResult;

  const searchParams = request.nextUrl.searchParams;
  const toolType = searchParams.get('toolType');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('shared_tools')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (toolType) query = query.eq('tool_type', toolType);
    if (category) query = query.eq('category', category);
    if (search) query = query.ilike('tool_name', `%${search}%`);

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

// 创建工具资源
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!isAuthUser(authResult)) return authResult;

  const body = await request.json();
  const supabase = getSupabaseClient();

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', authResult.userId)
      .single();

    const { data, error } = await supabase
      .from('shared_tools')
      .insert({
        tool_name: body.name, // 数据库列名是 tool_name
        tool_type: body.tool_type,
        description: body.description,
        usage_guide: body.usage_guide,
        tool_url: body.download_url, // 数据库列名是 tool_url
        tags: body.tags || [],
        shared_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '工具资源分享成功',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
