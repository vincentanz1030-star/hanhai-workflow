import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// 获取单个公告详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const client = getSupabaseClient();

    const { data: announcement, error: announcementError } = await client
      .from('announcements')
      .select('*')
      .eq('id', id)
      .single();

    if (announcementError) {
      console.error('获取公告失败:', announcementError);
      return NextResponse.json(
        { error: '公告不存在' },
        { status: 404 }
      );
    }

    // 检查品牌权限
    if (authResult.brand !== 'all' && announcement.brand !== 'all' && announcement.brand !== authResult.brand) {
      return NextResponse.json(
        { error: '无权查看此公告' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      announcement
    });

  } catch (error) {
    console.error('获取公告失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 更新公告
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // 检查是否为管理员
    const isAdmin = authResult.roles.some((r) => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin) {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const client = getSupabaseClient();

    // 构建更新数据
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.start_time !== undefined) updateData.start_time = body.start_time;
    if (body.end_time !== undefined) updateData.end_time = body.end_time;
    if (body.brand !== undefined) updateData.brand = body.brand;

    const { data: announcement, error: announcementError } = await client
      .from('announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (announcementError) {
      console.error('更新公告失败:', announcementError);
      return NextResponse.json(
        { error: '更新公告失败' },
        { status: 500 }
      );
    }

    if (!announcement) {
      return NextResponse.json(
        { error: '公告不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      announcement,
      message: '公告更新成功'
    });

  } catch (error) {
    console.error('更新公告失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 删除公告
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // 检查是否为管理员
    const isAdmin = authResult.roles.some((r) => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin) {
      return NextResponse.json(
        { error: '需要管理员权限' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const client = getSupabaseClient();

    const { error: deleteError } = await client
      .from('announcements')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('删除公告失败:', deleteError);
      return NextResponse.json(
        { error: '删除公告失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '公告删除成功'
    });

  } catch (error) {
    console.error('删除公告失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
