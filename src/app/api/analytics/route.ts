import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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
    const filteredProjects = brand === 'all'
      ? projects
      : projects?.filter(p => p.brand === brand) || [];

    // 计算统计数据
    const stats = {
      projects: {
        total: filteredProjects.length,
        inProgress: filteredProjects.filter(p => p.status === 'in-progress').length,
        completed: filteredProjects.filter(p => p.status === 'completed').length,
        pending: filteredProjects.filter(p => p.status === 'pending').length,
      },
      tasks: {
        total: tasks?.length || 0,
        completed: tasks?.filter(t => t.status === 'completed').length || 0,
        inProgress: tasks?.filter(t => t.status === 'in-progress').length || 0,
        pending: tasks?.filter(t => t.status === 'pending').length || 0,
        overdue: tasks?.filter(t => {
          if (t.status === 'completed') return false;
          const deadline = new Date(t.estimated_completion_date);
          return deadline < now;
        }).length || 0,
      },
      completionRate: tasks && tasks.length > 0
        ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
        : 0,
    };

    // 品牌分布统计
    const brandDistribution = projects?.reduce((acc, project) => {
      acc[project.brand] = (acc[project.brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // 岗位任务统计
    const positionStats = tasks?.reduce((acc, task) => {
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
    }, {} as Record<string, { total: number; completed: number; inProgress: number; pending: number }>) || {};

    // 趋势数据（按月统计）
    const trendData: Array<{ month: string; projects: number; completedTasks: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit' });

      const monthProjects = projects?.filter(p => {
        const projectDate = new Date(p.created_at);
        return projectDate.getMonth() === date.getMonth() &&
               projectDate.getFullYear() === date.getFullYear();
      }).length || 0;

      const monthCompleted = tasks?.filter(t => {
        if (!t.actual_completion_date) return false;
        const completionDate = new Date(t.actual_completion_date);
        return completionDate.getMonth() === date.getMonth() &&
               completionDate.getFullYear() === date.getFullYear();
      }).length || 0;

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
