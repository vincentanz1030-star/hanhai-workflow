import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 直接从环境变量获取 Supabase 配置
// SSE 实时通知推送
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
  }

  // 设置 SSE 响应头
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const client = getSupabaseClient();
      
      // 发送初始连接成功消息
      const data = `data: ${JSON.stringify({ type: 'connected', message: 'SSE连接成功' })}\n\n`;
      controller.enqueue(encoder.encode(data));

      // 轮询检查新通知
      let lastChecked = new Date().toISOString();
      const pollInterval = setInterval(async () => {
        try {
          // 查询自上次检查以来的新通知
          const { data: notifications, error } = await client
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', lastChecked)
            .order('created_at', { ascending: true });

          if (error) {
            console.error('获取通知失败:', error);
            return;
          }

          if (notifications && notifications.length > 0) {
            // 发送新通知
            for (const notification of notifications) {
              const message = `data: ${JSON.stringify({
                type: 'notification',
                data: notification,
              })}\n\n`;
              controller.enqueue(encoder.encode(message));
            }
            
            // 更新最后检查时间
            lastChecked = new Date().toISOString();
          }
        } catch (error) {
          console.error('SSE轮询失败:', error);
        }
      }, 5000); // 每5秒检查一次

      // 心跳检测
      const heartbeatInterval = setInterval(() => {
        const heartbeat = `: heartbeat\n\n`;
        controller.enqueue(encoder.encode(heartbeat));
      }, 30000); // 每30秒发送一次心跳

      // 清理函数
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        clearInterval(heartbeatInterval);
        controller.close();
      });

      // 发送初始未读通知
      try {
        const { data: unreadNotifications } = await client
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(10);

        if (unreadNotifications && unreadNotifications.length > 0) {
          const message = `data: ${JSON.stringify({
            type: 'initial',
            data: unreadNotifications,
            unreadCount: unreadNotifications.length,
          })}\n\n`;
          controller.enqueue(encoder.encode(message));
        }
      } catch (error) {
        console.error('获取未读通知失败:', error);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Transfer-Encoding': 'chunked',
    },
  });
}
