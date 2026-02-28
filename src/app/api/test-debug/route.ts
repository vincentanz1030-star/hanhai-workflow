import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const logs: string[] = [];

  const addLog = (message: string) => {
    logs.push(`[${new Date().toISOString()}] ${message}`);
    console.log(message);
  };

  try {
    addLog('=== 开始测试 ===');

    // 1. 测试环境变量
    addLog('步骤 1: 检查环境变量');
    const supabaseUrl = process.env.COZE_SUPABASE_URL;
    const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY;
    addLog(`Supabase URL: ${supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : '未设置'}`);
    addLog(`Supabase Key: ${supabaseKey ? supabaseKey.substring(0, 20) + '...' : '未设置'}`);

    // 2. 测试数据库连接
    addLog('步骤 2: 测试数据库连接');
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.from('users').select('count').limit(1);
      if (error) {
        addLog(`❌ 数据库连接失败: ${error.message}`);
      } else {
        addLog('✅ 数据库连接成功');
      }
    } catch (error: any) {
      addLog(`❌ 数据库连接异常: ${error.message}`);
      return NextResponse.json({ logs, error: '数据库连接失败' }, { status: 500 });
    }

    // 3. 测试用户认证
    addLog('步骤 3: 测试用户认证');
    try {
      const currentUser = await getCurrentUser(request);
      if (currentUser) {
        addLog(`✅ 用户已登录: ${currentUser.email}`);
        addLog(`用户ID: ${currentUser.userId}`);
        addLog(`用户品牌: ${currentUser.brand}`);
      } else {
        addLog('❌ 用户未登录');
        return NextResponse.json({ logs, error: '用户未登录' }, { status: 401 });
      }
    } catch (error: any) {
      addLog(`❌ 认证失败: ${error.message}`);
      return NextResponse.json({ logs, error: '认证失败' }, { status: 500 });
    }

    // 4. 测试查询项目
    addLog('步骤 4: 查询现有项目');
    try {
      const client = getSupabaseClient();
      const { data: projects, error } = await client
        .from('projects')
        .select('id, name, brand, category')
        .limit(5);

      if (error) {
        addLog(`❌ 查询项目失败: ${error.message}`);
      } else {
        addLog(`✅ 查询成功，项目数量: ${projects?.length || 0}`);
        if (projects && projects.length > 0) {
          addLog(`第一个项目: ${JSON.stringify(projects[0])}`);
        }
      }
    } catch (error: any) {
      addLog(`❌ 查询项目异常: ${error.message}`);
    }

    // 5. 测试创建简单项目
    addLog('步骤 5: 测试创建简单项目');
    try {
      const client = getSupabaseClient();
      const testProject = {
        name: `测试项目_${Date.now()}`,
        brand: 'he_zhe',
        category: 'product_development',
        sales_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        project_confirm_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
      };

      addLog(`准备创建项目: ${JSON.stringify(testProject)}`);

      const { data: project, error: insertError } = await client
        .from('projects')
        .insert(testProject)
        .select()
        .single();

      if (insertError) {
        addLog(`❌ 创建项目失败: ${insertError.message}`);
        addLog(`错误详情: ${JSON.stringify(insertError)}`);
      } else {
        addLog(`✅ 创建项目成功，ID: ${project.id}`);
        addLog(`项目信息: ${JSON.stringify(project)}`);

        // 立即查询刚创建的项目
        const { data: checkProject, error: checkError } = await client
          .from('projects')
          .select('*')
          .eq('id', project.id)
          .single();

        if (checkError) {
          addLog(`❌ 查询刚创建的项目失败: ${checkError.message}`);
        } else {
          addLog(`✅ 查询成功，项目存在`);
        }
      }
    } catch (error: any) {
      addLog(`❌ 创建项目异常: ${error.message}`);
      addLog(`错误堆栈: ${error.stack}`);
    }

    return NextResponse.json({
      success: true,
      logs,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    addLog(`❌ 测试过程异常: ${error.message}`);
    return NextResponse.json({
      success: false,
      logs,
      error: error.message,
    }, { status: 500 });
  }
}
