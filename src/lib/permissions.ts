import { getSupabaseClient } from '@/storage/database/supabase-client';

// 类型定义
interface UserRole {
  role: string;
  is_primary?: boolean;
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

/**
 * 检查用户是否有指定权限
 */
export async function checkPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const supabase = getSupabaseClient();

  // 查询用户的所有角色
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (rolesError || !userRoles || userRoles.length === 0) {
    return false;
  }

  const roles = userRoles.map((r: UserRole) => r.role);

  // 检查这些角色是否有指定权限
  const { data: permissions, error: permsError } = await supabase
    .from('role_permissions')
    .select('permission_id')
    .in('role', roles);

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
  const supabase = getSupabaseClient();

  // 查询用户的所有角色
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (rolesError || !userRoles || userRoles.length === 0) {
    return [];
  }

  const roles = userRoles.map((r: UserRole) => r.role);

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
    .in('role', roles);

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
 * 获取用户的角色列表（兼容新旧两套角色表）
 */
export async function getUserRoles(userId: string) {
  const supabase = getSupabaseClient();
  const allRoles: { role: string; is_primary: boolean }[] = [];

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
export async function getPrimaryRole(userId: string): Promise<string | null> {
  const roles = await getUserRoles(userId);
  
  // 优先返回主角色
  const primary = roles.find((r) => r.is_primary);
  if (primary) return primary.role;
  
  // 其次按角色优先级返回
  const rolePriority = ['super_admin', 'admin', 'manager', 'member', 'user'];
  for (const priorityRole of rolePriority) {
    const found = roles.find((r) => r.role === priorityRole);
    if (found) return found.role;
  }
  
  // 返回第一个角色
  return roles[0]?.role || 'user';
}
