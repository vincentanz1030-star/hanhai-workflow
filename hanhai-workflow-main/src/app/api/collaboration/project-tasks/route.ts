/**
 * 企业协同平台 - 项目任务API
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

// GET - 获取项目任务列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const project_id = searchParams.get('project_id');
    const assignee = searchParams.get('assignee');
    const status = searchParams.get('status');

    let query = supabase
      .from('project_tasks')
      .select(`
        *,
        collaboration_projects(name)
      `);

    if (project_id) {
      query = query.eq('project_id', project_id);
    }
    if (assignee) {
      query = query.eq('assignee', assignee);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('sort_order', { ascending: true })
      .order('due_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('[Project Tasks API] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取项目任务列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建项目任务
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('project_tasks')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '项目任务创建成功',
    });
  } catch (error) {
    console.error('[Project Tasks API] Error:', error);
    return NextResponse.json(
      { success: false, error: '创建项目任务失败' },
      { status: 500 }
    );
  }
}
