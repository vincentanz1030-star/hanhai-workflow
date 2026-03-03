import { Project, Task } from './project-types';
import { ProjectWarning, AISuggestion, AIAnalysisResult } from './types';

/**
 * 本地规则引擎 - 分析项目状态
 * 即使没有配置Coze API，也能提供基础的预警和建议
 */
export function analyzeProjectLocally(project: Project, tasks: Task[] = []): AIAnalysisResult {
  const warnings: ProjectWarning[] = [];
  const suggestions: AISuggestion[] = [];
  const insights: string[] = [];
  const now = new Date();

  // 获取项目任务（如果没有传入）
  const projectTasks = tasks.length > 0 ? tasks : (project.tasks || []);

  // 1. 检查任务超期
  const overdueTasks = projectTasks.filter(t => {
    if (!t.estimatedCompletionDate) return false;
    const dueDate = new Date(t.estimatedCompletionDate);
    return dueDate < now && t.status !== 'completed';
  });

  if (overdueTasks.length > 0) {
    overdueTasks.forEach(task => {
      warnings.push({
        type: 'task_overdue',
        severity: 'error',
        projectId: project.id,
        projectName: project.name,
        taskId: task.id,
        taskName: task.taskName,
        message: `任务 "${task.taskName}" 已超期（截止日期：${task.estimatedCompletionDate}）`,
        suggestion: `建议立即联系 ${task.role} 岗位负责人，了解延期原因并协助解决问题。`,
        createdAt: now.toISOString(),
        dismissed: false,
      });
    });
  }

  // 2. 检查即将到期的任务（3天内）
  const upcomingTasks = projectTasks.filter(t => {
    if (!t.estimatedCompletionDate || t.status === 'completed') return false;
    const dueDate = new Date(t.estimatedCompletionDate);
    const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 0 && daysDiff <= 3;
  });

  upcomingTasks.forEach(task => {
    warnings.push({
      type: 'task_overdue',
      severity: 'warning',
      projectId: project.id,
      projectName: project.name,
      taskId: task.id,
      taskName: task.taskName,
      message: `任务 "${task.taskName}" 即将到期（截止日期：${task.estimatedCompletionDate}）`,
      suggestion: `建议提醒 ${task.role} 岗位注意截止日期，必要时提供支持。`,
      createdAt: now.toISOString(),
      dismissed: false,
    });
  });

  // 3. 检查项目整体进度
  const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
  const totalTasks = projectTasks.length;
  const overallProgress = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;

  // 检查销售日期
  if (project.salesDate) {
    const salesDate = new Date(project.salesDate);
    const daysToSales = Math.ceil((salesDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // 如果销售日期临近（7天内）但进度较低
    if (daysToSales <= 7 && daysToSales > 0 && overallProgress < 50) {
      warnings.push({
        type: 'project_delayed',
        severity: 'critical',
        projectId: project.id,
        projectName: project.name,
        message: `项目 "${project.name}" 销售日期临近（${daysToSales}天后），但整体进度仅 ${overallProgress}%`,
        suggestion: `建议立即召开项目会议，协调资源加快进度，必要时调整任务优先级。`,
        createdAt: now.toISOString(),
        dismissed: false,
      });
    }
  }

  // 4. 检查催促次数过多的任务
  const frequentlyRemindedTasks = projectTasks.filter(t => (t.reminderCount || 0) >= 3);
  if (frequentlyRemindedTasks.length > 0) {
    frequentlyRemindedTasks.forEach(task => {
      warnings.push({
        type: 'task_overdue',
        severity: 'critical',
        projectId: project.id,
        projectName: project.name,
        taskId: task.id,
        taskName: task.taskName,
        message: `任务 "${task.taskName}" 已被催促 ${task.reminderCount} 次，可能存在严重问题`,
        suggestion: `建议与 ${task.role} 岗位负责人深入沟通，了解实际困难，考虑调整任务或增加资源。`,
        createdAt: now.toISOString(),
        dismissed: false,
      });
    });
  }

  // 5. 检查资源冲突（同一岗位未完成任务过多）
  const roleTaskCount: Record<string, Task[]> = {};
  projectTasks.forEach(t => {
    if (!roleTaskCount[t.role]) {
      roleTaskCount[t.role] = [];
    }
    if (t.status !== 'completed') {
      roleTaskCount[t.role].push(t);
    }
  });

  Object.entries(roleTaskCount).forEach(([role, tasks]) => {
    if (tasks.length >= 3) {
      warnings.push({
        type: 'resource_conflict',
        severity: 'warning',
        projectId: project.id,
        projectName: project.name,
        message: `${role} 岗位有 ${tasks.length} 个未完成任务，可能存在资源冲突`,
        suggestion: `建议评估 ${role} 岗位的任务负荷，考虑重新分配或优先级排序。`,
        createdAt: now.toISOString(),
        dismissed: false,
      });
    }
  });

  // 6. 生成优化建议
  if (overdueTasks.length > 0) {
    suggestions.push({
      type: 'optimization',
      priority: 'high',
      projectId: project.id,
      projectName: project.name,
      message: '存在多个超期任务，建议立即召开紧急协调会',
      actionable: true,
      actionLabel: '查看超期任务',
      actionData: { filter: 'overdue' },
      createdAt: now.toISOString(),
      viewed: false,
    });
  }

  if (projectTasks.length > 0 && overallProgress < 30 && completedTasks > 0) {
    suggestions.push({
      type: 'optimization',
      priority: 'medium',
      projectId: project.id,
      projectName: project.name,
      message: '项目启动较慢，建议加强任务跟踪和沟通频率',
      actionable: true,
      actionLabel: '查看所有任务',
      actionData: { filter: 'all' },
      createdAt: now.toISOString(),
      viewed: false,
    });
  }

  // 7. 生成洞察
  if (completedTasks === totalTasks && totalTasks > 0) {
    insights.push('🎉 所有任务已完成，项目进展顺利！');
  } else if (overallProgress > 70) {
    insights.push('✅ 项目接近完成，建议开始准备交付和验收工作。');
  } else if (overallProgress > 30) {
    insights.push('📊 项目正在进行中，保持关注关键路径任务的进度。');
  } else {
    insights.push('🚀 项目启动阶段，建议确保各项任务有序推进。');
  }

  // 8. 生成下一步行动
  const nextSteps: string[] = [];

  if (overdueTasks.length > 0) {
    nextSteps.push(`优先处理 ${overdueTasks.length} 个超期任务`);
  }

  if (upcomingTasks.length > 0) {
    nextSteps.push(`跟进 ${upcomingTasks.length} 个即将到期任务`);
  }

  if (frequentlyRemindedTasks.length > 0) {
    nextSteps.push(`与被频繁催促的岗位负责人沟通（${frequentlyRemindedTasks.length} 个任务）`);
  }

  if (completedTasks === totalTasks && totalTasks > 0) {
    nextSteps.push('准备项目验收和总结');
  } else if (overallProgress > 80) {
    nextSteps.push('检查剩余任务的完成质量');
    nextSteps.push('准备项目交付材料');
  } else {
    nextSteps.push('定期检查任务进度（建议每周至少一次）');
  }

  // 9. 评估整体状态
  let overallStatus: 'healthy' | 'attention' | 'critical';
  const criticalWarnings = warnings.filter(w => w.severity === 'critical').length;
  const errorWarnings = warnings.filter(w => w.severity === 'error').length;

  if (criticalWarnings > 0 || errorWarnings > 2) {
    overallStatus = 'critical';
  } else if (warnings.length > 0) {
    overallStatus = 'attention';
  } else {
    overallStatus = 'healthy';
  }

  return {
    overallStatus,
    warnings,
    suggestions,
    insights,
    nextSteps,
  };
}

/**
 * 批量分析多个项目
 */
export function analyzeMultipleProjectsLocally(projects: Project[]): {
  overallStatus: string;
  criticalProjects: string[];
  warningProjects: string[];
  suggestions: string[];
} {
  const criticalProjects: string[] = [];
  const warningProjects: string[] = [];
  const suggestions: string[] = [];

  projects.forEach(project => {
    const analysis = analyzeProjectLocally(project);

    if (analysis.overallStatus === 'critical') {
      criticalProjects.push(project.name);
    } else if (analysis.overallStatus === 'attention') {
      warningProjects.push(project.name);
    }
  });

  if (criticalProjects.length > 0) {
    suggestions.push(`⚠️ 优先关注 ${criticalProjects.length} 个高风险项目：${criticalProjects.join('、')}`);
  }

  if (warningProjects.length > 0) {
    suggestions.push(`📋 定期检查 ${warningProjects.length} 个需关注项目：${warningProjects.join('、')}`);
  }

  return {
    overallStatus: criticalProjects.length > 0 ? 'critical' : (warningProjects.length > 0 ? 'attention' : 'healthy'),
    criticalProjects,
    warningProjects,
    suggestions,
  };
}
