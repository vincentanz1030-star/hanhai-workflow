import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/api-auth';

// 批量标记所有通知为已读
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    // 创建 Supabase 客户端
    const supabaseUrl = process.env.COZE_SUPABASE_URL!;
    const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;
    const client = createClient(supabaseUrl, supabaseAnonKey);

    // 标记所有未读通知为已读
    const { error: updateError } = await client
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('recipient_id', authResult.user.id)
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
