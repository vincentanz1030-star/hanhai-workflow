'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TestResult {
  success: boolean;
  logs: string[];
  summary?: {
    projectId: string;
    immediateVerify: boolean;
    verify500ms: boolean;
    verify1000ms: boolean;
    newConnectionVerify: boolean;
    concurrentSuccessRate: string;
  };
  error?: string;
}

export default function TestTransactionPage() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-transaction', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      console.error('测试失败:', error);
      alert('测试请求失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 自动运行测试
    runTest();
  }, []);

  const downloadLogs = () => {
    if (!result) return;

    const logContent = result.logs.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-test-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 头部 */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">数据库事务测试</h1>
          <p className="text-muted-foreground">
            测试项目创建后在不同时间点的数据一致性
          </p>
        </div>

        {/* 控制按钮 */}
        <div className="flex gap-3">
          <Button
            onClick={runTest}
            disabled={loading}
          >
            {loading ? '测试中...' : '重新运行测试'}
          </Button>

          {result && (
            <Button
              variant="outline"
              onClick={downloadLogs}
            >
              下载测试日志
            </Button>
          )}
        </div>

        {/* 加载状态 */}
        {loading && !result && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                <span>正在运行测试，请稍候...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 测试结果 */}
        {result && (
          <>
            {/* 总体状态 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>测试结果</span>
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? '✅ 通过' : '❌ 失败'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  项目 ID: {result.summary?.projectId}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 验证结果 */}
                {result.summary && (
                  <div>
                    <h3 className="font-semibold mb-2">验证结果</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">立即验证（无延迟）:</span>
                        <Badge variant={result.summary.immediateVerify ? 'default' : 'destructive'}>
                          {result.summary.immediateVerify ? '✅ 成功' : '❌ 失败'}
                        </Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">500ms 后验证:</span>
                        <Badge variant={result.summary.verify500ms ? 'default' : 'destructive'}>
                          {result.summary.verify500ms ? '✅ 成功' : '❌ 失败'}
                        </Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">1000ms 后验证:</span>
                        <Badge variant={result.summary.verify1000ms ? 'default' : 'destructive'}>
                          {result.summary.verify1000ms ? '✅ 成功' : '❌ 失败'}
                        </Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">新连接验证:</span>
                        <Badge variant={result.summary.newConnectionVerify ? 'default' : 'destructive'}>
                          {result.summary.newConnectionVerify ? '✅ 成功' : '❌ 失败'}
                        </Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded col-span-2">
                        <span className="text-muted-foreground">并发查询成功率:</span>
                        <Badge variant={result.summary.concurrentSuccessRate === '5/5' ? 'default' : 'warning'}>
                          {result.summary.concurrentSuccessRate}
                        </Badge>
                      </div>
                    </div>

                    {/* 诊断建议 */}
                    {(!result.summary.immediateVerify ||
                     !result.summary.verify500ms ||
                     !result.summary.verify1000ms ||
                     !result.summary.newConnectionVerify ||
                     result.summary.concurrentSuccessRate !== '5/5') && (
                      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm">
                        <p className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
                          ⚠️ 检测到数据一致性问题
                        </p>
                        <p className="text-muted-foreground">
                          这可能是由于数据库事务配置、缓存问题或部署环境的多实例设置导致的。
                          请下载详细日志并提供给开发团队进行进一步分析。
                        </p>
                      </div>
                    )}
                  </div>
                )}

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
