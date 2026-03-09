const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

// 加载环境变量
function loadEnv() {
  try {
    require('dotenv').config();
  } catch {
    // dotenv not available
  }

  try {
    const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;

    const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  } catch {
    // Silently fail
  }
}

async function testCreateProject() {
  console.log('\n=== 测试创建项目 ===');
  
  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    console.error('❌ 环境变量未设置');
    return false;
  }
  
  const supabase = createClient(url, anonKey, {
    db: { schema: 'public' }
  });
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error(`❌ 查询项目失败: ${error.message}`);
      return false;
    }
    
    console.log(`✅ 项目查询成功，找到 ${data?.length || 0} 个项目`);
    return true;
  } catch (error) {
    console.error(`❌ 测试失败: ${error.message}`);
    return false;
  }
}

async function testSalesTargets() {
  console.log('\n=== 测试销售目标 ===');
  
  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;
  
  const supabase = createClient(url, anonKey, {
    db: { schema: 'public' }
  });
  
  try {
    const { data, error } = await supabase
      .from('annual_sales_targets')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error(`❌ 查询销售目标失败: ${error.message}`);
      return false;
    }
    
    console.log(`✅ 销售目标查询成功，找到 ${data?.length || 0} 个目标`);
    return true;
  } catch (error) {
    console.error(`❌ 测试失败: ${error.message}`);
    return false;
  }
}

async function testWeeklyWorkPlans() {
  console.log('\n=== 测试本周工作安排 ===');
  
  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;
  
  const supabase = createClient(url, anonKey, {
    db: { schema: 'public' }
  });
  
  try {
    const { data, error } = await supabase
      .from('weekly_work_plans')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error(`❌ 查询本周工作安排失败: ${error.message}`);
      return false;
    }
    
    console.log(`✅ 本周工作安排查询成功，找到 ${data?.length || 0} 个计划`);
    return true;
  } catch (error) {
    console.error(`❌ 测试失败: ${error.message}`);
    return false;
  }
}

async function testCollaborationTasks() {
  console.log('\n=== 测试协同任务 ===');
  
  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;
  
  const supabase = createClient(url, anonKey, {
    db: { schema: 'public' }
  });
  
  try {
    const { data, error } = await supabase
      .from('collaboration_tasks')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error(`❌ 查询协同任务失败: ${error.message}`);
      return false;
    }
    
    console.log(`✅ 协同任务查询成功，找到 ${data?.length || 0} 个任务`);
    return true;
  } catch (error) {
    console.error(`❌ 测试失败: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('开始测试 API 接口...');
  
  loadEnv();
  
  const results = {
    projects: await testCreateProject(),
    salesTargets: await testSalesTargets(),
    weeklyWorkPlans: await testWeeklyWorkPlans(),
    collaborationTasks: await testCollaborationTasks(),
  };
  
  console.log('\n=== 测试结果汇总 ===');
  console.log(`创建项目: ${results.projects ? '✅' : '❌'}`);
  console.log(`销售目标: ${results.salesTargets ? '✅' : '❌'}`);
  console.log(`本周工作安排: ${results.weeklyWorkPlans ? '✅' : '❌'}`);
  console.log(`协同任务: ${results.collaborationTasks ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(r => r);
  console.log(`\n${allPassed ? '✅ 所有测试通过！' : '❌ 部分测试失败'}`);
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
