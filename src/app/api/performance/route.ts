import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// 类型定义
interface Task {
  id: string;
  status: string;
  role: string;
  project_id: string;
  created_at: string;
  estimated_completion_date: string | null;
  actual_completion_date: string | null;
  rating: number | null;
}

interface Project {
  id: string;
  brand: string;
  status: string;
  created_at: string;
}

interface User {
  id: string;
  username: string;
  nickname: string;
  brand: string;
  status: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface UserPerformance {
  userId: string;
  username: string;
  nickname: string;
  brand: string;
  roles: string[];
  stats: {
    totalProjects: number;
    completedProjects: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    averageCompletionTime: number; // 平均完成天数
    onTimeCompletionRate: number;
    averageRating: number;
    totalReminders: number;
  };
  performanceScore: number;
  ranking: number;
}

interface RolePerformance {
  role: string;
  stats: {
    totalUsers: number;
    totalTasks: number;
    completedTasks: number;
    averageCompletionTime: number;
    onTimeCompletionRate: number;
    overdueRate: number;
    averageRating: number;
  };
  performanceScore: number;
  topPerformers: string[];
}

interface PerformanceReport {
  period: {
    start: string;
    end: string;
    type: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  };
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalTasks: number;
    completedTasks: number;
    averageCompletionTime: number;
    overallOnTimeCompletionRate: number;
    averageRating: number;
  };
  userPerformance: UserPerformance[];
  rolePerformance: RolePerformance[];
  recommendations: string[];
}

