/**
 * 营销活动任务详情 API
 * GET /api/marketing/campaign-tasks/[id] - 查询任务详情
 * PUT /api/marketing/campaign-tasks/[id] - 更新任务
 * DELETE /api/marketing/campaign-tasks/[id] - 删除任务
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.COZE_SUPABASE_URL;
  const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

const supabase = getSupabaseClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: task, error } = await supabase
      .from('campaign_tasks')
      .select(`
        *,
        campaigns:campaign_id(id, name),
        users:assignee_id(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: '任务不存在' },
          { status: 404 }
        );
      }
      throw error;
    }

    const formattedTask = {
      ...task,
      campaign_name: task.campaigns?.name,
      assignee_name: task.users?.name,
    };

    return NextResponse.json({
      success: true,
      data: formattedTask,
    });
  } catch (error: any) {
    console.error('获取任务详情失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 检查任务是否存在
    const { data: existing } = await supabase
      .from('campaign_tasks')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      );
    }

    const { data: task, error } = await supabase
      .from('campaign_tasks')
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
      data: task,
    });
  } catch (error: any) {
    console.error('更新任务失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // 检查任务是否存在
    const { data: existing } = await supabase
      .from('campaign_tasks')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '任务不存在' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('campaign_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: '任务删除成功',
    });
  } catch (error: any) {
    console.error('删除任务失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
