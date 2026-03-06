import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase credentials are not set');
}

// POST - 设置用户为管理员
export async function POST(request: NextRequest) {
  try {
    // 验证请求者是否为管理员
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token 无效' }, { status: 401 });
    }

    // 获取要设置的用户邮箱
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: '缺少邮箱参数' }, { status: 400 });
    }

    console.log(`[设置管理员] 用户 ${decoded.email} 请求设置 ${email} 为管理员`);

    // 执行 SQL 设置管理员
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/set_user_as_admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        p_email: email,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[设置管理员] 失败:', error);

      // 如果 RPC 函数不存在，尝试直接使用 REST API
      return await setAdminViaRestAPI(email, supabaseUrl, supabaseKey);
    }

    const result = await response.json();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('[设置管理员] 错误:', error);
    return NextResponse.json(
      {
        error: '设置管理员失败',
        details: error?.message || '未知错误',
      },
      { status: 500 }
    );
  }
}

async function setAdminViaRestAPI(email: string, supabaseUrl: string, supabaseKey: string) {
  try {
    // 1. 查找用户 ID
    const userResponse = await fetch(
      `${supabaseUrl}/rest/v1/users?email=eq.${email}&select=user_id`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!userResponse.ok) {
      return NextResponse.json({ error: '查找用户失败' }, { status: 500 });
    }

    const users = await userResponse.json();
    if (!users || users.length === 0) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const userId = users[0].user_id;

    // 2. 检查是否已经是管理员
    const roleResponse = await fetch(
      `${supabaseUrl}/rest/v1/user_roles?user_id=eq.${userId}&role=eq.admin&select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!roleResponse.ok) {
      return NextResponse.json({ error: '检查角色失败' }, { status: 500 });
    }

    const roles = await roleResponse.json();

    if (roles.length > 0) {
      return NextResponse.json({
        success: true,
        message: '用户已经是管理员',
        userId,
        email,
      });
    }

    // 3. 设置为管理员
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/user_roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        user_id: userId,
        role: 'admin',
        is_primary: true,
      }),
    });

    if (!insertResponse.ok) {
      const error = await insertResponse.text();
      return NextResponse.json({ error: '设置管理员失败', details: error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '成功设置为管理员',
      userId,
      email,
    });
  } catch (error: any) {
    console.error('[设置管理员 REST] 错误:', error);
    return NextResponse.json(
      {
        error: '设置管理员失败',
        details: error?.message || '未知错误',
      },
      { status: 500 }
    );
  }
}
