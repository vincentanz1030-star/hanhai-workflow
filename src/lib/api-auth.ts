import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { checkPermission, getUserRoles, isAdmin } from '@/lib/permissions';

/**
 * 用户角色类型
 */
export interface UserRole {
  user_id: string;
  role: string;
  created_at?: string;
}

/**
 * 认证用户信息类型
 */
export interface AuthUser {
  userId: string;
  email: string;
  brand: string;
  roles: UserRole[];
}

/**
 * 类型守卫：判断认证结果是否为用户对象
 */
export function isAuthUser(result: AuthUser | NextResponse): result is AuthUser {
  return !(result instanceof NextResponse);
}

/**
 * API认证和权限检查
 * @param request NextRequest对象
 * @param resource 资源名称（如'project'、'task'等）
 * @param action 操作名称（如'view'、'create'、'edit'、'delete'）
 * @returns 返回用户信息或错误响应，如果返回NextResponse则说明认证/权限失败
 */
export async function requireAuth(
  request: NextRequest,
  resource?: string,
  action?: string
): Promise<AuthUser | NextResponse> {
  // 获取当前用户（传入 request 对象以支持 Authorization header）
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json(
      { error: '未登录，请先登录' },
      { status: 401 }
    );
  }

  // 使用统一的权限模块获取用户角色
  let roles: UserRole[] = [];
  try {
    const userRoles = await getUserRoles(currentUser.userId);
    roles = userRoles.map(r => ({
      user_id: currentUser.userId,
      role: r.role,
    }));
  } catch (error) {
    console.error('查询用户角色失败:', error);
    // 即使查询角色失败，也继续执行（向后兼容）
  }

  // 如果需要权限检查
  if (resource && action) {
    const hasPermission = await checkPermission(currentUser.userId, resource, action);
    if (!hasPermission) {
      return NextResponse.json(
        { error: '无权限执行此操作' },
        { status: 403 }
      );
    }
  }

  return {
    ...currentUser,
    roles,
  };
}

/**
 * 检查品牌访问权限
 * @param currentUserBrand 用户所属品牌
 * @param targetBrand 目标品牌
 * @returns 是否有权限访问
 */
export function checkBrandAccess(
  currentUserBrand: string,
  targetBrand: string
): boolean {
  // 用户可以查看所有品牌或品牌匹配
  return currentUserBrand === 'all' || currentUserBrand === targetBrand;
}

/**
 * 应用品牌过滤
 * @param currentUserBrand 用户所属品牌
 * @param query Supabase查询对象
 * @returns 过滤后的查询对象
 */
export function applyBrandFilter<T extends { eq: (column: string, value: any) => T }>(
  currentUserBrand: string,
  query: T,
  brandColumn: string = 'brand'
): T {
  if (currentUserBrand !== 'all') {
    return query.eq(brandColumn, currentUserBrand) as T;
  }
  return query;
}

/**
 * 要求用户是管理员
 * @param request NextRequest对象
 * @returns 返回用户信息或错误响应
 */
export async function requireAdmin(
  request: NextRequest
): Promise<AuthUser | NextResponse> {
  const currentUser = await getCurrentUser(request);

  if (!currentUser) {
    return NextResponse.json(
      { error: '未登录，请先登录' },
      { status: 401 }
    );
  }

  const admin = await isAdmin(currentUser.userId);
  if (!admin) {
    return NextResponse.json(
      { error: '无权限执行此操作，仅限管理员' },
      { status: 403 }
    );
  }

  // 使用统一的权限模块获取用户角色
  const userRoles = await getUserRoles(currentUser.userId);
  const roles: UserRole[] = userRoles.map(r => ({
    user_id: currentUser.userId,
    role: r.role,
  }));

  return {
    ...currentUser,
    roles,
  };
}
