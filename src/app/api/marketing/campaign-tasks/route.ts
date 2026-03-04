/**
 * 营销中台 - 活动任务API
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

// GET - 获取活动任务列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const campaign_id = searchParams.get('campaign_id');
    const status = searchParams.get('status');
    const assignee = searchParams.get('assignee');

    let query = supabase
      .from('campaign_tasks')
      .select(`
        *,
        marketing_campaigns(name)
      `);

    if (campaign_id) {
      query = query.eq('campaign_id', campaign_id);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (assignee) {
      query = query.eq('assignee', assignee);
    }

    const { data, error } = await query
      .order('due_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('[Campaign Tasks API] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取活动任务列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建活动任务
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('campaign_tasks')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '活动任务创建成功',
    });
  } catch (error) {
    console.error('[Campaign Tasks API] Error:', error);
    return NextResponse.json(
      { success: false, error: '创建活动任务失败' },
      { status: 500 }
    );
  }
}
