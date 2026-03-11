/**
 * 权限检查工具库（新版）
 * 支持三层权限架构：角色 + 岗位 + 个人
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY || '';

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'public' as const }
  });
}

// 权限缓存（5分钟）
const permissionCache = new Map<string, { permissions: Set<string>; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * 检查用户是否有指定权限
 * @param userId 用户ID
 * @param permissionCode 权限代码（如 'product:view' 或 'product:product:view'）
 */
export async function checkUserPermission(
  userId: string,
  permissionCode: string
): Promise<boolean> {
  const permissions = await getUserAllPermissions(userId);
  
  // 检查精确匹配
  if (permissions.has(permissionCode)) return true;
  
  // 检查通配符匹配
  const parts = permissionCode.split(':');
  for (let i = parts.length - 1; i >= 0; i--) {
    const wildcard = parts.slice(0, i + 1).join(':') + ':*';
    if (permissions.has(wildcard)) return true;
  }
  
  // 检查超级通配符
  if (permissions.has('*')) return true;
  
  return false;
}

/**
 * 检查用户是否有多个权限中的任意一个
 */
export async function checkAnyPermission(
  userId: string,
  permissionCodes: string[]
): Promise<boolean> {
  for (const code of permissionCodes) {
    if (await checkUserPermission(userId, code)) return true;
  }
  return false;
}

/**
 * 检查用户是否有所有指定权限
 */
export async function checkAllPermissions(
  userId: string,
  permissionCodes: string[]
): Promise<boolean> {
  for (const code of permissionCodes) {
    if (!(await checkUserPermission(userId, code))) return false;
  }
  return true;
}

/**
 * 获取用户所有有效权限（合并角色+岗位+个人）
 */
export async function getUserAllPermissions(userId: string): Promise<Set<string>> {
  // 检查缓存
  const cached = permissionCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached.permissions;
  }

  const supabase = getSupabaseClient();
  const permissions = new Set<string>();

  try {
    // 1. 获取用户角色
    const { data: userRoles } = await supabase
      .from('user_roles_v2')
      .select('role_id')
      .eq('user_id', userId);

    const roleIds = (userRoles || []).map(r => r.role_id);

    // 检查是否超级管理员
    if (roleIds.length > 0) {
      const { data: superAdmin } = await supabase
        .from('roles_v2')
        .select('id')
        .eq('code', 'super_admin')
        .in('id', roleIds)
        .single();

      if (superAdmin) {
        permissions.add('*');
        return permissions;
      }
    }

    // 2. 获取角色权限
    if (roleIds.length > 0) {
      const { data: rolePerms } = await supabase
        .from('role_permissions_v2')
        .select('permission:permissions_v2(code)')
        .in('role_id', roleIds);

      (rolePerms || []).forEach(p => {
        const code = (p.permission as any)?.code;
        if (code) permissions.add(code);
      });
    }

    // 3. 获取用户岗位
    const { data: userPositions } = await supabase
      .from('user_positions_v2')
      .select('position_id')
      .eq('user_id', userId);

    const positionIds = (userPositions || []).map(p => p.position_id);

    // 4. 获取岗位权限
    if (positionIds.length > 0) {
      const { data: posPerms } = await supabase
        .from('position_permissions_v2')
        .select('permission:permissions_v2(code)')
        .in('position_id', positionIds);

      (posPerms || []).forEach(p => {
        const code = (p.permission as any)?.code;
        if (code) permissions.add(code);
      });
    }

    // 5. 获取用户个人权限覆盖
    const { data: userPerms } = await supabase
      .from('user_permissions_v2')
      .select('is_granted, permission:permissions_v2(code), expires_at')
      .eq('user_id', userId);

    (userPerms || []).forEach(up => {
      const code = (up.permission as any)?.code;
      if (!code) return;

      // 检查过期
      if (up.expires_at && new Date(up.expires_at) < new Date()) return;

      if (up.is_granted) {
        permissions.add(code);
      } else {
        permissions.delete(code);
      }
    });

  } catch (error) {
    console.error('[权限检查] 获取权限失败:', error);
  }

  // 更新缓存
  permissionCache.set(userId, {
    permissions,
    expires: Date.now() + CACHE_TTL,
  });

  return permissions;
}

/**
 * 清除用户权限缓存
 */
export function clearPermissionCache(userId?: string) {
  if (userId) {
    permissionCache.delete(userId);
  } else {
    permissionCache.clear();
  }
}

/**
 * 获取用户权限列表（用于前端展示）
 */
export async function getUserPermissionList(userId: string) {
  const permissions = await getUserAllPermissions(userId);
  return Array.from(permissions);
}

/**
 * 检查资源操作权限（简化版）
 * @param userId 用户ID
 * @param module 模块代码
 * @param resource 资源代码
 * @param action 操作代码
 */
export async function checkPermission(
  userId: string,
  module: string,
  resource: string,
  action: string
): Promise<boolean> {
  const permCode = `${module}:${resource}:${action}`;
  return checkUserPermission(userId, permCode);
}

// 导出兼容旧版的方法
export { checkPermission as hasPermission };
