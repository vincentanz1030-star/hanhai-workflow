/**
 * 客户反馈详情 API - 单条记录操作
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';
import { canManageAllBrands } from '@/lib/permissions';
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

// GET - 获取单条客户反馈
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const supabase = getSupabaseClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from('weekly_feedbacks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: '反馈不存在' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: toCamelCase(data) });
}

// PATCH - 更新客户反馈
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const user = authResult;
  const supabase = getSupabaseClient();
  const { id } = await params;
  const body = await request.json();

  // 检查反馈是否存在
  const { data: existing, error: fetchError } = await supabase
    .from('weekly_feedbacks')
    .select('brand')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ success: false, error: '反馈不存在' }, { status: 404 });
  }

  // 品牌权限检查
  const canManageAll = await canManageAllBrands(user.brand);
  if (!canManageAll && existing.brand !== user.brand) {
    return NextResponse.json({ success: false, error: '无权限修改此反馈' }, { status: 403 });
  }

  // 构建更新数据
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (body.brand !== undefined) updateData.brand = body.brand;
  if (body.weekStart !== undefined) updateData.week_start = body.weekStart;
  if (body.weekEnd !== undefined) updateData.week_end = body.weekEnd;
  if (body.customerName !== undefined) updateData.customer_name = body.customerName;
  if (body.contactInfo !== undefined) updateData.contact_info = body.contactInfo;
  if (body.feedbackType !== undefined) updateData.feedback_type = body.feedbackType;
  if (body.feedbackContent !== undefined) updateData.feedback_content = body.feedbackContent;
  if (body.rating !== undefined) updateData.rating = body.rating;
  if (body.images !== undefined) updateData.images = body.images;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.responseContent !== undefined) updateData.response_content = body.responseContent;

  const { data, error } = await supabase
    .from('weekly_feedbacks')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新客户反馈失败:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: toCamelCase(data) });
}

// DELETE - 删除客户反馈
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const user = authResult;
  const supabase = getSupabaseClient();
  const { id } = await params;

  // 检查反馈是否存在
  const { data: existing, error: fetchError } = await supabase
    .from('weekly_feedbacks')
    .select('brand')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ success: false, error: '反馈不存在' }, { status: 404 });
  }

  // 品牌权限检查
  const canManageAll = await canManageAllBrands(user.brand);
  if (!canManageAll && existing.brand !== user.brand) {
    return NextResponse.json({ success: false, error: '无权限删除此反馈' }, { status: 403 });
  }

  const { error } = await supabase
    .from('weekly_feedbacks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('删除客户反馈失败:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: '删除成功' });
}
