import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const POSITION_ORDER = ['插画', '产品', '详情', '文案', '采购', '包装', '财务', '客服', '仓储', '运营'];

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const brand = searchParams.get('brand');
    const includeCompleted = searchParams.get('includeCompleted') === 'true';

    const supabaseUrl = process.env.COZE_SUPABASE_URL!;
    const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;
    const client = createClient(supabaseUrl, supabaseAnonKey);

    const isAdmin = authResult.roles.some((r: any) => r.role === 'admin');
    const userBrand = authResult.brand;

    let queryBrand = brand;
    if (!isAdmin) {
      if (userBrand && userBrand !== 'all') {
        queryBrand = userBrand;
      } else {
        return NextResponse.json({
          criticalPath: {
            projectCriticalPath: [],
            bottleneckTasks: [],
            summary: {
              totalProjects: 0,
              atRiskProjects: 0,
              onTrackProjects: 0,
              delayedProjects: 0
            }
          }
        });
      }
    }

    let projectsQuery = client
      .from('projects')
      .select(`
        id,
        name,
        category,
        sales_date,
        brand,
        tasks (
          id,
          task_name,
          role,
          status,
          estimated_completion_date,
          actual_completion_date,
          progress
        )
      `);

    if (queryBrand) {
      projectsQuery = projectsQuery.eq('brand', queryBrand);
    }

    if (projectId) {
      projectsQuery = projectsQuery.eq('id', projectId);
    }

    if (!includeCompleted) {
      projectsQuery = projectsQuery.or('status.is.null,status.neq.completed');
    }

    const { data: projects, error: projectsError } = await projectsQuery;

    if (projectsError) {
      console.error('获取项目失败:', projectsError);
      console.error('错误详情:', JSON.stringify(projectsError));
      return NextResponse.json({ error: '获取项目失败', details: projectsError }, { status: 500 });
    }

    const projectCriticalPath = projects.map((project: any) => {
      const tasks = project.tasks || [];
      
      const sortedTasks = tasks.sort((a: any, b: any) => {
        const indexA = POSITION_ORDER.indexOf(a.role || '');
        const indexB = POSITION_ORDER.indexOf(b.role || '');
        return indexA - indexB;
      });

      const result = calculateCriticalPath(sortedTasks, project.sales_date);

      return {
        projectId: project.id,
        projectName: project.name,
        projectType: project.category,
        salesDate: project.sales_date,
        brand: project.brand,
        ...result
      };
    });

    const bottleneckTasks: any[] = [];
    projectCriticalPath.forEach((project: any) => {
      if (project.bottleneckTasks && project.bottleneckTasks.length > 0) {
        bottleneckTasks.push(...project.bottleneckTasks);
      }
    });

    bottleneckTasks.sort((a: any, b: any) => {
      const priorityOrder: Record<string, number> = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
      return priorityOrder[a.riskLevel] - priorityOrder[b.riskLevel];
    });

    const summary = {
      totalProjects: projects.length,
      atRiskProjects: projectCriticalPath.filter((p: any) => p.status === 'at-risk').length,
      onTrackProjects: projectCriticalPath.filter((p: any) => p.status === 'on-track').length,
      delayedProjects: projectCriticalPath.filter((p: any) => p.status === 'delayed').length
    };

    return NextResponse.json({
      success: true,
      criticalPath: {
        projectCriticalPath,
        bottleneckTasks,
        summary
      }
    });

  } catch (error) {
    console.error('获取关键路径失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

function calculateCriticalPath(tasks: any[], salesDate: string | null) {
  const now = new Date();
  const projectDeadline = salesDate ? new Date(salesDate) : null;

  const incompleteTasks = tasks.filter((t: any) => t.status !== 'completed');
  
  if (incompleteTasks.length === 0) {
    return {
      status: 'completed',
      criticalPath: tasks,
      bottleneckTasks: [],
      totalProgress: 100,
      estimatedCompletion: null
    };
  }

  const taskMap = new Map();
  incompleteTasks.forEach((task: any) => {
    taskMap.set(task.id, {
      ...task,
      predecessors: [],
      successors: [],
      earliestStart: null,
      latestStart: null,
      slack: null
    });
  });

  incompleteTasks.forEach((task: any, index: number) => {
    const currentPos = POSITION_ORDER.indexOf(task.role || '');
    
    incompleteTasks.forEach((other: any) => {
      const otherPos = POSITION_ORDER.indexOf(other.role || '');
      if (otherPos < currentPos) {
        const currentTask = taskMap.get(task.id);
        const otherTask = taskMap.get(other.id);
        if (currentTask && otherTask) {
          currentTask.predecessors.push(other.id);
          otherTask.successors.push(task.id);
        }
      }
    });
  });

  const taskArray = Array.from(taskMap.values());
  taskArray.forEach((task: any) => {
    if (task.predecessors.length === 0) {
      task.earliestStart = new Date(now);
    } else {
      const maxPredecessorEnd = task.predecessors
        .map((predId: any) => {
          const pred = taskMap.get(predId);
          if (!pred) return now;
          const endDate = pred.estimated_completion_date ? new Date(pred.estimated_completion_date) : pred.earliestStart || now;
          return new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
        })
        .reduce((max: any, date: any) => date > max ? date : max, now);
      task.earliestStart = maxPredecessorEnd;
    }
  });

  const projectEnd = projectDeadline || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const sortedByPosition = [...taskArray].sort((a: any, b: any) => {
    const indexA = POSITION_ORDER.indexOf(a.role || '');
    const indexB = POSITION_ORDER.indexOf(b.role || '');
    return indexB - indexA;
  });

  sortedByPosition.forEach((task: any) => {
    if (task.successors.length === 0) {
      task.latestStart = new Date(projectEnd.getTime() - 24 * 60 * 60 * 1000);
    } else {
      const minSuccessorStart = task.successors
        .map((succId: any) => {
          const succ = taskMap.get(succId);
          return succ?.latestStart || projectEnd;
        })
        .reduce((min: any, date: any) => date < min ? date : min, projectEnd);
      task.latestStart = new Date(minSuccessorStart.getTime() - 24 * 60 * 60 * 1000);
    }

    if (task.earliestStart && task.latestStart) {
      task.slack = (task.latestStart.getTime() - task.earliestStart.getTime()) / (24 * 60 * 60 * 1000);
    }
  });

  const criticalTasks = taskArray.filter((task: any) => {
    return task.slack !== null && task.slack <= 1;
  });

  const bottleneckTasks = criticalTasks
    .filter((task: any) => {
      const isOverdue = task.estimated_completion_date && new Date(task.estimated_completion_date) < now;
      const isDelayed = task.slack !== null && task.slack < 0;
      return isOverdue || isDelayed;
    })
    .map((task: any) => {
      let riskLevel = 'medium';
      if ((task.slack !== null && task.slack < -3)) {
        riskLevel = 'critical';
      } else if (task.priority === 'high' || (task.slack !== null && task.slack < 0)) {
        riskLevel = 'high';
      }

      return {
        taskId: task.id,
        taskTitle: task.title,
        position: task.position,
        status: task.status,
        deadline: task.deadline,
        slack: task.slack,
        riskLevel,
        assignee: task.role
      };
    });

  const completedCount = tasks.filter((t: any) => t.status === 'completed').length;
  const totalProgress = Math.round((completedCount / tasks.length) * 100);

  let estimatedCompletion = null;
  if (criticalTasks.length > 0) {
    const lastCriticalTask = criticalTasks[criticalTasks.length - 1];
    if (lastCriticalTask.earliestStart) {
      estimatedCompletion = new Date(lastCriticalTask.earliestStart.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  let status = 'on-track';
  if (bottleneckTasks.some((t: any) => t.riskLevel === 'critical')) {
    status = 'delayed';
  } else if (bottleneckTasks.some((t: any) => t.riskLevel === 'high')) {
    status = 'at-risk';
  }

  return {
    status,
    criticalPath: criticalTasks,
    bottleneckTasks,
    totalProgress,
    estimatedCompletion: estimatedCompletion?.toISOString()
  };
}
