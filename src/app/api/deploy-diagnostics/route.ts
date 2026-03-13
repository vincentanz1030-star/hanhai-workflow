import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

// 部署环境诊断 - 需要管理员权限
export async function GET(request: NextRequest) {
  // 认证检查
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

  const logs: string[] = [];

  const addLog = (message: string) => {
    logs.push(`[${new Date().toISOString()}] ${message}`);
    console.log(message);
  };

  try {
    addLog('=== 部署环境诊断开始 ===');

    // 1. 环境变量检查（不暴露敏感信息）
    addLog('步骤1: 检查环境变量');
    const envCheck = {
      jwtSecret: process.env.JWT_SECRET ? '已配置' : '未配置',
      nodeEnv: process.env.NODE_ENV || '未配置',
    };
    addLog(`环境变量: ${JSON.stringify(envCheck)}`);

    // 2. 时区检查
    addLog('步骤2: 检查时区');
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    addLog(`时区: ${timezone}`);
    const testDate = new Date();
    addLog(`当前时间: ${testDate.toISOString()}`);
    addLog(`本地时间: ${testDate.toLocaleString('zh-CN')}`);

    // 3. 数据库连接测试
    addLog('步骤3: 测试数据库连接');
    try {
      const client = getSupabaseClient();
      addLog('数据库客户端创建成功');

      // 测试查询
      const { data, error, count } = await client
        .from('projects')
        .select('*', { count: 'exact', head: true });

      if (error) {
        addLog(`❌ 数据库查询失败: ${error.message}`);
      } else {
        addLog(`✅ 数据库连接成功`);
        addLog(`项目总数: ${count || 0}`);
      }
    } catch (error: any) {
      addLog(`❌ 数据库连接异常: ${error.message}`);
    }

    // 4. 检查最近创建的项目
    addLog('步骤4: 查询最近创建的5个项目');
    try {
      const client = getSupabaseClient();
      const { data: recentProjects, error } = await client
        .from('projects')
        .select('id, name, brand, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        addLog(`❌ 查询最近项目失败: ${error.message}`);
      } else {
        addLog(`✅ 查询成功，项目数量: ${recentProjects?.length || 0}`);
        if (recentProjects && recentProjects.length > 0) {
          recentProjects.forEach((p: { name: string; brand: string; created_at: string }, i: number) => {
            addLog(`  ${i + 1}. ${p.name} (${p.brand}) - 创建时间: ${p.created_at}`);
          });
        }
      }
    } catch (error: any) {
      addLog(`❌ 查询最近项目异常: ${error.message}`);
    }

    addLog('=== 诊断完成 ===');

    return NextResponse.json({
      success: true,
      logs,
      envCheck,
      timezone,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    addLog(`❌ 诊断过程异常: ${error.message}`);
    return NextResponse.json({
      success: false,
      logs,
      error: error.message,
    }, { status: 500 });
  }
}
