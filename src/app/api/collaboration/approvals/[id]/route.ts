/**
 * 企业协同平台 - 审批操作API
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

// PUT - 执行审批操作（通过/拒绝）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const { action, comment } = body; // action: 'approve' | 'reject'

    // 检查审批实例是否存在
    const { data: instance, error: fetchError } = await supabase
      .from('approval_instances')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !instance) {
      return NextResponse.json(
        { success: false, error: '审批实例不存在' },
        { status: 404 }
      );
    }

    // 检查审批状态
    if (instance.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `审批已${instance.status === 'approved' ? '通过' : instance.status === 'rejected' ? '拒绝' : '完成'}，无法再次操作` },
        { status: 400 }
      );
    }

    // 更新审批实例
    const { data, error } = await supabase
      .from('approval_instances')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        completed_at: new Date().toISOString(),
        comments: comment || '',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: action === 'approve' ? '审批已通过' : '审批已拒绝',
    });
  } catch (error) {
    console.error('[Approval Action API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '审批操作失败',
      },
      { status: 500 }
    );
  }
}
