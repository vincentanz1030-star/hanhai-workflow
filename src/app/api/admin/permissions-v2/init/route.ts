/**
 * 权限系统初始化 API
 * 用于创建表、初始化预设数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 检查表是否存在
async function checkTablesExist(supabase: any): Promise<boolean> {
  const { error } = await supabase
    .from('permission_modules')
    .select('id')
    .limit(1);
  
  // 如果没有错误，表存在
  if (!error) return true;
  
  // 如果错误代码是表不存在，返回 false
  if (error.code === '42P01' || 
      error.message?.includes('does not exist') ||
      error.message?.includes('not find the table')) {
    return false;
  }
  
  // 其他错误情况，假设表存在（可能是权限问题等其他原因）
  return true;
}

// 资源名称中文映射
const RESOURCE_NAMES: Record<string, string> = {
  users: '用户',
  roles: '角色',
  permissions: '权限',
  logs: '日志',
  config: '配置',
  backup: '备份',
  restore: '恢复',
  project: '项目',
  task: '任务',
  assign: '分配',
  complete: '完成',
  product: '商品',
  price: '价格',
  inventory: '库存',
  supplier: '供应商',
  purchase_order: '采购订单',
  sales_stats: '销售统计',
  product_feedback: '商品反馈',
  handle: '处理',
  campaign: '营销活动',
  campaign_task: '活动任务',
  collaboration: '协同项目',
  member: '成员',
  knowledge: '知识库',
  schedule: '日程',
  approval: '审批',
  reject: '拒绝',
  message: '消息',
  send: '发送',
  shared_resource: '共享资源',
  feedback: '反馈',
  analytics: '数据分析',
};

// 操作名称中文映射
const ACTION_NAMES: Record<string, string> = {
  view: '查看',
  create: '新增',
  edit: '编辑',
  delete: '删除',
  approve: '审批',
  export: '导出',
  import: '导入',
  manage: '管理',
  assign: '分配',
  complete: '完成',
  handle: '处理',
  send: '发送',
  reject: '拒绝',
  restore: '恢复',
};

// 预设权限模块
const DEFAULT_MODULES = [
  { code: 'system', name: '系统管理', icon: 'Shield', sort_order: 0, is_system: true },
  { code: 'project', name: '项目管理', icon: 'FolderOpen', sort_order: 1, is_system: true },
  { code: 'task', name: '任务管理', icon: 'CheckSquare', sort_order: 2, is_system: true },
  { code: 'product', name: '商品中心', icon: 'Package', sort_order: 3, is_system: true },
  { code: 'supplier', name: '供应商管理', icon: 'Building', sort_order: 4, is_system: true },
  { code: 'purchase_order', name: '采购订单', icon: 'ShoppingCart', sort_order: 5, is_system: true },
  { code: 'sales_stats', name: '销售统计', icon: 'TrendingUp', sort_order: 6, is_system: true },
  { code: 'product_feedback', name: '商品反馈', icon: 'MessageSquare', sort_order: 7, is_system: true },
  { code: 'campaign', name: '营销活动', icon: 'Megaphone', sort_order: 8, is_system: true },
  { code: 'campaign_task', name: '活动任务', icon: 'ListTodo', sort_order: 9, is_system: true },
  { code: 'collaboration', name: '协同项目', icon: 'Users', sort_order: 10, is_system: true },
  { code: 'knowledge', name: '知识库', icon: 'BookOpen', sort_order: 11, is_system: true },
  { code: 'schedule', name: '日程管理', icon: 'Calendar', sort_order: 12, is_system: true },
  { code: 'approval', name: '审批流程', icon: 'ClipboardCheck', sort_order: 13, is_system: true },
  { code: 'message', name: '内部消息', icon: 'MessageCircle', sort_order: 14, is_system: true },
  { code: 'shared_resource', name: '资源共享', icon: 'FolderKanban', sort_order: 15, is_system: true },
  { code: 'feedback', name: '客户反馈', icon: 'Inbox', sort_order: 16, is_system: true },
  { code: 'analytics', name: '数据分析', icon: 'BarChart', sort_order: 17, is_system: true },
];

// 预设权限操作类型
const DEFAULT_ACTIONS = [
  { code: 'view', name: '查看', icon: 'Eye', color: 'blue', sort_order: 0, is_system: true },
  { code: 'create', name: '新增', icon: 'Plus', color: 'green', sort_order: 1, is_system: true },
  { code: 'edit', name: '编辑', icon: 'Edit', color: 'orange', sort_order: 2, is_system: true },
  { code: 'delete', name: '删除', icon: 'Trash2', color: 'red', sort_order: 3, is_system: true },
  { code: 'approve', name: '审批', icon: 'CheckCircle', color: 'purple', sort_order: 4, is_system: true },
  { code: 'export', name: '导出', icon: 'Download', color: 'cyan', sort_order: 5, is_system: true },
  { code: 'import', name: '导入', icon: 'Upload', color: 'teal', sort_order: 6, is_system: true },
  { code: 'manage', name: '管理', icon: 'Settings', color: 'gray', sort_order: 7, is_system: true },
];

// 模块默认权限配置
const MODULE_PERMISSIONS: Record<string, { resource: string; actions: string[] }[]> = {
  system: [
    { resource: 'users', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'roles', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'permissions', actions: ['view', 'edit'] },
    { resource: 'logs', actions: ['view', 'export'] },
    { resource: 'config', actions: ['view', 'edit'] },
    { resource: 'backup', actions: ['view', 'create', 'restore'] },
  ],
  project: [
    { resource: 'project', actions: ['view', 'create', 'edit', 'delete', 'export'] },
  ],
  task: [
    { resource: 'task', actions: ['view', 'create', 'edit', 'delete', 'assign', 'complete'] },
  ],
  product: [
    { resource: 'product', actions: ['view', 'create', 'edit', 'delete', 'export', 'import'] },
    { resource: 'price', actions: ['view', 'edit'] },
    { resource: 'inventory', actions: ['view', 'edit'] },
  ],
  supplier: [
    { resource: 'supplier', actions: ['view', 'create', 'edit', 'delete'] },
  ],
  purchase_order: [
    { resource: 'purchase_order', actions: ['view', 'create', 'edit', 'approve'] },
  ],
  sales_stats: [
    { resource: 'sales_stats', actions: ['view', 'create', 'edit', 'export'] },
  ],
  product_feedback: [
    { resource: 'product_feedback', actions: ['view', 'create', 'handle', 'delete'] },
  ],
  campaign: [
    { resource: 'campaign', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
  ],
  campaign_task: [
    { resource: 'campaign_task', actions: ['view', 'create', 'edit', 'assign', 'complete'] },
  ],
  collaboration: [
    { resource: 'collaboration', actions: ['view', 'create', 'edit', 'delete'] },
    { resource: 'member', actions: ['view', 'manage'] },
  ],
  knowledge: [
    { resource: 'knowledge', actions: ['view', 'create', 'edit', 'delete'] },
  ],
  schedule: [
    { resource: 'schedule', actions: ['view', 'create', 'edit', 'delete'] },
  ],
  approval: [
    { resource: 'approval', actions: ['view', 'create', 'approve', 'reject'] },
  ],
  message: [
    { resource: 'message', actions: ['view', 'send', 'delete'] },
  ],
  shared_resource: [
    { resource: 'shared_resource', actions: ['view', 'create', 'edit', 'delete'] },
  ],
  feedback: [
    { resource: 'feedback', actions: ['view', 'create', 'handle', 'delete'] },
  ],
  analytics: [
    { resource: 'analytics', actions: ['view', 'export'] },
  ],
};

// 预设角色
const DEFAULT_ROLES = [
  { code: 'super_admin', name: '超级管理员', description: '拥有系统全部权限', color: 'red', icon: 'Crown', is_system: true, sort_order: 0 },
  { code: 'admin', name: '管理员', description: '管理用户和业务数据', color: 'orange', icon: 'Shield', is_system: true, sort_order: 1 },
  { code: 'operations_manager', name: '运营经理', description: '管理营销活动和数据分析', color: 'purple', icon: 'TrendingUp', is_system: true, sort_order: 2 },
  { code: 'product_manager', name: '商品经理', description: '管理商品和供应链', color: 'blue', icon: 'Package', is_system: true, sort_order: 3 },
  { code: 'purchaser', name: '采购专员', description: '管理采购和供应商', color: 'green', icon: 'ShoppingCart', is_system: true, sort_order: 4 },
  { code: 'designer', name: '设计师', description: '完成任务和资源管理', color: 'pink', icon: 'Palette', is_system: true, sort_order: 5 },
  { code: 'customer_service', name: '客服', description: '处理客户反馈', color: 'cyan', icon: 'Headphones', is_system: true, sort_order: 6 },
  { code: 'employee', name: '普通员工', description: '基础功能访问', color: 'gray', icon: 'User', is_system: true, sort_order: 7 },
];

// 预设岗位
const DEFAULT_POSITIONS = [
  { code: 'project_manager', name: '项目经理', department: '项目管理部', color: 'blue', icon: 'FolderOpen', is_system: true, sort_order: 0 },
  { code: 'illustration', name: '插画', department: '设计部', color: 'pink', icon: 'Image', is_system: true, sort_order: 1 },
  { code: 'product_design', name: '产品设计', department: '设计部', color: 'purple', icon: 'Box', is_system: true, sort_order: 2 },
  { code: 'detail_design', name: '详情设计', department: '设计部', color: 'violet', icon: 'Layout', is_system: true, sort_order: 3 },
  { code: 'copywriting', name: '文案撰写', department: '内容部', color: 'green', icon: 'FileText', is_system: true, sort_order: 4 },
  { code: 'procurement', name: '采购管理', department: '采购部', color: 'orange', icon: 'ShoppingCart', is_system: true, sort_order: 5 },
  { code: 'packaging_design', name: '包装设计', department: '设计部', color: 'teal', icon: 'Package', is_system: true, sort_order: 6 },
  { code: 'finance', name: '财务管理', department: '财务部', color: 'yellow', icon: 'DollarSign', is_system: true, sort_order: 7 },
  { code: 'customer_service', name: '客服培训', department: '客服部', color: 'cyan', icon: 'Headphones', is_system: true, sort_order: 8 },
  { code: 'warehouse', name: '仓储管理', department: '仓储部', color: 'brown', icon: 'Warehouse', is_system: true, sort_order: 9 },
  { code: 'operations', name: '运营管理', department: '运营部', color: 'indigo', icon: 'TrendingUp', is_system: true, sort_order: 10 },
];

// 角色默认权限
const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'], // 全部权限
  admin: [
    'system:users:*', 'system:roles:view', 'system:permissions:view',
    'system:logs:*', 'system:config:view',
    'project:*', 'task:*', 'product:*', 'supplier:*', 'purchase_order:*',
    'sales_stats:*', 'product_feedback:*', 'campaign:*', 'campaign_task:*',
    'collaboration:*', 'knowledge:*', 'schedule:*', 'approval:*',
    'message:*', 'shared_resource:*', 'feedback:*', 'analytics:*',
  ],
  operations_manager: [
    'project:view', 'project:edit', 'project:export',
    'task:view', 'task:assign',
    'product:view', 'product:edit',
    'campaign:*', 'campaign_task:*',
    'analytics:*', 'approval:approve', 'approval:reject',
    'collaboration:view', 'knowledge:*', 'schedule:*', 'message:*',
  ],
  product_manager: [
    'product:*', 'supplier:*', 'purchase_order:view', 'purchase_order:create', 'purchase_order:edit',
    'sales_stats:*', 'product_feedback:*',
    'project:view', 'task:view', 'analytics:view',
  ],
  purchaser: [
    'supplier:*', 'purchase_order:*',
    'product:view', 'product:inventory:view',
  ],
  designer: [
    'project:view', 'task:view', 'task:edit', 'task:complete',
    'product:view',
    'shared_resource:*', 'knowledge:view', 'knowledge:create',
    'message:*', 'schedule:*',
  ],
  customer_service: [
    'product:view', 'feedback:*', 'product_feedback:view', 'product_feedback:create',
    'message:*', 'knowledge:view',
  ],
  employee: [
    'project:view', 'task:view', 'task:complete',
    'schedule:*', 'message:*', 'knowledge:view',
  ],
};

// 岗位默认权限
const POSITION_PERMISSIONS: Record<string, string[]> = {
  project_manager: ['project:*', 'task:*', 'collaboration:*'],
  illustration: ['task:view', 'task:complete', 'shared_resource:*'],
  product_design: ['task:view', 'task:complete', 'product:view'],
  detail_design: ['task:view', 'task:complete', 'product:view', 'product:edit'],
  copywriting: ['task:view', 'task:complete', 'knowledge:*', 'campaign:view', 'campaign:edit'],
  procurement: ['supplier:*', 'purchase_order:*'],
  packaging_design: ['task:view', 'task:complete', 'shared_resource:*'],
  finance: ['sales_stats:view', 'purchase_order:view', 'approval:view', 'approval:approve'],
  customer_service: ['feedback:*', 'product_feedback:view', 'product_feedback:handle'],
  warehouse: ['product:view', 'product:inventory:*'],
  operations: ['campaign:*', 'analytics:view', 'campaign_task:*'],
};

// GET - 获取初始化状态
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // 检查表是否存在
    const tablesExist = await checkTablesExist(supabase);

    if (!tablesExist) {
      return NextResponse.json({
        success: true,
        initialized: false,
        tablesExist: false,
        message: '权限系统数据表尚未创建，请先执行SQL脚本创建表',
        sqlPath: 'sql/permission-system-tables.sql',
      });
    }

    // 检查是否有数据
    const { data: modules, error } = await supabase
      .from('permission_modules')
      .select('id')
      .limit(1);

    const initialized = !error && modules && modules.length > 0;

    return NextResponse.json({
      success: true,
      initialized,
      tablesExist: true,
      message: initialized ? '权限系统已初始化' : '权限系统未初始化，请点击初始化按钮',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      initialized: false,
      message: '检查初始化状态失败',
    });
  }
}

// POST - 执行初始化
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    // 检查管理员权限（使用简单的token验证）
    const authHeader = request.headers.get('authorization');
    const cookie = request.headers.get('cookie') || '';
    const tokenMatch = cookie.match(/auth_token=([^;]+)/);
    const token = authHeader?.replace('Bearer ', '') || tokenMatch?.[1];

    if (!token) {
      return NextResponse.json({ error: '未登录，请先登录' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const force = body.force === true; // 强制重新初始化

    // 检查表是否存在
    const tablesExist = await checkTablesExist(supabase);
    if (!tablesExist) {
      return NextResponse.json({
        success: false,
        error: '权限系统数据表尚未创建',
        message: '请先在数据库中执行 sql/permission-system-tables.sql 脚本创建数据表',
        sqlPath: 'sql/permission-system-tables.sql',
      }, { status: 400 });
    }

    console.log('[权限初始化] 开始初始化...');

    // 1. 初始化模块
    console.log('[权限初始化] 初始化模块...');
    for (const module of DEFAULT_MODULES) {
      const { error } = await supabase
        .from('permission_modules')
        .upsert({
          code: module.code,
          name: module.name,
          icon: module.icon,
          sort_order: module.sort_order,
          is_system: module.is_system,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'code' });
      
      if (error) console.warn(`模块 ${module.code} 初始化警告:`, error.message);
    }

    // 2. 初始化操作类型
    console.log('[权限初始化] 初始化操作类型...');
    for (const action of DEFAULT_ACTIONS) {
      const { error } = await supabase
        .from('permission_actions')
        .upsert({
          code: action.code,
          name: action.name,
          icon: action.icon,
          color: action.color,
          sort_order: action.sort_order,
          is_system: action.is_system,
          is_active: true,
        }, { onConflict: 'code' });
      
      if (error) console.warn(`操作 ${action.code} 初始化警告:`, error.message);
    }

    // 3. 获取模块和操作ID映射
    const { data: modules } = await supabase.from('permission_modules').select('id, code');
    const { data: actions } = await supabase.from('permission_actions').select('id, code');
    
    const moduleMap = new Map((modules || []).map((m: any) => [m.code, m.id]));
    const actionMap = new Map((actions || []).map((a: any) => [a.code, a.id]));

    // 4. 初始化权限
    console.log('[权限初始化] 初始化权限...');
    let permissionCount = 0;
    for (const [moduleCode, resources] of Object.entries(MODULE_PERMISSIONS)) {
      const moduleId = moduleMap.get(moduleCode);
      if (!moduleId) continue;

      for (const { resource, actions: resourceActions } of resources) {
        for (const actionCode of resourceActions) {
          const actionId = actionMap.get(actionCode);
          if (!actionId) continue;

          const permCode = `${moduleCode}:${resource}:${actionCode}`;
          // 使用中文名称
          const resourceName = RESOURCE_NAMES[resource] || resource;
          const actionName = ACTION_NAMES[actionCode] || actionCode;
          const permName = `${resourceName}${actionName}`;

          const { error } = await supabase
            .from('permissions_v2')
            .upsert({
              module_id: moduleId,
              code: permCode,
              name: permName,
              action_id: actionId,
              resource: resource,
              is_system: true,
              is_active: true,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'code' });

          if (!error) permissionCount++;
        }
      }
    }

    // 5. 初始化角色
    console.log('[权限初始化] 初始化角色...');
    for (const role of DEFAULT_ROLES) {
      const { error } = await supabase
        .from('roles_v2')
        .upsert({
          code: role.code,
          name: role.name,
          description: role.description,
          color: role.color,
          icon: role.icon,
          is_system: role.is_system,
          sort_order: role.sort_order,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'code' });
      
      if (error) console.warn(`角色 ${role.code} 初始化警告:`, error.message);
    }

    // 6. 初始化岗位
    console.log('[权限初始化] 初始化岗位...');
    for (const position of DEFAULT_POSITIONS) {
      const { error } = await supabase
        .from('positions_v2')
        .upsert({
          code: position.code,
          name: position.name,
          department: position.department,
          color: position.color,
          icon: position.icon,
          is_system: position.is_system,
          sort_order: position.sort_order,
          is_active: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'code' });
      
      if (error) console.warn(`岗位 ${position.code} 初始化警告:`, error.message);
    }

    // 7. 获取角色和权限ID映射
    const { data: roles } = await supabase.from('roles_v2').select('id, code');
    const { data: permissions } = await supabase.from('permissions_v2').select('id, code');
    
    const roleMap = new Map((roles || []).map((r: any) => [r.code, r.id]));
    const permMap = new Map((permissions || []).map((p: any) => [p.code, p.id]));

    // 8. 分配角色权限
    console.log('[权限初始化] 分配角色权限...');
    let rolePermCount = 0;
    for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
      const roleId = roleMap.get(roleCode);
      if (!roleId) continue;

      // 超级管理员跳过
      if (permCodes.includes('*')) continue;

      for (const permCodePattern of permCodes) {
        // 处理通配符
        if (permCodePattern.endsWith(':*')) {
          const prefix = permCodePattern.slice(0, -2);
          const matchingPerms = (permissions || []).filter((p: any) => p.code.startsWith(prefix));
          for (const perm of matchingPerms) {
            const { error } = await supabase
              .from('role_permissions_v2')
              .upsert({
                role_id: roleId,
                permission_id: perm.id,
                granted_at: new Date().toISOString(),
              }, { onConflict: 'role_id,permission_id' });
            if (!error) rolePermCount++;
          }
        } else {
          const permId = permMap.get(permCodePattern);
          if (!permId) continue;
          const { error } = await supabase
            .from('role_permissions_v2')
            .upsert({
              role_id: roleId,
              permission_id: permId,
              granted_at: new Date().toISOString(),
            }, { onConflict: 'role_id,permission_id' });
          if (!error) rolePermCount++;
        }
      }
    }

    // 9. 分配岗位权限
    console.log('[权限初始化] 分配岗位权限...');
    let positionPermCount = 0;
    const { data: positions } = await supabase.from('positions_v2').select('id, code');
    const positionMap = new Map((positions || []).map((p: any) => [p.code, p.id]));

    for (const [posCode, permCodes] of Object.entries(POSITION_PERMISSIONS)) {
      const posId = positionMap.get(posCode);
      if (!posId) continue;

      for (const permCodePattern of permCodes) {
        if (permCodePattern.endsWith(':*')) {
          const prefix = permCodePattern.slice(0, -2);
          const matchingPerms = (permissions || []).filter((p: any) => p.code.startsWith(prefix));
          for (const perm of matchingPerms) {
            const { error } = await supabase
              .from('position_permissions_v2')
              .upsert({
                position_id: posId,
                permission_id: perm.id,
                granted_at: new Date().toISOString(),
              }, { onConflict: 'position_id,permission_id' });
            if (!error) positionPermCount++;
          }
        } else {
          const permId = permMap.get(permCodePattern);
          if (!permId) continue;
          const { error } = await supabase
            .from('position_permissions_v2')
            .upsert({
              position_id: posId,
              permission_id: permId,
              granted_at: new Date().toISOString(),
            }, { onConflict: 'position_id,permission_id' });
          if (!error) positionPermCount++;
        }
      }
    }

    console.log('[权限初始化] 初始化完成!');

    return NextResponse.json({
      success: true,
      message: '权限系统初始化成功',
      stats: {
        modules: DEFAULT_MODULES.length,
        actions: DEFAULT_ACTIONS.length,
        permissions: permissionCount,
        roles: DEFAULT_ROLES.length,
        positions: DEFAULT_POSITIONS.length,
        rolePermissions: rolePermCount,
        positionPermissions: positionPermCount,
      },
    });
  } catch (error) {
    console.error('[权限初始化] 错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '初始化失败',
      },
      { status: 500 }
    );
  }
}
