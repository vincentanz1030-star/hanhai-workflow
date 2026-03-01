import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, applyBrandFilter } from '@/lib/api-auth';
import { createTasksForProject } from '@/lib/project-tasks';

// 将蛇形命名转换为驼峰命名
function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;

  const newObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // 移除所有下划线，并将下划线后的字母大写
      const camelKey = key.split('_').reduce((result, word, index) => {
        if (index === 0) {
          return word;
        }
        return result + word.charAt(0).toUpperCase() + word.slice(1);
      }, '');
      newObj[camelKey] = toCamelCase(obj[key]);
    }
  }
  return newObj;
}

// 获取所有项目
// 直接从环境变量获取 Supabase 配置
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 环境变量未设置');
}

export async function GET(request: NextRequest) {
  try {
    // 认证和权限检查
    const authResult = await requireAuth(request, 'project', 'view');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    console.log(`GET /api/projects - 用户: ${authResult.email}, 用户品牌: ${authResult.brand}`);

    const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });
    const searchParams = request.nextUrl.searchParams;
    const brand = searchParams.get('brand');
    const category = searchParams.get('category');

    console.log(`请求参数 - brand: ${brand}, category: ${category}`);

    // 构建查询 - 不应用品牌过滤，所有用户都可以查看所有项目
    let query = client
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    // 如果指定了品牌，进一步过滤
    if (brand && brand !== 'all') {
      query = query.eq('brand', brand);
      console.log(`过滤品牌: ${brand}`);
    }

    // 项目分类过滤
    if (category && category !== 'all') {
      query = query.eq('category', category);
      console.log(`过滤分类: ${category}`);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('获取项目失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`查询成功，项目数量: ${projects?.length || 0}`);

    if (projects && projects.length > 0) {
      console.log(`第一个项目:`, {
        id: projects[0].id,
        name: projects[0].name,
        brand: projects[0].brand,
        category: projects[0].category,
        created_at: projects[0].created_at,
      });

      // 统计各品牌的项目数量
      const brandCount: Record<string, number> = {};
      projects.forEach(p => {
        brandCount[p.brand] = (brandCount[p.brand] || 0) + 1;
      });
      console.log(`各品牌项目分布:`, brandCount);
    } else {
      console.warn(`⚠️ 未查询到任何项目`);
      // 查询数据库中的总项目数（忽略品牌过滤）
      const { count: totalCount } = await client
        .from('projects')
        .select('*', { count: 'exact', head: true });
      console.log(`数据库总项目数: ${totalCount || 0}`);
    }

    // 获取每个项目的任务
    const projectsWithTasks = await Promise.all(
      (projects || []).map(async (project) => {
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

    const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });
    const body = await request.json();
    const { name, brand, category, salesDate, description } = body;

    // 验证必填项
    if (!name || !salesDate || !brand || !category) {
      return NextResponse.json(
        { error: '项目名称、品牌、分类和销售日期为必填项' },
        { status: 400 }
      );
    }

    // 检查品牌权限：非管理员用户只能创建自己品牌的项目
    console.log(`创建项目 - 名称: ${name}, 品牌: ${brand}, 分类: ${category}`);

    // 计算项目确认日期（销售前3个月）
    const salesDateObj = new Date(salesDate);
    const projectConfirmDateObj = new Date(salesDateObj);
    projectConfirmDateObj.setMonth(projectConfirmDateObj.getMonth() - 3);

    // 创建项目
    console.log(`开始插入项目到数据库...`);
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
      console.error('错误详情:', {
        message: projectError.message,
        code: projectError.code,
        details: projectError.details,
        hint: projectError.hint,
      });
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    if (!project) {
      console.error('项目插入后未返回数据');
      return NextResponse.json({ error: '项目创建失败，未返回数据' }, { status: 500 });
    }

    console.log(`✅ 项目插入成功，ID: ${project.id}, 名称: ${project.name}`);

    // 立即验证项目是否真的在数据库中
    console.log(`验证项目是否存在于数据库...`);
    const { data: verifyProject, error: verifyError } = await client
      .from('projects')
      .select('*')
      .eq('id', project.id)
      .single();

    if (verifyError) {
      console.error(`❌ 验证失败: ${verifyError.message}`);
    } else if (!verifyProject) {
      console.error(`❌ 验证失败: 项目 ${project.id} 不存在于数据库`);
      return NextResponse.json({ error: '项目创建后验证失败' }, { status: 500 });
    } else {
      console.log(`✅ 验证成功，项目存在于数据库`);
      console.log(`验证返回数据:`, verifyProject);
    }

    // 创建各岗位任务（根据项目类型）
    const tasks = await createTasksForProject(
      client, 
      project.id, 
      salesDate, 
      projectConfirmDateObj, 
      category
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

    console.log(`创建项目成功 - 返回数据: brand=${camelProject.brand}, salesDate=${camelProject.salesDate}`);

    return NextResponse.json({ project: camelProject, tasks: camelTasks });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除项目
export async function DELETE(request: NextRequest) {
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '项目ID为必填项' }, { status: 400 });
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
