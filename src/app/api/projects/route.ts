import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取所有项目
export async function GET() {
  try {
    const client = getSupabaseClient();

    // 获取所有项目
    const { data: projects, error } = await client
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取项目失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
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

    return NextResponse.json({ projects: projectsWithTasks });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建新项目
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { name, brand, category, salesDate, description } = body;

    if (!name || !salesDate || !brand || !category) {
      return NextResponse.json(
        { error: '项目名称、品牌、分类和销售日期为必填项' },
        { status: 400 }
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

    return NextResponse.json({ project, tasks });
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
async function createTasksForProject(
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

  // 岗位任务定义
  const roleTasks: Record<string, Array<{ name: string; description: string; order: number }>> = {
    illustration: [
      { name: '需求分析与风格确定', description: '分析产品需求，确定插画风格和表现方式', order: 1 },
      { name: '草图绘制与构思', description: '绘制初步草图，确定构图和元素', order: 2 },
      { name: '线稿绘制', description: '完成详细的线稿设计', order: 3 },
      { name: '上色与细节完善', description: '进行上色处理，完善细节和光影效果', order: 4 },
      { name: '最终调整与交付', description: '根据反馈进行调整，完成最终版本交付', order: 5 },
    ],
    product_design: [
      { name: '市场调研与竞品分析', description: '调研市场需求，分析竞品特点', order: 1 },
      { name: '产品概念设计与草图', description: '进行产品概念设计，绘制草图', order: 2 },
      { name: '3D建模与效果图', description: '完成3D建模和效果图制作', order: 3 },
      { name: '样品制作与测试', description: '制作样品并进行功能测试', order: 4 },
      { name: '最终确认与量产准备', description: '确认设计方案，准备量产', order: 5 },
    ],
    detail_design: [
      { name: '详情页架构规划', description: '规划详情页整体结构和内容布局', order: 1 },
      { name: '主视觉设计', description: '设计主视觉Banner和关键展示图', order: 2 },
      { name: '细节展示设计', description: '设计产品细节展示和功能说明', order: 3 },
      { name: '交互与动效制作', description: '制作交互效果和动画展示', order: 4 },
      { name: '适配与最终交付', description: '进行多端适配，完成最终交付', order: 5 },
    ],
    copywriting: [
      { name: '文案策略制定', description: '制定文案风格和传播策略', order: 1 },
      { name: '卖点提炼', description: '提炼产品核心卖点和优势', order: 2 },
      { name: '详情文案撰写', description: '撰写详情页介绍和产品说明', order: 3 },
      { name: '宣传文案创作', description: '创作宣传推广文案', order: 4 },
      { name: '文案优化与定稿', description: '根据反馈优化，完成最终文案', order: 5 },
    ],
    procurement: [
      { name: '需求分析与供应商筛选', description: '分析采购需求，筛选合适供应商', order: 1 },
      { name: '询价与比价', description: '进行询价和价格对比', order: 2 },
      { name: '合同签订', description: '签订采购合同', order: 3 },
      { name: '样品测试与确认', description: '接收样品进行测试和质量确认', order: 4 },
      { name: '批量采购与入库', description: '完成批量采购和产品入库', order: 5 },
    ],
    packaging_design: [
      { name: '包装风格与材质确定', description: '确定包装设计风格和材质选择', order: 1 },
      { name: '包装结构设计', description: '设计包装结构和尺寸规格', order: 2 },
      { name: '包装视觉设计', description: '完成包装平面视觉设计', order: 3 },
      { name: '打样与效果确认', description: '制作包装打样，确认最终效果', order: 4 },
      { name: '生产文件交付', description: '输出生产文件，准备批量生产', order: 5 },
    ],
    finance: [
      { name: '预算编制与审批', description: '制定项目预算，完成审批流程', order: 1 },
      { name: '款项支付审核', description: '审核各项款项支付的合规性', order: 2 },
      { name: '供应商付款执行', description: '及时支付供应商款项，避免影响出货', order: 3 },
      { name: '费用核算与记账', description: '核算项目费用，完成记账工作', order: 4 },
      { name: '财务报表与总结', description: '编制财务报表，总结项目成本', order: 5 },
    ],
    customer_service: [
      { name: '产品知识培训', description: '培训客服人员产品知识和特点', order: 1 },
      { name: '销售流程培训', description: '培训销售流程和订单处理流程', order: 2 },
      { name: '话术与沟通技巧', description: '培训客服话术和客户沟通技巧', order: 3 },
      { name: '常见问题应对', description: '准备常见问题解答和应对方案', order: 4 },
      { name: '模拟演练与考核', description: '进行模拟销售演练，通过考核上岗', order: 5 },
    ],
    warehouse: [
      { name: '仓储规划与布局', description: '规划仓储空间，确定货物存放位置', order: 1 },
      { name: '库存盘点与清点', description: '盘点现有库存，清点货物数量', order: 2 },
      { name: '货物整理与分类', description: '整理货物，进行分类标记', order: 3 },
      { name: '入库准备与系统录入', description: '准备入库流程，完成系统数据录入', order: 4 },
      { name: '出库流程测试', description: '测试出库流程，确保销售前准备就绪', order: 5 },
    ],
    operations: [
      { name: '运营策略制定', description: '制定活动运营策略和执行计划', order: 1 },
      { name: '资源协调与准备', description: '协调各方资源，做好活动准备', order: 2 },
      { name: '活动执行监控', description: '实时监控活动执行情况', order: 3 },
      { name: '数据分析与优化', description: '分析活动数据，持续优化', order: 4 },
      { name: '效果评估与总结', description: '评估活动效果，完成总结报告', order: 5 },
    ],
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
    const taskList = roleTasks[role];

    // 根据岗位类型确定开始时间
    let startDate: Date;
    let taskIntervalDays: number; // 任务间隔天数

    if (role === 'illustration' || role === 'product_design') {
      // 插画设计和产品设计：项目确认后开始
      startDate = new Date(projectConfirmDate);
      taskIntervalDays = 7; // 每周一个任务
    } else if (role === 'packaging_design') {
      // 包装设计：产品确认后两周内完成
      startDate = new Date(projectConfirmDate);
      taskIntervalDays = 3; // 2周内完成5个任务，每个任务间隔3天
    } else if (role === 'operations') {
      // 运营团队：贯穿整个项目，配合其他团队
      startDate = new Date(projectConfirmDate);
      taskIntervalDays = 10; // 每10天一个关键节点
    } else if (role === 'finance') {
      // 财务：贯穿整个项目，需要及时付款
      startDate = new Date(projectConfirmDate);
      taskIntervalDays = 14; // 付款节点可能间隔较长
    } else if (role === 'customer_service' || role === 'warehouse') {
      // 客服培训和仓储：销售前完成
      startDate = new Date(salesBefore3Days);
      taskIntervalDays = 5; // 销售前快速完成
    } else {
      // 详情设计、文案、采购：销售前3天开始
      startDate = new Date(salesBefore3Days);
      taskIntervalDays = 7;
    }

    for (const task of taskList) {
      // 计算预计完成时间
      const estimatedDate = new Date(startDate);
      estimatedDate.setDate(estimatedDate.getDate() + (task.order - 1) * taskIntervalDays);

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
  }

  return tasks;
}
