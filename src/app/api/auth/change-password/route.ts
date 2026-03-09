import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { getSupabaseClient } from '@/lib/db-pool';
import { getCurrentUser } from '@/lib/auth';

// 修改密码 API
export async function POST(request: NextRequest) {
  try {
    // 获取当前用户
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: '未登录，请先登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { oldPassword, newPassword } = body;

    // 验证必填字段
    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: '请填写旧密码和新密码' },
        { status: 400 }
      );
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '新密码长度至少6位' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 查询用户当前密码
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', user.userId)
      .single();

    if (fetchError || !userData) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 验证旧密码
    const isValidPassword = await verifyPassword(oldPassword, userData.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '旧密码错误' },
        { status: 400 }
      );
    }

    // 生成新密码哈希
    const newPasswordHash = await hashPassword(newPassword);

    // 更新密码
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.userId);

    if (updateError) {
      console.error('更新密码失败:', updateError);
      return NextResponse.json(
        { error: '修改密码失败，请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '密码修改成功'
    });

  } catch (error) {
    console.error('修改密码异常:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
