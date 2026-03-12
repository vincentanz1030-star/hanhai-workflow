import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createTasksForProject } from '@/lib/project-tasks';

// 直接从环境变量获取 Supabase 配置

export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  const logs: string[] = [];

  const addLog = (message: string) => {
    logs.push(`[${new Date().toISOString()}] ${message}`);
    console.log(message);
  };

  try {
    addLog('=== 强制创建项目 ===');

    // 1. 获取用户信息
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      addLog('❌ 用户未登录');
      return NextResponse.json({ logs, error: '用户未登录' }, { status: 401 });
    }
    addLog(`✅ 用户已登录: ${currentUser.email}, 品牌: ${currentUser.brand}`);

    // 2. 获取请求参数
    const body = await request.json();
    const { name, brand, category, salesDate, description } = body;
    addLog(`项目数据: ${JSON.stringify(body)}`);

    if (!name || !salesDate || !brand || !category) {
      addLog('❌ 缺少必填项');
      return NextResponse.json({ logs, error: '项目名称、品牌、分类和销售日期为必填项' }, { status: 400 });
    }

    // 3. 计算日期
    const salesDateObj = new Date(salesDate);
    const projectConfirmDateObj = new Date(salesDateObj);
    projectConfirmDateObj.setMonth(projectConfirmDateObj.getMonth() - 3);

    // 4. 确定最终品牌
    let finalBrand = brand;
    if (currentUser.brand !== 'all') {
      finalBrand = currentUser.brand;
      addLog(`强制使用用户品牌: ${finalBrand}`);
    }

    // 5. 创建项目
    addLog('开始创建项目...');
    const { data: project, error: projectError } = await client
      .from('projects')
      .insert({
        name,
        brand: finalBrand,
        category,
        sales_date: salesDate,
        project_confirm_date: projectConfirmDateObj.toISOString(),
        description: description || null,
        status: 'pending',
      })
      .select()
      .single();

    if (projectError) {
      addLog(`❌ 创建项目失败: ${projectError.message}`);
      addLog(`错误详情: ${JSON.stringify(projectError)}`);
      return NextResponse.json({ logs, error: projectError.message }, { status: 500 });
    }

    addLog(`✅ 项目创建成功，ID: ${project.id}`);

    // 6. 创建任务
    addLog('开始创建任务...');
    const tasks = await createTasksForProject(
      client,
      project.id,
      salesDate,
      projectConfirmDateObj,
      category
    );
    addLog(`✅ 创建了 ${tasks.length} 个任务`);

    // 7. 更新项目预计完成时间
    const estimatedDates = tasks
      .filter((t: any) => t.estimated_completion_date)
      .map((t: any) => new Date(t.estimated_completion_date));

    if (estimatedDates.length > 0) {
      const maxDate = new Date(Math.max(...estimatedDates.map((d: any) => d.getTime())));
      await client
        .from('projects')
        .update({ overall_completion_date: maxDate.toISOString() })
        .eq('id', project.id);
      addLog(`✅ 更新预计完成时间: ${maxDate.toISOString()}`);
    }

    // 8. 验证项目是否真的保存了
    addLog('验证项目是否保存...');
    const { data: checkProject, error: checkError } = await client
      .from('projects')
      .select('*')
      .eq('id', project.id)
      .single();

    if (checkError) {
      addLog(`❌ 验证失败: ${checkError.message}`);
    } else {
      addLog(`✅ 验证成功，项目存在: ${checkProject.name}`);
    }

    // 9. 返回完整的项目数据（包括任务）
    const { data: finalProject } = await client
      .from('projects')
      .select('*, tasks(*)')
      .eq('id', project.id)
      .single();

    addLog('=== 创建完成 ===');
    return NextResponse.json({
      success: true,
      logs,
      project: finalProject,
    });

  } catch (error: any) {
    addLog(`❌ 服务器错误: ${error.message}`);
    addLog(`错误堆栈: ${error.stack}`);
    return NextResponse.json({
      success: false,
      logs,
      error: error.message,
    }, { status: 500 });
  }
}
