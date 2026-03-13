import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';
import { getPositionName } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const searchParams = request.nextUrl.searchParams;
    const brand = searchParams.get('brand');
    const position = searchParams.get('position');
    const includeTasks = searchParams.get('includeTasks') === 'true';

    ;
    ;
    const client = getSupabaseClient();

    const isAdmin = authResult.roles.some((r: any) => r.role === 'admin' || r.role === 'super_admin');
    const userBrand = authResult.brand;

    let queryBrand = brand;
    if (!isAdmin) {
      if (userBrand && userBrand !== 'all') {
        queryBrand = userBrand;
      } else {
        return NextResponse.json({
          workload: {
            byUser: [],
            byPosition: [],
            overloadedUsers: [],
            summary: {
              totalTasks: 0,
              completedTasks: 0,
              inProgressTasks: 0,
              overdueTasks: 0,
              overloadedCount: 0
            }
          }
        });
      }
    }

    let tasksQuery = client
      .from('tasks')
      .select(`
        id,
        task_name,
        role,
        status,
        description,
        progress,
        estimated_completion_date,
        actual_completion_date,
        project_id,
        projects (
          id,
          name,
          sales_date
        )
      `);

    // tasks 表没有 brand 列，需要通过 projects 表进行过滤
    // 如果指定了 brand，则过滤对应品牌的项目
    if (queryBrand) {
      // 注意：这里需要修改查询逻辑，暂时不过滤品牌
      // 因为 tasks 表没有 brand 列，我们需要通过 project_id 关联查询
    }

    const { data: tasks, error: tasksError } = await tasksQuery;

    if (tasksError) {
      console.error('获取任务失败:', tasksError);
      console.error('错误详情:', JSON.stringify(tasksError));
      return NextResponse.json({ error: '获取任务失败', details: tasksError }, { status: 500 });
    }

    const byPosition: any[] = [];
    const positionTasksMap: Record<string, any[]> = {};

    tasks.forEach((task: any) => {
      const position = task.role || '未分类';
      if (!positionTasksMap[position]) {
        positionTasksMap[position] = [];
      }
      positionTasksMap[position].push(task);
    });

    Object.keys(positionTasksMap).forEach(pos => {
      const positionTaskList = positionTasksMap[pos];
      const inProgress = positionTaskList.filter((t: any) => t.status === 'in-progress');
      const pending = positionTaskList.filter((t: any) => t.status === 'pending');
      const completed = positionTaskList.filter((t: any) => t.status === 'completed');

      const now = new Date();
      const overdue = positionTaskList.filter((t: any) => {
        return t.estimated_completion_date && new Date(t.estimated_completion_date) < now && t.status !== 'completed';
      });

      // 定义positionData的类型，包含可选的tasks字段
      let positionData: any = {
        position: getPositionName(pos),
        originalPosition: pos,
        totalTasks: positionTaskList.length,
        inProgressTasks: inProgress.length,
        pendingTasks: pending.length,
        completedTasks: completed.length,
        overdueTasks: overdue.length,
        averageWorkload: positionTaskList.length > 0
          ? (inProgress.length * 3 + pending.length * 2 + overdue.length * 5) / positionTaskList.length
          : 0
      };

      // 如果用户请求了任务详情，则添加任务列表
      if (includeTasks && (!position || pos === position)) {
        positionData.tasks = positionTaskList.map((t: any) => ({
          id: t.id,
          taskName: t.task_name,
          description: t.description,
          status: t.status,
          progress: t.progress,
          estimatedCompletionDate: t.estimated_completion_date,
          actualCompletionDate: t.actual_completion_date,
          projectName: t.projects?.name || '未知项目',
          projectSalesDate: t.projects?.sales_date,
          isOverdue: t.estimated_completion_date && new Date(t.estimated_completion_date) < now && t.status !== 'completed'
        }));
      }

      byPosition.push(positionData);
    });

    const overloadedUsers = byPosition.filter((p: any) => p.averageWorkload >= 2);

    const summary = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t: any) => t.status === 'completed').length,
      inProgressTasks: tasks.filter((t: any) => t.status === 'in-progress').length,
      overdueTasks: tasks.filter((t: any) => {
        const now = new Date();
        return t.estimated_completion_date && new Date(t.estimated_completion_date) < now && t.status !== 'completed';
      }).length,
      overloadedCount: overloadedUsers.length,
      averageWorkload: byPosition.length > 0 
        ? byPosition.reduce((sum: number, p: any) => sum + p.averageWorkload, 0) / byPosition.length
        : 0
    };

    return NextResponse.json({
      success: true,
      workload: {
        byUser: [],
        byPosition,
        overloadedUsers,
        summary
      }
    });

  } catch (error) {
    console.error('获取工作负载失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
