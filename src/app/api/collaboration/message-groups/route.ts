/**
 * 企业协同平台 - 消息群组API
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

// GET - 获取消息群组列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');

    const offset = (page - 1) * limit;

    let query = supabase
      .from('message_groups')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (type && type !== 'all') {
      query = query.eq('group_type', type);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('updated_at', { ascending: false });

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
    console.error('[Message Groups API] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取消息群组列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建消息群组
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('message_groups')
      .insert({
        group_name: body.name,
        description: body.description,
        group_type: body.type || 'general',
        members: body.members || [],
        member_count: (body.members || []).length,
        owner: body.created_by || '00000000-0000-0000-0000-000000000000',
        is_active: true,
        created_by: body.created_by || '00000000-0000-0000-0000-000000000000',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '消息群组创建成功',
    });
  } catch (error) {
    console.error('[Message Groups API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建消息群组失败',
      },
      { status: 500 }
    );
  }
}
