import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;

// 更新工具资源
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
      .from('shared_tools')
      .select('shared_by')
      .eq('id', id)
      .single();

    if (!existing || existing.shared_by !== (authResult as any).userId) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 删除工具资源
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
      .from('shared_tools')
      .select('shared_by')
      .eq('id', id)
      .single();

    if (!existing || existing.shared_by !== (authResult as any).userId) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
