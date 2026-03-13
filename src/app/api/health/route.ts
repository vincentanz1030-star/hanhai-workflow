import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db-pool';
import { disableInProduction } from '@/lib/diagnostic-guard';

export async function GET(request: NextRequest) {
  // 生产环境禁用
  const disabledResponse = disableInProduction(request);
  if (disabledResponse) return disabledResponse;
  const startTime = Date.now();
  
  try {
    // 检查数据库连接
    const dbHealth = await checkDatabaseHealth();
    
    const response = {
      status: dbHealth.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: dbHealth.healthy,
        latency: dbHealth.latency,
        error: dbHealth.error,
      },
      environment: process.env.NODE_ENV,
      responseTime: Date.now() - startTime,
    };
    
    const statusCode = dbHealth.healthy ? 200 : 503;
    
    return NextResponse.json(response, { status: statusCode });
  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message || '健康检查失败',
      responseTime: Date.now() - startTime,
    }, { status: 503 });
  }
}
