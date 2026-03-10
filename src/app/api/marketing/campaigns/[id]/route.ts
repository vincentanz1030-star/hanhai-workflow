/**
 * 营销中台 - 活动详情API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

function getSupabaseClient() {
  const supabaseUrl = process.env.COZE_SUPABASE_URL;
  const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// PUT - 更新活动
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '活动更新成功',
    });
  } catch (error) {
    console.error('[Marketing Campaigns API] Error:', error);
    return NextResponse.json(
      { success: false, error: '更新活动失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除活动
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('marketing_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: '活动删除成功',
    });
  } catch (error) {
    console.error('[Marketing Campaigns API] Error:', error);
    return NextResponse.json(
      { success: false, error: '删除活动失败' },
      { status: 500 }
    );
  }
}
