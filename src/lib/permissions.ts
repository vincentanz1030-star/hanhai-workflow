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
 * 获取用户的角色列表（兼容新旧两套角色表）
 * 这是所有权限检查的基础函数
 */
export async function getUserRoles(userId: string): Promise<UserRoleInfo[]> {
  const supabase = getSupabaseClient();
  const allRoles: UserRoleInfo[] = [];

  // 1. 先从新版角色表获取（优先）
  try {
    const { data: v2Roles } = await supabase
      .from('user_roles_v2')
      .select('is_primary, roles_v2(code)')
      .eq('user_id', userId);

    if (v2Roles && v2Roles.length > 0) {
      for (const r of v2Roles) {
        const roleData = r as { is_primary: boolean; roles_v2: { code: string } | null };
        if (roleData.roles_v2?.code) {
          allRoles.push({
            role: roleData.roles_v2.code,
            is_primary: roleData.is_primary || false,
          });
        }
      }
    }
  } catch (e) {
    console.error('[getUserRoles] 查询 user_roles_v2 失败:', e);
  }

  // 2. 再从旧版角色表获取（兼容）
  try {
    const { data: v1Roles } = await supabase
      .from('user_roles')
      .select('role, is_primary')
      .eq('user_id', userId);

    if (v1Roles && v1Roles.length > 0) {
      for (const r of v1Roles) {
        // 避免重复添加
        if (!allRoles.find(ar => ar.role === r.role)) {
          allRoles.push({
            role: r.role,
            is_primary: r.is_primary || false,
          });
        }
      }
    }
  } catch (e) {
    console.error('[getUserRoles] 查询 user_roles 失败:', e);
  }

  return allRoles;
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
  // 使用统一的 getUserRoles 获取角色
  const roles = await getUserRoles(userId);
  
  if (roles.length === 0) {
    return false;
  }

  const roleNames = roles.map(r => r.role);
  const supabase = getSupabaseClient();

  // 检查这些角色是否有指定权限
  const { data: permissions, error: permsError } = await supabase
    .from('role_permissions')
    .select('permission_id')
    .in('role', roleNames);

  if (permsError || !permissions) {
    return false;
  }

  const permissionIds = permissions.map((p: { permission_id: string }) => p.permission_id);

  // 查询权限详情
  const { data: permDetails, error: detailsError } = await supabase
    .from('permissions')
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
  // 只有品牌为 'all' 的用户才能查看所有品牌数据
  return userBrand === 'all';
}

/**
 * 检查用户是否可以管理所有品牌数据（创建、修改、删除）
 * 条件：用户品牌必须为 'all'
 */
export async function canManageAllBrands(userBrand?: string): Promise<boolean> {
  // 只有品牌为 'all' 的用户才能管理所有品牌的数据
  return userBrand === 'all';
}

/**
 * 获取用户的所有权限
 */
export async function getUserPermissions(userId: string) {
  // 使用统一的 getUserRoles 获取角色
  const roles = await getUserRoles(userId);
  
  if (roles.length === 0) {
    return [];
  }

  const roleNames = roles.map(r => r.role);
  const supabase = getSupabaseClient();

  // 获取这些角色的所有权限
  const { data: permissions, error: permsError } = await supabase
    .from('role_permissions')
    .select(`
      permission_id,
      permissions (
        resource,
        action,
        description
      )
    `)
    .in('role', roleNames);

  if (permsError || !permissions) {
    return [];
  }

  return permissions.map((p: RolePermission) => ({
    resource: (p.permissions as Permission).resource,
    action: (p.permissions as Permission).action,
    description: (p.permissions as Permission).description,
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
