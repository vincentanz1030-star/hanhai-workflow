import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// 获取用户审核日志
// 直接从环境变量获取 Supabase 配置
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 环境变量未设置');
}

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

    const supabase = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });

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
