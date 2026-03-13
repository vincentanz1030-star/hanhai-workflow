import { getSupabaseClient } from '@/storage/database/supabase-client';

// 类型定义
export interface UserRoleInfo {
  role: string;
  is_primary: boolean;
}

interface RolePermission {
  role: string;
  permission_id: string;
  permissions?: {
    resource: string;
    action: string;
    description: string;
  };
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

// 角色优先级（数值越大权限越高）
const ROLE_PRIORITY: Record<string, number> = {
  'super_admin': 100,
  'admin': 80,
  'manager': 60,
  'member': 40,
  'user': 20,
};

// 管理员角色列表
const ADMIN_ROLES = ['super_admin', 'admin'];

/**
 * 获取用户的角色列表（从 user_roles_v2 表）
 */
export async function getUserRoles(userId: string): Promise<UserRoleInfo[]> {
  const supabase = getSupabaseClient();

  const { data: userRoles, error } = await supabase
    .from('user_roles_v2')
    .select('is_primary, roles_v2(code)')
    .eq('user_id', userId);

  if (error) {
    console.error('[getUserRoles] 查询失败:', error);
    return [];
  }

  if (!userRoles || userRoles.length === 0) {
    return [];
  }

  return userRoles
    .filter((r: any) => r.roles_v2?.code)
    .map((r: any) => ({
      role: r.roles_v2.code,
      is_primary: r.is_primary || false,
    }));
}

/**
 * 获取用户的主角色
 */
export async function getPrimaryRole(userId: string): Promise<string> {
  const roles = await getUserRoles(userId);
  
  if (roles.length === 0) return 'user';
  
  // 优先返回主角色
  const primary = roles.find((r) => r.is_primary);
  if (primary) return primary.role;
  
  // 其次按角色优先级返回
  const sortedRoles = [...roles].sort((a, b) => {
    return (ROLE_PRIORITY[b.role] || 0) - (ROLE_PRIORITY[a.role] || 0);
  });
  
  return sortedRoles[0]?.role || 'user';
}

/**
 * 检查用户是否拥有指定角色
 */
export async function hasRole(userId: string, role: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.some(r => r.role === role);
}

/**
 * 检查用户是否拥有任意一个指定角色
 */
export async function hasAnyRole(userId: string, roleList: string[]): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.some(r => roleList.includes(r.role));
}

/**
 * 检查用户是否是管理员（admin 或 super_admin）
 */
export async function isAdmin(userId: string): Promise<boolean> {
  return hasAnyRole(userId, ADMIN_ROLES);
}

/**
 * 检查用户是否是超级管理员
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  return hasRole(userId, 'super_admin');
}

/**
 * 检查用户是否有指定权限
 */
export async function checkPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  // 超级管理员拥有所有权限
  const superAdmin = await isSuperAdmin(userId);
  if (superAdmin) return true;

  // 管理员拥有大部分权限
  const admin = await isAdmin(userId);
  if (admin) {
    // 管理员权限检查可以在这里细化
    return true;
  }

  const roles = await getUserRoles(userId);
  
  if (roles.length === 0) {
    return false;
  }

  const roleNames = roles.map(r => r.role);
  const supabase = getSupabaseClient();

  // 检查这些角色是否有指定权限
  const { data: permissions, error: permsError } = await supabase
    .from('role_permissions_v2')
    .select('permission_id')
    .in('role_id', 
      `(SELECT id FROM roles_v2 WHERE code IN (${roleNames.map(r => `'${r}'`).join(',')}))`
    );

  if (permsError || !permissions) {
    return false;
  }

  const permissionIds = permissions.map((p: { permission_id: string }) => p.permission_id);

  // 查询权限详情
  const { data: permDetails, error: detailsError } = await supabase
    .from('permissions_v2')
    .select('*')
    .in('id', permissionIds)
    .eq('resource', resource)
    .eq('action', action);

  if (detailsError) {
    return false;
  }

  return permDetails && permDetails.length > 0;
}

/**
 * 检查用户是否可以查看所有品牌数据
 * 条件：用户品牌必须为 'all'（管理员和超级管理员）
 */
export async function canViewAllBrands(userId: string, userBrand?: string): Promise<boolean> {
  return userBrand === 'all';
}

/**
 * 检查用户是否可以管理所有品牌数据（创建、修改、删除）
 * 条件：用户品牌必须为 'all'
 */
export async function canManageAllBrands(userBrand?: string): Promise<boolean> {
  return userBrand === 'all';
}

/**
 * 获取用户的所有权限
 */
export async function getUserPermissions(userId: string) {
  const roles = await getUserRoles(userId);
  
  if (roles.length === 0) {
    return [];
  }

  // 超级管理员返回所有权限
  const superAdmin = roles.some(r => r.role === 'super_admin');
  if (superAdmin) {
    return [{ resource: '*', action: '*', description: '所有权限' }];
  }

  const roleNames = roles.map(r => r.role);
  const supabase = getSupabaseClient();

  // 获取这些角色的所有权限
  const { data: roleIds } = await supabase
    .from('roles_v2')
    .select('id')
    .in('code', roleNames);

  if (!roleIds || roleIds.length === 0) {
    return [];
  }

  const { data: permissions, error: permsError } = await supabase
    .from('role_permissions_v2')
    .select(`
      permission_id,
      permissions_v2 (
        resource,
        action,
        description
      )
    `)
    .in('role_id', roleIds.map((r: any) => r.id));

  if (permsError || !permissions) {
    return [];
  }

  return permissions.map((p: any) => ({
    resource: p.permissions_v2?.resource,
    action: p.permissions_v2?.action,
    description: p.permissions_v2?.description,
  }));
}

/**
 * 检查用户角色优先级是否高于指定角色
 */
export async function hasHigherRoleThan(userId: string, targetRole: string): Promise<boolean> {
  const roles = await getUserRoles(userId);
  const userMaxPriority = Math.max(...roles.map(r => ROLE_PRIORITY[r.role] || 0));
  const targetPriority = ROLE_PRIORITY[targetRole] || 0;
  return userMaxPriority > targetPriority;
}

/**
 * 获取用户最高优先级的角色
 */
export async function getHighestRole(userId: string): Promise<string> {
  const roles = await getUserRoles(userId);
  if (roles.length === 0) return 'user';
  
  const sortedRoles = [...roles].sort((a, b) => {
    return (ROLE_PRIORITY[b.role] || 0) - (ROLE_PRIORITY[a.role] || 0);
  });
  
  return sortedRoles[0].role;
}
