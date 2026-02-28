'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DiagnosticsResult {
  success: boolean;
  logs: string[];
  envCheck: {
    supabaseUrl: string;
    supabaseKey: string;
    jwtSecret: string;
    nodeEnv: string;
  };
  timezone: string;
  timestamp: string;
  error?: string;
}

export default function DeployDiagnosticsPage() {
  const [result, setResult] = useState<DiagnosticsResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/deploy-diagnostics');
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      console.error('诊断失败:', error);
      alert('诊断请求失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 自动运行诊断
    runDiagnostics();
  }, []);

  const downloadLogs = () => {
    if (!result) return;

    const logContent = result.logs.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deploy-diagnostics-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">部署环境诊断工具</h1>
          <p className="text-muted-foreground">
            检查部署环境的数据库连接、时区设置、项目创建逻辑等
          </p>
        </div>

        {/* 控制按钮 */}
        <div className="flex gap-3">
          <Button
            onClick={runDiagnostics}
            disabled={loading}
          >
            {loading ? '诊断中...' : '重新运行诊断'}
          </Button>

          {result && (
            <Button
              variant="outline"
              onClick={downloadLogs}
            >
              下载诊断日志
            </Button>
          )}
        </div>

        {/* 加载状态 */}
        {loading && !result && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                <span>正在运行诊断，请稍候...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 诊断结果 */}
        {result && (
          <>
            {/* 总体状态 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>诊断结果</span>
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? '✅ 通过' : '❌ 失败'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  运行时间: {new Date(result.timestamp).toLocaleString('zh-CN')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 环境变量 */}
                <div>
                  <h3 className="font-semibold mb-2">环境变量检查</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span className="text-muted-foreground">Supabase URL:</span>
                      <Badge variant={result.envCheck.supabaseUrl === '已配置' ? 'default' : 'destructive'}>
                        {result.envCheck.supabaseUrl}
                      </Badge>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span className="text-muted-foreground">Supabase Key:</span>
                      <Badge variant={result.envCheck.supabaseKey === '已配置' ? 'default' : 'destructive'}>
                        {result.envCheck.supabaseKey}
                      </Badge>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span className="text-muted-foreground">JWT Secret:</span>
                      <Badge variant={result.envCheck.jwtSecret === '已配置' ? 'default' : 'destructive'}>
                        {result.envCheck.jwtSecret}
                      </Badge>
                    </div>
                    <div className="flex justify-between p-2 bg-muted rounded">
                      <span className="text-muted-foreground">Node 环境:</span>
                      <Badge>{result.envCheck.nodeEnv}</Badge>
                    </div>
                  </div>
                </div>

                {/* 时区 */}
                <div>
                  <h3 className="font-semibold mb-2">时区信息</h3>
                  <div className="p-2 bg-muted rounded text-sm">
                    <span className="text-muted-foreground">时区: </span>
                    {result.timezone}
                  </div>
                </div>

                {/* 错误信息 */}
                {result.error && (
                  <div>
                    <h3 className="font-semibold mb-2">错误信息</h3>
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                      {result.error}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 详细日志 */}
            <Card>
              <CardHeader>
                <CardTitle>详细日志</CardTitle>
                <CardDescription>
                  共 {result.logs.length} 条日志
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-1 max-h-[600px] overflow-y-auto">
                  {result.logs.map((log, index) => {
                    const isError = log.includes('❌');
                    const isSuccess = log.includes('✅');
                    const isWarning = log.includes('⚠️');

                    return (
                      <div
                        key={index}
                        className={`${
                          isError ? 'text-red-600 dark:text-red-400' :
                          isSuccess ? 'text-green-600 dark:text-green-400' :
                          isWarning ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-muted-foreground'
                        }`}
                      >
                        {log}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
