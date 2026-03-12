import { getSupabaseClient } from '@/storage/database/supabase-client';
/**
 * 环境变量诊断 API
 * 用于检查环境变量是否正确配置
 */

import { NextResponse } from 'next/server';

export async function GET() {
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
