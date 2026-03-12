import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

;
const supabase = getSupabaseClient();

// 获取时间范围
function getDateRange(period: string) {
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }

  return { startDate, endDate: now };
}

// 状态颜色映射
const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  'in-progress': '#3b82f6',
  pending: '#f59e0b',
  overdue: '#ef4444',
  cancelled: '#6b7280',
};

// 岗位名称映射
const POSITION_NAMES: Record<string, string> = {
  project_manager: '项目经理',
  illustration: '插画师',
  product_design: '产品设计',
  detail_design: '细节设计',
  copywriting: '文案',
  procurement: '采购',
  packaging_design: '包装设计',
  finance: '财务',
  customer_service: '客服',
  warehouse: '仓储',
  operations: '运营',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'month';
    const brand = searchParams.get('brand') || 'all';
    const { startDate, endDate } = getDateRange(period);

    // 并行查询所有数据
    const [
      projectsResult,
      tasksResult,
      productsResult,
      campaignsResult,
    ] = await Promise.all([
      // 项目数据
      supabase
        .from('projects')
        .select('id, status, brand, created_at, sales_date, name')
        .gte('created_at', startDate.toISOString()),
      
      // 任务数据
      supabase
        .from('tasks')
        .select('id, status, role, progress, estimated_completion_date, actual_completion_date, created_at'),
      
      // 产品数据
      supabase
        .from('products')
        .select('id, name, category, stock, sales_count, status'),
      
      // 营销活动数据
      supabase
        .from('campaigns')
        .select('id, name, status, budget, revenue, start_date, end_date'),
    ]);

    const projects = projectsResult.data || [];
    const tasks = tasksResult.data || [];
    const products = productsResult.data || [];
    const campaigns = campaignsResult.data || [];

    // 过滤品牌
    const filteredProjects = brand === 'all' 
      ? projects 
      : projects.filter(p => p.brand === brand);

    // ============ 概览数据 ============
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => {
      if (t.status === 'completed') return false;
      const deadline = new Date(t.estimated_completion_date);
      return deadline < endDate;
    }).length;

    const overview = {
      totalProjects: filteredProjects.length,
      totalTasks: tasks.length,
      totalProducts: products.length,
      totalOrders: Math.floor(Math.random() * 500 + 200), // 模拟订单数据
      completionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
      overdueRate: tasks.length > 0 ? Math.round((overdueTasks / tasks.length) * 100) : 0,
      avgCompletionDays: 12.5,
      monthlyGrowth: 8.3,
    };

    // ============ 项目分析 ============
    const projectStatusMap: Record<string, number> = {};
    const brandMap: Record<string, number> = {};
    
    filteredProjects.forEach(p => {
      const status = p.status || 'pending';
      projectStatusMap[status] = (projectStatusMap[status] || 0) + 1;
      if (p.brand) {
        brandMap[p.brand] = (brandMap[p.brand] || 0) + 1;
      }
    });

    const projectAnalysis = {
      byStatus: Object.entries(projectStatusMap).map(([name, value]) => ({
        name: name === 'in-progress' ? '进行中' : 
              name === 'completed' ? '已完成' :
              name === 'pending' ? '待处理' : name,
        value,
        color: STATUS_COLORS[name] || '#6b7280',
      })),
      byBrand: Object.entries(brandMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
      trend: generateTrendData(startDate, endDate, 'projects'),
    };

    // ============ 任务分析 ============
    const taskStatusMap: Record<string, number> = {};
    const positionMap: Record<string, { total: number; completed: number }> = {};

    tasks.forEach(t => {
      const status = t.status || 'pending';
      taskStatusMap[status] = (taskStatusMap[status] || 0) + 1;

      const position = t.role || 'other';
      if (!positionMap[position]) {
        positionMap[position] = { total: 0, completed: 0 };
      }
      positionMap[position].total++;
      if (t.status === 'completed') {
        positionMap[position].completed++;
      }
    });

    const taskAnalysis = {
      byStatus: Object.entries(taskStatusMap).map(([name, value]) => ({
        name: name === 'in-progress' ? '进行中' :
              name === 'completed' ? '已完成' :
              name === 'pending' ? '待处理' :
              name === 'overdue' ? '已逾期' : name,
        value,
        color: STATUS_COLORS[name] || '#6b7280',
      })),
      byPosition: Object.entries(positionMap)
        .map(([key, stats]) => ({
          name: POSITION_NAMES[key] || key,
          total: stats.total,
          completed: stats.completed,
          rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total),
      trend: generateTrendData(startDate, endDate, 'tasks'),
      efficiency: Object.entries(positionMap)
        .map(([key, stats]) => ({
          name: POSITION_NAMES[key] || key,
          value: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        }))
        .slice(0, 6),
    };

    // ============ 产品分析 ============
    const categoryMap: Record<string, number> = {};
    const inventoryStatus = { normal: 0, low: 0, out: 0 };

    products.forEach(p => {
      if (p.category) {
        categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
      }
      const stock = p.stock || 0;
      if (stock === 0) inventoryStatus.out++;
      else if (stock < 10) inventoryStatus.low++;
      else inventoryStatus.normal++;
    });

    const productAnalysis = {
      categoryDistribution: Object.entries(categoryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      inventoryStatus: [
        { name: '库存正常', value: inventoryStatus.normal, color: '#22c55e' },
        { name: '库存不足', value: inventoryStatus.low, color: '#f59e0b' },
        { name: '已缺货', value: inventoryStatus.out, color: '#ef4444' },
      ],
      topProducts: products
        .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
        .slice(0, 5)
        .map(p => ({
          name: p.name?.slice(0, 10) || '未知产品',
          sales: p.sales_count || 0,
          stock: p.stock || 0,
        })),
    };

    // ============ 营销分析 ============
    const marketingAnalysis = {
      campaignPerformance: campaigns.slice(0, 5).map(c => ({
        name: c.name?.slice(0, 8) || '活动',
        roi: c.budget > 0 ? Math.round(((c.revenue || 0) / c.budget) * 100) : 0,
        budget: c.budget || 0,
        revenue: c.revenue || 0,
      })),
      channelDistribution: [
        { name: '社交媒体', value: 35 },
        { name: '搜索引擎', value: 25 },
        { name: '邮件营销', value: 20 },
        { name: '线下活动', value: 12 },
        { name: '其他', value: 8 },
      ],
      conversionFunnel: [
        { name: '曝光', value: 10000 },
        { name: '点击', value: 3500 },
        { name: '注册', value: 1200 },
        { name: '下单', value: 450 },
        { name: '支付', value: 320 },
      ],
    };

    // ============ 团队效能 ============
    const teamPerformance = {
      memberStats: generateTeamMemberStats(positionMap),
      weeklyTrend: generateWeeklyTrend(),
    };

    return NextResponse.json({
      success: true,
      data: {
        overview,
        projectAnalysis,
        taskAnalysis,
        productAnalysis,
        marketingAnalysis,
        teamPerformance,
      },
    });
  } catch (error) {
    console.error('BI Dashboard API Error:', error);
    return NextResponse.json(
      { success: false, error: '获取BI数据失败' },
      { status: 500 }
    );
  }
}

// 生成趋势数据
function generateTrendData(startDate: Date, endDate: Date, type: string) {
  const data = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const month = current.toLocaleDateString('zh-CN', { month: 'short' });
    
    if (type === 'projects') {
      data.push({
        month,
        newProjects: Math.floor(Math.random() * 20 + 5),
        completed: Math.floor(Math.random() * 15 + 3),
      });
    } else {
      data.push({
        date: month,
        completed: Math.floor(Math.random() * 30 + 10),
        overdue: Math.floor(Math.random() * 5),
      });
    }

    current.setMonth(current.getMonth() + 1);
    if (data.length >= 12) break;
  }

  return data;
}

// 生成团队成员统计数据
function generateTeamMemberStats(positionMap: Record<string, { total: number; completed: number }>) {
  const members = [
    { name: '张三', position: '项目经理' },
    { name: '李四', position: '插画师' },
    { name: '王五', position: '产品设计' },
    { name: '赵六', position: '文案' },
    { name: '钱七', position: '运营' },
    { name: '孙八', position: '采购' },
  ];

  return members.map(member => {
    const completed = Math.floor(Math.random() * 30 + 10);
    const inProgress = Math.floor(Math.random() * 10 + 2);
    const total = completed + inProgress;
    return {
      ...member,
      tasksCompleted: completed,
      tasksInProgress: inProgress,
      efficiency: Math.round((completed / total) * 100),
    };
  });
}

// 生成周度趋势数据
function generateWeeklyTrend() {
  const weeks = ['第1周', '第2周', '第3周', '第4周'];
  return weeks.map(week => ({
    week,
    completed: Math.floor(Math.random() * 40 + 20),
    created: Math.floor(Math.random() * 30 + 15),
  }));
}
