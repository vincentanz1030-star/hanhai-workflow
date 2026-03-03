import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

// 直接从环境变量获取 Supabase 配置
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, projects, tasks, users
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ error: '搜索关键词不能为空' }, { status: 400 });
    }

    const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });

    const results: any = {
      projects: [],
      tasks: [],
      users: [],
    };

    // 检查用户角色
    const { data: userRoles } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', authResult.userId);

    const isAdmin = userRoles?.some((r: any) => r.role === 'admin') || false;

    // 搜索项目
    if (type === 'all' || type === 'projects') {
      let projectQuery = client
        .from('projects')
        .select('id, name, brand, category, status, sales_date, created_at')
        .ilike('name', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      // 非管理员只能查看自己品牌的
      if (!isAdmin) {
        const { data: userBrands } = await client
          .from('user_roles')
          .select('brand')
          .eq('user_id', authResult.userId);

        if (userBrands && userBrands.length > 0) {
          const brands = userBrands.map((b: any) => b.brand);
          projectQuery = projectQuery.in('brand', brands);
        }
      }

      const { data: projects } = await projectQuery;
      results.projects = projects || [];
    }

    // 搜索任务
    if (type === 'all' || type === 'tasks') {
      let taskQuery = client
        .from('tasks')
        .select('id, project_id, task_name, role, status, progress, estimated_completion_date, created_at, projects!inner(name, brand)')
        .ilike('task_name', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      // 非管理员只能查看自己品牌的任务
      if (!isAdmin) {
        const { data: userBrands } = await client
          .from('user_roles')
          .select('brand')
          .eq('user_id', authResult.userId);

        if (userBrands && userBrands.length > 0) {
          const brands = userBrands.map((b: any) => b.brand);
          taskQuery = taskQuery.in('projects.brand', brands);
        }
      }

      const { data: tasks } = await taskQuery;
      results.tasks = tasks || [];
    }

    // 搜索用户
    if (type === 'all' || type === 'users') {
      if (isAdmin) {
        const { data: users } = await client
          .from('users')
          .select('id, name, email, created_at')
          .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
          .order('created_at', { ascending: false })
          .limit(limit);

        results.users = users || [];
      } else {
        // 非管理员只能搜索自己
        const { data: currentUser } = await client
          .from('users')
          .select('id, name, email, created_at')
          .eq('id', authResult.userId)
          .single();

        if (currentUser) {
          results.users = [currentUser];
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('搜索失败:', error);
    return NextResponse.json({ error: '搜索失败: ' + (error as Error).message }, { status: 500 });
  }
}
