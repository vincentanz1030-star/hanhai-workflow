/**
 * 管理员权限中间件
 * 用于保护敏感的管理接口和诊断接口
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

/**
 * 验证请求是否来自管理员
 * @param request NextRequest
 * @returns 用户信息或错误响应
 */
export async function requireAdmin(request: NextRequest): Promise<{
  user: { userId: string; email: string; brand: string; roles: any[] };
} | NextResponse> {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // 只允许 brand=all 的管理员访问
  if (authResult.brand !== 'all') {
    return NextResponse.json(
      { success: false, error: '无权限访问此接口，仅限管理员' },
      { status: 403 }
    );
  }

  return { user: authResult };
}

/**
 * 开发环境检查
 * @returns 是否为开发环境
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * 仅开发环境可用
 * @param request NextRequest
 * @returns 是否允许访问
 */
export async function requireDevelopment(request: NextRequest): Promise<NextResponse | null> {
  if (!isDevelopment()) {
    return NextResponse.json(
      { success: false, error: '此接口仅限开发环境使用' },
      { status: 403 }
    );
  }
  return null;
}
