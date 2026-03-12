import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';

// 直接从环境变量获取 Supabase 配置

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    console.log(`查询项目ID: ${id}`);

    // 查询项目
    const { data: project, error } = await client
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`查询项目失败:`, error);
      return NextResponse.json({
        success: false,
        exists: false,
        error: error.message
      });
    }

    if (!project) {
      console.log(`项目不存在: ${id}`);
      return NextResponse.json({
        success: true,
        exists: false,
        message: '项目不存在'
      });
    }

    // 查询项目的任务
    const { data: tasks, error: tasksError } = await client
      .from('tasks')
      .select('*')
      .eq('project_id', id);

    console.log(`项目存在: ${project.name}, 任务数量: ${tasks?.length || 0}`);

    return NextResponse.json({
      success: true,
      exists: true,
      project: project,
      tasks: tasks || [],
      taskCount: tasks?.length || 0
    });

  } catch (error: any) {
    console.error(`查询项目异常:`, error);
    return NextResponse.json({
      success: false,
      exists: false,
      error: error.message
    });
  }
}
