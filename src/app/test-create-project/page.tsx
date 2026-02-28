'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestCreateProjectPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const testDebug = async () => {
    addLog('=== 运行完整诊断 ===');
    setLoading(true);
    clearLogs();

    try {
      const response = await fetch('/api/test-debug', {
        credentials: 'include'
      });
      const data = await response.json();
      addLog(`诊断响应状态: ${response.status}`);
      addLog('--- 诊断日志 ---');
      data.logs.forEach((log: string) => addLog(log));
      if (data.error) {
        addLog(`错误: ${data.error}`);
      }
    } catch (error) {
      addLog(`请求失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    addLog('=== 测试用户认证 ===');
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      const data = await response.json();
      addLog(`响应状态: ${response.status}`);
      addLog(`用户信息: ${JSON.stringify(data, null, 2)}`);
      return data;
    } catch (error) {
      addLog(`错误: ${error}`);
      return null;
    }
  };

  const testGetProjects = async () => {
    addLog('=== 测试获取项目列表 ===');
    try {
      const response = await fetch('/api/projects', {
        credentials: 'include'
      });
      const data = await response.json();
      addLog(`响应状态: ${response.status}`);
      addLog(`项目数量: ${data.projects?.length || 0}`);
      if (data.projects && data.projects.length > 0) {
        addLog(`第一个项目: ${JSON.stringify(data.projects[0], null, 2)}`);
      }
      return data;
    } catch (error) {
      addLog(`错误: ${error}`);
      return null;
    }
  };

  const testForceCreateProject = async () => {
    addLog('=== 测试强制创建项目 ===');
    setLoading(true);

    try {
      const user = await testAuth();
      if (!user || !user.user) {
        addLog('❌ 用户未认证，无法创建项目');
        setLoading(false);
        return;
      }

      addLog('准备强制创建项目...');
      const projectData = {
        name: `强制测试项目_${Date.now()}`,
        brand: 'he_zhe',
        category: 'product_development',
        salesDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: '这是一个强制创建的测试项目'
      };

      addLog(`项目数据: ${JSON.stringify(projectData, null, 2)}`);

      const response = await fetch('/api/force-create-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(projectData),
      });

      const data = await response.json();
      addLog(`响应状态: ${response.status}`);
      addLog('--- 响应日志 ---');
      data.logs?.forEach((log: string) => addLog(log));

      if (response.ok && data.success) {
        addLog('✅ 强制创建项目成功！');
        addLog(`项目信息: ${JSON.stringify(data.project, null, 2)}`);

        // 重新获取项目列表
        addLog('等待2秒后重新获取项目列表...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await testGetProjects();
      } else {
        addLog(`❌ 强制创建项目失败: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ 强制创建项目出错: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testCreateProject = async () => {
    addLog('=== 测试创建项目 ===');
    setLoading(true);

    try {
      // 1. 先检查用户认证
      const user = await testAuth();
      if (!user || !user.user) {
        addLog('❌ 用户未认证，无法创建项目');
        return;
      }

      // 2. 创建测试项目
      addLog('准备创建测试项目...');
      const projectData = {
        name: `测试项目_${Date.now()}`,
        brand: 'he_zhe',
        category: 'product_development',
        salesDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: '这是一个测试项目'
      };

      addLog(`项目数据: ${JSON.stringify(projectData, null, 2)}`);

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(projectData),
      });

      const data = await response.json();
      addLog(`响应状态: ${response.status}`);
      addLog(`响应数据: ${JSON.stringify(data, null, 2)}`);

      if (response.ok) {
        addLog('✅ 项目创建成功！');
        addLog(`项目ID: ${data.project?.id}`);

        // 3. 重新获取项目列表
        addLog('等待2秒后重新获取项目列表...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        await testGetProjects();
      } else {
        addLog(`❌ 项目创建失败: ${data.error}`);
      }
    } catch (error) {
      addLog(`❌ 创建项目出错: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>🔍 项目创建完整诊断工具</CardTitle>
          <p className="text-sm text-muted-foreground">
            请先点击"完整诊断"按钮，系统会自动检测所有可能的问题
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <Button onClick={testDebug} disabled={loading} className="bg-red-600 hover:bg-red-700">
              🔍 完整诊断（推荐先运行）
            </Button>
            <Button onClick={testForceCreateProject} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
              ⚡ 强制创建项目（快速修复）
            </Button>
            <Button onClick={testAuth} disabled={loading}>
              测试认证
            </Button>
            <Button onClick={testGetProjects} disabled={loading}>
              获取项目列表
            </Button>
            <Button onClick={testCreateProject} disabled={loading}>
              {loading ? '创建中...' : '创建测试项目'}
            </Button>
            <Button onClick={clearLogs} variant="outline">
              清空日志
            </Button>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-[500px] overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">点击按钮开始测试...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1 whitespace-pre-wrap break-words">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
