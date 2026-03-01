import { createClient } from '@supabase/supabase-js';

// 直接从环境变量获取 Supabase 配置
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: 'public' as const }
  });
}

/**
 * 创建通知
 */
export async function createNotification(params: {
  userId: string;
  type: 'task_reminder' | 'collaboration_request' | 'task_assigned' | 'task_completed' | 'user_audit';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high';
}) {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    data: params.data || {},
    priority: params.priority || 'medium',
    is_read: false,
  });

  if (error) {
    console.error('创建通知失败:', error);
    throw error;
  }
}

/**
 * 创建任务催促通知
 */
export async function createReminderNotification(
  targetUserId: string,
  taskName: string,
  projectName: string,
  reminderCount: number
) {
  await createNotification({
    userId: targetUserId,
    type: 'task_reminder',
    title: '任务催促提醒',
    message: `项目"${projectName}"中的任务"${taskName}"已被催促 ${reminderCount} 次，请尽快处理`,
    data: {
      taskName,
      projectName,
      reminderCount,
    },
    priority: reminderCount > 3 ? 'high' : 'medium',
  });
}

/**
 * 创建协同工作请求通知
 */
export async function createCollaborationNotification(
  targetUserId: string,
  taskTitle: string,
  requestingRole: string,
  deadline: string
) {
  await createNotification({
    userId: targetUserId,
    type: 'collaboration_request',
    title: '协同工作请求',
    message: `您收到了来自${requestingRole}的协同工作请求：${taskTitle}，截止日期：${deadline}`,
    data: {
      taskTitle,
      requestingRole,
      deadline,
    },
    priority: deadline && new Date(deadline) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      ? 'high'
      : 'medium',
  });
}

/**
 * 创建任务分配通知
 */
export async function createTaskAssignmentNotification(
  targetUserId: string,
  taskName: string,
  projectName: string
) {
  await createNotification({
    userId: targetUserId,
    type: 'task_assigned',
    title: '新任务分配',
    message: `您被分配了新任务：${taskName}（项目：${projectName}）`,
    data: {
      taskName,
      projectName,
    },
    priority: 'medium',
  });
}

/**
 * 创建用户审核通知
 */
export async function createUserAuditNotification(
  userId: string,
  action: 'approved' | 'rejected',
  reason?: string
) {
  const title = action === 'approved' ? '账号审核通过' : '账号审核未通过';
  const message = action === 'approved'
    ? '您的账号已通过审核，现在可以正常登录了'
    : reason
      ? `您的账号审核未通过，原因：${reason}`
      : '您的账号审核未通过';

  await createNotification({
    userId,
    type: 'user_audit',
    title,
    message,
    data: { action, reason },
    priority: action === 'approved' ? 'high' : 'low',
  });
}
