import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { createCollaborationNotification } from '@/lib/notifications';

// 蛇形转驼峰
function toCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
    }
  }
  return result;
}

// 获取协同合作任务列表
// 直接从环境变量获取 Supabase 配置

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const requestingRole = searchParams.get('requestingRole');
    const targetRole = searchParams.get('targetRole');

    let query = client
      .from('collaboration_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (brand && brand !== 'all') {
      query = query.eq('brand', brand);
    }
    if (requestingRole) {
      query = query.eq('requesting_role', requestingRole);
    }
    if (targetRole) {
      query = query.eq('target_role', targetRole);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('获取协同合作任务失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tasks: toCamelCase(tasks || []) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建协同合作任务
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const {
      requestingRole,
      targetRole,
      taskTitle,
      description,
      deadline,
      priority,
      brand,
    } = body;

    console.log('=== POST 创建协同合作任务 ===');
    console.log('body:', body);

    if (!requestingRole || !targetRole || !taskTitle || !brand) {
      return NextResponse.json(
        { error: '请求岗位、目标岗位、任务标题和品牌为必填项' },
        { status: 400 }
      );
    }

    // 创建协同合作任务
    const { data: task, error } = await client
      .from('collaboration_tasks')
      .insert({
        requesting_role: requestingRole,
        target_role: targetRole,
        task_title: taskTitle,
        description: description || '',
        deadline: deadline || null,
        progress: 0,
        status: 'pending',
        priority: priority || 'normal',
        brand,
      })
      .select()
      .single();

    if (error) {
      console.error('创建协同合作任务失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 发送通知给目标角色的用户
    try {
      // 获取该品牌下目标角色的用户
      const { data: targetUsers } = await client
        .from('users')
        .select('id')
        .eq('brand', brand)
        .eq('status', 'active');

      if (targetUsers && targetUsers.length > 0) {
        const userIds = targetUsers.map((u) => u.id);
        const { data: userRoles } = await client
          .from('user_roles')
          .select('user_id')
          .in('user_id', userIds)
          .eq('role', targetRole);

        if (userRoles) {
          for (const userRole of userRoles) {
            await createCollaborationNotification(
              userRole.user_id,
              taskTitle,
              requestingRole,
              deadline || ''
            );
          }
        }
      }
    } catch (notifyError) {
      console.error('发送通知失败:', notifyError);
      // 通知发送失败不影响协同任务创建
    }

    console.log('创建成功:', task);
    return NextResponse.json({ task: toCamelCase(task) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
