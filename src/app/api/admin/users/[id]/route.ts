import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser } from '@/lib/auth';

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

    const supabase = getSupabaseClient();

    // 检查用户角色
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.userId)
      .eq('is_primary', true)
      .single();

    if (!adminRole || adminRole.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

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

    const supabase = getSupabaseClient();

    // 检查用户角色
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.userId)
      .eq('is_primary', true)
      .single();

    if (!adminRole || adminRole.role !== 'admin') {
      return NextResponse.json({ error: '无权限' }, { status: 403 });
    }

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
