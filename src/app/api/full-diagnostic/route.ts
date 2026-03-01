import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// 直接从环境变量获取 Supabase 配置
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 环境变量未设置');
}

export async function GET(request: NextRequest) {
  const logs: string[] = [];
  const timestamp = Date.now();

  const addLog = (message: string) => {
    const log = `[${new Date().toISOString()}] ${message}`;
    logs.push(log);
    console.log(log);
  };

  try {
    addLog('=== 完整诊断开始 ===');

    const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });
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

    // 3. 查询所有项目
    addLog('\n步骤3: 查询所有项目');
    const { data: allProjects, error: allError } = await client
      .from('projects')
      .select('id, name, brand, created_at')
      .order('created_at', { ascending: false });

    if (allError) {
      addLog(`❌ 查询所有项目失败: ${allError.message}`);
    } else {
      addLog(`✅ 总项目数: ${allProjects?.length || 0}`);

      // 统计各品牌项目数量
      const brandCount: Record<string, number> = {};
      allProjects?.forEach((p: any) => {
        brandCount[p.brand] = (brandCount[p.brand] || 0) + 1;
      });
      addLog(`各品牌分布:`);
      Object.entries(brandCount).forEach(([brand, count]) => {
        addLog(`   ${brand}: ${count} 个`);
      });

      // 显示最近5个项目
      addLog(`最近5个项目:`);
      allProjects?.slice(0, 5).forEach((p: any, i: number) => {
        addLog(`   ${i + 1}. ${p.name} (${p.brand}) - 创建于: ${p.created_at}`);
      });
    }

    // 4. 检查项目是否在"最近项目"列表中
    addLog('\n步骤4: 验证项目位置');
    if (allProjects) {
      const index = allProjects.findIndex((p: any) => p.id === projectId);
      if (index !== -1) {
        addLog(`✅ 项目在所有项目列表中，位置: ${index + 1}/${allProjects.length}`);
      } else {
        addLog(`❌ 项目不在所有项目列表中！`);
      }
    }

    addLog('\n=== 诊断完成 ===');

    return NextResponse.json({
      success: true,
      logs,
      project,
      tasks,
      allProjectsCount: allProjects?.length || 0,
      tasksCount: tasks?.length || 0,
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
