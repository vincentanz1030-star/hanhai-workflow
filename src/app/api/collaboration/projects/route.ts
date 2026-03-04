/**
 * 企业协同平台 - 项目协同API
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

    const { data, error } = await supabase
      .from('collaboration_projects')
      .insert(body)
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
      { success: false, error: '创建项目失败' },
      { status: 500 }
    );
  }
}
