/**
 * 营销中台 - 活动策划API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取活动列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const campaign_type = searchParams.get('campaign_type');
    const year = searchParams.get('year');

    const offset = (page - 1) * limit;

    let query = supabase
      .from('marketing_campaigns')
      .select('*', { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (campaign_type && campaign_type !== 'all') {
      query = query.eq('campaign_type', campaign_type);
    }
    if (year) {
      query = query.gte('start_date', `${year}-01-01`).lte('end_date', `${year}-12-31`);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('start_date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('[Marketing Campaigns API] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取活动列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建活动
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const {
      campaign_code,
      name,
      campaign_type,
      description,
      start_date,
      end_date,
      budget,
      target_gmv,
      priority,
      channels,
      brands,
      products,
      created_by,
    } = body;

    // 验证必填字段
    if (!campaign_code || !name || !campaign_type || !start_date || !end_date) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必填字段：campaign_code、name、campaign_type、start_date、end_date',
        },
        { status: 400 }
      );
    }

    // 验证日期
    if (new Date(start_date) > new Date(end_date)) {
      return NextResponse.json(
        {
          success: false,
          error: '开始日期不能晚于结束日期',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('marketing_campaigns')
      .insert({
        campaign_code,
        name,
        campaign_type,
        description,
        start_date,
        end_date,
        budget,
        target_gmv,
        priority,
        channels: channels || [],
        brands: brands || [],
        products: products || [],
        created_by,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '活动创建成功',
    });
  } catch (error) {
    console.error('[Marketing Campaigns API] Error:', error);
    return NextResponse.json(
      { success: false, error: '创建活动失败' },
      { status: 500 }
    );
  }
}
