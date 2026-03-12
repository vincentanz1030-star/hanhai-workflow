import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 类型定义
interface Project {
  id: string;
  status: string;
  brand: string;
  created_at: string;
  sales_date: string;
}

interface Task {
  id: string;
  status: string;
  role: string;
  progress: number;
  estimated_completion_date: string;
  actual_completion_date: string | null;
  project_id: string;
}

interface PositionStats {
  total: number;
  completed: number;
}

const supabase = getSupabaseClient();

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 查询所有项目
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, status, brand, created_at, sales_date');

    if (projectsError) throw projectsError;

    // 查询所有任务
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, status, role, progress, estimated_completion_date, actual_completion_date, project_id');

    if (tasksError) throw tasksError;

    // 查询本月新增项目
    const { data: monthlyProjects, error: monthlyProjectsError } = await supabase
      .from('projects')
      .select('id')
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString());

    if (monthlyProjectsError) throw monthlyProjectsError;

    // 查询本月完成任务
    const { data: monthlyCompleted, error: monthlyCompletedError } = await supabase
      .from('tasks')
      .select('id')
      .eq('status', 'completed')
      .gte('actual_completion_date', startOfMonth.toISOString())
      .lte('actual_completion_date', endOfMonth.toISOString());

    if (monthlyCompletedError) throw monthlyCompletedError;

    // 类型转换
    const typedProjects: Project[] = projects || [];
    const typedTasks: Task[] = tasks || [];

    // 计算统计数据
    const projectStats = {
      total: typedProjects.length,
      completed: typedProjects.filter((p: Project) => p.status === 'completed').length,
      inProgress: typedProjects.filter((p: Project) => p.status === 'in-progress').length,
      overdue: typedProjects.filter((p: Project) => {
        if (p.status === 'completed') return false;
        const deadline = new Date(p.sales_date);
        return deadline < now;
      }).length,
    };

    const taskStats = {
      total: typedTasks.length,
      completed: typedTasks.filter((t: Task) => t.status === 'completed').length,
      inProgress: typedTasks.filter((t: Task) => t.status === 'in-progress').length,
      overdue: typedTasks.filter((t: Task) => {
        if (t.status === 'completed') return false;
        const deadline = new Date(t.estimated_completion_date);
        return deadline < now;
      }).length,
    };

    // 计算KPI指标
    const metrics = {
      completionRate: typedTasks.length > 0
        ? Math.round((taskStats.completed / typedTasks.length) * 100)
        : 0,
      overdueRate: typedTasks.length > 0
        ? Math.round((taskStats.overdue / typedTasks.length) * 100)
        : 0,
      avgCompletionTime: 0, // 需要更复杂的计算
      monthlyNewProjects: monthlyProjects?.length || 0,
      monthlyCompletedTasks: monthlyCompleted?.length || 0,
    };

    // 计算平均完成时间
    const completedTasksWithDates = typedTasks.filter((t: Task) => t.status === 'completed' && t.actual_completion_date);
    if (completedTasksWithDates.length > 0) {
      let totalTime = 0;
      let count = 0;

      completedTasksWithDates.forEach((task: Task) => {
        const project = typedProjects.find((p: Project) => p.id === task.project_id);
        if (project && task.actual_completion_date) {
          const projectCreated = new Date(project.created_at);
          const taskCompleted = new Date(task.actual_completion_date);
          totalTime += (taskCompleted.getTime() - projectCreated.getTime()) / (1000 * 60 * 60 * 24);
          count++;
        }
      });

      metrics.avgCompletionTime = count > 0 ? totalTime / count : 0;
    }

    // 品牌分布
    const brandDistribution = typedProjects.reduce((acc: Record<string, number>, project: Project) => {
      acc[project.brand] = (acc[project.brand] || 0) + 1;
      return acc;
    }, {});

    // 岗位效率
    const positionStats = typedTasks.reduce((acc: Record<string, PositionStats>, task: Task) => {
      if (!acc[task.role]) {
        acc[task.role] = { total: 0, completed: 0 };
      }
      acc[task.role].total++;
      if (task.status === 'completed') {
        acc[task.role].completed++;
      }
      return acc;
    }, {});

    const topPositions = Object.entries(positionStats)
      .map(([name, stats]: [string, PositionStats]) => ({
        name,
        completed: stats.completed,
        total: stats.total,
        rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);

    // 趋势数据（近7天）
    const trendData: Array<{ date: string; completed: number; overdue: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

      const dayCompleted = typedTasks.filter((t: Task) => {
        if (!t.actual_completion_date) return false;
        const completionDate = new Date(t.actual_completion_date);
        return completionDate >= dayStart && completionDate < dayEnd;
      }).length;

      const dayOverdue = typedTasks.filter((t: Task) => {
        if (t.status === 'completed') return false;
        const deadline = new Date(t.estimated_completion_date);
        return deadline >= dayStart && deadline < dayEnd && deadline < now;
      }).length;

      trendData.push({
        date: dateStr,
        completed: dayCompleted,
        overdue: dayOverdue,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        projects: projectStats,
        tasks: taskStats,
        metrics,
        brandDistribution,
        topPositions,
        trendData,
      },
    });
  } catch (error) {
    console.error('获取KPI数据失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取数据失败',
    }, { status: 500 });
  }
}
