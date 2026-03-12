import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// 标记通知为已读
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id: notificationId } = await params;

    // 创建 Supabase 客户端
    ;
    ;
    const client = getSupabaseClient();

    // 检查通知是否存在
    const { data: notification, error: notificationError } = await client
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (notificationError || !notification) {
      return NextResponse.json(
        { error: '通知不存在' },
        { status: 404 }
      );
    }

    // 检查权限（只能标记自己的通知）
    if (notification.recipient_id !== authResult.userId) {
      return NextResponse.json(
        { error: '您只能标记自己的通知' },
        { status: 403 }
      );
    }

    // 更新通知状态
    const { data: updatedNotification, error: updateError } = await client
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (updateError) {
      console.error('标记通知失败:', updateError);
      return NextResponse.json(
        { error: '标记通知失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: updatedNotification,
      message: '通知已标记为已读'
    });

  } catch (error) {
    console.error('标记通知失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 删除通知
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id: notificationId } = await params;

    // 创建 Supabase 客户端
    ;
    ;
    const client = getSupabaseClient();

    // 检查通知是否存在
    const { data: notification, error: notificationError } = await client
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (notificationError || !notification) {
      return NextResponse.json(
        { error: '通知不存在' },
        { status: 404 }
      );
    }

    // 检查权限（只能删除自己的通知）
    const isAdmin = authResult.roles.some((r: any) => r.role === 'admin');
    if (notification.recipient_id !== authResult.userId && !isAdmin) {
      return NextResponse.json(
        { error: '您只能删除自己的通知' },
        { status: 403 }
      );
    }

    // 删除通知
    const { error: deleteError } = await client
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (deleteError) {
      console.error('删除通知失败:', deleteError);
      return NextResponse.json(
        { error: '删除通知失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '通知已删除'
    });

  } catch (error) {
    console.error('删除通知失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
