/**
 * 测试登录接口 - 仅限开发环境使用
 * 安全警告：此接口已被禁用
 */

import { NextRequest, NextResponse } from 'next/server';

// 此接口已禁用 - 安全原因
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: '此接口已禁用',
    message: '安全策略：测试接口仅在开发环境可用'
  }, { status: 403 });
}
