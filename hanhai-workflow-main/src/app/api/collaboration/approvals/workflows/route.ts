/**
 * 获取审批工作流列表API
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

// GET - 获取审批工作流列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('approval_workflows')
      .select('id, workflow_code, name, description, category, steps')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('[Approval Workflows API] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取审批工作流列表失败' },
      { status: 500 }
    );
  }
}
