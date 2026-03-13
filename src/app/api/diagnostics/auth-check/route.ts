/**
 * 认证诊断接口
 * 用于调试身份认证问题
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest } from '@/lib/token-helper';
import { verifyToken } from '@/lib/auth';
import { disableInProduction } from '@/lib/diagnostic-guard';

export async function GET(request: NextRequest) {
  // 生产环境禁用
  const disabledResponse = disableInProduction(request);
  if (disabledResponse) return disabledResponse;
  // 获取请求信息
  const cookieHeader = request.headers.get('cookie');
  const authHeader = request.headers.get('authorization');

  // 获取 token
  const token = await getTokenFromRequest(request);

  // 验证 token
  let decoded = null;
  let tokenValid = false;
  if (token) {
    decoded = verifyToken(token);
    tokenValid = !!decoded;
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    request: {
      cookieExists: !!cookieHeader,
      authHeaderExists: !!authHeader,
      authHeaderStartsWithBearer: authHeader?.startsWith('Bearer '),
    },
    token: {
      exists: !!token,
      length: token?.length,
      source: authHeader?.startsWith('Bearer ') ? 'Authorization header' : 'Cookie',
      valid: tokenValid,
      decoded: decoded ? {
        userId: decoded.userId,
        email: decoded.email,
        brand: decoded.brand,
      } : null,
    },
    hints: {
      noToken: !token ? '未找到 token。请检查是否已登录，或者 localStorage 中是否有 auth_token' : null,
      invalidToken: token && !tokenValid ? 'Token 存在但验证失败。可能是 token 已过期或格式不正确' : null,
      validToken: tokenValid ? 'Token 验证成功！认证系统工作正常' : null,
    },
  });
}
