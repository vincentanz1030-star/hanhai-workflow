/**
 * 前端权限检查工具函数
 * 这些函数用于前端组件中的权限判断
 */

// 管理员角色列表
const ADMIN_ROLES = ['super_admin', 'admin'];

/**
 * 检查用户是否是管理员（admin 或 super_admin）
 */
export function checkIsAdmin(roles: Array<{ role: string }> | undefined | null): boolean {
  if (!roles || !Array.isArray(roles)) return false;
  return roles.some(r => ADMIN_ROLES.includes(r.role));
}

/**
 * 检查用户是否是超级管理员
 */
export function checkIsSuperAdmin(roles: Array<{ role: string }> | undefined | null): boolean {
  if (!roles || !Array.isArray(roles)) return false;
  return roles.some(r => r.role === 'super_admin');
}

/**
 * 检查用户是否有指定角色
 */
export function checkHasRole(roles: Array<{ role: string }> | undefined | null, role: string): boolean {
  if (!roles || !Array.isArray(roles)) return false;
  return roles.some(r => r.role === role);
}

/**
 * 检查用户是否有任意一个指定角色
 */
export function checkHasAnyRole(roles: Array<{ role: string }> | undefined | null, roleList: string[]): boolean {
  if (!roles || !Array.isArray(roles)) return false;
  return roles.some(r => roleList.includes(r.role));
}

/**
 * 获取用户最高优先级的角色
 */
export function getHighestRole(roles: Array<{ role: string }> | undefined | null): string {
  if (!roles || !Array.isArray(roles) || roles.length === 0) return 'user';
  
  const rolePriority: Record<string, number> = {
    'super_admin': 100,
    'admin': 80,
    'manager': 60,
    'member': 40,
    'user': 20,
  };
  
  // 获取岗位角色的默认优先级
  const getPositionPriority = (role: string): number => {
    if (rolePriority[role]) return rolePriority[role];
    // 岗位角色默认优先级为 30
    return 30;
  };
  
  const sortedRoles = [...roles].sort((a, b) => {
    return getPositionPriority(b.role) - getPositionPriority(a.role);
  });
  
  return sortedRoles[0]?.role || 'user';
}
