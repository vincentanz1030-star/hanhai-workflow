'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface RealtimeDataProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // 默认30秒
  onRefresh?: () => Promise<void>;
  children?: React.ReactNode;
  title?: string;
  description?: string;
}

export function RealtimeData({
  autoRefresh = true,
  refreshInterval = 30000,
  onRefresh,
  children,
  title = '实时数据',
  description = '数据自动刷新中',
}: RealtimeDataProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // 手动刷新
  const handleRefresh = useCallback(async () => {
    if (!isMountedRef.current || isRefreshing) return;

    setIsRefreshing(true);
    setRefreshError(null);

    try {
      if (onRefresh) {
        await onRefresh();
      }

      if (isMountedRef.current) {
        setLastRefreshTime(new Date());
        setRefreshCount(prev => prev + 1);
        setIsConnected(true);
      }
    } catch (error) {
      if (isMountedRef.current) {
        const errorMsg = error instanceof Error ? error.message : '刷新失败';
        setRefreshError(errorMsg);
        setIsConnected(false);
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [onRefresh, isRefreshing]);

  // 启动自动刷新
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    // 首次加载时刷新一次
    handleRefresh();

    // 设置定时刷新
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current && !isRefreshing) {
        handleRefresh();
      }
    }, refreshInterval);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, refreshInterval, onRefresh, handleRefresh, isRefreshing]);

  // 切换自动刷新
  const toggleAutoRefresh = (enabled: boolean) => {
    if (!enabled && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // 如果重新启用，useEffect 会自动处理
  };

  // 格式化最后刷新时间
  const formatLastRefresh = () => {
    if (!lastRefreshTime) return '从未刷新';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastRefreshTime.getTime()) / 1000);

    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    return lastRefreshTime.toLocaleTimeString('zh-CN');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              {title}
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* 自动刷新开关 */}
            <div className="flex items-center gap-2">
              <Switch
                checked={autoRefresh}
                onCheckedChange={toggleAutoRefresh}
                disabled={!onRefresh}
              />
              <span className="text-xs text-muted-foreground">自动刷新</span>
            </div>

            {/* 手动刷新按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || !onRefresh}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">刷新</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 状态信息 */}
        <div className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">最后刷新:</span>
              <span className="font-medium">{formatLastRefresh()}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">刷新次数:</span>
              <Badge variant="secondary">{refreshCount}</Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {autoRefresh && (
              <Badge variant="outline">
                {Math.floor(refreshInterval / 1000)}秒/次
              </Badge>
            )}
          </div>
        </div>

        {/* 错误提示 */}
        {refreshError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4" />
              <span>{refreshError}</span>
            </div>
          </div>
        )}

        {/* 内容区域 */}
        <div className={isRefreshing ? 'opacity-50' : ''}>
          {children}
        </div>

        {/* 刷新指示器 */}
        {isRefreshing && (
          <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right-4">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">正在刷新...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// 使用示例：
/*
<RealtimeData
  autoRefresh={true}
  refreshInterval={30000} // 30秒
  onRefresh={async () => {
    // 刷新数据的逻辑
    await fetchData();
  }}
  title="项目数据"
  description="实时同步最新项目信息"
>
  <ProjectDataDisplay />
</RealtimeData>
*/
