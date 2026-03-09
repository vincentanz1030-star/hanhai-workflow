import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

// 开始任务计时
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { taskId, notes } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: '任务ID不能为空' },
        { status: 400 }
      );
    }

    // 检查权限
    const hasPermission = authResult.roles.some((p: any) => 
      p.permission === 'task.edit' || p.permission === '*'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: '您没有编辑任务的权限' },
        { status: 403 }
      );
    }

    // 创建 Supabase 客户端
    const supabaseUrl = process.env.COZE_SUPABASE_URL!;
    const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;
    const client = createClient(supabaseUrl, supabaseAnonKey);

    // 检查是否已有正在进行的计时
    const { data: activeTimer, error: activeError } = await client
      .from('task_time_logs')
      .select('*')
      .eq('user_id', authResult.userId)
      .is('end_time', null)
      .single();

    if (activeTimer && !activeError) {
      // 先暂停正在进行的计时
      const endTime = new Date();
      const durationMinutes = Math.floor((endTime.getTime() - new Date(activeTimer.start_time).getTime()) / 1000 / 60);

      await client
        .from('task_time_logs')
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeTimer.id);
    }

    // 检查任务是否存在
    const { data: task, error: taskError } = await client
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { error: '任务不存在' },
        { status: 404 }
      );
    }

    // 检查品牌权限
    const isAdmin = authResult.roles.some((r: any) => r.role === 'admin');
    const userBrand = authResult.brand;
    if (!isAdmin && userBrand && userBrand !== 'all' && task.brand !== userBrand) {
      return NextResponse.json(
        { error: '您只能计时自己品牌的任务' },
        { status: 403 }
      );
    }

    // 创建新的计时记录
    const { data: timer, error: timerError } = await client
      .from('task_time_logs')
      .insert({
        task_id: taskId,
        user_id: authResult.userId,
        brand: task.brand,
        notes: notes || null
      })
      .select()
      .single();

    if (timerError) {
      console.error('创建计时记录失败:', timerError);
      return NextResponse.json(
        { error: '创建计时记录失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      timer,
      message: '计时已开始'
    });

  } catch (error) {
    console.error('开始计时失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
