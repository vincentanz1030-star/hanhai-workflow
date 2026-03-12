import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth, isAuthUser } from '@/lib/api-auth';

;
;

// 更新工具资源
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
  const isAdmin = authResult.roles?.some((r) => r.role === 'admin');

  try {
    // 检查是否是创建者或管理员
    const { data: existing, error: fetchError } = await supabase
      .from('shared_tools')
      .select('shared_by')
      .eq('id', id)
      .single();

    console.log('[Tools PUT] 检查权限:', {
      id,
      currentUserId,
      sharedBy: existing?.shared_by,
      isAdmin,
      fetchError: fetchError?.message
    });

    if (fetchError) {
      return NextResponse.json({ error: '工具不存在' }, { status: 404 });
    }

    // 管理员可以编辑所有资源，创建者只能编辑自己的资源，无创建者的资源允许编辑（兼容历史数据）
    if (!isAdmin && existing.shared_by && existing.shared_by !== currentUserId) {
      return NextResponse.json({ error: '无权限编辑此工具' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('shared_tools')
      .update({
        tool_name: body.name,
        tool_type: body.tool_type,
        description: body.description,
        usage_guide: body.usage_guide,
        tool_url: body.download_url,
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
      message: '工具资源更新成功',
    });
  } catch (error: any) {
    console.error('[Tools PUT] 错误:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 删除工具资源
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (!isAuthUser(authResult)) return authResult;

  const { id } = await params;
  const supabase = getSupabaseClient();
  const currentUserId = authResult.userId;
  const isAdmin = authResult.roles?.some((r) => r.role === 'admin');

  try {
    // 检查是否是创建者或管理员
    const { data: existing, error: fetchError } = await supabase
      .from('shared_tools')
      .select('shared_by')
      .eq('id', id)
      .single();

    console.log('[Tools DELETE] 检查权限:', {
      id,
      currentUserId,
      sharedBy: existing?.shared_by,
      isAdmin,
      fetchError: fetchError?.message
    });

    if (fetchError) {
      return NextResponse.json({ error: '工具不存在' }, { status: 404 });
    }

    // 管理员可以删除所有资源，创建者只能删除自己的资源，无创建者的资源允许删除（兼容历史数据）
    if (!isAdmin && existing.shared_by && existing.shared_by !== currentUserId) {
      return NextResponse.json({ error: '无权限删除此工具' }, { status: 403 });
    }

    const { error } = await supabase
      .from('shared_tools')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: '工具资源删除成功',
    });
  } catch (error: any) {
    console.error('[Tools DELETE] 错误:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
