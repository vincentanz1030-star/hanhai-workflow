import { NextRequest, NextResponse } from 'next/server';
import { chatWithAI, getCozeBotConfig } from '@/lib/ai/coze-service';

/**
 * 测试 Coze Bot 连接
 */
export async function GET(request: NextRequest) {
  try {
    const config = getCozeBotConfig();

    return NextResponse.json({
      success: true,
      config: {
        configured: config.configured,
        botId: config.botId,
        hasToken: config.hasToken,
        // 不返回完整的 token，只返回前8个字符用于验证
        tokenPreview: process.env.COZE_BOT_TOKEN ? process.env.COZE_BOT_TOKEN.substring(0, 8) + '...' : 'not set',
      },
      message: config.configured
        ? 'Coze Bot 已配置'
        : 'Coze Bot 未配置，请检查环境变量',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * 测试 Coze Bot 对话
 */
export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: '请输入测试消息' },
        { status: 400 }
      );
    }

    const response = await chatWithAI(message);

    return NextResponse.json({
      success: true,
      message: response,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
