import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

// GET - 获取单个反馈详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const client = getSupabaseClient();

    const { data: feedback, error } = await client
      .from('weekly_feedbacks')
      .select(`
        *,
        created_by_user:users!weekly_feedbacks_created_by_fkey(name)
      `)
      .eq('id', id)
      .single();

    if (error || !feedback) {
      return NextResponse.json(
        { error: '反馈不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      feedback: {
        ...feedback,
        created_by_name: feedback.created_by_user?.name || null,
        created_by_user: undefined,
      },
    });
  } catch (error) {
    console.error('获取反馈详情失败:', error);
    return NextResponse.json(
      { error: '获取反馈详情失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新反馈
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
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
      status,
      priority,
      responseContent,
    } = body;

    const client = getSupabaseClient();

    // 构建更新对象
    const updateData: Record<string, any> = {};
    
    if (brand !== undefined) updateData.brand = brand;
    if (weekStart !== undefined) updateData.week_start = weekStart;
    if (weekEnd !== undefined) updateData.week_end = weekEnd;
    if (customerName !== undefined) updateData.customer_name = customerName;
    if (contactInfo !== undefined) updateData.contact_info = contactInfo;
    if (feedbackType !== undefined) updateData.feedback_type = feedbackType;
    if (feedbackContent !== undefined) updateData.feedback_content = feedbackContent;
    if (rating !== undefined) updateData.rating = rating;
    if (images !== undefined) updateData.images = images;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (responseContent !== undefined) updateData.response_content = responseContent;

    updateData.updated_at = new Date().toISOString();

    const { data: feedback, error } = await client
      .from('weekly_feedbacks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新反馈失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!feedback) {
      return NextResponse.json(
        { error: '反馈不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error('更新反馈失败:', error);
    return NextResponse.json(
      { error: '更新反馈失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除反馈
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户身份
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const client = getSupabaseClient();

    const { error } = await client
      .from('weekly_feedbacks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除反馈失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '反馈已删除',
    });
  } catch (error) {
    console.error('删除反馈失败:', error);
    return NextResponse.json(
      { error: '删除反馈失败' },
      { status: 500 }
    );
  }
}
