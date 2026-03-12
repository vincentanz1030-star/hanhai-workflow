import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { PoolClient } from 'pg';
import { getPgClient, shouldUseLocalDatabase } from './pg-client';

let envLoaded = false;

interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

function loadEnv(): void {
  // 如果已经加载过环境变量，直接返回（缓存机制）
  if (envLoaded) {
    return;
  }

  // 首先尝试使用 dotenv 加载 .env.local
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch {
    // dotenv not available
  }
  
  // 然后尝试默认的 .env
  try {
    require('dotenv').config();
  } catch {
    // dotenv not available
  }

  // 尝试从 coze workload identity 获取环境变量
  try {
    const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;

    const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        // 更新环境变量
        process.env[key] = value;
      }
    }

    envLoaded = true;
  } catch {
    // Silently fail
  }
}

function getSupabaseCredentials(): SupabaseCredentials {
  loadEnv();

  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;

  console.log('[DB Credentials] URL exists:', !!url);
  console.log('[DB Credentials] AnonKey exists:', !!anonKey, anonKey ? `(length: ${anonKey.length})` : '');

  if (!url) {
    throw new Error('COZE_SUPABASE_URL is not set');
  }
  if (!anonKey) {
    throw new Error('COZE_SUPABASE_ANON_KEY is not set');
  }

  return { url, anonKey };
}

// 统一的数据库客户端类型 - 使用 any 避免类型冲突
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DatabaseClient = any;

function getSupabaseClient(token?: string): DatabaseClient {
  // 检查是否应该使用本地数据库
  if (shouldUseLocalDatabase()) {
    console.log('[DB] Using local PostgreSQL database');
    return getPgClient();
  }

  // 否则使用 Supabase HTTP API
  console.log('[DB] Using Supabase HTTP API');
  const { url, anonKey } = getSupabaseCredentials();

  const clientOptions = {
    db: {
      schema: 'public' as const,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'Cache-Control': 'no-cache',
      },
    },
  };

  if (token) {
    return createClient(url, anonKey, {
      ...clientOptions,
      global: {
        ...clientOptions.global,
        headers: {
          ...clientOptions.global.headers,
          Authorization: `Bearer ${token}`,
        },
      },
    });
  }

  return createClient(url, anonKey, clientOptions);
}

// 获取本地数据库客户端（用于需要原始 pg 访问的场景）
function getLocalDbClient() {
  return getPgClient();
}

// 检查当前是否使用本地数据库
function isUsingLocalDatabase(): boolean {
  return shouldUseLocalDatabase();
}

export { 
  loadEnv, 
  getSupabaseCredentials, 
  getSupabaseClient,
  getLocalDbClient,
  isUsingLocalDatabase
};
