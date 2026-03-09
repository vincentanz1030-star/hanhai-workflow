import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

export async function GET(request: NextRequest) {
  // 从 request 中获取 email 参数
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: '缺少 email 参数' }, { status: 400 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: 'public' as const }
    });

    // 查询用户
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, brand, is_active, status, created_at')
      .eq('email', email)
      .single();

    if (error) {
      return NextResponse.json({
        error: '查询用户失败',
        details: error.message,
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({
        error: '用户不存在',
        email,
      }, { status: 404 });
    }

    // 查询用户角色
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        brand: user.brand,
        is_active: user.is_active,
        status: user.status,
        created_at: user.created_at,
      },
      roles: roles || [],
      rolesCount: roles?.length || 0,
    });

  } catch (error: any) {
    return NextResponse.json({
      error: '诊断失败',
      details: error?.message || '未知错误',
    }, { status: 500 });
  }
}
