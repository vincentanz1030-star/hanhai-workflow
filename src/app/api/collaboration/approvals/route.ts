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
        approval_workflows(name, category, steps)
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

    const { workflow_id, title, content, comments } = body;

    // 检查workflow_id是否为字符串（workflow_code），如果是则查找对应的UUID
    let actualWorkflowId = workflow_id;
    let actualWorkflowCode = '';

    // 验证workflow_id是否是UUID格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(workflow_id)) {
      // 如果不是UUID，则当作workflow_code处理
      actualWorkflowCode = workflow_id;
      const { data: workflow } = await supabase
        .from('approval_workflows')
        .select('id, name')
        .eq('workflow_code', workflow_id)
        .single();

      if (workflow) {
        actualWorkflowId = workflow.id;
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `未找到审批流程：${workflow_id}`,
          },
          { status: 400 }
        );
      }
    }

    if (!actualWorkflowId) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少审批流程ID',
        },
        { status: 400 }
      );
    }

    // 生成实例编号
    const instance_code = `APR-${Date.now()}`;

    // 准备插入数据
    const insertData: any = {
      workflow_id: actualWorkflowId,
      workflow_code: actualWorkflowCode,
      instance_code,
      title,
      current_step: 0,
      status: 'pending',
      created_by: body.initiator || '00000000-0000-0000-0000-000000000000',
      initiator: body.initiator || '00000000-0000-0000-0000-000000000000',
    };

    // 如果有content，存储到form_data
    if (content) {
      insertData.form_data = { content };
    }

    // 如果有comments，添加到insertData
    if (comments) {
      insertData.comments = comments;
    }

    // 如果有审批人，添加到insertData
    if (body.approvers && Array.isArray(body.approvers)) {
      insertData.approvers = body.approvers;
    }

    const { data, error } = await supabase
      .from('approval_instances')
      .insert(insertData)
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
      {
        success: false,
        error: error instanceof Error ? error.message : '创建审批实例失败',
      },
      { status: 500 }
    );
  }
}
