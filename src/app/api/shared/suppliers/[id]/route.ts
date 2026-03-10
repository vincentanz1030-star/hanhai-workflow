import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;

// 更新供应商
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
      .from('shared_suppliers')
      .select('shared_by')
      .eq('id', id)
      .single();

    console.log('[Suppliers PUT] 检查权限:', {
      id,
      currentUserId,
      sharedBy: existing?.shared_by,
      fetchError: fetchError?.message
    });

    if (fetchError) {
      return NextResponse.json({ error: '供应商不存在' }, { status: 404 });
    }

    // 允许创建者或无创建者的资源被编辑（兼容历史数据）
    if (existing.shared_by && existing.shared_by !== currentUserId) {
      return NextResponse.json({ error: '无权限编辑此供应商' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('shared_suppliers')
      .update({
        supplier_name: body.supplier_name,
        supplier_type: body.supplier_type,
        contact_person: body.contact_person,
        contact_phone: body.contact_phone,
        contact_email: body.contact_email,
        address: body.address,
        cooperation_brands: body.cooperation_brands || [],
        main_products: body.main_products || [],
        quality_score: body.quality_score || 5,
        price_score: body.price_score || 5,
        delivery_score: body.delivery_score || 5,
        service_score: body.service_score || 5,
        overall_score: body.overall_score || (
          (body.quality_score + body.price_score + body.delivery_score + body.service_score) / 4
        ),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '供应商更新成功',
    });
  } catch (error: any) {
    console.error('[Suppliers PUT] 错误:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 删除供应商
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
      .from('shared_suppliers')
      .select('shared_by')
      .eq('id', id)
      .single();

    console.log('[Suppliers DELETE] 检查权限:', {
      id,
      currentUserId,
      sharedBy: existing?.shared_by,
      fetchError: fetchError?.message
    });

    if (fetchError) {
      return NextResponse.json({ error: '供应商不存在' }, { status: 404 });
    }

    // 允许创建者或无创建者的资源被删除（兼容历史数据）
    if (existing.shared_by && existing.shared_by !== currentUserId) {
      return NextResponse.json({ error: '无权限删除此供应商' }, { status: 403 });
    }

    const { error } = await supabase
      .from('shared_suppliers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: '供应商删除成功',
    });
  } catch (error: any) {
    console.error('[Suppliers DELETE] 错误:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
