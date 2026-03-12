/**
 * 企业协同平台 - 消息群组详情API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// PUT - 更新消息群组
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabase
      .from('message_groups')
      .update({
        group_name: body.name,
        description: body.description,
        group_type: body.type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '消息群组更新成功',
    });
  } catch (error) {
    console.error('[Message Group Detail API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '更新消息群组失败',
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除消息群组
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
      .from('message_groups')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: '消息群组删除成功',
    });
  } catch (error) {
    console.error('[Message Group Detail API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '删除消息群组失败',
      },
      { status: 500 }
    );
  }
}
