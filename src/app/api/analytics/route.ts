import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 类型定义
interface Project {
  id: string;
  status: string;
  brand: string;
  created_at: string;
  sales_date?: string;
}

interface Task {
  id: string;
  status: string;
  role: string;
  progress: number;
  estimated_completion_date: string;
  actual_completion_date?: string;
}

const supabase = getSupabaseClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month';
    const brand = searchParams.get('brand') || 'all';

    // 计算时间范围
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // 查询项目统计
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, status, brand, created_at, sales_date')
      .gte('created_at', startDate.toISOString());

    if (projectsError) throw projectsError;

    // 查询任务统计
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, status, role, progress, estimated_completion_date, actual_completion_date');

    if (tasksError) throw tasksError;

    // 过滤品牌
    const filteredProjects: Project[] = brand === 'all'
      ? projects || []
      : projects?.filter((p: Project) => p.brand === brand) || [];

    // 计算统计数据
    const typedTasks = tasks || [];
    const stats = {
      projects: {
        total: filteredProjects.length,
        inProgress: filteredProjects.filter((p: Project) => p.status === 'in-progress').length,
        completed: filteredProjects.filter((p: Project) => p.status === 'completed').length,
        pending: filteredProjects.filter((p: Project) => p.status === 'pending').length,
      },
      tasks: {
        total: typedTasks.length,
        completed: typedTasks.filter((t: Task) => t.status === 'completed').length,
        inProgress: typedTasks.filter((t: Task) => t.status === 'in-progress').length,
        pending: typedTasks.filter((t: Task) => t.status === 'pending').length,
        overdue: typedTasks.filter((t: Task) => {
          if (t.status === 'completed') return false;
          const deadline = new Date(t.estimated_completion_date);
          return deadline < now;
        }).length,
      },
      completionRate: typedTasks.length > 0
        ? Math.round((typedTasks.filter((t: Task) => t.status === 'completed').length / typedTasks.length) * 100)
        : 0,
    };

    // 品牌分布统计
    const brandDistribution: Record<string, number> = (projects || []).reduce(
      (acc: Record<string, number>, project: Project) => {
        acc[project.brand] = (acc[project.brand] || 0) + 1;
        return acc;
      },
      {}
    );

    // 岗位任务统计
    type PositionStats = Record<string, { total: number; completed: number; inProgress: number; pending: number }>;
    const positionStats: PositionStats = typedTasks.reduce(
      (acc: PositionStats, task: Task) => {
        if (!acc[task.role]) {
          acc[task.role] = {
            total: 0,
            completed: 0,
            inProgress: 0,
            pending: 0,
          };
        }
        acc[task.role].total++;
        if (task.status === 'completed') {
          acc[task.role].completed++;
        } else if (task.status === 'in-progress') {
          acc[task.role].inProgress++;
        } else if (task.status === 'pending') {
          acc[task.role].pending++;
        }
        return acc;
      },
      {}
    );

    // 趋势数据（按月统计）
    const trendData: Array<{ month: string; projects: number; completedTasks: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' });

      const monthProjects = (projects || []).filter((p: Project) => {
        const projectDate = new Date(p.created_at);
        return projectDate.getMonth() === date.getMonth() &&
               projectDate.getFullYear() === date.getFullYear();
      }).length;

      const monthCompleted = typedTasks.filter((t: Task) => {
        if (!t.actual_completion_date) return false;
        const completionDate = new Date(t.actual_completion_date);
        return completionDate.getMonth() === date.getMonth() &&
               completionDate.getFullYear() === date.getFullYear();
      }).length;

      trendData.push({
        month: monthStr,
        projects: monthProjects,
        completedTasks: monthCompleted,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        brandDistribution,
        positionStats,
        trendData,
      },
    });
  } catch (error) {
    console.error('获取分析数据失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取数据失败',
    }, { status: 500 });
  }
}
