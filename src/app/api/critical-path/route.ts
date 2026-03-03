import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

// 岗位依赖顺序（从上到下）
const POSITION_ORDER = [
  '插画',
  '产品',
  '详情',
  '文案',
  '采购',
  '包装',
  '财务',
  '客服',
  '仓储',
  '运营'
];

// 获取项目的关键路径
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

    // 创建 Supabase 客户端
    const supabaseUrl = process.env.COZE_SUPABASE_URL!;
    const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;
    const client = createClient(supabaseUrl, supabaseAnonKey);

    // 检查权限
    const isAdmin = authResult.roles.some((r: any) => r.role === 'admin');
    const userBrand = authResult.brand;

    // 确定查询品牌
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

    // 构建项目查询
    let projectsQuery = client
      .from('projects')
      .select(`
        id,
        name,
        project_type,
        sales_date,
        brand,
        created_at,
        tasks (
          id,
          title,
          position,
          status,
          deadline,
          assignee,
          priority
        )
      `);

    if (queryBrand) {
      projectsQuery = projectsQuery.eq('brand', queryBrand);
    }

    if (projectId) {
      projectsQuery = projectsQuery.eq('id', parseInt(projectId));
    }

    if (!includeCompleted) {
      // 只查询未完成的项目
      projectsQuery = projectsQuery.or('status.is.null,status.neq.completed');
    }

    const { data: projects, error: projectsError } = await projectsQuery;

    if (projectsError) {
      console.error('获取项目失败:', projectsError);
      return NextResponse.json(
        { error: '获取项目失败' },
        { status: 500 }
      );
    }

    // 分析每个项目的关键路径
    const projectCriticalPath = projects.map(project => {
      const tasks = project.tasks || [];

      // 按岗位顺序排序
      const sortedTasks = tasks.sort((a, b) => {
        const indexA = POSITION_ORDER.indexOf(a.position || '');
        const indexB = POSITION_ORDER.indexOf(b.position || '');
        return indexA - indexB;
      });

      // 计算项目的关键路径和瓶颈
      const result = calculateCriticalPath(sortedTasks, project.sales_date);

      return {
        projectId: project.id,
        projectName: project.name,
        projectType: project.project_type,
        salesDate: project.sales_date,
        brand: project.brand,
        ...result
      };
    });

    // 找出所有瓶颈任务
    const bottleneckTasks: any[] = [];
    projectCriticalPath.forEach(project => {
      if (project.bottleneckTasks && project.bottleneckTasks.length > 0) {
        bottleneckTasks.push(...project.bottleneckTasks);
      }
    });

    // 按风险等级排序
    bottleneckTasks.sort((a, b) => {
      const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
      return priorityOrder[a.riskLevel] - priorityOrder[b.riskLevel];
    });

    // 汇总统计
    const summary = {
      totalProjects: projects.length,
      atRiskProjects: projectCriticalPath.filter(p => p.status === 'at-risk').length,
      onTrackProjects: projectCriticalPath.filter(p => p.status === 'on-track').length,
      delayedProjects: projectCriticalPath.filter(p => p.status === 'delayed').length
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
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 计算关键路径的函数
function calculateCriticalPath(tasks: any[], salesDate: string | null) {
  const now = new Date();
  const projectDeadline = salesDate ? new Date(salesDate) : null;

  // 找出未完成的任务
  const incompleteTasks = tasks.filter(t => t.status !== 'completed');
  
  // 如果所有任务都完成了，项目状态为完成
  if (incompleteTasks.length === 0) {
    return {
      status: 'completed',
      criticalPath: tasks,
      bottleneckTasks: [],
      totalProgress: 100,
      estimatedCompletion: null
    };
  }

  // 计算每个任务的依赖关系
  const taskMap = new Map();
  incompleteTasks.forEach(task => {
    taskMap.set(task.id, {
      ...task,
      predecessors: [],
      successors: [],
      earliestStart: null,
      latestStart: null,
      slack: null
    });
  });

  // 根据岗位顺序建立依赖关系
  incompleteTasks.forEach((task, index) => {
    const currentPos = POSITION_ORDER.indexOf(task.position || '');
    
    // 找出前面的所有岗位任务作为前置任务
    incompleteTasks.forEach(other => {
      const otherPos = POSITION_ORDER.indexOf(other.position || '');
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

  // 计算最早开始时间（前向计算）
  const taskArray = Array.from(taskMap.values());
  taskArray.forEach(task => {
    if (task.predecessors.length === 0) {
      task.earliestStart = new Date(now);
    } else {
      const maxPredecessorEnd = task.predecessors
        .map(predId => {
          const pred = taskMap.get(predId);
          if (!pred) return now;
          const endDate = pred.deadline ? new Date(pred.deadline) : pred.earliestStart || now;
          // 假设每个任务需要1天完成
          return new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
        })
        .reduce((max, date) => date > max ? date : max, now);
      task.earliestStart = maxPredecessorEnd;
    }
  });

  // 计算最晚开始时间（后向计算）
  const projectEnd = projectDeadline || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 默认30天后

  // 按岗位顺序倒序计算
  const sortedByPosition = [...taskArray].sort((a, b) => {
    const indexA = POSITION_ORDER.indexOf(a.position || '');
    const indexB = POSITION_ORDER.indexOf(b.position || '');
    return indexB - indexA;
  });

  sortedByPosition.forEach(task => {
    if (task.successors.length === 0) {
      task.latestStart = new Date(projectEnd.getTime() - 24 * 60 * 60 * 1000);
    } else {
      const minSuccessorStart = task.successors
        .map(succId => {
          const succ = taskMap.get(succId);
          return succ?.latestStart || projectEnd;
        })
        .reduce((min, date) => date < min ? date : min, projectEnd);
      task.latestStart = new Date(minSuccessorStart.getTime() - 24 * 60 * 60 * 1000);
    }

    // 计算松弛时间（Slack）
    if (task.earliestStart && task.latestStart) {
      task.slack = (task.latestStart.getTime() - task.earliestStart.getTime()) / (24 * 60 * 60 * 1000); // 天数
    }
  });

  // 找出关键路径上的任务（Slack = 0 或接近0）
  const criticalTasks = taskArray.filter(task => {
    return task.slack !== null && task.slack <= 1; // 1天以内的松弛时间视为关键路径
  });

  // 找出瓶颈任务（关键路径上且未完成且已逾期或即将逾期）
  const bottleneckTasks = criticalTasks
    .filter(task => {
      const isOverdue = task.deadline && new Date(task.deadline) < now;
      const isHighPriority = task.priority === 'high' || task.priority === 'critical';
      const isDelayed = task.slack !== null && task.slack < 0;
      return isOverdue || isHighPriority || isDelayed;
    })
    .map(task => {
      let riskLevel = 'medium';
      if (task.priority === 'critical' || (task.slack !== null && task.slack < -3)) {
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
        assignee: task.assignee
      };
    });

  // 计算项目进度
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalProgress = Math.round((completedCount / tasks.length) * 100);

  // 预计完成时间
  let estimatedCompletion = null;
  if (criticalTasks.length > 0) {
    const lastCriticalTask = criticalTasks[criticalTasks.length - 1];
    if (lastCriticalTask.earliestStart) {
      estimatedCompletion = new Date(lastCriticalTask.earliestStart.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  // 判断项目状态
  let status = 'on-track';
  if (bottleneckTasks.some(t => t.riskLevel === 'critical')) {
    status = 'delayed';
  } else if (bottleneckTasks.some(t => t.riskLevel === 'high')) {
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
