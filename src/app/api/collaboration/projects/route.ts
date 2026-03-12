/**
 * 企业协同平台 - 项目协同API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取项目列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const owner = searchParams.get('owner');

    const offset = (page - 1) * limit;

    let query = supabase
      .from('collaboration_projects')
      .select('*', { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (owner) {
      query = query.eq('owner', owner);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('[Collaboration Projects API] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取项目列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建项目
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    // 验证owner_id是否为有效的UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validOwnerId = uuidRegex.test(body.owner_id) ? body.owner_id : '00000000-0000-0000-0000-000000000000';

    // 添加默认的created_by字段（如果没有提供）
    const validCreatedBy = body.created_by || '00000000-0000-0000-0000-000000000000';

    // 初始化默认值
    const projectData = {
      name: body.name,
      description: body.description,
      owner_id: validOwnerId,
      status: body.status || 'planning',
      priority: body.priority || 'medium',
      start_date: body.start_date,
      end_date: body.end_date,
      progress: body.progress || 0,
      task_count: body.task_count || 0,
      completed_tasks: body.completed_tasks || 0,
      members: body.members || [],
      created_by: validCreatedBy,
    };

    const { data, error } = await supabase
      .from('collaboration_projects')
      .insert(projectData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '项目创建成功',
    });
  } catch (error) {
    console.error('[Collaboration Projects API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建项目失败',
      },
      { status: 500 }
    );
  }
}
