import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// 创建通知
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const {
      recipientId,
      type,
      title,
      content,
      relatedEntityType,
      relatedEntityId,
      brand
    } = body;

    if (!recipientId || !type || !title || !brand) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 检查权限（只有管理员或自己可以创建通知）
    const isAdmin = authResult.roles.some((r: any) => r.role === 'admin' || r.role === 'super_admin');
    const isSelf = recipientId === authResult.userId;

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { error: '您没有权限创建此通知' },
        { status: 403 }
      );
    }

    // 创建 Supabase 客户端
    ;
    ;
    const client = getSupabaseClient();

    // 创建通知
    const { data: notification, error: notificationError } = await client
      .from('notifications')
      .insert({
        recipient_id: recipientId,
        sender_id: authResult.userId,
        type,
        title,
        content: content || null,
        related_entity_type: relatedEntityType || null,
        related_entity_id: relatedEntityId || null,
        brand
      })
      .select()
      .single();

    if (notificationError) {
      console.error('创建通知失败:', notificationError);
      return NextResponse.json(
        { error: '创建通知失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notification,
      message: '通知创建成功'
    });

  } catch (error) {
    console.error('创建通知失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 获取通知列表
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 创建 Supabase 客户端
    ;
    ;
    const client = getSupabaseClient();

    // 构建查询
    let query = client
      .from('notifications')
      .select('*')
      .eq('recipient_id', authResult.userId)
      .order('created_at', { ascending: false });

    // 过滤条件
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (type) {
      query = query.eq('type', type);
    }

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data: notifications, error: notificationsError } = await query;

    if (notificationsError) {
      console.error('获取通知失败:', notificationsError);
      return NextResponse.json(
        { error: '获取通知失败' },
        { status: 500 }
      );
    }

    // 获取未读数量
    const { count: unreadCount } = await client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', authResult.userId)
      .eq('is_read', false);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount: unreadCount || 0,
      total: notifications.length
    });

  } catch (error) {
    console.error('获取通知失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
