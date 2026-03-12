import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getSupabaseClient, getSupabaseCredentials } from '@/storage/database/supabase-client';

// POST - 设置用户为管理员（仅限管理员操作）
export async function POST(request: NextRequest) {
  try {
    // 验证请求者是否为管理员
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token 无效' }, { status: 401 });
    }

    // 检查当前用户是否是管理员
    const client = getSupabaseClient();
    const { data: currentUserRoles, error: roleError } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', decoded.userId);

    if (roleError || !currentUserRoles?.some((r: { role: string }) => r.role === 'admin')) {
      console.log(`[设置管理员] 非管理员用户 ${decoded.email} 尝试设置管理员`);
      return NextResponse.json({ error: '无权限执行此操作，仅限管理员' }, { status: 403 });
    }

    // 获取要设置的用户邮箱
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: '缺少邮箱参数' }, { status: 400 });
    }

    console.log(`[设置管理员] 用户 ${decoded.email} 请求设置 ${email} 为管理员`);

    // 使用 Supabase 客户端查找用户
    const { data: users, error: userError } = await client
      .from('users')
      .select('id, email')
      .eq('email', email);

    if (userError) {
      console.error('[设置管理员] 查找用户失败:', userError);
      return NextResponse.json({ error: '查找用户失败' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const userId = users[0].id;

    // 检查是否已经是管理员
    const { data: existingRoles, error: checkError } = await client
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin');

    if (checkError) {
      console.error('[设置管理员] 检查角色失败:', checkError);
      return NextResponse.json({ error: '检查角色失败' }, { status: 500 });
    }

    if (existingRoles && existingRoles.length > 0) {
      return NextResponse.json({
        success: true,
        message: '用户已经是管理员',
        userId,
        email,
      });
    }

    // 设置为管理员
    const { error: insertError } = await client
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin',
        is_primary: true,
      });

    if (insertError) {
      console.error('[设置管理员] 设置失败:', insertError);
      return NextResponse.json({ error: '设置管理员失败', details: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '成功设置为管理员',
      userId,
      email,
    });
  } catch (error: unknown) {
    console.error('[设置管理员] 错误:', error);
    return NextResponse.json(
      {
        error: '设置管理员失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
