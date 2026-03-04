/**
 * 数据中台 - 核心服务层
 * 提供统一的数据访问、聚合、缓存能力
 */

import { createClient } from '@supabase/supabase-js';

// 数据源配置
const DATA_SOURCES = {
  projects: '/api/projects',
  tasks: '/api/tasks',
  users: '/api/users',
  collaborations: '/api/collaboration-tasks',
  weeklyPlans: '/api/weekly-work-plans',
  salesTargets: '/api/sales-targets',
  productCategories: '/api/product-categories',
  feedback: '/api/feedback',
  notifications: '/api/notifications',
  reports: '/api/reports',
  performance: '/api/performance',
  efficiency: '/api/efficiency',
  workload: '/api/workload',
  criticalPath: '/api/critical-path',
};

// 数据缓存接口
interface DataCache<T> {
  data: T | null;
  timestamp: number;
  expireAt: number;
}

// 缓存存储
const cacheStore = new Map<string, DataCache<any>>();

// 缓存配置
const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000, // 默认5分钟
  projectTTL: 2 * 60 * 1000, // 项目数据2分钟
  taskTTL: 1 * 60 * 1000, // 任务数据1分钟
  analyticsTTL: 10 * 60 * 1000, // 分析数据10分钟
};

/**
 * 数据中台核心类
 */
export class DataPlatform {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(source: string, params: Record<string, any> = {}): string {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    return `${source}?${paramString}`;
  }

  /**
   * 获取缓存数据
   */
  private getCache<T>(key: string): T | null {
    const cached = cacheStore.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expireAt) {
      cacheStore.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * 设置缓存数据
   */
  private setCache<T>(key: string, data: T, ttl: number = CACHE_CONFIG.defaultTTL): void {
    const cache: DataCache<T> = {
      data,
      timestamp: Date.now(),
      expireAt: Date.now() + ttl,
    };
    cacheStore.set(key, cache);
  }

  /**
   * 清除缓存
   */
  public clearCache(pattern?: string): void {
    if (!pattern) {
      cacheStore.clear();
      return;
    }

    for (const key of cacheStore.keys()) {
      if (key.includes(pattern)) {
        cacheStore.delete(key);
      }
    }
  }

  /**
   * 统一数据获取方法
   */
  async fetchData<T>(
    source: string,
    params: Record<string, any> = {},
    options: {
      useCache?: boolean;
      ttl?: number;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T | null> {
    const { useCache = true, ttl, headers } = options;
    const cacheKey = this.getCacheKey(source, params);

    // 尝试从缓存获取
    if (useCache) {
      const cached = this.getCache<T>(cacheKey);
      if (cached) {
        console.log(`[DataPlatform] Cache hit: ${cacheKey}`);
        return cached;
      }
    }

    try {
      const url = new URL(this.baseURL + DATA_SOURCES[source as keyof typeof DATA_SOURCES], window.location.origin);
      Object.keys(params).forEach(key => url.searchParams.append(key, String(params[key])));

      const response = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // 缓存数据
      if (useCache) {
        const cacheTTL = ttl || this.getCacheTTL(source);
        this.setCache(cacheKey, data, cacheTTL);
      }

      return data;
    } catch (error) {
      console.error(`[DataPlatform] Fetch error: ${source}`, error);
      return null;
    }
  }

  /**
   * 根据数据源获取缓存TTL
   */
  private getCacheTTL(source: string): number {
    if (source === 'projects') return CACHE_CONFIG.projectTTL;
    if (source === 'tasks') return CACHE_CONFIG.taskTTL;
    if (['reports', 'performance', 'efficiency'].includes(source)) return CACHE_CONFIG.analyticsTTL;
    return CACHE_CONFIG.defaultTTL;
  }

  /**
   * 批量获取数据
   */
  async batchFetch<T>(
    requests: Array<{
      source: string;
      params?: Record<string, any>;
      options?: any;
    }>
  ): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();
    const promises = requests.map(async (req, index) => {
      const data = await this.fetchData<T>(req.source, req.params, req.options);
      return { index, data, key: this.getCacheKey(req.source, req.params) };
    });

    const responses = await Promise.all(promises);
    responses.forEach(({ index, data, key }) => {
      results.set(key, data);
    });

    return results;
  }

  /**
   * 数据聚合 - 聚合多个数据源的数据
   */
  async aggregateData<T>(
    sources: string[],
    aggregator: (dataMap: Map<string, any>) => T
  ): Promise<T | null> {
    const requests = sources.map(source => ({ source }));
    const dataMap = await this.batchFetch<any>(requests);

    return aggregator(dataMap);
  }
}

// 创建全局数据中台实例
let dataPlatformInstance: DataPlatform | null = null;

/**
 * 获取数据中台实例（单例模式）
 */
export function getDataPlatform(): DataPlatform {
  if (!dataPlatformInstance) {
    dataPlatformInstance = new DataPlatform();
  }
  return dataPlatformInstance;
}

/**
 * 数据中台钩子（React Hook）
 */
export function useDataPlatform() {
  return {
    dataPlatform: getDataPlatform(),
    clearCache: (pattern?: string) => getDataPlatform().clearCache(pattern),
  };
}
