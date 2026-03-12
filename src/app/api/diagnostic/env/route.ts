import { getSupabaseCredentials } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  // 认证检查 - 只允许管理员访问
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const user = authResult;

  // 只允许 brand=all 的管理员访问
  if (user.brand !== 'all') {
    return NextResponse.json(
      { error: '无权限访问此接口' },
      { status: 403 }
    );
  }

  try {
    let supabaseUrlStatus = '✗ 未设置';
    let supabaseKeyStatus = '✗ 未设置';
    
    try {
      const creds = getSupabaseCredentials();
      supabaseUrlStatus = '✓ 已设置';
      supabaseKeyStatus = '✓ 已设置';
    } catch {
      // 凭证获取失败
    }

    const envStatus = {
      supabaseUrl: supabaseUrlStatus,
      supabaseAnonKey: supabaseKeyStatus,
      jwtSecret: process.env.JWT_SECRET ? '✓ 已设置' : '✗ 未设置',
      nodeEnv: process.env.NODE_ENV || '未设置',
    };

    return NextResponse.json({
      success: true,
      env: envStatus,
      message: envStatus.supabaseUrl === '✓ 已设置' && envStatus.supabaseAnonKey === '✓ 已设置'
        ? '环境变量配置正常'
        : '环境变量配置异常，请检查'
    });
  } catch (error) {
    return NextResponse.json(
      { error: '检查失败', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
