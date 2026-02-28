'use client';

import { useState, useEffect, useRef } from 'react';

interface Project {
  id: string;
  name: string;
  brand: string;
  [key: string]: any;
}

export default function TestStateTrackingPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [brandFilter, setBrandFilter] = useState<'all' | 'he_zhe' | 'baobao' | 'ai_he' | 'bao_deng_yuan'>('all');
  const [logs, setLogs] = useState<string[]>([]);

  const logRef = useRef(logs);
  logRef.current = logs;

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    const log = `[${timestamp}] ${message}`;
    console.log(log);
    setLogs(prev => [...prev, log]);
  };

  // 监控 projects 状态变化
  useEffect(() => {
    addLog(`📊 projects 状态变化：数量 = ${projects.length}`);
    if (projects.length > 0) {
      projects.slice(0, 3).forEach((p, i) => {
        addLog(`  ${i + 1}. ${p.name} (${p.brand})`);
      });
    }
  }, [projects]);

  // 监控 brandFilter 状态变化
  useEffect(() => {
    addLog(`🏷️ brandFilter 状态变化：${brandFilter}`);
  }, [brandFilter]);

  // 测试创建项目
  const testCreateProject = async () => {
    addLog('=== 开始创建项目测试 ===');

    try {
      addLog('步骤1: 创建项目');
      const createResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: `状态跟踪测试_${Date.now()}`,
          brand: 'he_zhe',
          category: 'product_development',
          salesDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: '状态跟踪测试',
        }),
      });

      const createData = await createResponse.json();
      addLog(`创建响应: ${createResponse.ok ? '成功' : '失败'}`);

      if (!createData.project) {
        addLog(`❌ 创建失败: ${createData.error}`);
        return;
      }

      const createdProjectId = createData.project.id;
      addLog(`✅ 项目创建成功，ID: ${createdProjectId}`);
      addLog(`   品牌: ${createData.project.brand}`);

      addLog('\n步骤2: 添加到前端列表');
      addLog(`   当前列表长度: ${projects.length}`);

      // 模拟前端代码的行为
      const newProjectData = { ...createData.project, tasks: createData.tasks || [] };
      addLog(`   新项目数据: ${newProjectData.name} (${newProjectData.brand})`);

      setProjects(prev => {
        addLog(`   setProjects 触发，当前长度: ${prev.length}`);
        const newList = [newProjectData, ...prev];
        addLog(`   setProjects 完成，新长度: ${newList.length}`);
        return newList;
      });

      addLog('\n步骤3: 1秒后检查列表');
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog(`   1秒后列表长度: ${projects.length}`);
      addLog(`   1秒后品牌过滤器: ${brandFilter}`);

      addLog('\n步骤4: 2秒后检查列表');
      await new Promise(resolve => setTimeout(resolve, 2000));
      addLog(`   2秒后列表长度: ${projects.length}`);
      addLog(`   2秒后品牌过滤器: ${brandFilter}`);

      addLog('\n步骤5: 3秒后检查列表');
      await new Promise(resolve => setTimeout(resolve, 3000));
      addLog(`   3秒后列表长度: ${projects.length}`);
      addLog(`   3秒后品牌过滤器: ${brandFilter}`);

      // 查询后端验证
      addLog('\n步骤6: 查询后端验证');
      const listResponse = await fetch('/api/projects?brand=all&category=all', {
        credentials: 'include',
      });
      const listData = await listResponse.json();
      addLog(`   后端返回项目数量: ${listData.projects?.length || 0}`);

      if (listData.projects) {
        const found = listData.projects.find((p: any) => p.id === createdProjectId);
        if (found) {
          addLog(`   ✅ 后端存在该项目`);
          addLog(`      后端项目品牌: ${found.brand}`);
        } else {
          addLog(`   ❌ 后端不存在该项目`);
        }
      }

      addLog('\n步骤7: 总结');
      addLog(`   前端列表长度: ${projects.length}`);
      addLog(`   后端返回长度: ${listData.projects?.length || 0}`);

      if (projects.length !== (listData.projects?.length || 0)) {
        addLog(`   ⚠️ 前后端数据不一致！`);
        addLog(`   差异: ${projects.length - (listData.projects?.length || 0)} 个项目`);
      } else {
        addLog(`   ✅ 前后端数据一致`);
      }

    } catch (error: any) {
      addLog(`❌ 测试异常: ${error.message}`);
    }
  };

  // 手动添加项目
  const manualAddProject = () => {
    const testProject = {
      id: `manual_${Date.now()}`,
      name: `手动添加_${Date.now()}`,
      brand: 'he_zhe' as const,
    };

    addLog(`📝 手动添加项目: ${testProject.name} (${testProject.brand})`);
    setProjects(prev => [testProject, ...prev]);
  };

  // 清空列表
  const clearProjects = () => {
    addLog('🗑️ 清空列表');
    setProjects([]);
  };

  // 改变品牌过滤器
  const changeBrandFilter = (brand: 'all' | 'he_zhe' | 'baobao' | 'ai_he' | 'bao_deng_yuan') => {
    addLog(`🔁 手动改变品牌过滤器: ${brand}`);
    setBrandFilter(brand);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">状态追踪测试</h1>
        <p className="text-muted-foreground">
          监控 projects 和 brandFilter 状态的所有变化，找出导致项目消失的原因。
        </p>

        {/* 操作按钮 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={testCreateProject}
            className="px-4 py-2 bg-primary text-primary-foreground rounded"
          >
            测试创建项目
          </button>
          <button
            onClick={manualAddProject}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded"
          >
            手动添加项目
          </button>
          <button
            onClick={clearProjects}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded"
          >
            清空列表
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-muted rounded"
          >
            清空日志
          </button>
        </div>

        {/* 品牌过滤器控制 */}
        <div className="flex gap-3 items-center">
          <span className="font-semibold">品牌过滤器：</span>
          <button
            onClick={() => changeBrandFilter('all')}
            className={`px-3 py-1 rounded ${brandFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            全部 ({projects.length})
          </button>
          <button
            onClick={() => changeBrandFilter('he_zhe')}
            className={`px-3 py-1 rounded ${brandFilter === 'he_zhe' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            何折 ({projects.filter(p => p.brand === 'he_zhe').length})
          </button>
          <button
            onClick={() => changeBrandFilter('baobao')}
            className={`px-3 py-1 rounded ${brandFilter === 'baobao' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            宝宝 ({projects.filter(p => p.brand === 'baobao').length})
          </button>
        </div>

        {/* 项目列表 */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">当前项目列表（总数: {projects.length}）</h2>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {projects.length === 0 ? (
              <p className="text-muted-foreground">暂无项目</p>
            ) : (
              projects.map((p, i) => (
                <div key={p.id} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span>{i + 1}. {p.name}</span>
                  <span className="px-2 py-1 bg-background rounded text-xs">{p.brand}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 日志 */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">日志（{logs.length} 条）</h2>
            <span className="text-xs text-muted-foreground">{logs.length > 0 ? logs[0].split(']')[0] : ''}</span>
          </div>
          <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-1 max-h-[500px] overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">暂无日志</p>
            ) : (
              [...logs].reverse().map((log, i) => (
                <div key={i} className="text-xs">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
