'use client';

import { useState } from 'react';

export default function TestDirectAPIPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    const log = `[${timestamp}] ${message}`;
    console.log(log);
    setLogs(prev => [...prev, log]);
  };

  const testCreateProject = async () => {
    setLoading(true);
    addLog('=== 开始测试创建项目 ===');

    try {
      // 1. 创建项目
      addLog('步骤1: 创建项目');
      const createResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: `直接测试_${Date.now()}`,
          brand: 'he_zhe',
          category: 'product_development',
          salesDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: '直接API测试项目',
        }),
      });

      const createData = await createResponse.json();
      addLog(`创建响应状态: ${createResponse.status}`);
      addLog(`创建响应数据: ${JSON.stringify(createData)}`);

      if (!createData.project) {
        addLog('❌ 创建失败，未返回项目数据');
        setLoading(false);
        return;
      }

      const projectId = createData.project.id;
      addLog(`✅ 项目创建成功，ID: ${projectId}`);
      addLog(`项目名称: ${createData.project.name}`);
      addLog(`项目品牌: ${createData.project.brand}`);

      // 2. 立即查询所有项目
      addLog('\n步骤2: 查询所有项目');
      const listResponse = await fetch('/api/projects?brand=all&category=all', {
        credentials: 'include',
      });

      const listData = await listResponse.json();
      addLog(`查询响应状态: ${listResponse.status}`);
      addLog(`查询到的项目数量: ${listData.projects?.length || 0}`);

      if (listData.projects && listData.projects.length > 0) {
        addLog('项目列表:');
        listData.projects.forEach((p: any, i: number) => {
          addLog(`  ${i + 1}. ${p.name} (${p.brand}) - ID: ${p.id}`);
        });

        // 检查新创建的项目是否在列表中
        const found = listData.projects.find((p: any) => p.id === projectId);
        if (found) {
          addLog(`✅ 新创建的项目在列表中找到`);
        } else {
          addLog(`❌ 新创建的项目未在列表中找到！`);
        }
      } else {
        addLog(`❌ 查询结果为空！`);
      }

      // 3. 直接查询该特定项目
      addLog('\n步骤3: 直接查询该项目');
      const checkResponse = await fetch(`/api/check-project/${projectId}`, {
        credentials: 'include',
      });

      const checkData = await checkResponse.json();
      addLog(`检查响应状态: ${checkResponse.status}`);
      addLog(`检查结果: ${JSON.stringify(checkData)}`);

      if (checkData.success && checkData.exists) {
        addLog(`✅ 项目存在于数据库中`);
      } else {
        addLog(`❌ 项目不存在于数据库中`);
      }

      // 4. 1秒后再次查询所有项目
      addLog('\n步骤4: 1秒后再次查询所有项目');
      await new Promise(resolve => setTimeout(resolve, 1000));
      const listResponse2 = await fetch('/api/projects?brand=all&category=all', {
        credentials: 'include',
      });

      const listData2 = await listResponse2.json();
      addLog(`1秒后项目数量: ${listData2.projects?.length || 0}`);

      if (listData2.projects) {
        const found2 = listData2.projects.find((p: any) => p.id === projectId);
        if (found2) {
          addLog(`✅ 1秒后项目仍在列表中`);
        } else {
          addLog(`❌ 1秒后项目消失了！`);
        }
      }

      // 5. 统计各品牌项目数量
      addLog('\n步骤5: 统计各品牌项目数量');
      if (listData2.projects) {
        const brandCount: Record<string, number> = {};
        listData2.projects.forEach((p: any) => {
          brandCount[p.brand] = (brandCount[p.brand] || 0) + 1;
        });
        addLog('品牌分布:');
        Object.entries(brandCount).forEach(([brand, count]) => {
          addLog(`  ${brand}: ${count} 个`);
        });
      }

      addLog('\n=== 测试完成 ===');

    } catch (error: any) {
      addLog(`❌ 测试异常: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">直接 API 测试</h1>
        <p className="text-muted-foreground">
          这个页面直接测试 API，不使用任何复杂的状态管理，用于诊断项目创建问题。
        </p>

        <div className="flex gap-3">
          <button
            onClick={testCreateProject}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? '测试中...' : '开始测试'}
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
          >
            清空日志
          </button>
        </div>

        <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-1 max-h-[600px] overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-muted-foreground">点击"开始测试"查看日志</p>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={log.includes('❌') ? 'text-red-600' : log.includes('✅') ? 'text-green-600' : 'text-foreground'}
              >
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
