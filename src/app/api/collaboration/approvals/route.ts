/**
 * 企业协同平台 - 审批流程API
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

// GET - 获取审批实例列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const initiator = searchParams.get('initiator');

    const offset = (page - 1) * limit;

    let query = supabase
      .from('approval_instances')
      .select(`
        *,
        approval_workflows(name, category),
        initiator_users:users!approval_instances_initiator_fkey(email, name)
      `, { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (initiator) {
      query = query.eq('initiator', initiator);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('started_at', { ascending: false });

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
    console.error('[Approvals API] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取审批实例列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建审批实例
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { workflow_id, title, form_data, initiator, comments } = body;

    // 生成实例编号
    const instance_code = `APR-${Date.now()}`;

    const { data, error } = await supabase
      .from('approval_instances')
      .insert({
        workflow_id,
        instance_code,
        title,
        form_data,
        initiator,
        comments,
        current_step: 0,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '审批实例创建成功',
    });
  } catch (error) {
    console.error('[Approvals API] Error:', error);
    return NextResponse.json(
      { success: false, error: '创建审批实例失败' },
      { status: 500 }
    );
  }
}
