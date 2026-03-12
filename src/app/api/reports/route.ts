import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// 直接从环境变量获取 Supabase 配置
interface ReportSummary {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  delayedProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalUsers: number;
  activeUsers: number;
  averageTaskProgress: number;
  onTimeCompletionRate: number;
}

interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  summary: ReportSummary;
  projects: {
    total: number;
    completed: number;
    byStatus: { [key: string]: number };
    byBrand: { [key: string]: number };
    topDelayed: Array<{
      id: string;
      name: string;
      brand: string;
      delayDays: number;
    }>;
  };
  tasks: {
    total: number;
    completed: number;
    byRole: { [key: string]: number };
    byStatus: { [key: string]: number };
    overdueByRole: { [key: string]: number };
    topOverdue: Array<{
      id: string;
      taskName: string;
      role: string;
      overdueDays: number;
    }>;
  };
  collaboration: {
    total: number;
    completed: number;
    byRequestingRole: { [key: string]: number };
    byTargetRole: { [key: string]: number };
  };
  weeklyPlans: {
    total: number;
    completed: number;
    byPosition: { [key: string]: number };
  };
  salesTargets: {
    annualTotal: number;
    annualActual: number;
    monthly: Array<{
      month: number;
      target: number;
      actual: number;
      completionRate: number;
    }>;
  };
}

interface MonthlyReport {
  year: number;
  month: number;
  summary: ReportSummary;
  projects: {
    total: number;
    completed: number;
    byStatus: { [key: string]: number };
    byBrand: { [key: string]: number };
  };
  tasks: {
    total: number;
    completed: number;
    byRole: { [key: string]: number };
    byStatus: { [key: string]: number };
    completionRateByRole: { [key: string]: number };
  };
  salesTargets: {
    monthlyTarget: number;
    monthlyActual: number;
    completionRate: number;
    byBrand: { [key: string]: { target: number; actual: number } };
  };
  weeklyTrends: Array<{
    weekStart: string;
    completedTasks: number;
    completedProjects: number;
  }>;
}

// 生成周报
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'weekly'; // weekly 或 monthly
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const weekStart = searchParams.get('weekStart');

    const client = getSupabaseClient();

    if (type === 'weekly') {
      return await generateWeeklyReport(client, weekStart);
    } else if (type === 'monthly') {
      return await generateMonthlyReport(client, year, month);
    } else {
      return NextResponse.json({ error: '无效的报表类型' }, { status: 400 });
    }
  } catch (error) {
    console.error('生成报表失败:', error);
    return NextResponse.json({ error: '生成报表失败' }, { status: 500 });
  }
}

async function generateWeeklyReport(client: any, weekStart?: string | null) {
  // 计算本周日期范围
  const today = new Date();
  const startOfWeek = weekStart ? new Date(weekStart) : new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // 周日为一周开始
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const weekStartStr = startOfWeek.toISOString().split('T')[0];
  const weekEndStr = endOfWeek.toISOString().split('T')[0];

  // 获取本周的项目数据
  const { data: projects } = await client
    .from('projects')
    .select('*')
    .gte('created_at', weekStartStr)
    .lte('created_at', weekEndStr);

  // 获取本周的任务数据
  const { data: tasks } = await client
    .from('tasks')
    .select('*')
    .gte('created_at', weekStartStr)
    .lte('created_at', weekEndStr);

  // 获取本周的协同任务
  const { data: collaborations } = await client
    .from('collaboration_tasks')
    .select('*')
    .gte('created_at', weekStartStr)
    .lte('created_at', weekEndStr);

  // 获取本周的工作计划
  const { data: weeklyPlans } = await client
    .from('weekly_work_plans')
    .select('*')
    .gte('week_start', weekStartStr)
    .lte('week_end', weekEndStr);

  // 计算汇总统计
  const totalProjects = projects?.length || 0;
  const completedProjects = projects?.filter((p: any) => p.status === 'completed').length || 0;
  const inProgressProjects = projects?.filter((p: any) => p.status === 'in_progress').length || 0;
  const delayedProjects = projects?.filter((p: any) => p.status === 'delayed').length || 0;

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((t: any) => t.status === 'completed').length || 0;
  const inProgressTasks = tasks?.filter((t: any) => t.status === 'in_progress').length || 0;
  const overdueTasks = tasks?.filter((t: any) => {
    if (!t.estimated_completion_date || t.status === 'completed') return false;
    return new Date(t.estimated_completion_date) < new Date();
  }).length || 0;

  const averageTaskProgress = totalTasks > 0
    ? Math.round((tasks?.reduce((sum: number, t: any) => sum + (t.progress || 0), 0) || 0) / totalTasks)
    : 0;

  const onTimeCompletionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  // 按状态统计项目
  const projectsByStatus: { [key: string]: number } = {};
  projects?.forEach((p: any) => {
    projectsByStatus[p.status] = (projectsByStatus[p.status] || 0) + 1;
  });

  // 按品牌统计项目
  const projectsByBrand: { [key: string]: number } = {};
  projects?.forEach((p: any) => {
    projectsByBrand[p.brand] = (projectsByBrand[p.brand] || 0) + 1;
  });

  // 按岗位统计任务
  const tasksByRole: { [key: string]: number } = {};
  tasks?.forEach((t: any) => {
    tasksByRole[t.role] = (tasksByRole[t.role] || 0) + 1;
  });

  // 按状态统计任务
  const tasksByStatus: { [key: string]: number } = {};
  tasks?.forEach((t: any) => {
    tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
  });

  // 按岗位统计逾期任务
  const overdueTasksByRole: { [key: string]: number } = {};
  tasks?.forEach((t: any) => {
    if (!t.estimated_completion_date || t.status === 'completed') return;
    if (new Date(t.estimated_completion_date) < new Date()) {
      overdueTasksByRole[t.role] = (overdueTasksByRole[t.role] || 0) + 1;
    }
  });

  // 按岗位统计本周工作计划
  const weeklyPlansByPosition: { [key: string]: number } = {};
  weeklyPlans?.forEach((p: any) => {
    if (p.position) {
      weeklyPlansByPosition[p.position] = (weeklyPlansByPosition[p.position] || 0) + 1;
    }
  });

  const report: WeeklyReport = {
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    summary: {
      totalProjects,
      completedProjects,
      inProgressProjects,
      delayedProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      totalUsers: 0,
      activeUsers: 0,
      averageTaskProgress,
      onTimeCompletionRate,
    },
    projects: {
      total: totalProjects,
      completed: completedProjects,
      byStatus: projectsByStatus,
      byBrand: projectsByBrand,
      topDelayed: [],
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      byRole: tasksByRole,
      byStatus: tasksByStatus,
      overdueByRole: overdueTasksByRole,
      topOverdue: [],
    },
    collaboration: {
      total: collaborations?.length || 0,
      completed: collaborations?.filter((c: any) => c.status === 'completed').length || 0,
      byRequestingRole: {},
      byTargetRole: {},
    },
    weeklyPlans: {
      total: weeklyPlans?.length || 0,
      completed: weeklyPlans?.filter((p: any) => p.status === 'completed').length || 0,
      byPosition: weeklyPlansByPosition,
    },
    salesTargets: {
      annualTotal: 0,
      annualActual: 0,
      monthly: [],
    },
  };

  return NextResponse.json({ success: true, report });
}

