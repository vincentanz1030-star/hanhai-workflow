import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';

// 获取用户审核日志
export async function GET(
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

    // 获取审核日志
    const { data: logs, error } = await supabase
      .from('user_audit_logs')
      .select(`
        *,
        admin:admin_id (
          name,
          email
        ),
        user:user_id (
          name,
          email
        )
      `)
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: '获取日志失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error('获取审核日志错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
