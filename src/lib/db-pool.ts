/**
 * Supabase 连接池管理器
 * 用于解决 Vercel Serverless 环境下的数据库连接问题
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { 
  getSupabaseClient as getBaseClient,
  loadEnv
} from '@/storage/database/supabase-client';

// 确保环境变量已加载
loadEnv();

// 全局连接池
let supabaseClient: SupabaseClient | null = null;
let lastConnectionTime = 0;
const CONNECTION_TTL = 60000; // 60秒连接缓存

/**
 * 获取 Supabase 客户端（带连接池和重试）
 */
export function getSupabaseClient(): SupabaseClient {
  const now = Date.now();
  
  // 如果连接存在且未过期，复用连接
  if (supabaseClient && (now - lastConnectionTime) < CONNECTION_TTL) {
    return supabaseClient;
  }

  // 使用统一的客户端获取方法
  supabaseClient = getBaseClient() as SupabaseClient;
  lastConnectionTime = now;
  return supabaseClient;
}

/**
 * 带重试的数据库查询
 */
export async function queryWithRetry<T>(
  queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>,
  maxRetries = 3
): Promise<{ data: T | null; error: any }> {
  let lastError: any = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const client = getSupabaseClient();
      const result = await queryFn(client);
      
      if (!result.error) {
        return result;
      }
      
      lastError = result.error;
      
      // 如果是连接错误，等待后重试
      if (isConnectionError(result.error)) {
        console.log(`[DB重试] 第 ${i + 1} 次重试...`);
        await sleep(500 * (i + 1)); // 递增延迟
        continue;
      }
      
      // 其他错误直接返回
      return result;
    } catch (err) {
      lastError = err;
      console.error(`[DB异常] 第 ${i + 1} 次尝试失败:`, err);
      await sleep(500 * (i + 1));
    }
  }
  
  return { data: null, error: lastError };
}

/**
 * 判断是否为连接错误
 */
function isConnectionError(error: any): boolean {
  if (!error) return false;
  
  const connectionErrorCodes = [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNREFUSED',
    'ETIMEDOUT',
  ];
  
  const errorMessage = error.message || '';
  const errorCode = error.code || '';
  
  return connectionErrorCodes.some(code => 
    errorMessage.includes(code) || errorCode === code
  );
}

/**
 * 延迟函数
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 健康检查
 */
export async function checkDatabaseHealth(): Promise<{ 
  healthy: boolean; 
  latency?: number; 
  error?: string 
}> {
  const start = Date.now();
  
  try {
    const client = getSupabaseClient();
    const { error } = await client
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      return { healthy: false, error: error.message };
    }
    
    return { 
      healthy: true, 
      latency: Date.now() - start 
    };
  } catch (err: any) {
    return { 
      healthy: false, 
      error: err.message || '未知错误' 
    };
  }
}
