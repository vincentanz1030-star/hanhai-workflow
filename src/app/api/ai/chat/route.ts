import { NextRequest, NextResponse } from 'next/server';
import { chatWithAI, isCozeBotConfigured } from '@/lib/ai/coze-service';

export async function POST(request: NextRequest) {
  try {
    // 检查是否配置了 Coze Bot
    if (!isCozeBotConfigured()) {
      return NextResponse.json(
        {
          error: 'AI助手未配置',
          message: '请联系管理员设置 Coze Bot ID 和 Token',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { message, context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      );
    }

    // 调用 Coze AI 服务
    const response = await chatWithAI(message, context);

    return NextResponse.json({
      success: true,
      response,
    });
  } catch (error) {
    console.error('AI Chat API 错误:', error);
    return NextResponse.json(
      {
        error: 'AI助手服务异常',
        message: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // 检查 AI 服务配置状态
  const config = isCozeBotConfigured();

  return NextResponse.json({
    configured: config,
    message: config ? 'AI助手已配置' : 'AI助手未配置',
  });
}
