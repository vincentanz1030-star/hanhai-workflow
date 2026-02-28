import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getTokenFromRequest as getTokenFromRequestHelper } from '@/lib/token-helper';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // Token过期时间

/**
 * 密码加密
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 生成JWT Token
 */
export function generateToken(payload: {
  userId: string;
  email: string;
  brand: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * 验证JWT Token
 */
export function verifyToken(token: string): {
  userId: string;
  email: string;
  brand: string;
} | null {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      brand: string;
    };
  } catch (error) {
    return null;
  }
}

/**
 * 从请求中获取Token
 */
export async function getTokenFromRequest(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  return token || null;
}

/**
 * 设置Token到Cookie
 */
export async function setTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7天
    path: '/',
  });
}

/**
 * 清除Token Cookie
 */
export async function clearTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

/**
 * 从请求中获取当前用户信息（支持Request对象）
 */
export async function getCurrentUser(request?: Request): Promise<{
  userId: string;
  email: string;
  brand: string;
} | null> {
  const token = await getTokenFromRequestHelper(request);
  if (!token) return null;

  return verifyToken(token);
}
