'use client';

import { useState } from 'react';

interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export default function TestRealFlowPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, { time: timestamp, message, type }]);
    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${icon} [${timestamp}] ${message}`);
  };

  const testRealFlow = async () => {
    setLoading(true);
    setLogs([]);
    setProjectId(null);

    addLog('=== 开始测试真实创建流程 ===', 'info');

    try {
      // 步骤1: 创建项目
      addLog('\n步骤1: 创建项目', 'info');
      const createResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: `真实流程测试_${Date.now()}`,
          brand: 'he_zhe',
          category: 'product_development',
          salesDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: '真实流程测试项目',
        }),
      });

      const createData = await createResponse.json();
      addLog(`创建响应状态: ${createResponse.status}`, createResponse.ok ? 'success' : 'error');

      if (!createData.project) {
        addLog(`创建失败: ${createData.error || '未知错误'}`, 'error');
        setLoading(false);
        return;
      }

      const createdProjectId = createData.project.id;
      setProjectId(createdProjectId);
      addLog(`项目创建成功，ID: ${createdProjectId}`, 'success');
      addLog(`项目名称: ${createData.project.name}`, 'info');
      addLog(`项目品牌: ${createData.project.brand}`, 'info');

      // 步骤2: 立即查询所有项目（模拟前端 loadProjects）
      addLog('\n步骤2: 立即查询所有项目（模拟 loadProjects）', 'info');
      const listResponse1 = await fetch('/api/projects?brand=all&category=all', {
        credentials: 'include',
      });

      const listData1 = await listResponse1.json();
      addLog(`查询响应状态: ${listResponse1.status}`, listResponse1.ok ? 'success' : 'error');
      addLog(`查询到的项目数量: ${listData1.projects?.length || 0}`, 'info');

      if (listData1.projects) {
        const found = listData1.projects.find((p: any) => p.id === createdProjectId);
        if (found) {
          addLog(`✅ 新项目在列表中找到（第1次查询）`, 'success');
        } else {
          addLog(`❌ 新项目未在列表中找到（第1次查询）`, 'error');
        }

        // 统计各品牌
        const brandCount: Record<string, number> = {};
        listData1.projects.forEach((p: any) => {
          brandCount[p.brand] = (brandCount[p.brand] || 0) + 1;
        });
        addLog(`各品牌分布: ${JSON.stringify(brandCount)}`, 'info');
      }

      // 步骤3: 1秒后查询（模拟 setInterval）
      addLog('\n步骤3: 1秒后查询', 'warning');
      await new Promise(resolve => setTimeout(resolve, 1000));
      const listResponse2 = await fetch('/api/projects?brand=all&category=all', {
        credentials: 'include',
      });
      const listData2 = await listResponse2.json();
      addLog(`1秒后项目数量: ${listData2.projects?.length || 0}`, 'info');
      if (listData2.projects) {
        const found2 = listData2.projects.find((p: any) => p.id === createdProjectId);
        if (found2) {
          addLog(`✅ 新项目在列表中找到（第2次查询）`, 'success');
        } else {
          addLog(`❌ 新项目未在列表中找到（第2次查询）`, 'error');
        }
      }

      // 步骤4: 2秒后查询
      addLog('\n步骤4: 2秒后查询', 'warning');
      await new Promise(resolve => setTimeout(resolve, 2000));
      const listResponse3 = await fetch('/api/projects?brand=all&category=all', {
        credentials: 'include',
      });
      const listData3 = await listResponse3.json();
      addLog(`2秒后项目数量: ${listData3.projects?.length || 0}`, 'info');
      if (listData3.projects) {
        const found3 = listData3.projects.find((p: any) => p.id === createdProjectId);
        if (found3) {
          addLog(`✅ 新项目在列表中找到（第3次查询）`, 'success');
        } else {
          addLog(`❌ 新项目未在列表中找到（第3次查询）`, 'error');
        }
      }

      // 步骤5: 3秒后查询（关键时刻）
      addLog('\n步骤5: 3秒后查询（关键时刻）', 'warning');
      await new Promise(resolve => setTimeout(resolve, 3000));
      const listResponse4 = await fetch('/api/projects?brand=all&category=all', {
        credentials: 'include',
      });
      const listData4 = await listResponse4.json();
      addLog(`3秒后项目数量: ${listData4.projects?.length || 0}`, 'info');
      if (listData4.projects) {
        const found4 = listData4.projects.find((p: any) => p.id === createdProjectId);
        if (found4) {
          addLog(`✅ 新项目在列表中找到（第4次查询）`, 'success');
        } else {
          addLog(`❌ 新项目未在列表中找到（第4次查询）- 项目消失！`, 'error');
        }
      }

      // 步骤6: 直接查询该项目
      addLog('\n步骤6: 直接查询该项目', 'info');
      const checkResponse = await fetch(`/api/check-project/${createdProjectId}`, {
        credentials: 'include',
      });
      const checkData = await checkResponse.json();
      addLog(`检查响应: ${checkData.success ? '成功' : '失败'}`, checkData.success ? 'success' : 'error');
      addLog(`项目存在: ${checkData.exists}`, checkData.exists ? 'success' : 'error');

      // 步骤7: 总结
      addLog('\n=== 测试总结 ===', 'info');
      const totalTime = 1 + 2 + 3; // 6秒
      addLog(`总共测试了 ${totalTime} 秒`, 'info');

      const allFound = [
        listData1.projects?.find((p: any) => p.id === createdProjectId),
        listData2.projects?.find((p: any) => p.id === createdProjectId),
        listData3.projects?.find((p: any) => p.id === createdProjectId),
        listData4.projects?.find((p: any) => p.id === createdProjectId),
      ];

      if (allFound.every(f => f)) {
        addLog(`✅ 所有查询都找到了项目，项目没有消失`, 'success');
      } else {
        addLog(`❌ 部分查询未找到项目，有问题`, 'error');
        addLog(`查询结果: ${allFound.map(f => f ? '✅' : '❌').join(', ')}`, 'info');
      }

    } catch (error: any) {
      addLog(`测试异常: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setProjectId(null);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">真实创建流程测试</h1>
        <p className="text-muted-foreground">
          模拟真实的创建项目流程，包括创建后1秒、2秒、3秒的查询，验证项目是否消失。
        </p>

        <div className="flex gap-3">
          <button
            onClick={testRealFlow}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? '测试中...（需要6秒）' : '开始测试'}
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
          >
            清空日志
          </button>
        </div>

        {projectId && (
          <div className="bg-muted rounded-lg p-4">
            <p className="font-semibold">测试项目ID:</p>
            <p className="font-mono text-sm">{projectId}</p>
          </div>
        )}

        <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-1 max-h-[600px] overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-muted-foreground">点击"开始测试"查看日志</p>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={
                  log.type === 'error' ? 'text-red-600' :
                  log.type === 'success' ? 'text-green-600' :
                  log.type === 'warning' ? 'text-yellow-600' :
                  'text-foreground'
                }
              >
                <span className="text-muted-foreground">[{log.time}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
