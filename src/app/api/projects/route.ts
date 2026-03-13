import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, applyBrandFilter } from '@/lib/api-auth';
import { createTasksForProject } from '@/lib/project-tasks';
import { toCamelCase } from '@/lib/utils';

// 获取所有项目
// 直接从环境变量获取 Supabase 配置

export async function GET(request: NextRequest) {
  try {
    // 认证和权限检查
    const authResult = await requireAuth(request, 'project', 'view');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const brand = searchParams.get('brand');
    const category = searchParams.get('category');

    // 品牌隔离逻辑：
    // 1. 检查用户是否是管理员
    const isAdmin = authResult.roles && authResult.roles.some((r: any) => r.role === 'admin' || r.role === 'super_admin');

    // 2. 构建基础查询
    let query = client
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    // 3. 应用品牌过滤
    if (isAdmin) {
      // 管理员可以看到所有品牌的项目
      // 如果请求指定了品牌参数，则进一步过滤
      if (brand && brand !== 'all') {
        query = query.eq('brand', brand);
      }
    } else {
      // 品牌用户，只能查看对应品牌的项目
      const userBrand = authResult.brand;
      if (!userBrand || userBrand === 'all') {
        return NextResponse.json({ projects: [] });
      }
      query = query.eq('brand', userBrand);
    }

    // 4. 项目分类过滤
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('获取项目失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 获取每个项目的任务
    const projectsWithTasks = await Promise.all(
      (projects || []).map(async (project: { id: string; [key: string]: any }) => {
        const { data: tasks } = await client
          .from('tasks')
          .select('*')
          .eq('project_id', project.id)
          .order('role', { ascending: true })
          .order('task_order', { ascending: true });

        return {
          ...project,
          tasks: tasks || [],
        };
      })
    );

    return NextResponse.json({ projects: toCamelCase(projectsWithTasks) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建新项目
export async function POST(request: NextRequest) {
  try {
    // 只检查用户是否登录，不检查权限
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const client = getSupabaseClient();
    const body = await request.json();
    const { name, brand, category, salesDate, description, selectedRoles } = body;

    // 验证必填项
    if (!name || !salesDate || !brand || !category) {
      return NextResponse.json(
        { error: '项目名称、品牌、分类和销售日期为必填项' },
        { status: 400 }
      );
    }

    // 品牌隔离检查：非管理员用户只能创建自己品牌的项目
    const isAdmin = authResult.roles && authResult.roles.some((r: any) => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin && authResult.brand !== 'all' && brand !== authResult.brand) {
      return NextResponse.json(
        { error: '您只能创建自己品牌的项目' },
        { status: 403 }
      );
    }

    // 计算项目确认日期（销售前3个月）
    const salesDateObj = new Date(salesDate);
    const projectConfirmDateObj = new Date(salesDateObj);
    projectConfirmDateObj.setMonth(projectConfirmDateObj.getMonth() - 3);

    // 创建项目
    const { data: project, error: projectError } = await client
      .from('projects')
      .insert({
        name,
        brand,
        category,
        sales_date: salesDate,
        project_confirm_date: projectConfirmDateObj.toISOString(),
        description: description || null,
        status: 'pending',
      })
      .select()
      .single();

    if (projectError) {
      console.error('创建项目失败:', projectError);
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    if (!project) {
      return NextResponse.json({ error: '项目创建失败，未返回数据' }, { status: 500 });
    }

    // 创建各岗位任务（根据项目类型和选择的岗位）
    const tasks = await createTasksForProject(
      client,
      project.id,
      salesDate,
      projectConfirmDateObj,
      category,
      selectedRoles // 传递用户选择的岗位列表
    );

    // 计算项目整体预计完成时间（取所有任务中最晚的预计完成时间）
    const estimatedDates = tasks
      .filter(t => t.estimated_completion_date)
      .map(t => new Date(t.estimated_completion_date));
    
    if (estimatedDates.length > 0) {
      const maxDate = new Date(Math.max(...estimatedDates.map(d => d.getTime())));
      await client
        .from('projects')
        .update({ overall_completion_date: maxDate.toISOString() })
        .eq('id', project.id);
      
      project.overall_completion_date = maxDate.toISOString();
    }

    // 转换为驼峰命名
    const camelProject = toCamelCase(project);
    const camelTasks = tasks.map((t: any) => toCamelCase(t));

    return NextResponse.json({ project: camelProject, tasks: camelTasks });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除项目
export async function DELETE(request: NextRequest) {
  try {
    // 认证检查
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '项目ID为必填项' }, { status: 400 });
    }

    // 品牌隔离检查：获取项目信息
    const { data: project, error: fetchError } = await client
      .from('projects')
      .select('brand')
      .eq('id', id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }

    // 检查删除权限
    const isAdmin = authResult.roles && authResult.roles.some((r: any) => r.role === 'admin' || r.role === 'super_admin');
    if (!isAdmin && authResult.brand !== 'all' && project.brand !== authResult.brand) {
      return NextResponse.json({ error: '您只能删除自己品牌的项目' }, { status: 403 });
    }

    // 先删除项目相关的所有任务
    const { error: tasksDeleteError } = await client
      .from('tasks')
      .delete()
      .eq('project_id', id);

    if (tasksDeleteError) {
      console.error('删除项目任务失败:', tasksDeleteError);
      return NextResponse.json({ error: tasksDeleteError.message }, { status: 500 });
    }

    // 删除项目
    const { error: projectDeleteError } = await client
      .from('projects')
      .delete()
      .eq('id', id);

    if (projectDeleteError) {
      console.error('删除项目失败:', projectDeleteError);
      return NextResponse.json({ error: projectDeleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: '项目删除成功' });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
