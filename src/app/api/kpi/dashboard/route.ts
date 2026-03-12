import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

;
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

    // 计算统计数据
    const projectStats = {
      total: projects?.length || 0,
      completed: projects?.filter(p => p.status === 'completed').length || 0,
      inProgress: projects?.filter(p => p.status === 'in-progress').length || 0,
      overdue: projects?.filter(p => {
        if (p.status === 'completed') return false;
        const deadline = new Date(p.sales_date);
        return deadline < now;
      }).length || 0,
    };

    const taskStats = {
      total: tasks?.length || 0,
      completed: tasks?.filter(t => t.status === 'completed').length || 0,
      inProgress: tasks?.filter(t => t.status === 'in-progress').length || 0,
      overdue: tasks?.filter(t => {
        if (t.status === 'completed') return false;
        const deadline = new Date(t.estimated_completion_date);
        return deadline < now;
      }).length || 0,
    };

    // 计算KPI指标
    const metrics = {
      completionRate: tasks && tasks.length > 0
        ? Math.round((taskStats.completed / tasks.length) * 100)
        : 0,
      overdueRate: tasks && tasks.length > 0
        ? Math.round((taskStats.overdue / tasks.length) * 100)
        : 0,
      avgCompletionTime: 0, // 需要更复杂的计算
      monthlyNewProjects: monthlyProjects?.length || 0,
      monthlyCompletedTasks: monthlyCompleted?.length || 0,
    };

    // 计算平均完成时间
    const completedTasksWithDates = tasks?.filter(t => t.status === 'completed' && t.actual_completion_date) || [];
    if (completedTasksWithDates.length > 0) {
      const projectsWithCreated = projects || [];
      let totalTime = 0;
      let count = 0;

      completedTasksWithDates.forEach(task => {
        const project = projectsWithCreated.find(p => p.id === task.project_id);
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
    const brandDistribution = projects?.reduce((acc, project) => {
      acc[project.brand] = (acc[project.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // 岗位效率
    const positionStats = tasks?.reduce((acc, task) => {
      if (!acc[task.role]) {
        acc[task.role] = { total: 0, completed: 0 };
      }
      acc[task.role].total++;
      if (task.status === 'completed') {
        acc[task.role].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>) || {};

    const topPositions = Object.entries(positionStats)
      .map(([name, stats]) => ({
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

      const dayCompleted = tasks?.filter(t => {
        if (!t.actual_completion_date) return false;
        const completionDate = new Date(t.actual_completion_date);
        return completionDate >= dayStart && completionDate < dayEnd;
      }).length || 0;

      const dayOverdue = tasks?.filter(t => {
        if (t.status === 'completed') return false;
        const deadline = new Date(t.estimated_completion_date);
        return deadline >= dayStart && deadline < dayEnd && deadline < now;
      }).length || 0;

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
