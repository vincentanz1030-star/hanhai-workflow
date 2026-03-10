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
  const currentUserId = (authResult as any).userId;

  try {
    // 检查是否是创建者
    const { data: existing, error: fetchError } = await supabase
      .from('shared_marketing_cases')
      .select('shared_by')
      .eq('id', id)
      .single();

    console.log('[MarketingCases PUT] 检查权限:', {
      id,
      currentUserId,
      sharedBy: existing?.shared_by,
      fetchError: fetchError?.message
    });

    if (fetchError) {
      return NextResponse.json({ error: '案例不存在' }, { status: 404 });
    }

    // 允许创建者或无创建者的资源被编辑（兼容历史数据）
    if (existing.shared_by && existing.shared_by !== currentUserId) {
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
    console.error('[MarketingCases PUT] 错误:', error);
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
  const currentUserId = (authResult as any).userId;

  try {
    // 检查是否是创建者
    const { data: existing, error: fetchError } = await supabase
      .from('shared_marketing_cases')
      .select('shared_by')
      .eq('id', id)
      .single();

    console.log('[MarketingCases DELETE] 检查权限:', {
      id,
      currentUserId,
      sharedBy: existing?.shared_by,
      fetchError: fetchError?.message
    });

    if (fetchError) {
      return NextResponse.json({ error: '案例不存在' }, { status: 404 });
    }

    // 允许创建者或无创建者的资源被删除（兼容历史数据）
    if (existing.shared_by && existing.shared_by !== currentUserId) {
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
    console.error('[MarketingCases DELETE] 错误:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
