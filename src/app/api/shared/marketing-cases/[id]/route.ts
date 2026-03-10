import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;

// 更新营销案例
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
      .from('shared_marketing_cases')
      .select('shared_by')
      .eq('id', id)
      .single();

    if (!existing || existing.shared_by !== (authResult as any).userId) {
      return NextResponse.json({ error: '无权限编辑此案例' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('shared_marketing_cases')
      .update({
        case_name: body.case_name,
        case_type: body.case_type,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
        objective: body.description || body.objective,
        strategy: body.key_points || body.strategy,
        lessons: body.lessons,
        roi: body.roi || null,
        gmv: body.gmv || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '营销案例更新成功',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 删除营销案例
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
      .from('shared_marketing_cases')
      .select('shared_by')
      .eq('id', id)
      .single();

    if (!existing || existing.shared_by !== (authResult as any).userId) {
      return NextResponse.json({ error: '无权限删除此案例' }, { status: 403 });
    }

    const { error } = await supabase
      .from('shared_marketing_cases')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: '营销案例删除成功',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
