import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';

// 直接从环境变量获取 Supabase 配置

export async function POST(request: NextRequest) {
  const logs: string[] = [];
  const timestamp = Date.now();

  const addLog = (message: string) => {
    const log = `[${new Date().toISOString()}] ${message}`;
    logs.push(log);
    console.log(log);
  };

  try {
    addLog('=== 事务测试开始 ===');

    const client = getSupabaseClient();
    const testId = `test_${timestamp}`;

    // 1. 创建测试项目
    addLog('步骤1: 创建测试项目');
    const { data: project, error: projectError } = await client
      .from('projects')
      .insert({
        name: `事务测试_${testId}`,
        brand: 'he_zhe',
        category: 'product_development',
        sales_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        project_confirm_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (projectError) {
      addLog(`❌ 创建项目失败: ${projectError.message}`);
      return NextResponse.json({ success: false, logs, error: projectError.message });
    }

    if (!project) {
      addLog(`❌ 项目创建后未返回数据`);
      return NextResponse.json({ success: false, logs, error: '未返回数据' });
    }

    addLog(`✅ 项目创建成功，ID: ${project.id}`);

    // 2. 立即验证（无延迟）
    addLog('步骤2: 立即验证（无延迟）');
    const { data: verify1, error: verify1Error } = await client
      .from('projects')
      .select('*')
      .eq('id', project.id)
      .single();

    if (verify1Error) {
      addLog(`❌ 立即验证失败: ${verify1Error.message}`);
    } else if (!verify1) {
      addLog(`❌ 立即验证失败：项目不存在`);
    } else {
      addLog(`✅ 立即验证成功`);
    }

    // 3. 等待 500ms 后验证
    addLog('步骤3: 等待 500ms 后验证');
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: verify2, error: verify2Error } = await client
      .from('projects')
      .select('*')
      .eq('id', project.id)
      .single();

    if (verify2Error) {
      addLog(`❌ 500ms 验证失败: ${verify2Error.message}`);
    } else if (!verify2) {
      addLog(`❌ 500ms 验证失败：项目不存在`);
    } else {
      addLog(`✅ 500ms 验证成功`);
    }

    // 4. 等待 1000ms 后验证
    addLog('步骤4: 等待 1000ms 后验证');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const { data: verify3, error: verify3Error } = await client
      .from('projects')
      .select('*')
      .eq('id', project.id)
      .single();

    if (verify3Error) {
      addLog(`❌ 1000ms 验证失败: ${verify3Error.message}`);
    } else if (!verify3) {
      addLog(`❌ 1000ms 验证失败：项目不存在`);
    } else {
      addLog(`✅ 1000ms 验证成功`);
    }

    // 5. 使用新连接验证
    addLog('步骤5: 使用新连接验证');
    const newClient = getSupabaseClient();
    const { data: verify4, error: verify4Error } = await newClient
      .from('projects')
      .select('*')
      .eq('id', project.id)
      .single();

    if (verify4Error) {
      addLog(`❌ 新连接验证失败: ${verify4Error.message}`);
    } else if (!verify4) {
      addLog(`❌ 新连接验证失败：项目不存在`);
    } else {
      addLog(`✅ 新连接验证成功`);
    }

    // 6. 测试并发查询
    addLog('步骤6: 测试并发查询（5次）');
    const promises = Array(5).fill(null).map(async (_, i) => {
      const { data, error } = await client
        .from('projects')
        .select('*')
        .eq('id', project.id)
        .single();

      if (error) {
        return { index: i, success: false, error: error.message };
      }
      return { index: i, success: true, exists: !!data };
    });

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success && r.exists).length;
    addLog(`并发查询结果: ${successCount}/5 成功`);
    results.forEach(r => {
      if (!r.success) {
        addLog(`  查询 ${r.index} 失败: ${r.error}`);
      } else if (!r.exists) {
        addLog(`  查询 ${r.index} 成功但项目不存在`);
      }
    });

    // 7. 清理测试项目
    addLog('步骤7: 清理测试项目');
    const { error: deleteError } = await client
      .from('projects')
      .delete()
      .eq('id', project.id);

    if (deleteError) {
      addLog(`⚠️ 删除测试项目失败: ${deleteError.message}`);
    } else {
      addLog(`✅ 测试项目已删除`);
    }

    addLog('=== 事务测试完成 ===');

    return NextResponse.json({
      success: true,
      logs,
      summary: {
        projectId: project.id,
        immediateVerify: !!verify1,
        verify500ms: !!verify2,
        verify1000ms: !!verify3,
        newConnectionVerify: !!verify4,
        concurrentSuccessRate: `${successCount}/5`,
      },
    });

  } catch (error: any) {
    addLog(`❌ 测试异常: ${error.message}`);
    addLog(`错误堆栈: ${error.stack}`);
    return NextResponse.json({
      success: false,
      logs,
      error: error.message,
    }, { status: 500 });
  }
}
