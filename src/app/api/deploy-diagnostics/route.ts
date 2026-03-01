import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// 直接从环境变量获取 Supabase 配置
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 环境变量未设置');
}

export async function GET(request: NextRequest) {
  const logs: string[] = [];

  const addLog = (message: string) => {
    logs.push(`[${new Date().toISOString()}] ${message}`);
    console.log(message);
  };

  try {
    addLog('=== 部署环境诊断开始 ===');

    // 1. 环境变量检查
    addLog('步骤1: 检查环境变量');
    const envCheck = {
      supabaseUrl: process.env.COZE_SUPABASE_URL ? '已配置' : '未配置',
      supabaseKey: process.env.COZE_SUPABASE_ANON_KEY ? '已配置' : '未配置',
      jwtSecret: process.env.JWT_SECRET ? '已配置' : '未配置',
      nodeEnv: process.env.NODE_ENV || '未配置',
    };
    addLog(`环境变量: ${JSON.stringify(envCheck)}`);

    // 2. 时区检查
    addLog('步骤2: 检查时区');
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    addLog(`时区: ${timezone}`);
    const testDate = new Date();
    addLog(`当前时间: ${testDate.toISOString()}`);
    addLog(`本地时间: ${testDate.toLocaleString('zh-CN')}`);

    // 3. 数据库连接测试
    addLog('步骤3: 测试数据库连接');
    try {
      const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });
      addLog('Supabase客户端创建成功');

      // 测试查询
      const { data, error, count } = await client
        .from('projects')
        .select('*', { count: 'exact', head: true });

      if (error) {
        addLog(`❌ 数据库查询失败: ${error.message}`);
        addLog(`错误代码: ${error.code}`);
        addLog(`错误详情: ${JSON.stringify(error)}`);
      } else {
        addLog(`✅ 数据库连接成功`);
        addLog(`项目总数: ${count || 0}`);
      }
    } catch (error: any) {
      addLog(`❌ 数据库连接异常: ${error.message}`);
    }

    // 4. 测试创建项目（不保存到数据库）
    addLog('步骤4: 测试项目创建逻辑');
    try {
      const testProjectData = {
        name: `诊断测试_${Date.now()}`,
        brand: 'he_zhe',
        category: 'product_development',
        sales_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        project_confirm_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending' as const,
      };
      addLog(`测试项目数据: ${JSON.stringify(testProjectData)}`);

      // 实际创建项目
      const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });
      const { data: project, error: insertError } = await client
        .from('projects')
        .insert(testProjectData)
        .select()
        .single();

      if (insertError) {
        addLog(`❌ 创建项目失败: ${insertError.message}`);
        addLog(`错误代码: ${insertError.code}`);
        addLog(`错误详情: ${JSON.stringify(insertError)}`);
      } else {
        addLog(`✅ 创建项目成功，ID: ${project.id}`);
        addLog(`项目名称: ${project.name}`);
        addLog(`项目品牌: ${project.brand}`);

        // 立即查询刚创建的项目
        addLog('立即查询刚创建的项目...');
        const { data: checkProject, error: checkError } = await client
          .from('projects')
          .select('*')
          .eq('id', project.id)
          .single();

        if (checkError) {
          addLog(`❌ 立即查询失败: ${checkError.message}`);
        } else {
          addLog(`✅ 立即查询成功`);
          addLog(`项目存在: ${checkProject.name}`);
        }

        // 2秒后再次查询
        addLog('等待2秒后再次查询...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        const { data: checkProject2, error: checkError2 } = await client
          .from('projects')
          .select('*')
          .eq('id', project.id)
          .single();

        if (checkError2) {
          addLog(`❌ 2秒后查询失败: ${checkError2.message}`);
        } else {
          addLog(`✅ 2秒后查询成功`);
          addLog(`项目仍然存在: ${checkProject2.name}`);

          // 删除测试项目
          addLog('删除测试项目...');
          const { error: deleteError } = await client
            .from('projects')
            .delete()
            .eq('id', project.id);

          if (deleteError) {
            addLog(`⚠️ 删除测试项目失败: ${deleteError.message}`);
          } else {
            addLog(`✅ 测试项目已删除`);
          }
        }
      }
    } catch (error: any) {
      addLog(`❌ 测试项目创建异常: ${error.message}`);
      addLog(`错误堆栈: ${error.stack}`);
    }

    // 5. 检查最近创建的项目
    addLog('步骤5: 查询最近创建的5个项目');
    try {
      const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });
      const { data: recentProjects, error } = await client
        .from('projects')
        .select('id, name, brand, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        addLog(`❌ 查询最近项目失败: ${error.message}`);
      } else {
        addLog(`✅ 查询成功，项目数量: ${recentProjects?.length || 0}`);
        if (recentProjects && recentProjects.length > 0) {
          recentProjects.forEach((p, i) => {
            addLog(`  ${i + 1}. ${p.name} (${p.brand}) - 创建时间: ${p.created_at}`);
          });
        }
      }
    } catch (error: any) {
      addLog(`❌ 查询最近项目异常: ${error.message}`);
    }

    addLog('=== 诊断完成 ===');

    return NextResponse.json({
      success: true,
      logs,
      envCheck,
      timezone,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    addLog(`❌ 诊断过程异常: ${error.message}`);
    return NextResponse.json({
      success: false,
      logs,
      error: error.message,
    }, { status: 500 });
  }
}
