import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// 直接从环境变量获取 Supabase 配置
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 环境变量未设置');
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    let query = supabase.from('users').select('id, email, name, brand, status, is_active, created_at');

    if (email) {
      query = query.eq('email', email);
    }

    const { data: users, error } = await query.limit(10);

    if (error) {
      return NextResponse.json(
        { error: '查询失败', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: users?.length || 0,
      users: users || [],
    });
  } catch (error) {
    console.error('诊断错误:', error);
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
