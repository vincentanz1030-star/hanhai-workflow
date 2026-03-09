import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getAuditLogs } from '@/lib/audit-log';

/**
 * 获取审计日志列表
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // 只有管理员可以查看审计日志
  const isAdmin = authResult.roles && authResult.roles.some((r: any) => r.role === 'admin');
  if (!isAdmin) {
    return NextResponse.json({ error: '无权限查看审计日志' }, { status: 403 });
  }

  return getAuditLogs(request);
}
