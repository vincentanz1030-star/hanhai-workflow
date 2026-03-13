import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createReminderNotification } from '@/lib/notifications';
import { getUserRoles } from '@/lib/permissions';

// 催促任务
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // 获取任务信息
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        *,
        projects (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    // 更新催促次数
    const newReminderCount = (task.reminder_count || 0) + 1;
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        reminder_count: newReminderCount,
        last_reminder_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: '催促失败' }, { status: 500 });
    }

    // 获取目标角色的用户
    const targetRole = task.role;
    const brand = task.projects?.brand;

    // 查找该品牌下该角色的用户
    const { data: targetUsers } = await supabase
      .from('users')
      .select('id')
      .eq('brand', brand)
      .eq('status', 'active');

    if (targetUsers && targetUsers.length > 0) {
      // 使用统一的权限模块获取用户角色
      for (const targetUser of targetUsers) {
        const userRoles = await getUserRoles(targetUser.id);
        if (userRoles.some(r => r.role === targetRole)) {
          await createReminderNotification(
            targetUser.id,
            task.task_name,
            task.projects?.name || '未知项目',
            newReminderCount
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      reminderCount: newReminderCount,
    });
  } catch (error) {
    console.error('催促任务错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
