import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// 获取用户已读公告列表
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const client = getSupabaseClient();

    const { data: reads, error: readsError } = await client
      .from('announcement_reads')
      .select('announcement_id, read_at')
      .eq('user_id', authResult.userId);

    if (readsError) {
      console.error('获取已读记录失败:', readsError);
      return NextResponse.json(
        { error: '获取已读记录失败' },
        { status: 500 }
      );
    }

    // 返回已读公告ID集合
    const readMap: Record<string, string> = {};
    (reads || []).forEach((r: { announcement_id: string; read_at: string }) => {
      readMap[r.announcement_id] = r.read_at;
    });

    return NextResponse.json({
      success: true,
      readMap
    });

  } catch (error) {
    console.error('获取已读记录失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 标记公告为已读
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { announcementId } = body;

    if (!announcementId) {
      return NextResponse.json(
        { error: '缺少公告ID' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    // 使用 upsert 避免重复插入
    const { error: upsertError } = await client
      .from('announcement_reads')
      .upsert({
        announcement_id: announcementId,
        user_id: authResult.userId,
        read_at: new Date().toISOString()
      }, {
        onConflict: 'announcement_id,user_id'
      });

    if (upsertError) {
      console.error('标记已读失败:', upsertError);
      return NextResponse.json(
        { error: '标记已读失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '已标记为已读'
    });

  } catch (error) {
    console.error('标记已读失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 标记所有公告为已读
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const client = getSupabaseClient();

    // 获取所有启用的公告
    const { data: announcements, error: announcementsError } = await client
      .from('announcements')
      .select('id')
      .eq('is_active', true);

    if (announcementsError) {
      console.error('获取公告失败:', announcementsError);
      return NextResponse.json(
        { error: '获取公告失败' },
        { status: 500 }
      );
    }

    if (!announcements || announcements.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有公告需要标记'
      });
    }

    // 批量插入已读记录
    const readRecords = announcements.map((a: { id: string }) => ({
      announcement_id: a.id,
      user_id: authResult.userId,
      read_at: new Date().toISOString()
    }));

    const { error: insertError } = await client
      .from('announcement_reads')
      .upsert(readRecords, {
        onConflict: 'announcement_id,user_id'
      });

    if (insertError) {
      console.error('标记全部已读失败:', insertError);
      return NextResponse.json(
        { error: '标记全部已读失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '已标记全部为已读',
      count: announcements.length
    });

  } catch (error) {
    console.error('标记全部已读失败:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
