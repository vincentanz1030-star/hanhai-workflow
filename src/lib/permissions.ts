import { createClient } from '@supabase/supabase-js';

// 直接从环境变量获取 Supabase 配置
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: 'public' as const }
  });
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

  const roles = userRoles.map(r => r.role);

  // 检查这些角色是否有指定权限
  const { data: permissions, error: permsError } = await supabase
    .from('role_permissions')
    .select('permission_id')
    .in('role', roles);

  if (permsError || !permissions) {
    return false;
  }

  const permissionIds = permissions.map(p => p.permission_id);

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
 */
export async function canViewAllBrands(userId: string): Promise<boolean> {
  return checkPermission(userId, 'system', 'view_all');
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

  const roles = userRoles.map(r => r.role);

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

  return permissions.map(p => ({
    resource: (p.permissions as any).resource,
    action: (p.permissions as any).action,
    description: (p.permissions as any).description,
  }));
}

/**
 * 获取用户的角色列表
 */
export async function getUserRoles(userId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('user_roles')
    .select('role, is_primary')
    .eq('user_id', userId);

  if (error || !data) {
    return [];
  }

  return data;
}

/**
 * 获取用户的主角色
 */
export async function getPrimaryRole(userId: string): Promise<string | null> {
  const roles = await getUserRoles(userId);
  const primary = roles.find(r => r.is_primary);
  return primary ? primary.role : (roles[0]?.role || null);
}
