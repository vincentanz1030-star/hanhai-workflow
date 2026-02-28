import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth, applyBrandFilter } from '@/lib/api-auth';

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
export async function GET(request: NextRequest) {
  try {
    // 认证和权限检查
    const authResult = await requireAuth(request, 'project', 'view');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    console.log(`GET /api/projects - 用户: ${authResult.email}, 用户品牌: ${authResult.brand}`);

    const client = getSupabaseClient();
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
      console.log(`第一个项目:`, projects[0]);
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

    const client = getSupabaseClient();
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
    const client = getSupabaseClient();
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


// 为项目创建任务（根据项目类型）
export async function createTasksForProject(
  client: any,
  projectId: string,
  salesDate: string,
  projectConfirmDate: Date,
  category: string
) {
  // 计算关键时间点
  const salesDateObj = new Date(salesDate);
  const salesBefore3Days = new Date(salesDateObj);
  salesBefore3Days.setDate(salesBefore3Days.getDate() - 3);

  // 岗位任务定义 - 每个岗位一个综合性任务
  const roleTasks: Record<string, { name: string; description: string; order: number }> = {
    illustration: {
      name: '插画设计',
      description: '完成需求分析、风格确定、草图绘制、线稿设计、上色与细节完善以及最终调整交付',
      order: 1
    },
    product_design: {
      name: '产品设计',
      description: '完成市场调研与竞品分析、产品概念设计与草图、3D建模与效果图制作、样品制作与测试以及最终确认与量产准备',
      order: 1
    },
    detail_design: {
      name: '详情设计',
      description: '完成详情页架构规划、主视觉设计、细节展示设计、交互与动效制作以及多端适配与最终交付',
      order: 1
    },
    copywriting: {
      name: '文案撰写',
      description: '完成文案策略制定、卖点提炼、详情文案撰写、宣传文案创作以及文案优化与定稿',
      order: 1
    },
    procurement: {
      name: '采购管理',
      description: '完成需求分析与供应商筛选、询价与比价、合同签订、样品测试与确认以及批量采购与入库',
      order: 1
    },
    packaging_design: {
      name: '包装设计',
      description: '完成包装风格与材质确定、包装结构设计、包装视觉设计、打样与效果确认以及生产文件交付',
      order: 1
    },
    finance: {
      name: '财务管理',
      description: '完成预算编制与审批、款项支付审核、供应商付款执行、费用核算与记账以及财务报表与总结',
      order: 1
    },
    customer_service: {
      name: '客服培训',
      description: '完成产品知识培训、销售流程培训、话术与沟通技巧培训、常见问题应对准备以及模拟演练与考核',
      order: 1
    },
    warehouse: {
      name: '仓储管理',
      description: '完成仓储规划与布局、库存盘点与清点、货物整理与分类、入库准备与系统录入以及出库流程测试',
      order: 1
    },
    operations: {
      name: '运营管理',
      description: '完成运营策略制定、资源协调与准备、活动执行监控、数据分析与优化以及效果评估与总结',
      order: 1
    },
  };

  const tasks = [];
  
  // 根据项目类型确定需要创建的岗位
  const allRoles = ['illustration', 'product_design', 'detail_design', 'copywriting', 'procurement', 'packaging_design', 'finance', 'customer_service', 'warehouse', 'operations'] as const;
  
  // 产品开发项目包含的岗位
  const productDevelopmentRoles = ['illustration', 'product_design', 'packaging_design', 'procurement', 'finance', 'warehouse'] as const;
  
  // 运营活动项目包含的岗位
  const operationsActivityRoles = ['copywriting', 'detail_design', 'operations', 'customer_service'] as const;
  
  // 根据项目分类确定要创建的岗位
  let roleKeys: readonly string[];
  if (category === 'product_development') {
    roleKeys = productDevelopmentRoles;
  } else if (category === 'operations_activity') {
    roleKeys = operationsActivityRoles;
  } else {
    // 默认创建所有岗位（向后兼容）
    roleKeys = allRoles;
  }

  for (const role of roleKeys) {
    const task = roleTasks[role];

    if (!task) continue;

    // 根据岗位类型确定预计完成时间
    let estimatedDate: Date;

    if (role === 'illustration' || role === 'product_design') {
      // 插画设计和产品设计：项目确认后2周内完成
      estimatedDate = new Date(projectConfirmDate);
      estimatedDate.setDate(estimatedDate.getDate() + 14);
    } else if (role === 'packaging_design') {
      // 包装设计：产品确认后1个月内完成
      estimatedDate = new Date(projectConfirmDate);
      estimatedDate.setDate(estimatedDate.getDate() + 30);
    } else if (role === 'operations') {
      // 运营团队：销售前1周完成
      estimatedDate = new Date(salesBefore3Days);
      estimatedDate.setDate(estimatedDate.getDate() + 7);
    } else if (role === 'finance') {
      // 财务：贯穿整个项目，销售前完成
      estimatedDate = new Date(salesBefore3Days);
    } else if (role === 'customer_service' || role === 'warehouse') {
      // 客服培训和仓储：销售前3天完成
      estimatedDate = new Date(salesBefore3Days);
    } else {
      // 详情设计、文案、采购：销售前1周完成
      estimatedDate = new Date(salesBefore3Days);
      estimatedDate.setDate(estimatedDate.getDate() + 7);
    }

    const { data, error } = await client
      .from('tasks')
      .insert({
        project_id: projectId,
        role,
        task_name: task.name,
        task_order: task.order,
        description: task.description,
        progress: 0,
        estimated_completion_date: estimatedDate.toISOString(),
        status: 'pending',
        reminder_count: 0,
      })
      .select()
      .single();

    if (!error && data) {
      tasks.push(data);
    }
  }

  return tasks;
}
