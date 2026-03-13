import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

/**
 * 环境变量诊断 API
 * 用于检查环境变量是否正确配置
 * 安全警告：此接口需要管理员权限
 */

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

  const envCheck = {
    nodeEnv: process.env.NODE_ENV,
    // REMOVED: supabaseUrl: process.env.COZE_SUPABASE_URL ? '已设置' : '未设置',
    // REMOVED: supabaseAnonKey: process.env.COZE_SUPABASE_ANON_KEY ? '已设置' : '未设置',
    jwtSecret: process.env.JWT_SECRET ? '已设置' : '未设置',
    bucketEndpoint: process.env.COZE_BUCKET_ENDPOINT_URL ? '已设置' : '未设置',
    bucketName: process.env.COZE_BUCKET_NAME ? '已设置' : '未设置',
  };

  // 检查必需的环境变量
  const required = [
    'COZE_SUPABASE_URL',
    'COZE_SUPABASE_ANON_KEY',
    'JWT_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    return NextResponse.json({
      status: 'error',
      message: '缺少必需的环境变量',
      missing,
      envCheck,
    }, { status: 500 });
  }

  return NextResponse.json({
    status: 'ok',
    message: '所有必需的环境变量已配置',
    envCheck,
  });
}
