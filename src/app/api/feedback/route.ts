import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { canViewAllBrands, canManageAllBrands } from '@/lib/permissions';
import { toCamelCase } from '@/lib/utils';

// 获取所有反馈
export async function GET(request: NextRequest) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const user = authResult;

  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const role = searchParams.get('role');
    const brand = searchParams.get('brand');

    // 品牌隔离检查
    const canViewAll = await canViewAllBrands(user.userId, user.brand);

    let query = client
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });

    // 品牌过滤
    if (!canViewAll) {
      query = query.eq('brand', user.brand);
    } else if (brand && brand !== 'all') {
      query = query.eq('brand', brand);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) {
      console.error('获取反馈失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feedback: toCamelCase(data || []) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建反馈
export async function POST(request: NextRequest) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const user = authResult;

  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { type, brand, role, projectId, title, content, priority } = body;

    // 品牌权限验证
    const canManageAll = await canManageAllBrands(user.brand);
    const feedbackBrand = brand || user.brand;

    if (!canManageAll && feedbackBrand !== user.brand) {
      return NextResponse.json(
        { error: '无权限创建其他品牌的反馈' },
        { status: 403 }
      );
    }

    if (!title || !content) {
      return NextResponse.json(
        { error: '标题和内容不能为空' },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from('feedback')
      .insert({
        type,
        brand: feedbackBrand,
        role,
        project_id: projectId,
        title,
        content,
        priority: priority || 'medium',
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('创建反馈失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feedback: toCamelCase(data) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
