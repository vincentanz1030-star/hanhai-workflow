import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;
const client = createClient(supabaseUrl, supabaseAnonKey);

export interface CreateNotificationParams {
  recipientId: string;
  type: 'task_assigned' | 'task_updated' | 'task_completed' | 'task_overdue' | 'task_comment' | 'collaboration_request' | 'collaboration_accepted' | 'collaboration_rejected' | 'system' | 'deadline_reminder' | 'workload_warning';
  title: string;
  content?: string;
  relatedEntityType?: 'task' | 'project' | 'user' | 'collaboration';
  relatedEntityId?: number;
  brand: string;
  senderId?: string;
}

/**
 * 创建通知
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const { data, error } = await client
      .from('notifications')
      .insert({
        recipient_id: params.recipientId,
        sender_id: params.senderId || null,
        type: params.type,
        title: params.title,
        content: params.content || null,
        related_entity_type: params.relatedEntityType || null,
        related_entity_id: params.relatedEntityId || null,
        brand: params.brand
      })
      .select()
      .single();

    if (error) {
      console.error('创建通知失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('创建通知失败:', error);
    return null;
  }
}

/**
 * 任务分配通知
 */
export async function notifyTaskAssigned(
  recipientId: string,
  taskId: number,
  taskTitle: string,
  brand: string,
  senderId?: string
) {
  return createNotification({
    recipientId,
    type: 'task_assigned',
    title: '新任务分配',
    content: `您被分配了新任务：${taskTitle}`,
    relatedEntityType: 'task',
    relatedEntityId: taskId,
    brand,
    senderId
  });
}

/**
 * 任务更新通知
 */
export async function notifyTaskUpdated(
  recipientId: string,
  taskId: number,
  taskTitle: string,
  brand: string,
  senderId?: string
) {
  return createNotification({
    recipientId,
    type: 'task_updated',
    title: '任务已更新',
    content: `任务 "${taskTitle}" 已更新`,
    relatedEntityType: 'task',
    relatedEntityId: taskId,
    brand,
    senderId
  });
}

/**
 * 任务完成通知
 */
export async function notifyTaskCompleted(
  recipientId: string,
  taskId: number,
  taskTitle: string,
  brand: string,
  senderId?: string
) {
  return createNotification({
    recipientId,
    type: 'task_completed',
    title: '任务已完成',
    content: `任务 "${taskTitle}" 已完成`,
    relatedEntityType: 'task',
    relatedEntityId: taskId,
    brand,
    senderId
  });
}

/**
 * 任务逾期通知
 */
export async function notifyTaskOverdue(
  recipientId: string,
  taskId: number,
  taskTitle: string,
  deadline: string,
  brand: string
) {
  return createNotification({
    recipientId,
    type: 'task_overdue',
    title: '任务已逾期',
    content: `任务 "${taskTitle}" 已逾期，截止日期：${new Date(deadline).toLocaleDateString()}`,
    relatedEntityType: 'task',
    relatedEntityId: taskId,
    brand
  });
}

/**
 * 截止日期提醒通知
 */
export async function notifyDeadlineReminder(
  recipientId: string,
  taskId: number,
  taskTitle: string,
  deadline: string,
  daysLeft: number,
  brand: string
) {
  return createNotification({
    recipientId,
    type: 'deadline_reminder',
    title: '任务即将到期',
    content: `任务 "${taskTitle}" 将在 ${daysLeft} 天后到期，截止日期：${new Date(deadline).toLocaleDateString()}`,
    relatedEntityType: 'task',
    relatedEntityId: taskId,
    brand
  });
}

/**
 * 工作负载预警通知
 */
export async function notifyWorkloadWarning(
  recipientId: string,
  taskCount: number,
  brand: string
) {
  return createNotification({
    recipientId,
    type: 'workload_warning',
    title: '工作负载预警',
    content: `您当前有 ${taskCount} 个未完成任务，请合理安排工作`,
    brand
  });
}

/**
 * 协作请求通知
 */
export async function notifyCollaborationRequest(
  recipientId: string,
  collaborationId: number,
  requestorName: string,
  taskTitle: string,
  brand: string,
  senderId: string
) {
  return createNotification({
    recipientId,
    type: 'collaboration_request',
    title: '协作请求',
    content: `${requestorName} 请求在任务 "${taskTitle}" 上与您协作`,
    relatedEntityType: 'collaboration',
    relatedEntityId: collaborationId,
    brand,
    senderId
  });
}

/**
 * 协作接受通知
 */
export async function notifyCollaborationAccepted(
  recipientId: string,
  collaborationId: number,
  acceptorName: string,
  brand: string,
  senderId: string
) {
  return createNotification({
    recipientId,
    type: 'collaboration_accepted',
    title: '协作请求已接受',
    content: `${acceptorName} 已接受您的协作请求`,
    relatedEntityType: 'collaboration',
    relatedEntityId: collaborationId,
    brand,
    senderId
  });
}

/**
 * 协作拒绝通知
 */
export async function notifyCollaborationRejected(
  recipientId: string,
  collaborationId: number,
  rejectorName: string,
  reason?: string,
  brand: string,
  senderId: string
) {
  return createNotification({
    recipientId,
    type: 'collaboration_rejected',
    title: '协作请求已拒绝',
    content: `${rejectorName} 已拒绝您的协作请求${reason ? `，原因：${reason}` : ''}`,
    relatedEntityType: 'collaboration',
    relatedEntityId: collaborationId,
    brand,
    senderId
  });
}

/**
 * 系统通知
 */
export async function notifySystem(
  recipientId: string,
  title: string,
  content: string,
  brand: string
) {
  return createNotification({
    recipientId,
    type: 'system',
    title,
    content,
    brand
  });
}

/**
 * 批量创建通知
 */
export async function createBulkNotifications(
  notifications: Omit<CreateNotificationParams, 'brand'>[],
  brand: string
) {
  try {
    const notificationsWithBrand = notifications.map(n => ({
      recipient_id: n.recipientId,
      sender_id: n.senderId || null,
      type: n.type,
      title: n.title,
      content: n.content || null,
      related_entity_type: n.relatedEntityType || null,
      related_entity_id: n.relatedEntityId || null,
      brand
    }));

    const { data, error } = await client
      .from('notifications')
      .insert(notificationsWithBrand)
      .select();

    if (error) {
      console.error('批量创建通知失败:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('批量创建通知失败:', error);
    return [];
  }
}
