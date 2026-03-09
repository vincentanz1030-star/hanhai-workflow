import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

/**
 * 获取用户列表（用于任务分配）
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });
    const searchParams = request.nextUrl.searchParams;
    
    const role = searchParams.get('role');
    const brand = searchParams.get('brand');
    const isActive = searchParams.get('isActive');

    const isAdmin = authResult.roles && authResult.roles.some((r: any) => r.role === 'admin');
    const userBrand = authResult.brand;

    // 品牌过滤：非管理员只能看到自己品牌的用户
    if (!isAdmin && userBrand && userBrand !== 'all') {
      // 非管理员用户只能查看自己品牌的用户
      // 但可以查看所有品牌的管理员
      // 这里简化处理：品牌用户只能看自己品牌的用户
    }

    let query = client
      .from('users')
      .select(`
        id,
        email,
        brand,
        created_at,
        user_roles (
          role,
          is_primary
        ),
        user_profiles (
          avatar_url,
          phone,
          department,
          position
        )
      `)
      .eq('status', 'active') // 只返回已激活的用户
      .order('email', { ascending: true });

    const { data: users, error } = await query;

    if (error) {
      console.error('获取用户列表失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 格式化用户数据
    const formattedUsers = (users || []).map((user: any) => {
      const primaryRole = user.user_roles?.find((r: any) => r.is_primary) || user.user_roles?.[0];
      
      return {
        id: user.id,
        email: user.email,
        brand: user.brand,
        role: primaryRole?.role || 'user',
        avatar: user.user_profiles?.avatar_url || null,
        phone: user.user_profiles?.phone || null,
        department: user.user_profiles?.department || null,
        position: user.user_profiles?.position || null,
        displayName: user.email.split('@')[0], // 使用邮箱前缀作为显示名
      };
    });

    // 过滤（如果需要）
    let filteredUsers = formattedUsers;
    
    if (role) {
      filteredUsers = filteredUsers.filter((u: any) => u.role === role);
    }
    
    if (brand && brand !== 'all') {
      filteredUsers = filteredUsers.filter((u: any) => u.brand === brand);
    }

    // 非管理员用户：只能看到自己品牌的用户
    if (!isAdmin && userBrand && userBrand !== 'all') {
      filteredUsers = filteredUsers.filter((u: any) => u.brand === userBrand || u.brand === 'all');
    }

    return NextResponse.json({ users: filteredUsers });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
