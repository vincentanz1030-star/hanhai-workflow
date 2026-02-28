/**
 * 辅助函数：从请求中获取Token（支持Cookie和Authorization header）
 */
export async function getTokenFromRequest(request?: Request): Promise<string | null> {
  // 如果传入了request，先尝试从Authorization header获取
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
  }

  // 然后尝试从Cookie获取
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  return token || null;
}
