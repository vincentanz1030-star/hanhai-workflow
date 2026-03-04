/**
 * 企业协同平台 - 内部消息API
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

// GET - 获取消息列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const receiver = searchParams.get('receiver');
    const group_id = searchParams.get('group_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase.from('internal_messages');

    if (receiver) {
      // 获取私聊消息
      const { data, error } = await query
        .select(`
          *,
          sender_users:users!internal_messages_sender_fkey(email, name),
          receiver_users:users!internal_messages_receiver_fkey(email, name)
        `)
        .or(`and(sender.eq.${receiver}),and(receiver.eq.${receiver})`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: (data || []).reverse(),
      });
    } else if (group_id) {
      // 获取群聊消息
      const { data, error } = await query
        .select(`
          *,
          sender_users:users!internal_messages_sender_fkey(email, name)
        `)
        .eq('group_id', group_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data: (data || []).reverse(),
      });
    } else {
      return NextResponse.json(
        { success: false, error: '请指定接收者或群组' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Messages API] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取消息列表失败' },
      { status: 500 }
    );
  }
}

// POST - 发送消息
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('internal_messages')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '消息发送成功',
    });
  } catch (error) {
    console.error('[Messages API] Error:', error);
    return NextResponse.json(
      { success: false, error: '发送消息失败' },
      { status: 500 }
    );
  }
}
