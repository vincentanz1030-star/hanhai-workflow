import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

// 安全警告：此接口需要管理员权限
export async function GET(request: NextRequest) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // 检查是否是管理员
  const isAdmin = authResult.roles?.some((r: { role: string }) => r.role === 'admin');
  if (!isAdmin) {
    return NextResponse.json({ error: '无权限执行此操作，仅限管理员' }, { status: 403 });
  }

  const envStatus = {
    // REMOVED: supabaseUrl: !!process.env.COZE_SUPABASE_URL,
    // REMOVED: supabaseAnonKey: !!process.env.COZE_SUPABASE_ANON_KEY,
    jwtSecret: !!process.env.JWT_SECRET,
    bucketEndpointUrl: !!process.env.COZE_BUCKET_ENDPOINT_URL,
    bucketName: !!process.env.COZE_BUCKET_NAME,
  };

  return NextResponse.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    envStatus,
    timestamp: new Date().toISOString(),
  });
}
