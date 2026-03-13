import { NextRequest, NextResponse } from 'next/server';

/**
 * 速率限制配置
 */
interface RateLimitConfig {
  windowMs: number; // 时间窗口（毫秒）
  maxRequests: number; // 最大请求数
  message?: string; // 自定义错误消息
}

/**
 * 速率限制存储
 * 使用内存存储，适合单实例部署
 * 如果是多实例部署，建议使用 Redis
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * 清理过期的速率限制记录
 */
function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// 每分钟清理一次过期记录
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRecords, 60 * 1000);
}

/**
 * 获取客户端标识符
 * 优先使用 X-Forwarded-For 头，其次使用 X-Real-IP，最后使用一个默认值
 */
function getClientIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwardedFor) {
    // X-Forwarded-For 可能包含多个 IP，取第一个
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  // 如果无法获取 IP，使用一个默认标识符
  return 'unknown-client';
}

/**
 * 速率限制中间件
 * @param request Next.js 请求对象
 * @param config 速率限制配置
 * @param identifier 自定义标识符（如用户名、邮箱等），用于更精确的限制
 * @returns 如果超过限制，返回 429 响应；否则返回 null
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  identifier?: string
): NextResponse | null {
  const clientIp = getClientIdentifier(request);
  const key = identifier ? `${clientIp}:${identifier}` : clientIp;
  
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // 创建新记录
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return null;
  }
  
  if (record.count >= config.maxRequests) {
    // 超过限制
    const remainingTime = Math.ceil((record.resetTime - now) / 1000);
    const response = NextResponse.json(
      {
        error: config.message || '请求过于频繁，请稍后再试',
        retryAfter: remainingTime,
      },
      { status: 429 }
    );
    response.headers.set('Retry-After', remainingTime.toString());
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', record.resetTime.toString());
    return response;
  }
  
  // 增加计数
  record.count++;
  return null;
}

/**
 * 预设的速率限制配置
 */
export const rateLimitPresets = {
  // 登录接口：每 15 分钟最多 5 次尝试（每个 IP + 邮箱组合）
  login: {
    windowMs: 15 * 60 * 1000, // 15 分钟
    maxRequests: 5,
    message: '登录尝试次数过多，请 15 分钟后再试',
  },
  // 注册接口：每小时最多 3 次尝试（每个 IP）
  register: {
    windowMs: 60 * 60 * 1000, // 1 小时
    maxRequests: 3,
    message: '注册请求过于频繁，请 1 小时后再试',
  },
  // 密码修改：每小时最多 5 次
  changePassword: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
    message: '密码修改请求过于频繁，请稍后再试',
  },
  // 通用 API：每分钟最多 60 次
  api: {
    windowMs: 60 * 1000,
    maxRequests: 60,
    message: '请求过于频繁，请稍后再试',
  },
} as const;

/**
 * 创建速率限制响应头
 */
export function getRateLimitHeaders(
  config: RateLimitConfig,
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetTime.toString(),
  };
}
