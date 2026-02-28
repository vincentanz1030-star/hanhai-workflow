import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// 需要认证的路由
const protectedRoutes = ['/'];
// 公开路由（不需要认证）
const publicRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否是公开路由
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 获取Token
  const token = request.cookies.get('auth_token')?.value;

  // 如果没有Token且不是公开路由，重定向到登录页
  if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 验证Token
  if (token) {
    const payload = verifyToken(token);
    if (!payload) {
      // Token无效，清除并重定向到登录页
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - api (API路由)
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (favicon文件)
     * - public folder (public文件夹)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
