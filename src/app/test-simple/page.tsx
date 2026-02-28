'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestSimplePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const test = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/simple-test', {
        credentials: 'include'
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>简单测试 - 查询所有项目</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={test} disabled={loading}>
            {loading ? '加载中...' : '查询项目'}
          </Button>

          {result && (
            <div className="mt-4">
              {result.error ? (
                <div className="text-red-500">错误: {result.error}</div>
              ) : (
                <div>
                  <h3 className="font-bold mb-2">用户信息:</h3>
                  <pre className="bg-gray-100 p-2 rounded mb-4 text-sm">
                    {JSON.stringify(result.user, null, 2)}
                  </pre>

                  <h3 className="font-bold mb-2">项目列表 (无过滤):</h3>
                  <div className="text-lg font-bold mb-2">
                    数量: {result.count}
                  </div>
                  <pre className="bg-gray-100 p-2 rounded text-sm">
                    {JSON.stringify(result.projects, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