async function generateMonthlyReport(client: any, year: number, month: number) {
  // 计算本月日期范围
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
  const endOfMonthStr = endOfMonth.toISOString().split('T')[0];

  // 获取本月的项目数据
  const { data: projects } = await client
    .from('projects')
    .select('*')
    .gte('created_at', startOfMonthStr)
    .lte('created_at', endOfMonthStr);

  // 获取本月的任务数据
  const { data: tasks } = await client
    .from('tasks')
    .select('*')
    .gte('created_at', startOfMonthStr)
    .lte('created_at', endOfMonthStr);

  // 计算汇总统计
  const totalProjects = projects?.length || 0;
  const completedProjects = projects?.filter((p: any) => p.status === 'completed').length || 0;
  const inProgressProjects = projects?.filter((p: any) => p.status === 'in_progress').length || 0;
  const delayedProjects = projects?.filter((p: any) => p.status === 'delayed').length || 0;

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((t: any) => t.status === 'completed').length || 0;
  const inProgressTasks = tasks?.filter((t: any) => t.status === 'in_progress').length || 0;
  const overdueTasks = tasks?.filter((t: any) => {
    if (!t.estimated_completion_date || t.status === 'completed') return false;
    return new Date(t.estimated_completion_date) < new Date();
  }).length || 0;

  const averageTaskProgress = totalTasks > 0
    ? Math.round((tasks?.reduce((sum: number, t: any) => sum + (t.progress || 0), 0) || 0) / totalTasks)
    : 0;

  const onTimeCompletionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  // 按岗位统计任务
  const tasksByRole: { [key: string]: number } = {};
  tasks?.forEach((t: any) => {
    tasksByRole[t.role] = (tasksByRole[t.role] || 0) + 1;
  });

  // 按状态统计任务
  const tasksByStatus: { [key: string]: number } = {};
  tasks?.forEach((t: any) => {
    tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
  });

  // 计算各岗位完成率
  const completionRateByRole: { [key: string]: number } = {};
  Object.keys(tasksByRole).forEach(role => {
    const roleTasks = tasks?.filter((t: any) => t.role === role) || [];
    const roleCompleted = roleTasks.filter((t: any) => t.status === 'completed').length;
    completionRateByRole[role] = roleTasks.length > 0 ? Math.round((roleCompleted / roleTasks.length) * 100) : 0;
  });

  const report: MonthlyReport = {
    year,
    month,
    summary: {
      totalProjects,
      completedProjects,
      inProgressProjects,
      delayedProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      totalUsers: 0,
      activeUsers: 0,
      averageTaskProgress,
      onTimeCompletionRate,
    },
    projects: {
      total: totalProjects,
      completed: completedProjects,
      byStatus: {},
      byBrand: {},
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      byRole: tasksByRole,
      byStatus: tasksByStatus,
      completionRateByRole,
    },
    salesTargets: {
      monthlyTarget: 0,
      monthlyActual: 0,
      completionRate: 0,
      byBrand: {},
    },
    weeklyTrends: [],
  };

  return NextResponse.json({ success: true, report });
}
