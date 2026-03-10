import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;

// 更新设计素材
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const body = await request.json();
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const currentUserId = (authResult as any).userId;

  try {
    // 检查是否是创建者
    const { data: existing, error: fetchError } = await supabase
      .from('shared_design_assets')
      .select('shared_by')
      .eq('id', id)
      .single();

    console.log('[Designs PUT] 检查权限:', {
      id,
      currentUserId,
      sharedBy: existing?.shared_by,
      fetchError: fetchError?.message
    });

    if (fetchError) {
      return NextResponse.json({ error: '素材不存在' }, { status: 404 });
    }

    // 允许创建者或无创建者的资源被编辑（兼容历史数据）
    if (existing.shared_by && existing.shared_by !== currentUserId) {
      return NextResponse.json({ error: '无权限编辑此素材' }, { status: 403 });
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.name) updateData.asset_name = body.name;
    if (body.asset_type) updateData.asset_type = body.asset_type;
    if (body.category) updateData.category = body.category;
    if (body.tags) updateData.tags = body.tags;
    if (body.is_public !== undefined) updateData.is_public = body.is_public;
    if (body.file_key) updateData.file_key = body.file_key;
    if (body.thumbnail_key) updateData.preview_key = body.thumbnail_key;
    if (body.file_size) updateData.file_size = body.file_size;

    const { data, error } = await supabase
      .from('shared_design_assets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '设计素材更新成功',
    });
  } catch (error: any) {
    console.error('[Designs PUT] 错误:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 删除设计素材
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const currentUserId = (authResult as any).userId;

  try {
    // 检查是否是创建者
    const { data: existing, error: fetchError } = await supabase
      .from('shared_design_assets')
      .select('shared_by, file_key, preview_key')
      .eq('id', id)
      .single();

    console.log('[Designs DELETE] 检查权限:', {
      id,
      currentUserId,
      sharedBy: existing?.shared_by,
      fetchError: fetchError?.message
    });

    if (fetchError) {
      return NextResponse.json({ error: '素材不存在' }, { status: 404 });
    }

    // 允许创建者或无创建者的资源被删除（兼容历史数据）
    if (existing.shared_by && existing.shared_by !== currentUserId) {
      return NextResponse.json({ error: '无权限删除此素材' }, { status: 403 });
    }

    // 删除数据库记录
    const { error } = await supabase
      .from('shared_design_assets')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: '设计素材删除成功',
    });
  } catch (error: any) {
    console.error('[Designs DELETE] 错误:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
