import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { checkPermission } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 验证用户登录
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 检查权限
    const hasPermission = await checkPermission(currentUser.userId, 'user', 'view');
    if (!hasPermission) {
      return NextResponse.json(
        { error: '无权限查看用户详情' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseClient();

    // 获取用户详情
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        user_roles (
          role,
          is_primary
        )
      `)
      .eq('id', id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 404 }
      );
    }

    // 品牌隔离检查
    if (currentUser.brand !== 'all' && user.brand !== currentUser.brand) {
      return NextResponse.json(
        { error: '无权限访问该用户' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('获取用户详情错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, brand, isActive } = body;

    // 验证用户登录
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 检查权限
    const hasPermission = await checkPermission(currentUser.userId, 'user', 'edit');
    if (!hasPermission) {
      return NextResponse.json(
        { error: '无权限编辑用户' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseClient();

    // 构建更新数据
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (brand !== undefined) updateData.brand = brand;
    if (isActive !== undefined) updateData.is_active = isActive;
    updateData.updated_at = new Date().toISOString();

    // 更新用户
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: '更新用户失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('更新用户错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 验证用户登录
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 检查权限
    const hasPermission = await checkPermission(currentUser.userId, 'user', 'delete');
    if (!hasPermission) {
      return NextResponse.json(
        { error: '无权限删除用户' },
        { status: 403 }
      );
    }

    const supabase = getSupabaseClient();

    // 不能删除自己
    if (currentUser.userId === id) {
      return NextResponse.json(
        { error: '不能删除自己的账号' },
        { status: 400 }
      );
    }

    // 删除用户（级联删除角色）
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: '删除用户失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '用户已删除',
    });
  } catch (error) {
    console.error('删除用户错误:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
