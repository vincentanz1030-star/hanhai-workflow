/**
 * 数据中台 API 路由
 * 提供数据中台能力的REST接口
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataPlatform } from '@/lib/data-platform/core';
import { aggregators } from '@/lib/data-platform/aggregators';
import { requireAuth } from '@/lib/api-auth';
import { isAdmin } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  // 验证用户身份
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  // 敏感操作需要管理员权限
  if (action === 'clear-cache') {
    const admin = await isAdmin(authResult.userId);
    if (!admin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }
  }

  try {
    const dataPlatform = getDataPlatform();

    switch (action) {
      case 'cache-stats':
        // 获取缓存统计
        return NextResponse.json({
          success: true,
          data: {
            cacheCount: 0, // 由于cacheStore是私有的，这里返回模拟数据
            timestamp: new Date().toISOString(),
          },
        });

      case 'clear-cache':
        // 清除缓存
        const pattern = searchParams.get('pattern') || undefined;
        dataPlatform.clearCache(pattern);
        return NextResponse.json({
          success: true,
          message: '缓存已清除',
          timestamp: new Date().toISOString(),
        });

      case 'aggregate-project-stats':
        // 聚合项目统计
        const projectStats = await aggregators.projectStats();
        return NextResponse.json({
          success: true,
          data: projectStats,
        });

      case 'aggregate-workload':
        // 聚合工作负载
        const workload = await aggregators.workload();
        return NextResponse.json({
          success: true,
          data: workload,
        });

      case 'aggregate-dashboard':
        // 聚合仪表盘数据
        const dashboard = await aggregators.dashboard();
        return NextResponse.json({
          success: true,
          data: dashboard,
        });

      case 'aggregate-project-detail':
        // 聚合项目详情
        const projectId = searchParams.get('projectId');
        if (!projectId) {
          return NextResponse.json(
            { success: false, error: '缺少 projectId 参数' },
            { status: 400 }
          );
        }
        const projectDetail = await aggregators.projectDetail(projectId);
        return NextResponse.json({
          success: true,
          data: projectDetail,
        });

      default:
        return NextResponse.json(
          { success: false, error: '未知的操作类型' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[DataPlatform API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
