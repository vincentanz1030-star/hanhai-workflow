/**
 * 企业协同平台 - 知识库API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.COZE_SUPABASE_URL;
  const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// GET - 获取知识文章列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category_id = searchParams.get('category_id');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    let query = supabase
      .from('knowledge_articles')
      .select(`
        *,
        knowledge_categories(name)
      `, { count: 'exact' });

    if (category_id && category_id !== 'all') {
      query = query.eq('category_id', category_id);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

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
    console.error('[Knowledge API] Error:', error);
    return NextResponse.json(
      { success: false, error: '获取知识文章列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建知识文章
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    // 添加默认的created_by字段（如果没有提供）
    if (!body.created_by) {
      body.created_by = '00000000-0000-0000-0000-000000000000'; // 默认用户ID
    }

    const { data, error } = await supabase
      .from('knowledge_articles')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '知识文章创建成功',
    });
  } catch (error) {
    console.error('[Knowledge API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建知识文章失败',
      },
      { status: 500 }
    );
  }
}
