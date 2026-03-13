import { NextRequest, NextResponse } from 'next/server';

/**
 * 检查是否为生产环境
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * 诊断 API 禁用中间件
 * 在生产环境中禁用诊断 API，返回 404
 */
export function disableInProduction(
  request: NextRequest,
  handlerName?: string
): NextResponse | null {
  if (isProduction()) {
    const path = request.nextUrl.pathname;
    console.warn(`[安全警告] 生产环境禁用诊断 API: ${path}`);
    
    return NextResponse.json(
      { 
        error: 'Not Found',
        message: '该接口在当前环境不可用'
      },
      { status: 404 }
    );
  }
  
  return null;
}

/**
 * 获取诊断 API 列表
 */
export const diagnosticApiPaths = [
  '/api/diagnostic',
  '/api/diagnostic/create-admin',
  '/api/diagnostic/env-check',
  '/api/diagnostic/env',
  '/api/diagnostic/test-login',
  '/api/diagnostic/user-status',
  '/api/diagnostics',
  '/api/diagnostics/auth-check',
  '/api/diagnostics/env-check',
  '/api/diagnostics/password-check',
  '/api/diagnostics/storage-advanced',
  '/api/diagnostics/storage-check',
  '/api/diagnostics/storage-config-test',
  '/api/diagnostics/storage-endpoint',
  '/api/diagnostics/storage-env',
  '/api/diagnostics/storage-simple',
  '/api/diagnostics/storage-workload-identity',
  '/api/diagnostics/user-check',
  '/api/deploy-diagnostics',
  '/api/full-diagnostic',
  '/api/health-check',
  '/api/health',
] as const;

/**
 * 检查路径是否为诊断 API
 */
export function isDiagnosticApi(path: string): boolean {
  return diagnosticApiPaths.some(apiPath => 
    path === apiPath || path.startsWith(`${apiPath}/`)
  );
}