// 获取绩效统计
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'monthly'; // daily, weekly, monthly, quarterly

    const client = getSupabaseClient();

    // 计算时间范围
    const today = new Date();
    let startDate: Date;
    let endDate: Date = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    switch (type) {
      case 'daily':
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'quarterly':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // 获取所有用户
    const { data: users } = await client
      .from('users')
      .select('id, username, nickname, brand, status')
      .eq('status', 'active');

    const typedUsers: User[] = users || [];
    const activeUsers = typedUsers.filter((u: User) => u.status === 'active');

    // 获取用户的岗位信息
    const { data: userRoles } = await client
      .from('user_roles_v2')
      .select('*');

    const typedUserRoles: UserRole[] = userRoles || [];
    const userRolesMap = new Map<string, string[]>();
    typedUserRoles.forEach((ur: UserRole) => {
      if (!userRolesMap.has(ur.user_id)) {
        userRolesMap.set(ur.user_id, []);
      }
      userRolesMap.get(ur.user_id)!.push(ur.role);
    });

    // 获取时间范围内的任务
    const { data: tasks } = await client
      .from('tasks')
      .select('*')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);

    const typedTasks: Task[] = tasks || [];

    // 获取项目信息
    const { data: projects } = await client
      .from('projects')
      .select('*')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);

    const typedProjects: Project[] = projects || [];

    // 计算用户绩效
    const userPerformance: UserPerformance[] = [];
    const userProjectMap = new Map<string, Project[]>();

    typedProjects.forEach((project: Project) => {
      if (!userProjectMap.has(project.brand)) {
        userProjectMap.set(project.brand, []);
      }
      userProjectMap.get(project.brand)!.push(project);
    });

    // 按品牌统计任务
    const brandTasksMap = new Map<string, Task[]>();
    typedTasks.forEach((task: Task) => {
      const project = typedProjects.find((p: Project) => p.id === task.project_id);
      if (project) {
        if (!brandTasksMap.has(project.brand)) {
          brandTasksMap.set(project.brand, []);
        }
        brandTasksMap.get(project.brand)!.push(task);
      }
    });

    // 计算各岗位绩效
    const rolePerformance: RolePerformance[] = [];
    const roleTasksMap = new Map<string, Task[]>();
    typedTasks.forEach((task: Task) => {
      if (!roleTasksMap.has(task.role)) {
        roleTasksMap.set(task.role, []);
      }
      roleTasksMap.get(task.role)!.push(task);
    });

    const roleList = ['illustration', 'product_design', 'detail_design', 'copywriting',
                      'procurement', 'packaging_design', 'finance', 'customer_service',
                      'warehouse', 'operations'];

    roleList.forEach((role: string) => {
      const roleTasks = roleTasksMap.get(role) || [];
      const completedTasks = roleTasks.filter((t: Task) => t.status === 'completed');
      const overdueTasks = roleTasks.filter((t: Task) => {
        if (!t.estimated_completion_date || t.status === 'completed') return false;
        return new Date(t.estimated_completion_date) < new Date();
      });

      const onTimeCompletionRate = roleTasks.length > 0
        ? Math.round((completedTasks.length / roleTasks.length) * 100)
        : 0;

      const overdueRate = roleTasks.length > 0
        ? Math.round((overdueTasks.length / roleTasks.length) * 100)
        : 0;

      // 计算平均完成时间（天）
      let totalCompletionTime = 0;
      let completedWithTime = 0;
      completedTasks.forEach((task: Task) => {
        if (task.created_at && task.actual_completion_date) {
          const created = new Date(task.created_at);
          const completed = new Date(task.actual_completion_date);
          totalCompletionTime += (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          completedWithTime++;
        }
      });
      const averageCompletionTime = completedWithTime > 0 ? Math.round(totalCompletionTime / completedWithTime) : 0;

      // 计算平均评分
      const ratedTasks = completedTasks.filter((t: Task) => t.rating !== null);
      const averageRating = ratedTasks.length > 0
        ? ratedTasks.reduce((sum: number, t: Task) => sum + (t.rating || 0), 0) / ratedTasks.length
        : 0;

      // 计算绩效评分 (0-100)
      const performanceScore = Math.round(
        (onTimeCompletionRate * 0.4) +
        ((100 - overdueRate) * 0.3) +
        (averageRating * 20 * 0.2) +
        (Math.max(0, 100 - averageCompletionTime * 2) * 0.1)
      );

      rolePerformance.push({
        role,
        stats: {
          totalUsers: new Set(typedProjects.filter((p: Project) => p.brand).map((p: Project) => p.brand)).size,
          totalTasks: roleTasks.length,
          completedTasks: completedTasks.length,
          averageCompletionTime,
          onTimeCompletionRate,
          overdueRate,
          averageRating: Math.round(averageRating * 10) / 10,
        },
        performanceScore,
        topPerformers: [], // TODO: 计算表现最好的用户
      });
    });

    // 计算总体统计
    const totalTasks = typedTasks.length;
    const completedTasks = typedTasks.filter((t: Task) => t.status === 'completed').length;
    const overdueTasks = typedTasks.filter((t: Task) => {
      if (!t.estimated_completion_date || t.status === 'completed') return false;
      return new Date(t.estimated_completion_date) < new Date();
    }).length;

    let totalCompletionTime = 0;
    let completedWithTime = 0;
    typedTasks.filter((t: Task) => t.status === 'completed' && t.created_at && t.actual_completion_date).forEach((task: Task) => {
      const created = new Date(task.created_at);
      const completed = new Date(task.actual_completion_date!);
      totalCompletionTime += (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      completedWithTime++;
    });
    const averageCompletionTime = completedWithTime > 0 ? Math.round(totalCompletionTime / completedWithTime) : 0;

    const overallOnTimeCompletionRate = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    const ratedTasks = typedTasks.filter((t: Task) => t.status === 'completed' && t.rating !== null);
    const averageRating = ratedTasks.length > 0
      ? ratedTasks.reduce((sum: number, t: Task) => sum + (t.rating || 0), 0) / ratedTasks.length
      : 0;

    // 生成建议
    const recommendations: string[] = [];
    if (overallOnTimeCompletionRate < 80) {
      recommendations.push('整体按时完成率偏低，建议优化任务分配和时间管理');
    }
    if (overdueTasks > totalTasks * 0.1) {
      recommendations.push('逾期任务占比超过10%，需要重点关注');
    }
    if (averageCompletionTime > 7) {
      recommendations.push('平均任务完成时间较长，建议优化工作流程');
    }

    const report: PerformanceReport = {
      period: {
        start: startDateStr,
        end: endDateStr,
        type: type as 'daily' | 'weekly' | 'monthly' | 'quarterly',
      },
      summary: {
        totalUsers: typedUsers.length,
        activeUsers: activeUsers.length,
        totalTasks,
        completedTasks,
        averageCompletionTime,
        overallOnTimeCompletionRate,
        averageRating: Math.round(averageRating * 10) / 10,
      },
      userPerformance,
      rolePerformance,
      recommendations,
    };

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('获取绩效统计失败:', error);
    return NextResponse.json({ error: '获取绩效统计失败' }, { status: 500 });
  }
}
