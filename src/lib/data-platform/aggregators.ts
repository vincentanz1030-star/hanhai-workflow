/**
 * 数据中台 - 数据聚合器
 * 提供常见的数据聚合场景
 */

import { getDataPlatform } from './core';

/**
 * 项目统计聚合器
 */
export async function aggregateProjectStats() {
  const dataPlatform = getDataPlatform();

  const result = await dataPlatform.aggregateData(
    ['projects', 'tasks', 'users'],
    (dataMap) => {
      const projects = dataMap.get('projects?')?.projects || [];
      const tasks = dataMap.get('tasks?')?.tasks || [];
      const users = dataMap.get('users?')?.users || [];

      // 计算项目统计
      const projectStats = {
        total: projects.length,
        pending: projects.filter((p: any) => p.status === 'pending').length,
        inProgress: projects.filter((p: any) => p.status === 'in_progress').length,
        completed: projects.filter((p: any) => p.status === 'completed').length,
        delayed: projects.filter((p: any) => p.status === 'delayed').length,
      };

      // 计算任务统计
      const taskStats = {
        total: tasks.length,
        pending: tasks.filter((t: any) => t.progress === 0).length,
        inProgress: tasks.filter((t: any) => t.progress > 0 && t.progress < 100).length,
        completed: tasks.filter((t: any) => t.progress === 100).length,
        averageProgress: tasks.length > 0
          ? tasks.reduce((sum: number, t: any) => sum + t.progress, 0) / tasks.length
          : 0,
      };

      // 按品牌统计
      const brandStats = projects.reduce((acc: any, project: any) => {
        const brand = project.brand || 'unknown';
        if (!acc[brand]) {
          acc[brand] = {
            total: 0,
            completed: 0,
            inProgress: 0,
            delayed: 0,
          };
        }
        acc[brand].total++;
        if (project.status === 'completed') acc[brand].completed++;
        if (project.status === 'in_progress') acc[brand].inProgress++;
        if (project.status === 'delayed') acc[brand].delayed++;
        return acc;
      }, {});

      return {
        projectStats,
        taskStats,
        brandStats,
        userCount: users.length,
        timestamp: new Date().toISOString(),
      };
    }
  );

  return result;
}

/**
 * 工作负载聚合器
 */
export async function aggregateWorkload() {
  const dataPlatform = getDataPlatform();

  const result = await dataPlatform.aggregateData(
    ['tasks', 'workload'],
    (dataMap) => {
      const tasks = dataMap.get('tasks?')?.tasks || [];
      const workloadData = dataMap.get('workload?')?.data || [];

      // 按岗位统计工作负载
      const roleWorkload = tasks.reduce((acc: any, task: any) => {
        const role = task.role || 'unknown';
        if (!acc[role]) {
          acc[role] = {
            total: 0,
            completed: 0,
            inProgress: 0,
            pending: 0,
            averageProgress: 0,
          };
        }
        acc[role].total++;
        if (task.progress === 100) acc[role].completed++;
        else if (task.progress > 0) acc[role].inProgress++;
        else acc[role].pending++;
        acc[role].averageProgress += task.progress;
        return acc;
      }, {});

      // 计算平均进度
      Object.values(roleWorkload).forEach((role: any) => {
        if (role.total > 0) {
          role.averageProgress = Math.round(role.averageProgress / role.total);
        }
      });

      return {
        roleWorkload,
        workloadData,
        timestamp: new Date().toISOString(),
      };
    }
  );

  return result;
}

/**
 * 仪表盘数据聚合器
 */
export async function aggregateDashboardData() {
  const dataPlatform = getDataPlatform();

  const result = await dataPlatform.aggregateData(
    ['projects', 'tasks', 'notifications', 'collaborations'],
    (dataMap) => {
      const projects = dataMap.get('projects?')?.projects || [];
      const tasks = dataMap.get('tasks?')?.tasks || [];
      const notifications = dataMap.get('notifications?')?.notifications || [];
      const collaborations = dataMap.get('collaborations?')?.tasks || [];

      // 紧急任务
      const urgentTasks = tasks.filter((t: any) => {
        const dueDate = new Date(t.estimatedCompletionDate);
        const today = new Date();
        const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 3 && t.progress < 100;
      });

      // 延期任务
      const delayedTasks = tasks.filter((t: any) => {
        const dueDate = new Date(t.estimatedCompletionDate);
        const today = new Date();
        return dueDate < today && t.progress < 100;
      });

      // 待处理协同请求
      const pendingCollaborations = collaborations.filter((c: any) => c.status === 'pending');

      // 未读通知
      const unreadNotifications = notifications.filter((n: any) => !n.read);

      return {
        projects: {
          total: projects.length,
          inProgress: projects.filter((p: any) => p.status === 'in_progress').length,
          delayed: projects.filter((p: any) => p.status === 'delayed').length,
        },
        tasks: {
          total: tasks.length,
          completed: tasks.filter((t: any) => t.progress === 100).length,
          urgent: urgentTasks.length,
          delayed: delayedTasks.length,
        },
        notifications: {
          unread: unreadNotifications.length,
          total: notifications.length,
        },
        collaborations: {
          pending: pendingCollaborations.length,
          total: collaborations.length,
        },
        timestamp: new Date().toISOString(),
      };
    }
  );

  return result;
}

/**
 * 项目详情聚合器
 */
export async function aggregateProjectDetail(projectId: string) {
  const dataPlatform = getDataPlatform();

  const result = await dataPlatform.aggregateData(
    ['projects', 'tasks', 'collaborations'],
    (dataMap) => {
      const allProjects = dataMap.get(`projects?`)?.projects || [];
      const allTasks = dataMap.get(`tasks?`)?.tasks || [];
      const allCollaborations = dataMap.get(`collaborations?`)?.tasks || [];

      const project = allProjects.find((p: any) => p.id === projectId);
      if (!project) {
        return null;
      }

      const projectTasks = allTasks.filter((t: any) => t.projectId === projectId);
      const projectCollaborations = allCollaborations.filter((c: any) => c.projectId === projectId);

      // 计算项目整体进度
      const totalProgress = projectTasks.reduce((sum: number, t: any) => sum + t.progress, 0);
      const averageProgress = projectTasks.length > 0 ? Math.round(totalProgress / projectTasks.length) : 0;

      // 按状态统计任务
      const taskStats = {
        total: projectTasks.length,
        pending: projectTasks.filter((t: any) => t.progress === 0).length,
        inProgress: projectTasks.filter((t: any) => t.progress > 0 && t.progress < 100).length,
        completed: projectTasks.filter((t: any) => t.progress === 100).length,
        delayed: projectTasks.filter((t: any) => {
          const dueDate = new Date(t.estimatedCompletionDate);
          return dueDate < new Date() && t.progress < 100;
        }).length,
      };

      return {
        project,
        tasks: projectTasks,
        collaborations: projectCollaborations,
        stats: {
          averageProgress,
          taskStats,
        },
        timestamp: new Date().toISOString(),
      };
    }
  );

  return result;
}

/**
 * 导出所有聚合器
 */
export const aggregators = {
  projectStats: aggregateProjectStats,
  workload: aggregateWorkload,
  dashboard: aggregateDashboardData,
  projectDetail: aggregateProjectDetail,
};
