import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;

// 获取资源评分列表
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const resourceType = searchParams.get('resource_type');
  const resourceId = searchParams.get('resource_id');

  if (!resourceType || !resourceId) {
    return NextResponse.json({ error: '缺少资源类型或ID' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 获取评分列表
    const { data: ratings, error } = await supabase
      .from('shared_resource_ratings')
      .select(`
        id,
        rating,
        review,
        created_at,
        user_id,
        users!shared_resource_ratings_user_id_fkey (
          id,
          name,
          brand
        )
      `)
      .eq('resource_type', resourceType)
      .eq('resource_id', parseInt(resourceId))
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 计算平均评分
    const avgRating = ratings?.length > 0
      ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        ratings: ratings || [],
        average: avgRating,
        count: ratings?.length || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 提交评分
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const user = (authResult as any).user;
  const body = await request.json();
  const { resource_type, resource_id, rating, review } = body;

  if (!resource_type || !resource_id || !rating) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: '评分必须在1-5之间' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 检查是否已评分
    const { data: existing } = await supabase
      .from('shared_resource_ratings')
      .select('id')
      .eq('resource_type', resource_type)
      .eq('resource_id', resource_id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // 更新评分
      const { error } = await supabase
        .from('shared_resource_ratings')
        .update({
          rating,
          review,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // 新增评分
      const { error } = await supabase
        .from('shared_resource_ratings')
        .insert({
          resource_type,
          resource_id,
          user_id: user.id,
          brand: user.brand,
          rating,
          review,
        });

      if (error) throw error;

      // 更新用户贡献积分
      await supabase.rpc('update_contribution_points', {
        p_user_id: user.id,
        p_brand: user.brand,
        p_points: 1,
        p_resource_type: resource_type,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
