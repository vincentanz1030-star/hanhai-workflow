import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');
    const brand = searchParams.get('brand');
    const taskId = searchParams.get('taskId');

    const supabaseUrl = process.env.COZE_SUPABASE_URL!;
    const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;
    const client = createClient(supabaseUrl, supabaseAnonKey);

    const isAdmin = authResult.roles.some((r: any) => r.role === 'admin');
    const userBrand = authResult.brand;

    let query = client
      .from('task_time_logs')
      .select(`
        *,
        tasks (
          id,
          title,
          role,
          project_id,
          projects (
            id,
            name,
            project_type,
            sales_date
          )
        )
      `);

    if (!isAdmin) {
      if (userId && userId === authResult.userId) {
        query = query.eq('user_id', userId);
      } else {
        if (userBrand && userBrand !== 'all') {
          query = query.eq('brand', userBrand);
        } else {
          return NextResponse.json({
            stats: {
              totalDuration: 0,
              totalTasks: 0,
              activeTasks: 0,
              averageDuration: 0,
              byPosition: {},
              byDay: {},
              recentLogs: []
            }
          });
        }
      }
    }

    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    if (userId && isAdmin) {
      query = query.eq('user_id', userId);
    }

    if (brand && isAdmin) {
      query = query.eq('brand', brand);
    }

    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    query = query.order('start_time', { ascending: false });

    const { data: logs, error: logsError } = await query;

    if (logsError) {
      console.error('获取计时记录失败:', logsError);
      return NextResponse.json(
        { error: '获取计时记录失败' },
        { status: 500 }
      );
    }

    const completedLogs = logs.filter((log: any) => log.end_time !== null);
    const activeLogs = logs.filter((log: any) => log.end_time === null);

    const totalDuration = completedLogs.reduce((sum: number, log: any) => sum + (log.duration_minutes || 0), 0);
    const totalTasks = completedLogs.length;
    const activeTasks = activeLogs.length;
    const averageDuration = totalTasks > 0 ? Math.round(totalDuration / totalTasks) : 0;

    const byPosition: Record<string, { totalDuration: number; taskCount: number }> = {};
    completedLogs.forEach((log: any) => {
      const position = log.tasks?.role || '未分类';
      if (!byPosition[position]) {
        byPosition[position] = { totalDuration: 0, taskCount: 0 };
      }
      byPosition[position].totalDuration += log.duration_minutes || 0;
      byPosition[position].taskCount += 1;
    });

    const byDay: Record<string, { totalDuration: number; taskCount: number }> = {};
    completedLogs.forEach((log: any) => {
      const date = new Date(log.start_time).toISOString().split('T')[0];
      if (!byDay[date]) {
        byDay[date] = { totalDuration: 0, taskCount: 0 };
      }
      byDay[date].totalDuration += log.duration_minutes || 0;
      byDay[date].taskCount += 1;
    });

    const recentLogs = logs.slice(0, 20);

    return NextResponse.json({
      success: true,
      stats: {
        totalDuration,
        totalTasks,
        activeTasks,
        averageDuration,
        byPosition,
        byDay,
        recentLogs,
        activeTimer: activeLogs.length > 0 ? activeLogs[0] : null
      }
    });

  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
