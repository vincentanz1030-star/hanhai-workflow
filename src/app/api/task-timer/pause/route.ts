import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

// 暂停任务计时
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { timerId, notes } = body;

    const supabaseUrl = process.env.COZE_SUPABASE_URL!;
    const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;
    const client = createClient(supabaseUrl, supabaseAnonKey);

    let query = client
      .from('task_time_logs')
      .select('*')
      .eq('user_id', authResult.userId)
      .is('end_time', null);

    if (timerId) {
      query = query.eq('id', timerId);
    }

    const { data: timer, error: timerError } = await query.single();

    if (timerError || !timer) {
      return NextResponse.json(
        { error: '没有找到正在进行的计时' },
        { status: 404 }
      );
    }

    const isAdmin = authResult.roles.some((r: any) => r.role === 'admin');
    const userBrand = authResult.brand;
    if (!isAdmin && userBrand && userBrand !== 'all' && timer.brand !== userBrand) {
      return NextResponse.json(
        { error: '您只能操作自己品牌的计时' },
        { status: 403 }
      );
    }

    const endTime = new Date();
    const durationMinutes = Math.floor((endTime.getTime() - new Date(timer.start_time).getTime()) / 1000 / 60);

    const { data: updatedTimer, error: updateError } = await client
      .from('task_time_logs')
      .update({
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        notes: notes || timer.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', timer.id)
      .select()
      .single();

    if (updateError) {
      console.error('暂停计时失败:', updateError);
      return NextResponse.json(
        { error: '暂停计时失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      timer: updatedTimer,
      message: '计时已暂停'
    });

  } catch (error) {
    console.error('暂停计时失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
