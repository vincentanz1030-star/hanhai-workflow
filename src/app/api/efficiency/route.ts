import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// 直接从环境变量获取 Supabase 配置
interface EfficiencyMetric {
  metric: string;
  value: number;
  change: number; // 与上期相比的变化百分比
  trend: 'up' | 'down' | 'stable';
  description: string;
}

interface BottleneckAnalysis {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  count: number;
  impact: string;
  recommendations: string[];
}

interface WorkflowEfficiency {
  phase: string;
  averageDuration: number; // 天数
  completionRate: number;
  efficiencyScore: number;
  issues: string[];
}

interface EfficiencyReport {
  period: {
    start: string;
    end: string;
  };
  overallEfficiency: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D';
    change: number;
  };
  metrics: EfficiencyMetric[];
  bottlenecks: BottleneckAnalysis[];
  workflowEfficiency: WorkflowEfficiency[];
  insights: string[];
  recommendations: string[];
}

// 获取效率分析报告
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'monthly'; // weekly, monthly, quarterly

    const client = getSupabaseClient();

    // 计算时间范围
    const today = new Date();
    let startDate: Date;
    let endDate: Date = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    // 计算上期时间范围（用于对比）
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (type) {
      case 'weekly':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        startDate.setHours(0, 0, 0, 0);

        previousEndDate = new Date(startDate);
        previousEndDate.setDate(startDate.getDate() - 1);

        previousStartDate = new Date(previousEndDate);
        previousStartDate.setDate(previousEndDate.getDate() - 6);
        previousStartDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);

        previousEndDate = new Date(startDate);
        previousEndDate.setDate(startDate.getDate() - 1);

        previousStartDate = new Date(previousEndDate.getFullYear(), previousEndDate.getMonth(), 1);
        break;
      case 'quarterly':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);

        previousEndDate = new Date(startDate);
        previousEndDate.setDate(startDate.getDate() - 1);

        const previousQuarter = Math.floor(previousEndDate.getMonth() / 3);
        previousStartDate = new Date(previousEndDate.getFullYear(), previousQuarter * 3, 1);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        previousEndDate = new Date(startDate);
        previousEndDate.setDate(startDate.getDate() - 1);
        previousStartDate = new Date(previousEndDate.getFullYear(), previousEndDate.getMonth(), 1);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    const previousStartDateStr = previousStartDate.toISOString().split('T')[0];
    const previousEndDateStr = previousEndDate.toISOString().split('T')[0];

    // 获取本期数据
    const { data: currentTasks } = await client
      .from('tasks')
      .select('*')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);

    const { data: currentProjects } = await client
      .from('projects')
      .select('*')
      .gte('created_at', startDateStr)
      .lte('created_at', endDateStr);

    // 获取上期数据
    const { data: previousTasks } = await client
      .from('tasks')
      .select('*')
      .gte('created_at', previousStartDateStr)
      .lte('created_at', previousEndDateStr);

    // 计算本期指标
    const totalTasks = currentTasks?.length || 0;
    const completedTasks = currentTasks?.filter(t => t.status === 'completed').length || 0;
    const overdueTasks = currentTasks?.filter(t => {
      if (!t.estimated_completion_date || t.status === 'completed') return false;
      return new Date(t.estimated_completion_date) < new Date();
    }).length || 0;

    // 计算上期指标
    const previousTotalTasks = previousTasks?.length || 0;
    const previousCompletedTasks = previousTasks?.filter(t => t.status === 'completed').length || 0;
    const previousOverdueTasks = previousTasks?.filter(t => {
      if (!t.estimated_completion_date || t.status === 'completed') return false;
      return new Date(t.estimated_completion_date) < new Date();
    }).length || 0;

    // 计算平均完成时间
    let currentCompletionTime = 0;
    let currentCompletedWithTime = 0;
    currentTasks?.filter(t => t.status === 'completed' && t.created_at && t.actual_completion_date).forEach(task => {
      const created = new Date(task.created_at);
      const completed = new Date(task.actual_completion_date);
      currentCompletionTime += (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      currentCompletedWithTime++;
    });
    const averageCompletionTime = currentCompletedWithTime > 0 ? Math.round(currentCompletionTime / currentCompletedWithTime) : 0;

    let previousCompletionTime = 0;
    let previousCompletedWithTime = 0;
    previousTasks?.filter(t => t.status === 'completed' && t.created_at && t.actual_completion_date).forEach(task => {
      const created = new Date(task.created_at);
      const completed = new Date(task.actual_completion_date);
      previousCompletionTime += (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      previousCompletedWithTime++;
    });
    const previousAverageCompletionTime = previousCompletedWithTime > 0 ? Math.round(previousCompletionTime / previousCompletedWithTime) : 0;

    // 计算效率指标
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const previousCompletionRate = previousTotalTasks > 0 ? Math.round((previousCompletedTasks / previousTotalTasks) * 100) : 0;

    const overdueRate = totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0;
    const previousOverdueRate = previousTotalTasks > 0 ? Math.round((previousOverdueTasks / previousTotalTasks) * 100) : 0;

    // 计算整体效率评分 (0-100)
    const efficiencyScore = Math.round(
      (completionRate * 0.4) +
      ((100 - overdueRate) * 0.3) +
      (Math.max(0, 100 - averageCompletionTime * 5) * 0.3)
    );

    // 计算上期效率评分
    const previousEfficiencyScore = Math.round(
      (previousCompletionRate * 0.4) +
      ((100 - previousOverdueRate) * 0.3) +
      (Math.max(0, 100 - previousAverageCompletionTime * 5) * 0.3)
    );

    // 计算变化
    const change = efficiencyScore - previousEfficiencyScore;

    // 确定等级
    let grade: 'A' | 'B' | 'C' | 'D' = 'D';
    if (efficiencyScore >= 90) grade = 'A';
    else if (efficiencyScore >= 75) grade = 'B';
    else if (efficiencyScore >= 60) grade = 'C';

    // 构建指标列表
    const metrics: EfficiencyMetric[] = [
      {
        metric: '任务完成率',
        value: completionRate,
        change: completionRate - previousCompletionRate,
        trend: completionRate > previousCompletionRate ? 'up' : completionRate < previousCompletionRate ? 'down' : 'stable',
        description: '已完成任务占总任务的比例',
      },
      {
        metric: '逾期率',
        value: overdueRate,
        change: overdueRate - previousOverdueRate,
        trend: overdueRate < previousOverdueRate ? 'up' : overdueRate > previousOverdueRate ? 'down' : 'stable',
        description: '逾期任务占总任务的比例（越低越好）',
      },
      {
        metric: '平均完成时间',
        value: averageCompletionTime,
        change: averageCompletionTime - previousAverageCompletionTime,
        trend: averageCompletionTime < previousAverageCompletionTime ? 'up' : averageCompletionTime > previousAverageCompletionTime ? 'down' : 'stable',
        description: '任务从创建到完成的平均天数（越少越好）',
      },
      {
        metric: '整体效率',
        value: efficiencyScore,
        change: change,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
        description: '综合效率评分',
      },
    ];

    // 识别瓶颈
    const bottlenecks: BottleneckAnalysis[] = [];

    if (overdueRate > 20) {
      bottlenecks.push({
        category: '任务逾期',
        severity: overdueRate > 40 ? 'critical' : 'high',
        count: overdueTasks,
        impact: '严重拖慢项目整体进度',
        recommendations: [
          '优化任务分配，避免单人承担过多任务',
          '加强任务时间预估的准确性',
          '建立提前预警机制',
        ],
      });
    }

    if (averageCompletionTime > 10) {
      bottlenecks.push({
        category: '任务周期过长',
        severity: averageCompletionTime > 20 ? 'high' : 'medium',
        count: totalTasks,
        impact: '影响项目按时交付',
        recommendations: [
          '分析耗时较长的任务，找出可优化环节',
          '考虑并行处理部分任务',
          '提供更多资源支持',
        ],
      });
    }

    if (completionRate < 70) {
      bottlenecks.push({
        category: '完成率偏低',
        severity: completionRate < 50 ? 'high' : 'medium',
        count: totalTasks - completedTasks,
        impact: '大量任务积压，影响工作效率',
        recommendations: [
          '检查未完成任务的阻塞原因',
          '优化工作流程，减少不必要的等待',
          '加强团队协作和支持',
        ],
      });
    }

    // 分析各岗位效率
    const workflowEfficiency: WorkflowEfficiency[] = [];
    const roleList = ['illustration', 'product_design', 'detail_design', 'copywriting',
                      'procurement', 'packaging_design', 'finance', 'customer_service',
                      'warehouse', 'operations'];

    roleList.forEach(role => {
      const roleTasks = currentTasks?.filter(t => t.role === role) || [];
      const roleCompletedTasks = roleTasks.filter(t => t.status === 'completed');
      const roleOverdueTasks = roleTasks.filter(t => {
        if (!t.estimated_completion_date || t.status === 'completed') return false;
        return new Date(t.estimated_completion_date) < new Date();
      });

      let roleCompletionTime = 0;
      let roleCompletedWithTime = 0;
      roleCompletedTasks.forEach(task => {
        if (task.created_at && task.actual_completion_date) {
          const created = new Date(task.created_at);
          const completed = new Date(task.actual_completion_date);
          roleCompletionTime += (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          roleCompletedWithTime++;
        }
      });

      const averageDuration = roleCompletedWithTime > 0 ? Math.round(roleCompletionTime / roleCompletedWithTime) : 0;
      const completionRate = roleTasks.length > 0 ? Math.round((roleCompletedTasks.length / roleTasks.length) * 100) : 0;
      const efficiencyScore = Math.round(
        (completionRate * 0.5) +
        (Math.max(0, 100 - averageDuration * 5) * 0.5)
      );

      const issues: string[] = [];
      if (completionRate < 70) issues.push(`完成率仅${completionRate}%`);
      if (roleOverdueTasks.length > roleTasks.length * 0.1) issues.push(`逾期任务占比高`);
      if (averageDuration > 10) issues.push(`平均完成时间过长(${averageDuration}天)`);

      workflowEfficiency.push({
        phase: role,
        averageDuration,
        completionRate,
        efficiencyScore,
        issues,
      });
    });

    // 生成洞察
    const insights: string[] = [];
    if (completionRate > 80) {
      insights.push('整体任务完成率较高，团队协作效率良好');
    }
    if (overdueRate < 10) {
      insights.push('逾期控制良好，时间管理到位');
    }
    if (averageCompletionTime < 5) {
      insights.push('任务完成速度快，流程优化有效');
    }
    if (change > 10) {
      insights.push('效率较上期有明显提升');
    }

    // 生成建议
    const recommendations: string[] = [];
    if (overdueRate > 10) {
      recommendations.push('建立任务逾期预警机制，提前提醒');
    }
    if (averageCompletionTime > 7) {
      recommendations.push('分析耗时较长的任务，找出可优化环节');
    }
    if (efficiencyScore < 70) {
      recommendations.push('整体效率有待提升，建议审查工作流程');
    }
    if (change < -5) {
      recommendations.push('效率较上期下降，需要重点关注问题原因');
    }

    const report: EfficiencyReport = {
      period: {
        start: startDateStr,
        end: endDateStr,
      },
      overallEfficiency: {
        score: efficiencyScore,
        grade,
        change,
      },
      metrics,
      bottlenecks,
      workflowEfficiency,
      insights,
      recommendations,
    };

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('获取效率分析失败:', error);
    return NextResponse.json({ error: '获取效率分析失败' }, { status: 500 });
  }
}
