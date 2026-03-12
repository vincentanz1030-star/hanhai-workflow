/**
 * 权限管理初始化API
 * 用于初始化和更新权限配置
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 定义权限配置
interface Permission {
  resource: string;
  action: string;
  description: string;
}

interface RolePermissionConfig {
  role: string;
  permissions: string[];
  description: string;
}

// 完整的权限定义
const PERMISSIONS: Permission[] = [
  // 系统管理
  { resource: 'system', action: 'view_all', description: '查看所有品牌数据' },
  { resource: 'system', action: 'manage_users', description: '管理用户' },
  { resource: 'system', action: 'manage_roles', description: '管理角色和权限' },
  { resource: 'system', action: 'view_reports', description: '查看报表' },

  // 项目管理
  { resource: 'project', action: 'view', description: '查看项目' },
  { resource: 'project', action: 'create', description: '创建项目' },
  { resource: 'project', action: 'edit', description: '编辑项目' },
  { resource: 'project', action: 'delete', description: '删除项目' },
  { resource: 'project', action: 'export', description: '导出项目数据' },

  // 任务管理
  { resource: 'task', action: 'view', description: '查看任务' },
  { resource: 'task', action: 'create', description: '创建任务' },
  { resource: 'task', action: 'edit', description: '编辑任务' },
  { resource: 'task', action: 'delete', description: '删除任务' },
  { resource: 'task', action: 'assign', description: '分配任务' },
  { resource: 'task', action: 'complete', description: '完成任务' },

  // 商品中心
  { resource: 'product', action: 'view', description: '查看商品' },
  { resource: 'product', action: 'create', description: '创建商品' },
  { resource: 'product', action: 'edit', description: '编辑商品' },
  { resource: 'product', action: 'delete', description: '删除商品' },
  { resource: 'product', action: 'manage_inventory', description: '管理库存' },
  { resource: 'product', action: 'manage_prices', description: '管理价格' },

  // 供应商管理
  { resource: 'supplier', action: 'view', description: '查看供应商' },
  { resource: 'supplier', action: 'create', description: '创建供应商' },
  { resource: 'supplier', action: 'edit', description: '编辑供应商' },
  { resource: 'supplier', action: 'delete', description: '删除供应商' },

  // 采购订单
  { resource: 'purchase_order', action: 'view', description: '查看采购订单' },
  { resource: 'purchase_order', action: 'create', description: '创建采购订单' },
  { resource: 'purchase_order', action: 'edit', description: '编辑采购订单' },
  { resource: 'purchase_order', action: 'approve', description: '审批采购订单' },

  // 营销活动
  { resource: 'campaign', action: 'view', description: '查看营销活动' },
  { resource: 'campaign', action: 'create', description: '创建营销活动' },
  { resource: 'campaign', action: 'edit', description: '编辑营销活动' },
  { resource: 'campaign', action: 'delete', description: '删除营销活动' },
  { resource: 'campaign', action: 'approve', description: '审批营销活动' },

  // 新品发布
  { resource: 'product_launch', action: 'view', description: '查看新品发布' },
  { resource: 'product_launch', action: 'create', description: '创建新品发布' },
  { resource: 'product_launch', action: 'edit', description: '编辑新品发布' },
  { resource: 'product_launch', action: 'delete', description: '删除新品发布' },

  // 协作项目
  { resource: 'collaboration', action: 'view', description: '查看协作项目' },
  { resource: 'collaboration', action: 'create', description: '创建协作项目' },
  { resource: 'collaboration', action: 'edit', description: '编辑协作项目' },
  { resource: 'collaboration', action: 'delete', description: '删除协作项目' },
  { resource: 'collaboration', action: 'manage_members', description: '管理成员' },

  // 消息
  { resource: 'message', action: 'view', description: '查看消息' },
  { resource: 'message', action: 'send', description: '发送消息' },
  { resource: 'message', action: 'delete', description: '删除消息' },

  // 审批
  { resource: 'approval', action: 'view', description: '查看审批' },
  { resource: 'approval', action: 'approve', description: '审批' },
  { resource: 'approval', action: 'reject', description: '拒绝' },

  // 通知
  { resource: 'notification', action: 'view', description: '查看通知' },
  { resource: 'notification', action: 'send', description: '发送通知' },
  { resource: 'notification', action: 'manage', description: '管理通知' },

  // 反馈
  { resource: 'feedback', action: 'view', description: '查看反馈' },
  { resource: 'feedback', action: 'create', description: '创建反馈' },
  { resource: 'feedback', action: 'delete', description: '删除反馈' },

  // 数据分析
  { resource: 'analytics', action: 'view', description: '查看数据分析' },
  { resource: 'analytics', action: 'export', description: '导出分析数据' },

  // 工作负载
  { resource: 'workload', action: 'view', description: '查看工作负载' },
  { resource: 'workload', action: 'manage', description: '管理工作负载' },

  // 报表
  { resource: 'report', action: 'view', description: '查看报表' },
  { resource: 'report', action: 'create', description: '创建报表' },
  { resource: 'report', action: 'export', description: '导出报表' },

  // 搜索
  { resource: 'search', action: 'view', description: '使用搜索功能' },

  // 文件上传
  { resource: 'upload', action: 'create', description: '上传文件' },
];

// 角色权限配置
const ROLE_PERMISSIONS: RolePermissionConfig[] = [
  {
    role: 'admin',
    permissions: PERMISSIONS.map(p => `${p.resource}:${p.action}`),
    description: '管理员 - 拥有所有权限',
  },
  {
    role: 'product',
    permissions: [
      // 商品管理
      'product:view', 'product:create', 'product:edit', 'product:delete',
      'product:manage_inventory', 'product:manage_prices',
      // 供应商管理
      'supplier:view', 'supplier:create', 'supplier:edit', 'supplier:delete',
      // 采购订单
      'purchase_order:view', 'purchase_order:create', 'purchase_order:edit',
      // 项目管理
      'project:view', 'project:create', 'project:edit',
      // 任务管理
      'task:view', 'task:create', 'task:edit', 'task:complete',
      // 文件上传
      'upload:create',
      // 搜索
      'search:view',
    ],
    description: '产品经理 - 负责商品和供应链管理',
  },
  {
    role: 'purchasing',
    permissions: [
      // 供应商管理
      'supplier:view', 'supplier:create', 'supplier:edit',
      // 采购订单
      'purchase_order:view', 'purchase_order:create', 'purchase_order:edit', 'purchase_order:approve',
      // 商品管理（查看）
      'product:view',
      // 任务管理
      'task:view', 'task:create', 'task:edit', 'task:complete',
      // 文件上传
      'upload:create',
      // 搜索
      'search:view',
    ],
    description: '采购专员 - 负责采购和供应商管理',
  },
  {
    role: 'copywriting',
    permissions: [
      // 商品管理
      'product:view', 'product:edit',
      // 营销活动
      'campaign:view', 'campaign:create', 'campaign:edit',
      // 新品发布
      'product_launch:view', 'product_launch:create', 'product_launch:edit',
      // 项目管理
      'project:view', 'project:edit',
      // 任务管理
      'task:view', 'task:edit', 'task:complete',
      // 协作
      'collaboration:view', 'collaboration:create',
      'message:view', 'message:send',
      // 审批
      'approval:view',
      // 通知
      'notification:view',
      // 文件上传
      'upload:create',
      // 搜索
      'search:view',
    ],
    description: '文案策划 - 负责营销文案和内容创作',
  },
  {
    role: 'illustration',
    permissions: [
      // 商品管理
      'product:view', 'product:edit',
      // 营销活动
      'campaign:view', 'campaign:edit',
      // 新品发布
      'product_launch:view', 'product_launch:edit',
      // 项目管理
      'project:view', 'project:edit',
      // 任务管理
      'task:view', 'task:edit', 'task:complete',
      // 协作
      'collaboration:view', 'collaboration:create',
      'message:view', 'message:send',
      // 文件上传
      'upload:create',
      // 搜索
      'search:view',
    ],
    description: '插画师 - 负责视觉设计',
  },
  {
    role: 'finance',
    permissions: [
      // 采购订单
      'purchase_order:view', 'purchase_order:approve',
      // 商品管理（查看）
      'product:view',
      // 供应商管理（查看）
      'supplier:view',
      // 项目管理
      'project:view',
      // 任务管理
      'task:view', 'task:complete',
      // 数据分析
      'analytics:view', 'analytics:export',
      // 报表
      'report:view', 'report:export',
      // 工作负载
      'workload:view',
      // 搜索
      'search:view',
    ],
    description: '财务专员 - 负责财务审批和报表',
  },
];

// POST - 初始化权限
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { force = false } = body;

    console.log('开始初始化权限配置...');

    const results = {
      permissions: { created: 0, updated: 0, errors: 0 },
      rolePermissions: { created: 0, updated: 0, errors: 0 },
      details: [] as any[],
    };

    // 1. 创建或更新权限定义
    for (const perm of PERMISSIONS) {
      try {
        const { data: existing } = await supabase
          .from('permissions')
          .select('*')
          .eq('resource', perm.resource)
          .eq('action', perm.action)
          .single();

        if (existing) {
          if (force) {
            await supabase
              .from('permissions')
              .update({ description: perm.description })
              .eq('id', existing.id);
            results.permissions.updated++;
            results.details.push({
              type: 'permission',
              action: 'update',
              permission: `${perm.resource}:${perm.action}`,
            });
          }
        } else {
          const { error } = await supabase
            .from('permissions')
            .insert({
              resource: perm.resource,
              action: perm.action,
              description: perm.description,
            });

          if (error) throw error;
          results.permissions.created++;
          results.details.push({
            type: 'permission',
            action: 'create',
            permission: `${perm.resource}:${perm.action}`,
          });
        }
      } catch (error: any) {
        console.error(`处理权限 ${perm.resource}:${perm.action} 失败:`, error);
        results.permissions.errors++;
        results.details.push({
          type: 'permission',
          action: 'error',
          permission: `${perm.resource}:${perm.action}`,
          error: error.message,
        });
      }
    }

    // 2. 创建或更新角色权限映射
    for (const rolePerm of ROLE_PERMISSIONS) {
      try {
        // 获取权限ID
        const { data: permData, error: permError } = await supabase
          .from('permissions')
          .select('id')
          .in('id', rolePerm.permissions.map(p => `${p}`));

        // 先获取所有权限以匹配
        const { data: allPerms } = await supabase
          .from('permissions')
          .select('*');

        if (!allPerms) throw new Error('无法获取权限列表');

        const permMap = new Map(allPerms.map(p => [`${p.resource}:${p.action}`, p.id]));
        const permissionIds = rolePerm.permissions
          .map(p => permMap.get(p))
          .filter(Boolean);

        // 删除现有的角色权限映射
        if (force) {
          await supabase
            .from('role_permissions')
            .delete()
            .eq('role', rolePerm.role);
        }

        // 插入新的角色权限映射
        for (const permissionId of permissionIds) {
          const { error: insertError } = await supabase
            .from('role_permissions')
            .insert({
              role: rolePerm.role,
              permission_id: permissionId,
            });

          if (insertError) {
            // 如果是重复键错误，忽略
            if (!insertError.message.includes('duplicate')) {
              throw insertError;
            }
          }
        }

        if (force) {
          results.rolePermissions.updated++;
        } else {
          results.rolePermissions.created++;
        }

        results.details.push({
          type: 'role_permission',
          action: force ? 'update' : 'create',
          role: rolePerm.role,
          permissions: rolePerm.permissions.length,
        });
      } catch (error: any) {
        console.error(`处理角色权限 ${rolePerm.role} 失败:`, error);
        results.rolePermissions.errors++;
        results.details.push({
          type: 'role_permission',
          action: 'error',
          role: rolePerm.role,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: '权限配置初始化完成',
      results,
    });
  } catch (error: any) {
    console.error('初始化权限配置失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// GET - 获取权限配置概览
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // 获取所有权限
    const { data: permissions, error: permError } = await supabase
      .from('permissions')
      .select('*')
      .order('resource', { ascending: true });

    if (permError) throw permError;

    // 获取所有角色权限
    const { data: rolePermissions, error: rolePermError } = await supabase
      .from('role_permissions')
      .select(`
        role,
        permissions (
          id,
          resource,
          action,
          description
        )
      `)
      .order('role', { ascending: true });

    if (rolePermError) throw rolePermError;

    // 按角色分组权限
    const rolePermMap = new Map();
    rolePermissions?.forEach((rp: any) => {
      if (!rolePermMap.has(rp.role)) {
        rolePermMap.set(rp.role, []);
      }
      rolePermMap.get(rp.role).push(rp.permissions);
    });

    // 统计信息
    const stats = {
      totalPermissions: permissions?.length || 0,
      totalRoles: rolePermMap.size || 0,
      permissionsByResource: {} as any,
      permissionsByRole: {} as any,
    };

    // 按资源分组
    permissions?.forEach((p: any) => {
      if (!stats.permissionsByResource[p.resource]) {
        stats.permissionsByResource[p.resource] = [];
      }
      stats.permissionsByResource[p.resource].push(p.action);
    });

    // 按角色分组
    rolePermMap.forEach((perms: any[], role: string) => {
      stats.permissionsByRole[role] = perms.length;
    });

    return NextResponse.json({
      success: true,
      data: {
        permissions,
        rolePermissions: Array.from(rolePermMap.entries()).map(([role, perms]) => ({
          role,
          permissions: perms,
        })),
        stats,
      },
    });
  } catch (error: any) {
    console.error('获取权限配置失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
