import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;

// 获取评论列表
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const resourceType = searchParams.get('resource_type');
  const resourceId = searchParams.get('resource_id');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!resourceType || !resourceId) {
    return NextResponse.json({ error: '缺少资源类型或ID' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const offset = (page - 1) * limit;

    // 获取评论列表
    const { data: comments, error, count } = await supabase
      .from('shared_resource_comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        parent_id,
        users!shared_resource_comments_user_id_fkey (
          id,
          name,
          brand
        )
      `, { count: 'exact' })
      .eq('resource_type', resourceType)
      .eq('resource_id', parseInt(resourceId))
      .is('parent_id', null) // 只获取顶级评论
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // 获取回复
    const commentIds = comments?.map((c: any) => c.id) || [];
    let replies: any[] = [];
    if (commentIds.length > 0) {
      const { data: replyData } = await supabase
        .from('shared_resource_comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          parent_id,
          users!shared_resource_comments_user_id_fkey (
            id,
            name,
            brand
          )
        `)
        .in('parent_id', commentIds)
        .order('created_at', { ascending: true });
      replies = replyData || [];
    }

    // 组织评论树结构
    const commentsWithReplies = comments?.map((comment: any) => ({
      ...comment,
      replies: replies.filter((r: any) => r.parent_id === comment.id),
    }));

    return NextResponse.json({
      success: true,
      data: commentsWithReplies || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 发表评论
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const user = (authResult as any).user;
  const body = await request.json();
  const { resource_type, resource_id, content, parent_id } = body;

  if (!resource_type || !resource_id || !content) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data, error } = await supabase
      .from('shared_resource_comments')
      .insert({
        resource_type,
        resource_id,
        user_id: user.id,
        brand: user.brand,
        content,
        parent_id: parent_id || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 删除评论
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const user = (authResult as any).user;
  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get('id');

  if (!commentId) {
    return NextResponse.json({ error: '缺少评论ID' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 只能删除自己的评论
    const { error } = await supabase
      .from('shared_resource_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
