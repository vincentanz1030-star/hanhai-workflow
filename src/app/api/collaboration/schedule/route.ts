/**
 * 企业协同平台 - 日程管理API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取日程列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    const created_by = searchParams.get('created_by');

    let query = supabase.from('schedule_events').select('*');

    if (created_by) {
      query = query.eq('created_by', created_by);
    }

    if (start_date && end_date) {
      query = query
        .gte('start_time', start_date)
        .lte('end_time', end_date);
    }

    const { data, error } = await query
      .order('start_time', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('[Schedule API] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取日程列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建日程
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('schedule_events')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '日程创建成功',
    });
  } catch (error) {
    console.error('[Schedule API] Error:', error);
    return NextResponse.json(
      { success: false, error: '创建日程失败' },
      { status: 500 }
    );
  }
}
