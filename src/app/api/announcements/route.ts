import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// 获取公告列表
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const client = getSupabaseClient();

    // 构建基础查询
    let query = client
      .from('announcements')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    // 品牌过滤：用户只能看到自己品牌或 all 品牌的公告
    if (authResult.brand !== 'all') {
      query = query.or(`brand.eq.all,brand.eq.${authResult.brand}`);
    }

    // 只获取启用的公告
    if (activeOnly) {
      query = query.eq('is_active', true);
      
      // 过滤时间范围
      const now = new Date().toISOString();
      query = query.or(`start_time.is.null,start_time.lte.${now}`);
      query = query.or(`end_time.is.null,end_time.gte.${now}`);
    }

    // 分页
    query = query.range(offset, offset + limit - 1);

    const { data: announcements, error: announcementsError } = await query;

    if (announcementsError) {
      console.error('获取公告失败:', announcementsError);
      return NextResponse.json(
        { error: '获取公告失败' },
        { status: 500 }
      );
    }

    // 获取总数
    let countQuery = client
      .from('announcements')
      .select('*', { count: 'exact', head: true });
    
    if (authResult.brand !== 'all') {
      countQuery = countQuery.or(`brand.eq.all,brand.eq.${authResult.brand}`);
    }

    if (activeOnly) {
      countQuery = countQuery.eq('is_active', true);
    }

    const { count } = await countQuery;

    // 获取用户已读记录
    const { data: reads } = await client
      .from('announcement_reads')
      .select('announcement_id')
      .eq('user_id', authResult.userId);

    const readIds = new Set((reads || []).map((r: { announcement_id: string }) => r.announcement_id));

    // 为每个公告添加 isRead 字段
    const announcementsWithReadStatus = (announcements || []).map((a: { id: string }) => ({
      ...a,
      isRead: readIds.has(a.id)
    }));

    return NextResponse.json({
      success: true,
      announcements: announcementsWithReadStatus,
      total: count || 0,
      unreadCount: (announcements || []).filter((a: { id: string }) => !readIds.has(a.id)).length
    });

  } catch (error) {
    console.error('获取公告失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 创建公告
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      title,
      content,
      type = 'info',
      priority = 0,
      is_active = true,
      start_time,
      end_time,
      brand = 'all'
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: '公告标题不能为空' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    const { data: announcement, error: announcementError } = await client
      .from('announcements')
      .insert({
        title,
        content: content || null,
        type,
        priority,
        is_active,
        start_time: start_time || null,
        end_time: end_time || null,
        brand,
        created_by: authResult.userId
      })
      .select()
      .single();

    if (announcementError) {
      console.error('创建公告失败:', announcementError);
      return NextResponse.json(
        { error: '创建公告失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      announcement,
      message: '公告创建成功'
    });

  } catch (error) {
    console.error('创建公告失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
