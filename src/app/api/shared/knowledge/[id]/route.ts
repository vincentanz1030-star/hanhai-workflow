import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;

// 更新知识文档
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
      .from('shared_knowledge')
      .select('author_id')
      .eq('id', id)
      .single();

    if (!existing || existing.author_id !== (authResult as any).userId) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 删除知识文档
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
      .from('shared_knowledge')
      .select('author_id')
      .eq('id', id)
      .single();

    if (!existing || existing.author_id !== (authResult as any).userId) {
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
