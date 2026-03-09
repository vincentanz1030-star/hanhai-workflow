/**
 * 辅助函数：从请求中获取Token（支持Cookie和Authorization header）
 */
export async function getTokenFromRequest(request?: Request | any): Promise<string | null> {
  console.log('[token-helper] 开始获取 token...');

  // 如果传入了request，先尝试从Authorization header获取
  if (request && request.headers) {
    const authHeader = request.headers.get('authorization');
    console.log('[token-helper] Authorization header:', authHeader ? authHeader.substring(0, 50) + '...' : 'null');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('[token-helper] 从 Authorization header 获取到 token，长度:', token.length);
      return token;
    }
  } else {
    console.log('[token-helper] request 或 request.headers 不存在');
  }

  // 然后尝试从Cookie获取
  console.log('[token-helper] 尝试从 Cookie 获取 token...');
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    console.log('[token-helper] Cookie 中的 token:', token ? token.substring(0, 50) + '...' : 'null');

    return token || null;
  } catch (error) {
    console.error('[token-helper] 从 Cookie 获取 token 失败:', error);
    return null;
  }
}
