import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// 类型定义
interface Notification {
  id: string;
  type: 'collaboration' | 'reminder' | 'weekly' | 'project';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  role: string;
  deadline?: string;
  createdAt: string;
}

// 直接从环境变量获取 Supabase 配置
// 获取综合通知数据
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const client = getSupabaseClient();
    
    // 获取用户岗位信息
    const { data: userRoles } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', authResult.userId);

    const userRoleList = userRoles?.map((r: { role: string }) => r.role) || [];

    // 1. 获取协同合作请求
    const { data: collaborations } = await client
      .from('collaboration_tasks')
      .select('*')
      .or(`target_role.in.(${userRoleList.join(',')}),requesting_role.in.(${userRoleList.join(',')})`)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(10);

    const collaborationNotifications = (collaborations || []).map((task: any) => ({
      id: `collab-${task.id}`,
      type: 'collaboration' as const,
      title: `协同请求：${task.task_title}`,
      content: `${task.requesting_role} 请求 ${task.target_role} 协助完成${task.task_title}`,
      priority: task.priority === 'urgent' ? 'high' : 'medium' as const,
      role: task.target_role,
      deadline: task.deadline,
      createdAt: task.created_at,
    }));

    // 2. 获取需要催促的任务（逾期或即将到期）
    const { data: tasks } = await client
      .from('tasks')
      .select('*')
      .or(`role.in.(${userRoleList.join(',')})`)
      .not('status', 'eq', 'completed')
      .order('estimated_completion_date', { ascending: true })
      .limit(10);

    const reminderNotifications = (tasks || []).map((task: any) => {
      const deadline = task.estimated_completion_date;
      const deadlineDate = deadline ? new Date(deadline) : null;
      const now = new Date();
      const daysRemaining = deadlineDate ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : null;

      let priority: 'high' | 'medium' | 'low' = 'low';
      if (daysRemaining !== null) {
        if (daysRemaining < 0) priority = 'high';
        else if (daysRemaining <= 3) priority = 'medium';
      }

      if (task.reminder_count && task.reminder_count > 0) {
        priority = 'high';
      }

      return {
        id: `task-${task.id}`,
        type: 'reminder' as const,
        title: `任务提醒：${task.task_name}`,
        content: task.reminder_count > 0 
          ? `已催促${task.reminder_count}次，请尽快推进任务` 
          : `任务${daysRemaining !== null ? (daysRemaining < 0 ? `已逾期${Math.abs(daysRemaining)}天` : `还有${daysRemaining}天到期`) : '需要关注'}`,
        priority,
        role: task.role,
        deadline,
        createdAt: task.created_at,
      };
    }).filter((n: Notification) => n.priority !== 'low');

    // 3. 获取本周工作安排
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // 周一
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // 周日
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const { data: weeklyPlans } = await client
      .from('weekly_work_plans')
      .select('*')
      .or(`position.in.(${userRoleList.join(',')})`)
      .gte('week_start', weekStartStr)
      .lte('week_end', weekEndStr)
      .order('created_at', { ascending: false })
      .limit(10);

    const weeklyPlanNotifications = (weeklyPlans || []).map((plan: any) => {
      const priorityMap: Record<string, 'high' | 'medium' | 'low'> = { urgent: 'high', important: 'medium', normal: 'low' };
      return {
        id: `weekly-${plan.id}`,
        type: 'weekly' as const,
        title: `本周工作：${plan.content.substring(0, 30)}...`,
        content: plan.content,
        priority: priorityMap[plan.priority] || 'low' as 'high' | 'medium' | 'low',
        role: plan.position,
        deadline: plan.week_end,
        createdAt: plan.created_at,
      };
    }).filter((n: Notification) => n.priority !== 'low');

    // 4. 获取项目相关通知（项目即将到期或逾期）
    const { data: projects } = await client
      .from('projects')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .order('sales_date', { ascending: true })
      .limit(5);

    const projectNotifications = (projects || []).map((project: any) => {
      const salesDate = project.sales_date;
      const salesDateDate = salesDate ? new Date(salesDate) : null;
      const now = new Date();
      const daysRemaining = salesDateDate ? Math.ceil((salesDateDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)) : null;

      let priority: 'high' | 'medium' | 'low' = 'low';
      if (daysRemaining !== null) {
        if (daysRemaining < 0) priority = 'high';
        else if (daysRemaining <= 7) priority = 'medium';
      }

      return {
        id: `project-${project.id}`,
        type: 'project' as const,
        title: `项目提醒：${project.name}`,
        content: `销售日期${salesDate ? (daysRemaining !== null && daysRemaining < 0 ? `已逾期${Math.abs(daysRemaining)}天` : `还有${daysRemaining}天`) : '需要关注'}`,
        priority,
        deadline: salesDate,
        createdAt: project.created_at,
      };
    }).filter((n: Notification) => n.priority !== 'low');

    // 合并所有通知并按优先级排序
    const allNotifications = [
      ...collaborationNotifications,
      ...reminderNotifications,
      ...weeklyPlanNotifications,
      ...projectNotifications,
    ].sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority] || 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }).slice(0, 20); // 最多返回20条

    return NextResponse.json({
      collaborations: collaborationNotifications,
      reminders: reminderNotifications,
      weeklyPlans: weeklyPlanNotifications,
      projectNotifications: projectNotifications,
      all: allNotifications,
    });

  } catch (error) {
    console.error('获取通知数据失败:', error);
    return NextResponse.json({ 
      error: '服务器错误',
      collaborations: [],
      reminders: [],
      weeklyPlans: [],
      projectNotifications: [],
      all: [],
    }, { status: 500 });
  }
}
