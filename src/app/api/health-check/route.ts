import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { disableInProduction } from '@/lib/diagnostic-guard';

export async function GET(request: NextRequest) {
  // 生产环境禁用
  const disabledResponse = disableInProduction(request);
  if (disabledResponse) return disabledResponse;
  const checks: { name: string; status: 'ok' | 'error'; message: string; duration?: number }[] = [];

  // 1. 检查环境变量
  const dbCheckStart = Date.now();
  try {
    const supabase = getSupabaseClient();

    // 简单查询，测试连接
    const { data, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });

    if (error) {
      checks.push({
        name: '数据库连接',
        status: 'error',
        message: error.message,
        duration: Date.now() - dbCheckStart,
      });
    } else {
      checks.push({
        name: '数据库连接',
        status: 'ok',
        message: `用户总数: ${data}`,
        duration: Date.now() - dbCheckStart,
      });
    }
  } catch (error: any) {
    checks.push({
      name: '数据库连接',
      status: 'error',
      message: error.message || '未知错误',
      duration: Date.now() - dbCheckStart,
    });
  }

  // 3. 检查用户表
  const userTableCheckStart = Date.now();
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('users')
      .select('id, email, name')
      .limit(1);

    if (error) {
      checks.push({
        name: '用户表查询',
        status: 'error',
        message: error.message,
        duration: Date.now() - userTableCheckStart,
      });
    } else {
      checks.push({
        name: '用户表查询',
        status: 'ok',
        message: data && data.length > 0 ? `查询成功: ${data[0].email}` : '用户表为空',
        duration: Date.now() - userTableCheckStart,
      });
    }
  } catch (error: any) {
    checks.push({
      name: '用户表查询',
      status: 'error',
      message: error.message || '未知错误',
      duration: Date.now() - userTableCheckStart,
    });
  }

  // 判断整体状态
  const overall = checks.every(c => c.status === 'ok') ? 'ok' : 'error';

  return NextResponse.json({
    checks,
    overall,
    timestamp: new Date().toISOString(),
  });
}
