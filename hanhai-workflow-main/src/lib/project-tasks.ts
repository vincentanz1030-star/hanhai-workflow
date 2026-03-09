// 为项目创建任务（根据项目类型和选择的岗位）
export async function createTasksForProject(
  client: any,
  projectId: string,
  salesDate: string,
  projectConfirmDate: Date,
  category: string,
  selectedRoles?: string[] // 新增：用户选择的岗位列表
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

  // 根据项目分类和用户选择确定要创建的岗位
  let roleKeys: readonly string[];

  // 优先使用用户选择的岗位
  if (selectedRoles && selectedRoles.length > 0) {
    console.log(`✅ 使用用户选择的岗位: ${selectedRoles.join(', ')}`);
    // 验证选择的岗位是否在项目分类对应岗位中
    if (category === 'product_development') {
      roleKeys = selectedRoles.filter(role => productDevelopmentRoles.includes(role as any));
    } else if (category === 'operations_activity') {
      roleKeys = selectedRoles.filter(role => operationsActivityRoles.includes(role as any));
    } else {
      roleKeys = selectedRoles; // 如果没有匹配的分类，使用用户选择的所有岗位
    }
  } else {
    // 如果用户没有选择岗位，根据项目分类创建所有岗位（向后兼容）
    if (category === 'product_development') {
      roleKeys = productDevelopmentRoles;
    } else if (category === 'operations_activity') {
      roleKeys = operationsActivityRoles;
    } else {
      // 默认创建所有岗位（向后兼容）
      roleKeys = allRoles;
    }
  }

  console.log(`实际要创建的岗位: ${roleKeys.join(', ')}`);

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
