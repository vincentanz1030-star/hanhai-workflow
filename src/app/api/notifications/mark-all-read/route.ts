import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// 批量标记所有通知为已读
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // 创建 Supabase 客户端
    ;
    ;
    const client = getSupabaseClient();

    // 标记所有未读通知为已读
    const { error: updateError } = await client
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('recipient_id', authResult.userId)
      .eq('is_read', false);

    if (updateError) {
      console.error('批量标记失败:', updateError);
      return NextResponse.json(
        { error: '批量标记失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '所有通知已标记为已读'
    });

  } catch (error) {
    console.error('批量标记失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
