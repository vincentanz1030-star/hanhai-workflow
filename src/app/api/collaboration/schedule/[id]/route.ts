/**
 * 企业协同平台 - 日程管理API (单个日程)
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

// GET - 获取单个日程
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const params = await context.params;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('schedule_events')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Schedule API] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取日程失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新日程
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const params = await context.params;
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('schedule_events')
      .update({
        title: body.title,
        description: body.description,
        event_type: body.event_type,
        start_time: body.start_time,
        end_time: body.end_time,
        location: body.location,
        is_virtual: body.is_virtual,
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '日程更新成功',
    });
  } catch (error) {
    console.error('[Schedule API] Error:', error);
    return NextResponse.json(
      { success: false, error: '更新日程失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除日程
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const params = await context.params;
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('schedule_events')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: '日程删除成功',
    });
  } catch (error) {
    console.error('[Schedule API] Error:', error);
    return NextResponse.json(
      { success: false, error: '删除日程失败' },
      { status: 500 }
    );
  }
}
