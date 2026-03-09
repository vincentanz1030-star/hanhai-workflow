'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, RefreshCw } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  brand: string;
  status: string;
  is_active: boolean;
  created_at: string;
}

export default function LoginDiagnosticPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [testName, setTestName] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // 加载用户列表
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/diagnostic/user-status');
      const data = await response.json();

      if (data.success) {
        setUsers(data.users || []);
        if (data.users && data.users.length > 0) {
          setTestResult({ success: true, message: `✅ 成功加载 ${data.users.length} 个用户` });
        } else {
          setTestResult({ success: false, message: '⚠️ 系统中暂无用户，请先创建测试用户' });
        }
      } else {
        setTestResult({ success: false, message: `❌ 加载用户失败: ${data.error}` });
      }
    } catch (error) {
      setTestResult({ success: false, message: `❌ 加载用户出错: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  const createTestUser = async () => {
    if (!testEmail || !testPassword || !testName) {
      setTestResult({ success: false, message: '❌ 请填写完整的用户信息' });
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/diagnostic/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_user',
          email: testEmail,
          password: testPassword,
          name: testName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({ success: true, message: `✅ 测试用户创建成功: ${data.user.name} (${data.user.email})` });
        loadUsers(); // 刷新用户列表
      } else {
        setTestResult({ success: false, message: `❌ 创建用户失败: ${data.error}` });
      }
    } catch (error) {
      setTestResult({ success: false, message: `❌ 创建用户出错: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setTestLoading(false);
    }
  };

  const testLogin = async () => {
    if (!testEmail || !testPassword) {
      setTestResult({ success: false, message: '❌ 请填写邮箱和密码' });
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: `✅ 登录成功!\n用户: ${data.user.name} (${data.user.email})\n角色: ${data.user.role}\n品牌: ${data.user.brand}\nToken: ${data.token.substring(0, 20)}...`
        });
      } else {
        setTestResult({ success: false, message: `❌ 登录失败: ${data.error}` });
      }
    } catch (error) {
      setTestResult({ success: false, message: `❌ 登录出错: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setTestLoading(false);
    }
  };

  const getStatusBadge = (user: User) => {
    if (!user.is_active) {
      return <span className="text-red-600 font-semibold">已禁用</span>;
    }

    switch (user.status) {
      case 'active':
        return <span className="text-green-600 font-semibold">正常</span>;
      case 'pending':
        return <span className="text-yellow-600 font-semibold">审核中</span>;
      case 'rejected':
        return <span className="text-red-600 font-semibold">已拒绝</span>;
      case 'suspended':
        return <span className="text-orange-600 font-semibold">已暂停</span>;
      default:
        return <span className="text-gray-600 font-semibold">{user.status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">登录诊断工具</h1>
            <p className="text-muted-foreground">
              查看用户状态、创建测试用户并测试登录功能
            </p>
          </div>
          <Button onClick={loadUsers} variant="outline" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>

        {/* 创建测试用户 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              创建测试用户
            </CardTitle>
            <CardDescription>
              如果系统中没有用户，可以创建一个测试用户来测试登录功能
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">用户名</label>
                  <Input
                    placeholder="测试用户"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">邮箱</label>
                  <Input
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">密码</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={createTestUser} disabled={testLoading}>
                  {testLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    '创建测试用户'
                  )}
                </Button>
                <Button onClick={testLogin} variant="outline" disabled={testLoading}>
                  {testLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      测试中...
                    </>
                  ) : (
                    '测试登录'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 用户列表 */}
        <Card>
          <CardHeader>
            <CardTitle>用户列表</CardTitle>
            <CardDescription>
              当前系统中的所有用户及其状态
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">暂无用户</p>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setTestEmail(user.email);
                      setTestName(user.name);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <p className="text-muted-foreground text-sm">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p>{getStatusBadge(user)}</p>
                        <p className="text-xs text-muted-foreground mt-1">品牌: {user.brand}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 测试结果 */}
        {testResult && (
          <Alert variant={testResult.success ? 'default' : 'destructive'}>
            <AlertDescription className="whitespace-pre-wrap font-mono text-sm">
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}

        {/* 环境检查 */}
        <Card>
          <CardHeader>
            <CardTitle>环境检查</CardTitle>
            <CardDescription>
              检查数据库连接和环境变量配置
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={async () => {
              try {
                const response = await fetch('/api/diagnostic/env');
                const data = await response.json();
                setTestResult({
                  success: data.success,
                  message: JSON.stringify(data, null, 2)
                });
              } catch (error) {
                setTestResult({
                  success: false,
                  message: `检查失败: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
              }
            }} variant="outline">
              检查环境变量
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
