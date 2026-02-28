import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser } from '@/lib/auth';

// 获取通知列表
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      return NextResponse.json({ error: '获取通知失败' }, { status: 500 });
    }

    // 获取未读数量
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.userId)
      .eq('is_read', false);

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error('获取通知错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 标记通知为已读
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const body = await request.json();
    const { ids, readAll } = body;

    const supabase = getSupabaseClient();

    let result;
    if (readAll) {
      // 标记所有通知为已读
      result = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', currentUser.userId)
        .eq('is_read', false);
    } else if (ids && ids.length > 0) {
      // 标记指定通知为已读
      result = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', ids);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('标记通知错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
