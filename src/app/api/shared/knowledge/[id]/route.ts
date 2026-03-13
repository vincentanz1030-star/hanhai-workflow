import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth, isAuthUser } from '@/lib/api-auth';

;
;

// 更新知识文档
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (!isAuthUser(authResult)) return authResult;

  const { id } = await params;
  const body = await request.json();
  const supabase = getSupabaseClient();
  const currentUserId = authResult.userId;
  const isAdmin = authResult.roles?.some((r) => r.role === 'admin' || r.role === 'super_admin');

  try {
    // 检查是否是创建者或管理员
    const { data: existing, error: fetchError } = await supabase
      .from('shared_knowledge')
      .select('author_id')
      .eq('id', id)
      .single();

    console.log('[Knowledge PUT] 检查权限:', {
      id,
      currentUserId,
      authorId: existing?.author_id,
      isAdmin,
      fetchError: fetchError?.message
    });

    if (fetchError) {
      return NextResponse.json({ error: '文档不存在' }, { status: 404 });
    }

    // 管理员可以编辑所有资源，创建者只能编辑自己的资源，无创建者的资源允许编辑（兼容历史数据）
    if (!isAdmin && existing.author_id && existing.author_id !== currentUserId) {
      return NextResponse.json({ error: '无权限编辑此文档' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('shared_knowledge')
      .update({
        title: body.title,
        category: body.category,
        content: body.content,
        tags: body.tags || [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '知识文档更新成功',
    });
  } catch (error: any) {
    console.error('[Knowledge PUT] 错误:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 删除知识文档
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (!isAuthUser(authResult)) return authResult;

  const { id } = await params;
  const supabase = getSupabaseClient();
  const currentUserId = authResult.userId;
  const isAdmin = authResult.roles?.some((r) => r.role === 'admin' || r.role === 'super_admin');

  try {
    // 检查是否是创建者或管理员
    const { data: existing, error: fetchError } = await supabase
      .from('shared_knowledge')
      .select('author_id')
      .eq('id', id)
      .single();

    console.log('[Knowledge DELETE] 检查权限:', {
      id,
      currentUserId,
      authorId: existing?.author_id,
      isAdmin,
      fetchError: fetchError?.message
    });

    if (fetchError) {
      return NextResponse.json({ error: '文档不存在' }, { status: 404 });
    }

    // 管理员可以删除所有资源，创建者只能删除自己的资源，无创建者的资源允许删除（兼容历史数据）
    if (!isAdmin && existing.author_id && existing.author_id !== currentUserId) {
      return NextResponse.json({ error: '无权限删除此文档' }, { status: 403 });
    }

    const { error } = await supabase
      .from('shared_knowledge')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: '知识文档删除成功',
    });
  } catch (error: any) {
    console.error('[Knowledge DELETE] 错误:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
