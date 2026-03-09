'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'ok' | 'error';
  message: string;
  duration?: number;
}

export default function DiagnosticPage() {
  const [loading, setLoading] = useState(false);
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [overall, setOverall] = useState<'ok' | 'error'>('error');
  const [timestamp, setTimestamp] = useState<string>('');

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health-check');
      const data = await response.json();
      setChecks(data.checks);
      setOverall(data.overall);
      setTimestamp(data.timestamp);
    } catch (error) {
      setChecks([{
        name: '请求失败',
        status: 'error',
        message: error instanceof Error ? error.message : '未知错误',
      }]);
      setOverall('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">系统诊断</h1>
            <p className="text-muted-foreground mt-1">
              {timestamp ? `最后检查: ${new Date(timestamp).toLocaleString('zh-CN')}` : '等待检查...'}
            </p>
          </div>
          <Button onClick={runHealthCheck} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            重新检查
          </Button>
        </div>

        {/* 整体状态 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {overall === 'ok' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  系统正常
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  系统异常
                </>
              )}
            </CardTitle>
            <CardDescription>
              {overall === 'ok'
                ? '所有检查项均通过，系统运行正常'
                : '检测到异常，请查看下面的详细信息'}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* 检查详情 */}
        <Card>
          <CardHeader>
            <CardTitle>检查详情</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {checks.map((check, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{check.name}</span>
                        <Badge variant={check.status === 'ok' ? 'default' : 'destructive'}>
                          {check.status === 'ok' ? '正常' : '异常'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{check.message}</p>
                      {check.duration !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1">
                          耗时: {check.duration}ms
                        </p>
                      )}
                    </div>
                    {check.status === 'ok' ? (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 ml-4" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 ml-4" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 常见问题 */}
        <Card>
          <CardHeader>
            <CardTitle>常见问题</CardTitle>
            <CardDescription>
              如果系统异常，请尝试以下解决方案
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. 数据库连接失败</h4>
              <p className="text-sm text-muted-foreground">
                请检查 Supabase 环境变量是否正确配置，确认 Supabase 项目是否正常运行。
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. 用户表查询失败</h4>
              <p className="text-sm text-muted-foreground">
                请确认数据库已正确初始化，users 表是否存在且包含数据。
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. 无法登录</h4>
              <p className="text-sm text-muted-foreground">
                请尝试清除浏览器缓存和 localStorage，然后重新登录。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 快捷操作 */}
        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/login'}>
              前往登录页面
            </Button>
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/register'}>
              前往注册页面
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
