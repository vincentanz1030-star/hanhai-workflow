import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '@/lib/api-auth';

// 获取工作负载数据
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const brand = searchParams.get('brand');
    const userId = searchParams.get('userId');

    // 创建 Supabase 客户端
    const supabaseUrl = process.env.COZE_SUPABASE_URL!;
    const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;
    const client = createClient(supabaseUrl, supabaseAnonKey);

    // 检查权限
    const isAdmin = authResult.roles.some(r => r.role === 'admin');
    const userBrand = authResult.brand;

    // 确定查询品牌
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

    // 查询任务
    let tasksQuery = client
      .from('tasks')
      .select(`
        id,
        title,
        position,
        status,
        priority,
        deadline,
        brand,
        projects (
          id,
          name,
          sales_date
        )
      `);

    if (queryBrand) {
      tasksQuery = tasksQuery.eq('brand', queryBrand);
    }

    if (userId && isAdmin) {
      tasksQuery = tasksQuery.eq('assignee', userId);
    }

    const { data: tasks, error: tasksError } = await tasksQuery;

    if (tasksError) {
      console.error('获取任务失败:', tasksError);
      return NextResponse.json(
        { error: '获取任务失败' },
        { status: 500 }
      );
    }

    // 获取用户信息（用于按用户统计）
    let usersQuery = client
      .from('users')
      .select('id, username, nickname, brand, roles');

    if (queryBrand) {
      usersQuery = usersQuery.eq('brand', queryBrand);
    }

    const { data: users, error: usersError } = await usersQuery;

    if (usersError) {
      console.error('获取用户失败:', usersError);
      return NextResponse.json(
        { error: '获取用户失败' },
        { status: 500 }
      );
    }

    // 按用户统计
    const byUser = users.map(user => {
      const userTasks = tasks.filter(t => t.assignee === user.id);
      const inProgress = userTasks.filter(t => t.status === 'in-progress');
      const pending = userTasks.filter(t => t.status === 'pending');
      const completed = userTasks.filter(t => t.status === 'completed');

      const now = new Date();
      const overdue = userTasks.filter(t => {
        return t.deadline && new Date(t.deadline) < now && t.status !== 'completed';
      });

      // 计算高优先级任务数
      const highPriority = userTasks.filter(t => t.priority === 'high');

      // 工作负载评分（简单算法）
      let workloadScore = 0;
      workloadScore += inProgress.length * 3; // 进行中任务权重最高
      workloadScore += pending.length * 2; // 待处理任务权重中等
      workloadScore += highPriority.length * 2; // 高优先级任务额外加分
      workloadScore += overdue.length * 5; // 逾期任务权重最高

      // 判断是否超负荷（阈值：15分）
      const isOverloaded = workloadScore >= 15;

      return {
        userId: user.id,
        username: user.username,
        nickname: user.nickname,
        brand: user.brand,
        totalTasks: userTasks.length,
        inProgressTasks: inProgress.length,
        pendingTasks: pending.length,
        completedTasks: completed.length,
        overdueTasks: overdue.length,
        highPriorityTasks: highPriority.length,
        workloadScore,
        isOverloaded
      };
    });

    // 按岗位统计
    const positionTasks: Record<string, any[]> = {};
    tasks.forEach(task => {
      const position = task.position || '未分类';
      if (!positionTasks[position]) {
        positionTasks[position] = [];
      }
      positionTasks[position].push(task);
    });

    const byPosition = Object.keys(positionTasks).map(position => {
      const positionTaskList = positionTasks[position];
      const inProgress = positionTaskList.filter(t => t.status === 'in-progress');
      const pending = positionTaskList.filter(t => t.status === 'pending');
      const completed = positionTaskList.filter(t => t.status === 'completed');

      const now = new Date();
      const overdue = positionTaskList.filter(t => {
        return t.deadline && new Date(t.deadline) < now && t.status !== 'completed';
      });

      return {
        position,
        totalTasks: positionTaskList.length,
        inProgressTasks: inProgress.length,
        pendingTasks: pending.length,
        completedTasks: completed.length,
        overdueTasks: overdue.length,
        averageWorkload: positionTaskList.length > 0 
          ? (byUser.filter(u => positionTaskList.some(t => t.assignee === u.userId))
             .reduce((sum, u) => sum + u.workloadScore, 0) / 
             byUser.filter(u => positionTaskList.some(t => t.assignee === u.userId)).length)
          : 0
      };
    });

    // 超负荷用户
    const overloadedUsers = byUser.filter(u => u.isOverloaded);

    // 汇总统计
    const summary = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
      overdueTasks: tasks.filter(t => {
        const now = new Date();
        return t.deadline && new Date(t.deadline) < now && t.status !== 'completed';
      }).length,
      overloadedCount: overloadedUsers.length,
      averageWorkload: byUser.length > 0 
        ? Math.round(byUser.reduce((sum, u) => sum + u.workloadScore, 0) / byUser.length)
        : 0
    };

    return NextResponse.json({
      success: true,
      workload: {
        byUser,
        byPosition,
        overloadedUsers,
        summary
      }
    });

  } catch (error) {
    console.error('获取工作负载失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
