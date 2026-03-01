'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export default function TestProjectLoss() {
  const { user, login, logout } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [token, setToken] = useState('');

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    const log = `[${timestamp}] ${message}`;
    console.log(log);
    setLogs(prev => [...prev, log]);
  };

  const testLogin = async () => {
    addLog('🔐 开始登录测试...');
    try {
      await login('admin@hanhai.com', 'admin123');
      addLog('✅ 登录成功');
      addLog(`用户: ${user?.email}`);
      addLog(`Token: ${localStorage.getItem('auth_token')?.substring(0, 50)}...`);
      
      // 检查所有项目
      await checkProjects('all');
    } catch (error) {
      addLog(`❌ 登录失败: ${error}`);
    }
  };

  const checkProjects = async (brand: string) => {
    const authToken = localStorage.getItem('auth_token');
    addLog(`\n🔍 检查项目 (品牌: ${brand})...`);
    addLog(`Token: ${authToken?.substring(0, 50)}...`);

    try {
      const response = await fetch(`/api/projects?brand=${brand}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      addLog(`HTTP 状态: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        addLog(`✅ 获取成功`);
        addLog(`项目总数: ${data.projects?.length || 0}`);

        if (data.projects && data.projects.length > 0) {
          addLog('项目列表:');
          data.projects.slice(0, 5).forEach((p: any) => {
            addLog(`  - ${p.name} (${p.brand}) - ID: ${p.id.substring(0, 8)}...`);
          });
        }
      } else {
        const error = await response.json();
        addLog(`❌ 请求失败: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      addLog(`❌ 网络错误: ${error}`);
    }
  };

  const testCreateProject = async () => {
    addLog(`\n📝 创建测试项目...`);
    const authToken = localStorage.getItem('auth_token');

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: `测试项目-${Date.now()}`,
          brand: 'he_zhe',
          category: 'product_development',
          salesDate: '2026-09-01',
          description: '测试项目是否在重新登录后保留',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        addLog(`✅ 创建成功`);
        addLog(`项目ID: ${data.project?.id}`);
        addLog(`项目名称: ${data.project?.name}`);
        addLog(`项目品牌: ${data.project?.brand}`);

        // 立即验证
        addLog(`\n🔍 立即验证项目...`);
        await checkProjects('all');

        return data.project?.id;
      } else {
        const error = await response.json();
        addLog(`❌ 创建失败: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      addLog(`❌ 网络错误: ${error}`);
    }
  };

  const testLogout = async () => {
    addLog(`\n🚪 退出登录...`);
    try {
      await logout();
      addLog(`✅ 退出成功`);
      addLog(`Token已清除: ${!localStorage.getItem('auth_token')}`);
    } catch (error) {
      addLog(`❌ 退出失败: ${error}`);
    }
  };

  const testFullFlow = async () => {
    addLog('========================================');
    addLog('开始完整流程测试');
    addLog('========================================');
    
    // 步骤 1: 登录
    await testLogin();
    
    // 步骤 2: 检查当前项目数
    await checkProjects('all');
    
    // 步骤 3: 创建项目
    const projectId = await testCreateProject();
    
    // 步骤 4: 验证项目已创建
    await checkProjects('all');
    
    // 步骤 5: 退出登录
    await testLogout();
    
    // 步骤 6: 重新登录
    addLog(`\n========================================`);
    addLog(`等待 3 秒后重新登录...`);
    addLog(`========================================`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await testLogin();
    
    // 步骤 7: 验证项目仍然存在
    addLog(`\n========================================`);
    addLog(`验证项目是否仍然存在...`);
    addLog(`========================================`);
    await checkProjects('all');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>项目丢失问题诊断工具</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button onClick={testLogin} variant="outline">
                🔐 登录
              </Button>
              <Button onClick={() => checkProjects('all')} variant="outline">
                🔍 查看全部项目
              </Button>
              <Button onClick={() => checkProjects('he_zhe')} variant="outline">
                🔍 查看禾哲项目
              </Button>
              <Button onClick={testCreateProject} variant="outline">
                📝 创建项目
              </Button>
              <Button onClick={testLogout} variant="outline">
                🚪 退出
              </Button>
              <Button onClick={testFullFlow} className="col-span-1 sm:col-span-3">
                🚀 运行完整流程测试
              </Button>
              <Button onClick={clearLogs} variant="destructive">
                🗑️ 清空日志
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">当前状态：</h3>
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg space-y-1 text-sm">
                <div>用户: {user?.email || '未登录'}</div>
                <div>Token: {localStorage.getItem('auth_token') ? '已设置' : '未设置'}</div>
                <div>Token内容: {localStorage.getItem('auth_token')?.substring(0, 50)}...</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>日志</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 text-slate-50 p-4 rounded-lg font-mono text-xs space-y-1 max-h-[500px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-slate-500">暂无日志</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-green-400' : ''}>
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
