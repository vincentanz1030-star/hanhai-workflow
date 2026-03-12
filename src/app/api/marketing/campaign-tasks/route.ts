/**
 * 营销活动任务管理 API
 * POST /api/marketing/campaign-tasks - 创建任务
 * GET /api/marketing/campaign-tasks - 查询任务列表（支持筛选）
 * GET /api/marketing/campaign-tasks/[id] - 查询任务详情
 * PUT /api/marketing/campaign-tasks/[id] - 更新任务
 * DELETE /api/marketing/campaign-tasks/[id] - 删除任务
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const assignee = searchParams.get('assignee');
    const campaign_id = searchParams.get('campaign_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('campaign_tasks')
      .select(`
        *,
        campaigns:campaign_id(id, name),
        users:assignee_id(id, name, email)
      `);

    if (status) {
      query = query.eq('status', status);
    }

    if (assignee) {
      query = query.eq('assignee_id', assignee);
    }

    if (campaign_id) {
      query = query.eq('campaign_id', campaign_id);
    }

    const { data: tasks, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const formattedTasks = tasks?.map(task => ({
      ...task,
      campaign_name: task.campaigns?.name,
      assignee_name: task.users?.name,
    })) || [];

    return NextResponse.json({
      success: true,
      data: formattedTasks,
      total: count,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('获取任务列表失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaign_id,
      task_name,
      description,
      assignee_id,
      status = 'pending',
      priority = 'medium',
      due_date,
      progress = 0,
      attachments = [],
      tags = [],
    } = body;

    if (!campaign_id || !task_name || !assignee_id) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }

    const { data: task, error } = await supabase
      .from('campaign_tasks')
      .insert({
        campaign_id,
        task_name,
        description: description || '',
        assignee_id,
        status,
        priority,
        due_date: due_date || null,
        progress: progress || 0,
        attachments: attachments || [],
        tags: tags || [],
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    console.error('创建任务失败:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
