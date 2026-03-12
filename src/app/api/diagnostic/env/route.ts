import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envStatus = {
      // REMOVED: supabaseUrl: process.env.COZE_SUPABASE_URL ? '✓ 已设置' : '✗ 未设置',
      // REMOVED: supabaseAnonKey: process.env.COZE_SUPABASE_ANON_KEY ? '✓ 已设置' : '✗ 未设置',
      jwtSecret: process.env.JWT_SECRET ? '✓ 已设置' : '✗ 未设置',
      nodeEnv: process.env.NODE_ENV || '未设置',
    };

    return NextResponse.json({
      success: true,
      env: envStatus,
      message: envStatus.// REMOVED: supabaseUrl === '✓ 已设置' && envStatus.// REMOVED: supabaseAnonKey === '✓ 已设置'
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
