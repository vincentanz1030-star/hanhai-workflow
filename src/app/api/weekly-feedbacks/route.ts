/**
 * 客户反馈 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';
import { canViewAllBrands } from '@/lib/permissions';
import { toCamelCase } from '@/lib/utils';

// 转换函数
function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (typeof obj !== 'object') return obj;

  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      newObj[newKey] = toSnakeCase(obj[key]);
    }
  }
  return newObj;
}

// GET - 获取客户反馈列表
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const user = authResult;

  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const brand = searchParams.get('brand');
    const status = searchParams.get('status');

    // 品牌隔离检查
    const canViewAll = await canViewAllBrands(user.userId, user.brand);

    let query = supabase
      .from('weekly_feedbacks')
      .select('*')
      .order('created_at', { ascending: false });

    // 品牌过滤
    if (!canViewAll) {
      query = query.eq('brand', user.brand);
    } else if (brand && brand !== 'all') {
      query = query.eq('brand', brand);
    }

    // 状态过滤
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('获取客户反馈失败:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: toCamelCase(data || []) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

// POST - 创建客户反馈
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const user = authResult;

  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    // 验证必填字段
    if (!body.feedbackContent) {
      return NextResponse.json(
        { success: false, error: '请填写反馈内容' },
        { status: 400 }
      );
    }

    // 计算当前周的起始日期和结束日期（如果未提供）
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStartDate = new Date(now);
    weekStartDate.setDate(now.getDate() - dayOfWeek + 1); // 周一
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6); // 周日

    const formatDateToYMD = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    const insertData = {
      brand: body.brand || user.brand || 'he_zhe',
      week_start: body.weekStart || formatDateToYMD(weekStartDate),
      week_end: body.weekEnd || formatDateToYMD(weekEndDate),
      customer_name: body.customerName || null,
      contact_info: body.contactInfo || null,
      feedback_type: body.feedbackType || 'general',
      feedback_content: body.feedbackContent,
      rating: body.rating || 5,
      images: body.images || [],
      status: 'pending',
      priority: body.priority || 'normal',
      created_by: user.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('weekly_feedbacks')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('创建客户反馈失败:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: toCamelCase(data) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}
