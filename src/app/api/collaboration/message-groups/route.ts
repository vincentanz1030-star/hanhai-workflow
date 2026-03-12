/**
 * 企业协同平台 - 消息群组API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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

    // 映射字段名以匹配前端期望
    const mappedData = (data || []).map(group => ({
      id: group.id,
      name: group.group_name,
      description: group.description,
      type: group.group_type,
      member_count: group.member_count,
      members: group.members,
      owner: group.owner,
      last_message: group.last_message || '',
      last_message_time: group.last_message_time || group.updated_at,
      unread_count: 0, // 默认为0，需要从消息表计算
      created_at: group.created_at,
      updated_at: group.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: mappedData,
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
