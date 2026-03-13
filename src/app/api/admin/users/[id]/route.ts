import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';

// 审核用户
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body; // action: approve, reject, suspend, activate

    // 验证管理员权限
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 使用统一的权限检查函数
    const admin = await isAdmin(currentUser.userId);
    if (!admin) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const supabase = getSupabaseClient();

    // 获取目标用户信息
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 根据操作更新状态
    const statusMap: Record<string, string> = {
      approve: 'active',
      reject: 'rejected',
      suspend: 'suspended',
      activate: 'active',
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      return NextResponse.json({ error: '无效的操作' }, { status: 400 });
    }

    // 更新用户状态
    const { error: updateError } = await supabase
      .from('users')
      .update({
        status: newStatus,
        is_active: newStatus === 'active',
      })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: '更新失败' }, { status: 500 });
    }

    // 记录审核日志
    await supabase.from('user_audit_logs').insert({
      user_id: id,
      admin_id: currentUser.userId,
      action,
      old_value: { status: targetUser.status, is_active: targetUser.is_active },
      new_value: { status: newStatus, is_active: newStatus === 'active' },
      reason,
    });

    return NextResponse.json({
      success: true,
      message: `用户已${action === 'approve' ? '批准' : action === 'reject' ? '拒绝' : action === 'suspend' ? '暂停' : '激活'}`,
    });
  } catch (error) {
    console.error('审核用户错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 更新用户信息
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, brand } = body;

    // 验证管理员权限
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 使用统一的权限检查函数
    const admin = await isAdmin(currentUser.userId);
    if (!admin) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const supabase = getSupabaseClient();

    // 更新用户信息
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        ...(name && { name }),
        ...(email && { email }),
        ...(brand && { brand }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: '更新失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('更新用户错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 验证管理员权限
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 使用统一的权限检查函数
    const admin = await isAdmin(currentUser.userId);
    if (!admin) {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

    const supabase = getSupabaseClient();

    // 获取目标用户信息（用于记录日志）
    const { data: targetUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // 删除关联的外键记录（没有 CASCADE 删除的表）
    // 1. 将 weekly_feedbacks 的 created_by 设置为 null
    await supabase
      .from('weekly_feedbacks')
      .update({ created_by: null })
      .eq('created_by', id);

    // 2. 将 campaign_tasks 的 assignee 设置为 null
    await supabase
      .from('campaign_tasks')
      .update({ assignee: null })
      .eq('assignee', id);

    // 3. 将 marketing_campaigns 的 created_by 和 approved_by 设置为 null
    await supabase
      .from('marketing_campaigns')
      .update({ created_by: null })
      .eq('created_by', id);
    await supabase
      .from('marketing_campaigns')
      .update({ approved_by: null })
      .eq('approved_by', id);

    // 4. 将 product_trials 的 user_id 设置为 null
    await supabase
      .from('product_trials')
      .update({ user_id: null })
      .eq('user_id', id);

    // 5. 将 purchase_orders 的 reviewer_id 设置为 null
    await supabase
      .from('purchase_orders')
      .update({ reviewer_id: null })
      .eq('reviewer_id', id);

    // 6. 删除身份认证相关记录（如果有）
    await supabase.from('identities').delete().eq('user_id', id);
    await supabase.from('sessions').delete().eq('user_id', id);
    await supabase.from('mfa_factors').delete().eq('user_id', id);
    await supabase.from('one_time_tokens').delete().eq('user_id', id);
    await supabase.from('oauth_authorizations').delete().eq('user_id', id);
    await supabase.from('oauth_consents').delete().eq('user_id', id);

    // 删除用户（由于有外键约束，user_roles_v2和user_audit_logs会自动删除）
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除用户失败:', error);
      return NextResponse.json({ error: `删除失败: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '用户已删除',
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
