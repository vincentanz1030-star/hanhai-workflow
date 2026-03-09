import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyPassword } from '@/lib/auth';

const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '缺少 email 或 password 参数' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: 'public' as const }
    });

    // 查询用户
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, is_active, status')
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

    // 验证密码
    let isPasswordValid = false;
    let passwordError = null;

    try {
      isPasswordValid = await verifyPassword(password, user.password_hash);
    } catch (error) {
      passwordError = (error as Error).message;
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        is_active: user.is_active,
        status: user.status,
      },
      passwordCheck: {
        hasPasswordHash: !!user.password_hash,
        passwordHashLength: user.password_hash?.length || 0,
        isPasswordValid,
        error: passwordError,
      },
    });

  } catch (error: any) {
    return NextResponse.json({
      error: '诊断失败',
      details: error?.message || '未知错误',
    }, { status: 500 });
  }
}
