/**
 * 数据中台 - React Hooks
 * 提供便捷的数据访问能力
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDataPlatform } from '@/lib/data-platform/core';

/**
 * 使用数据中台数据的Hook
 */
export function useDataPlatformData<T>(
  source: string,
  params?: Record<string, any>,
  options?: {
    useCache?: boolean;
    ttl?: number;
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  const { useCache = true, enabled = true, refetchInterval } = options || {};
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const dataPlatform = getDataPlatform();
      const result = await dataPlatform.fetchData<T>(source, params || {}, { useCache });
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [source, params, useCache, enabled]);

  useEffect(() => {
    fetchData();

    if (refetchInterval) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refetchInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * 使用批量数据的Hook
 */
export function useDataPlatformBatch<T>(
  requests: Array<{
    source: string;
    params?: Record<string, any>;
    options?: any;
  }>,
  options: {
    enabled?: boolean;
  } = {}
) {
  const { enabled = true } = options;
  const [dataMap, setDataMap] = useState<Map<string, T | null>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const dataPlatform = getDataPlatform();
      const results = await dataPlatform.batchFetch<T>(requests);
      setDataMap(results);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [requests, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    dataMap,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * 使用聚合数据的Hook
 */
export function useDataPlatformAggregator<T>(
  sources: string[],
  aggregator: (dataMap: Map<string, any>) => T,
  options: {
    enabled?: boolean;
    refetchInterval?: number;
  } = {}
) {
  const { enabled = true, refetchInterval } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const dataPlatform = getDataPlatform();
      const result = await dataPlatform.aggregateData<T>(sources, aggregator);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [sources, aggregator, enabled]);

  useEffect(() => {
    fetchData();

    if (refetchInterval) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refetchInterval]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}

/**
 * 数据中台缓存管理Hook
 */
export function useDataPlatformCache() {
  const clearCache = useCallback((pattern?: string) => {
    const dataPlatform = getDataPlatform();
    dataPlatform.clearCache(pattern);
  }, []);

  const clearProjectCache = useCallback(() => {
    clearCache('projects');
  }, [clearCache]);

  const clearTaskCache = useCallback(() => {
    clearCache('tasks');
  }, [clearCache]);

  const clearAllCache = useCallback(() => {
    clearCache();
  }, [clearCache]);

  return {
    clearCache,
    clearProjectCache,
    clearTaskCache,
    clearAllCache,
  };
}
