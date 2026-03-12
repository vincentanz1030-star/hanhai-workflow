import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 简化的项目创建 API
export async function POST(request: NextRequest) {
  try {
    // 创建 Supabase 客户端
    const client = getSupabaseClient();

    // 解析请求体
    const body = await request.json();
    const { brand, name, description, positions, startDate } = body;

    // 验证必填项
    if (!name || !brand) {
      return NextResponse.json(
        { error: '项目名称和品牌为必填项' },
        { status: 400 }
      );
    }

    // 计算项目确认日期（默认当前日期）
    const startDateObj = startDate ? new Date(startDate) : new Date();

    // 创建项目
    console.log(`创建项目 - 名称: ${name}, 品牌: ${brand}`);
    const { data: project, error: projectError } = await client
      .from('projects')
      .insert({
        name,
        brand,
        category: 'custom', // 自定义分类
        sales_date: startDateObj.toISOString(),
        project_confirm_date: new Date().toISOString(),
        description: description || null,
        status: 'pending',
      })
      .select()
      .single();

    if (projectError) {
      console.error('创建项目失败:', projectError);
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    if (!project) {
      console.error('项目插入后未返回数据');
      return NextResponse.json({ error: '项目创建失败' }, { status: 500 });
    }

    console.log(`✅ 项目创建成功，ID: ${project.id}`);

    // 如果指定了参与岗位，创建对应任务
    if (positions && positions.length > 0) {
      const tasks = positions.map((position: string) => ({
        project_id: project.id,
        position,
        task_name: `${position}任务`,
        status: 'pending',
        progress: 0,
        estimated_start_date: startDateObj.toISOString(),
        estimated_completion_date: new Date(
          startDateObj.getTime() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }));

      const { error: tasksError } = await client
        .from('tasks')
        .insert(tasks);

      if (tasksError) {
        console.error('创建任务失败:', tasksError);
        // 任务创建失败不影响项目创建成功
      } else {
        console.log(`✅ 创建了 ${tasks.length} 个岗位任务`);
      }
    }

    // 转换为驼峰命名
    const camelProject = {
      id: project.id,
      name: project.name,
      brand: project.brand,
      description: project.description,
      salesDate: project.sales_date,
      status: project.status,
      createdAt: project.created_at,
    };

    return NextResponse.json({ project: camelProject });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
