import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';

// 直接从环境变量获取 Supabase 配置

export async function POST(request: NextRequest) {
  const logs: string[] = [];

  const addLog = (message: string) => {
    logs.push(`[${new Date().toISOString()}] ${message}`);
    console.log(message);
  };

  try {
    addLog('=== 测试：创建项目后使用同一 client 查询 ===');

    // 1. 创建同一个 client 实例
    const client = getSupabaseClient();
    addLog('✅ 创建 Supabase client');

    // 2. 创建项目
    addLog('\n步骤1: 创建项目');
    const testProjectName = `测试同一client_${Date.now()}`;

    const { data: project, error: projectError } = await client
      .from('projects')
      .insert({
        name: testProjectName,
        brand: 'he_zhe',
        category: 'product_development',
        sales_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        project_confirm_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (projectError) {
      addLog(`❌ 创建失败: ${projectError.message}`);
      return NextResponse.json({ success: false, logs, error: projectError.message });
    }

    addLog(`✅ 创建成功，ID: ${project.id}, 名称: ${project.name}`);

    // 3. 立即使用同一 client 查询
    addLog('\n步骤2: 使用同一 client 立即查询');
    const { data: check1, error: checkError1 } = await client
      .from('projects')
      .select('*')
      .eq('id', project.id)
      .single();

    if (checkError1) {
      addLog(`❌ 立即查询失败: ${checkError1.message}`);
    } else if (!check1) {
      addLog(`❌ 立即查询返回空`);
    } else {
      addLog(`✅ 立即查询成功`);
    }

    // 4. 查询所有项目（使用同一 client）
    addLog('\n步骤3: 使用同一 client 查询所有项目');
    const { data: allProjects1, error: allError1 } = await client
      .from('projects')
      .select('id, name, brand')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allError1) {
      addLog(`❌ 查询所有项目失败: ${allError1.message}`);
    } else {
      addLog(`✅ 查询所有项目成功，数量: ${allProjects1?.length || 0}`);
      const found = allProjects1?.find((p: any) => p.id === project.id);
      if (found) {
        addLog(`✅ 新项目在列表中`);
      } else {
        addLog(`❌ 新项目不在列表中`);
      }
    }

    // 5. 3秒后使用同一 client 查询
    addLog('\n步骤4: 等待3秒...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    addLog('步骤5: 3秒后使用同一 client 查询');
    const { data: check2, error: checkError2 } = await client
      .from('projects')
      .select('*')
      .eq('id', project.id)
      .single();

    if (checkError2) {
      addLog(`❌ 3秒后查询失败: ${checkError2.message}`);
    } else if (!check2) {
      addLog(`❌ 3秒后项目消失了！`);
    } else {
      addLog(`✅ 3秒后项目仍然存在`);
    }

    // 6. 3秒后查询所有项目（使用同一 client）
    addLog('\n步骤6: 3秒后使用同一 client 查询所有项目');
    const { data: allProjects2, error: allError2 } = await client
      .from('projects')
      .select('id, name, brand')
      .order('created_at', { ascending: false })
      .limit(10);

    if (allError2) {
      addLog(`❌ 查询所有项目失败: ${allError2.message}`);
    } else {
      addLog(`✅ 查询所有项目成功，数量: ${allProjects2?.length || 0}`);
      const found2 = allProjects2?.find((p: any) => p.id === project.id);
      if (found2) {
        addLog(`✅ 3秒后新项目仍在列表中`);
      } else {
        addLog(`❌ 3秒后新项目不在列表中`);
      }
    }

    // 7. 创建新的 client 实例查询
    addLog('\n步骤7: 使用新的 client 实例查询');
    const newClient = getSupabaseClient();
    const { data: check3, error: checkError3 } = await newClient
      .from('projects')
      .select('*')
      .eq('id', project.id)
      .single();

    if (checkError3) {
      addLog(`❌ 新 client 查询失败: ${checkError3.message}`);
    } else if (!check3) {
      addLog(`❌ 新 client 查询不到项目`);
    } else {
      addLog(`✅ 新 client 查询成功`);
    }

    // 8. 清理测试项目
    addLog('\n步骤8: 删除测试项目');
    await client
      .from('projects')
      .delete()
      .eq('id', project.id);
    addLog('✅ 测试项目已删除');

    addLog('\n=== 测试完成 ===');

    return NextResponse.json({
      success: true,
      logs,
      summary: {
        created: !!project,
        immediateCheck: !!check1,
        immediateInList: !!allProjects1?.find((p: any) => p.id === project.id),
        after3SecsCheck: !!check2,
        after3SecsInList: !!allProjects2?.find((p: any) => p.id === project.id),
        newClientCheck: !!check3,
      },
    });

  } catch (error: any) {
    addLog(`❌ 测试异常: ${error.message}`);
    return NextResponse.json({ success: false, logs, error: error.message }, { status: 500 });
  }
}
