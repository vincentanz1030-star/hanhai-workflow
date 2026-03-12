import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
// GET - 获取反馈列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const client = getSupabaseClient();
    
    let query = client
      .from('weekly_feedbacks')
      .select(`
        *,
        created_by_user:users!weekly_feedbacks_created_by_fkey(name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (brand && brand !== 'all') {
      query = query.eq('brand', brand);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: feedbacks, error, count } = await query;

    if (error) {
      console.error('获取反馈列表失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 转换数据格式
    const formattedFeedbacks = (feedbacks || []).map((f: {
      [key: string]: any;
      created_by_user?: { name: string };
    }) => ({
      ...f,
      created_by_name: f.created_by_user?.name || null,
      created_by_user: undefined,
    }));

    return NextResponse.json({
      feedbacks: formattedFeedbacks,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    return NextResponse.json(
      { error: '获取反馈列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新反馈
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      brand,
      weekStart,
      weekEnd,
      customerName,
      contactInfo,
      feedbackType,
      feedbackContent,
      rating,
      images,
      priority,
      createdBy,
    } = body;

    // 验证必填字段
    if (!brand || !weekStart || !weekEnd || !feedbackContent) {
      return NextResponse.json(
        { error: '品牌、周开始日期、周结束日期和反馈内容为必填项' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    const { data: feedback, error } = await client
      .from('weekly_feedbacks')
      .insert({
        brand,
        week_start: weekStart,
        week_end: weekEnd,
        customer_name: customerName || null,
        contact_info: contactInfo || null,
        feedback_type: feedbackType || 'general',
        feedback_content: feedbackContent,
        rating: rating || 5,
        images: images || [],
        status: 'pending',
        priority: priority || 'normal',
        created_by: createdBy || null,
      })
      .select()
      .single();

    if (error) {
      console.error('创建反馈失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error('创建反馈失败:', error);
    return NextResponse.json(
      { error: '创建反馈失败' },
      { status: 500 }
    );
  }
}
