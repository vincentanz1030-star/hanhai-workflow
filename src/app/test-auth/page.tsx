'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TestAuthPage() {
  const [token, setToken] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[TestAuth] ${message}`);
  };

  useEffect(() => {
    addLog('页面加载');
    checkLocalStorage();
    checkAuth();
  }, []);

  const checkLocalStorage = () => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        addLog(`✅ localStorage 中找到 token: ${storedToken.substring(0, 30)}...`);
      } else {
        addLog('❌ localStorage 中没有 token');
      }
    } catch (error) {
      addLog(`❌ 读取 localStorage 失败: ${error}`);
    }
  };

  const checkAuth = async () => {
    addLog('开始检查认证状态...');
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
      });

      addLog(`收到 /api/auth/me 响应，状态: ${response.status}`);

      const data = await response.json();
      addLog(`响应数据: ${JSON.stringify(data, null, 2)}`);

      if (response.ok) {
        setUser(data.user);
        addLog('✅ 认证成功');
      } else {
        addLog(`❌ 认证失败: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ 请求失败: ${error}`);
    }
  };

  const testLogin = async () => {
    addLog('开始测试登录...');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: 'admin@hanhai.com',
          password: 'admin123',
        }),
      });

      addLog(`收到 /api/auth/login 响应，状态: ${response.status}`);

      const data = await response.json();
      addLog(`响应数据: ${JSON.stringify(data, null, 2)}`);

      if (response.ok) {
        addLog('✅ 登录成功');
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
          addLog('✅ Token 已保存到 localStorage');
          setToken(data.token);
          // 重新检查认证
          setTimeout(checkAuth, 500);
        }
      } else {
        addLog(`❌ 登录失败: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ 请求失败: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">认证测试页面</h1>
          <p className="text-muted-foreground">
            诊断登录和认证问题
          </p>
        </div>

        {/* Token 状态 */}
        <Card>
          <CardHeader>
            <CardTitle>Token 状态</CardTitle>
          </CardHeader>
          <CardContent>
            {token ? (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-green-600">✅ Token 存在</div>
                <div className="text-xs text-muted-foreground font-mono break-all">
                  {token}
                </div>
              </div>
            ) : (
              <div className="text-sm font-semibold text-red-600">❌ Token 不存在</div>
            )}
          </CardContent>
        </Card>

        {/* 用户信息 */}
        <Card>
          <CardHeader>
            <CardTitle>用户信息</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <pre className="text-xs text-muted-foreground overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            ) : (
              <div className="text-sm font-semibold text-red-600">❌ 未登录</div>
            )}
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex gap-4">
          <Button onClick={testLogin}>测试登录</Button>
          <Button onClick={checkAuth} variant="outline">检查认证</Button>
          <Button onClick={checkLocalStorage} variant="outline">检查 localStorage</Button>
          <Button onClick={clearLogs} variant="outline">清空日志</Button>
        </div>

        {/* 日志 */}
        <Card>
          <CardHeader>
            <CardTitle>日志</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-auto max-h-96">
              {logs.length === 0 ? (
                <div className="text-muted-foreground">暂无日志</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
