import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { disableInProduction } from '@/lib/diagnostic-guard';

// 完整诊断 - 需要管理员权限
export async function GET(request: NextRequest) {
  // 生产环境禁用
  const disabledResponse = disableInProduction(request);
  if (disabledResponse) return disabledResponse;
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
  const timestamp = Date.now();

  const addLog = (message: string) => {
    const log = `[${new Date().toISOString()}] ${message}`;
    logs.push(log);
    console.log(log);
  };

  try {
    addLog('=== 完整诊断开始 ===');

    const client = getSupabaseClient();
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get('id');

    if (!projectId) {
      addLog('❌ 缺少项目ID参数');
      return NextResponse.json({ error: '缺少项目ID' }, { status: 400 });
    }

    addLog(`诊断项目ID: ${projectId}`);

    // 1. 查询项目
    addLog('\n步骤1: 查询项目');
    const { data: project, error: projectError } = await client
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) {
      addLog(`❌ 查询项目失败: ${projectError.message}`);
      addLog(`错误代码: ${projectError.code}`);
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    if (!project) {
      addLog(`❌ 项目不存在于数据库中`);
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    addLog(`✅ 项目存在: ${project.name}`);
    addLog(`   品牌: ${project.brand}`);
    addLog(`   分类: ${project.category}`);
    addLog(`   创建时间: ${project.created_at}`);

    // 2. 查询任务
    addLog('\n步骤2: 查询任务');
    const { data: tasks, error: tasksError } = await client
      .from('tasks')
      .select('*')
      .eq('project_id', projectId);

    if (tasksError) {
      addLog(`❌ 查询任务失败: ${tasksError.message}`);
    } else {
      addLog(`✅ 任务数量: ${tasks?.length || 0}`);
      tasks?.forEach((t: any, i: number) => {
        addLog(`   ${i + 1}. ${t.task_name} (${t.role})`);
      });
    }

    // 3. 查询所有项目（仅统计）
    addLog('\n步骤3: 统计所有项目');
    const { count: allProjectsCount, error: allError } = await client
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (allError) {
      addLog(`❌ 统计项目失败: ${allError.message}`);
    } else {
      addLog(`✅ 总项目数: ${allProjectsCount || 0}`);
    }

    addLog('\n=== 诊断完成 ===');

    return NextResponse.json({
      success: true,
      logs,
      project: {
        id: project.id,
        name: project.name,
        brand: project.brand,
        category: project.category,
        status: project.status,
      },
      tasksCount: tasks?.length || 0,
      allProjectsCount: allProjectsCount || 0,
    });

  } catch (error: any) {
    addLog(`❌ 诊断异常: ${error.message}`);
    return NextResponse.json({
      success: false,
      logs,
      error: error.message,
    }, { status: 500 });
  }
}
