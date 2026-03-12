/**
 * 品牌隔离工具函数
 * 用于统一处理 API 接口的认证和品牌隔离
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { canViewAllBrands, canManageAllBrands } from '@/lib/permissions';

/**
 * 认证并获取用户品牌信息
 * @param request NextRequest
 * @returns 用户信息或错误响应
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  user: { userId: string; email: string; brand: string; roles: any[] };
} | NextResponse> {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  return { user: authResult };
}

/**
 * 构建品牌过滤查询
 * @param query Supabase 查询对象
 * @param userBrand 用户品牌
 * @param brandFilter 请求的品牌过滤参数
 * @param brandColumn 品牌字段名，默认为 'brand'
 * @returns 过滤后的查询对象
 */
export async function applyBrandFilterQuery<T extends { eq: (column: string, value: any) => T }>(
  query: T,
  userBrand: string,
  brandFilter?: string | null,
  brandColumn: string = 'brand'
): Promise<T> {
  const canViewAll = await canViewAllBrands('', userBrand);
  
  if (!canViewAll) {
    // 非管理员只能看自己品牌
    return query.eq(brandColumn, userBrand) as T;
  } else if (brandFilter && brandFilter !== 'all') {
    // 管理员指定品牌过滤
    return query.eq(brandColumn, brandFilter) as T;
  }
  
  // 管理员查看所有
  return query;
}

/**
 * 检查是否有权限操作指定品牌的数据
 * @param userBrand 用户品牌
 * @param targetBrand 目标品牌
 * @returns 是否有权限
 */
export async function checkBrandOperationPermission(
  userBrand: string,
  targetBrand: string
): Promise<{ allowed: boolean; error?: string }> {
  const canManageAll = await canManageAllBrands(userBrand);
  
  if (!canManageAll && targetBrand !== userBrand) {
    return {
      allowed: false,
      error: '无权限操作该品牌的数据'
    };
  }
  
  return { allowed: true };
}

/**
 * 获取品牌过滤条件
 * @param userBrand 用户品牌
 * @param brandFilter 请求的品牌过滤参数
 * @returns 品牌过滤值，null 表示不过滤
 */
export async function getBrandFilterValue(
  userBrand: string,
  brandFilter?: string | null
): Promise<string | null> {
  const canViewAll = await canViewAllBrands('', userBrand);
  
  if (!canViewAll) {
    // 非管理员只能看自己品牌
    return userBrand;
  } else if (brandFilter && brandFilter !== 'all') {
    // 管理员指定品牌过滤
    return brandFilter;
  }
  
  // 管理员查看所有
  return null;
}
