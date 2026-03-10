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

  try {
    // 检查是否是创建者
    const { data: existing } = await supabase
      .from('shared_design_assets')
      .select('shared_by')
      .eq('id', id)
      .single();

    if (!existing || existing.shared_by !== (authResult as any).userId) {
      return NextResponse.json({ error: '无权限编辑此素材' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('shared_design_assets')
      .update({
        asset_name: body.name,
        asset_type: body.asset_type,
        category: body.category,
        tags: body.tags || [],
        is_public: body.is_public ?? true,
        updated_at: new Date().toISOString(),
      })
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

  try {
    // 检查是否是创建者
    const { data: existing } = await supabase
      .from('shared_design_assets')
      .select('shared_by, file_key, preview_key')
      .eq('id', id)
      .single();

    if (!existing || existing.shared_by !== (authResult as any).userId) {
      return NextResponse.json({ error: '无权限删除此素材' }, { status: 403 });
    }

    // 删除数据库记录
    const { error } = await supabase
      .from('shared_design_assets')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // 可选：删除对象存储中的文件
    // 这里暂时不删除存储文件，只删除数据库记录

    return NextResponse.json({
      success: true,
      message: '设计素材删除成功',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
