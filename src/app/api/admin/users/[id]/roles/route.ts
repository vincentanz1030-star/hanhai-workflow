import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';

// 分配角色给用户
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { roles } = body; // 角色数组: [{ role: string, is_primary: boolean }]

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

    // 删除用户现有角色
    await supabase.from('user_roles_v2').delete().eq('user_id', id);

    // 插入新角色
    if (roles && roles.length > 0) {
      const rolesToInsert = roles.map((r: any) => ({
        user_id: id,
        role: r.role,
        is_primary: r.is_primary || false,
      }));

      const { error: insertError } = await supabase
        .from('user_roles_v2')
        .insert(rolesToInsert);

      if (insertError) {
        return NextResponse.json({ error: '分配角色失败' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: '角色已更新' });
  } catch (error) {
    console.error('分配角色错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
