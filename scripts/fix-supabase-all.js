#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 递归查找所有 route.ts 文件
function findRouteFiles(dir) {
  const results = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 和 .next 目录
      if (item !== 'node_modules' && item !== '.next') {
        results.push(...findRouteFiles(fullPath));
      }
    } else if (item === 'route.ts') {
      results.push(fullPath);
    }
  }
  
  return results;
}

// 修复单个文件
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  
  // 检查是否需要修复
  if (!content.includes('createClient') && !content.includes('supabaseUrl') && !content.includes('supabaseAnonKey')) {
    return { fixed: false, reason: 'no issues found' };
  }
  
  // 1. 替换导入语句
  // 移除旧的导入
  content = content.replace(/import\s*\{\s*createClient\s*\}\s*from\s*['"]@supabase\/supabase-js['"]\s*;?\n?/g, '');
  
  // 添加新的导入（如果文件中使用了 Supabase 客户端）
  if ((content.includes('createClient') || content.includes('supabaseUrl') || content.includes('supabaseAnonKey')) && 
      !content.includes("from '@/storage/database/supabase-client'")) {
    // 在文件开头添加新导入
    content = `import { getSupabaseClient } from '@/storage/database/supabase-client';\n` + content;
  }
  
  // 2. 移除环境变量声明
  // 移除 const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
  content = content.replace(/const\s+supabaseUrl\s*=\s*process\.env\.COZE_SUPABASE_URL\s*\|\|\s*['"]['"]\s*;?\n?/g, '');
  // 移除 const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';
  content = content.replace(/const\s+supabaseAnonKey\s*=\s*process\.env\.COZE_SUPABASE_ANON_KEY\s*\|\|\s*['"]['"]\s*;?\n?/g, '');
  // 移除 const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY || '';
  content = content.replace(/const\s+supabaseKey\s*=\s*process\.env\.COZE_SUPABASE_ANON_KEY\s*\|\|\s*['"]['"]\s*;?\n?/g, '');
  
  // 3. 替换 createClient 调用
  // 替换 createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } })
  content = content.replace(/createClient\s*\(\s*supabaseUrl\s*,\s*supabaseAnonKey\s*,\s*\{\s*db:\s*\{\s*schema:\s*["']public["']\s*as\s+const\s*\}\s*\}\s*\)/g, 'getSupabaseClient()');
  
  // 替换 createClient(supabaseUrl, supabaseAnonKey, { db: { schema: 'public' } })
  content = content.replace(/createClient\s*\(\s*supabaseUrl\s*,\s*supabaseAnonKey\s*,\s*\{\s*db:\s*\{\s*schema:\s*['"]public['"]\s*\}\s*\}\s*\)/g, 'getSupabaseClient()');
  
  // 替换 createClient(supabaseUrl, supabaseAnonKey)
  content = content.replace(/createClient\s*\(\s*supabaseUrl\s*,\s*supabaseAnonKey\s*\)/g, 'getSupabaseClient()');
  
  // 替换 createClient(supabaseUrl, supabaseKey)
  content = content.replace(/createClient\s*\(\s*supabaseUrl\s*,\s*supabaseKey\s*\)/g, 'getSupabaseClient()');
  
  // 4. 移除环境变量检查
  // 移除 if (!supabaseUrl || !supabaseAnonKey) { ... }
  content = content.replace(/if\s*\(\s*!supabaseUrl\s*\|\|\s*!supabaseAnonKey\s*\)\s*\{\s*return\s+NextResponse\.json\s*\(\s*\{\s*error:\s*['"]数据库配置未设置['"]\s*\}\s*,\s*\{\s*status:\s*500\s*\}\s*\)\s*;?\s*\}\s*/g, '');
  
  // 移除 if (!supabaseUrl || !supabaseKey) { ... }
  content = content.replace(/if\s*\(\s*!supabaseUrl\s*\|\|\s*!supabaseKey\s*\)\s*\{\s*return\s+NextResponse\.json\s*\(\s*\{\s*error:\s*['"]数据库配置未设置['"]\s*\}\s*,\s*\{\s*status:\s*500\s*\}\s*\)\s*;?\s*\}\s*/g, '');
  
  // 移除 const client = createClient(...)
  content = content.replace(/const\s+client\s*=\s*createClient\s*\([^)]*\)\s*;?\n?/g, '');
  
  // 5. 清理空行
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // 6. 如果文件仍然引用 createClient 或 supabaseUrl，说明有特殊情况需要手动处理
  if (content.includes('createClient') || content.includes('supabaseUrl') || content.includes('supabaseAnonKey')) {
    // 尝试更激进的替换
    // 替换任何剩余的 createClient(...) 调用
    content = content.replace(/createClient\s*\([^)]*\)/g, 'getSupabaseClient()');
    
    // 移除任何剩余的环境变量引用
    content = content.replace(/supabaseUrl/g, '// REMOVED: supabaseUrl');
    content = content.replace(/supabaseAnonKey/g, '// REMOVED: supabaseAnonKey');
    content = content.replace(/supabaseKey/g, '// REMOVED: supabaseKey');
  }
  
  // 如果内容有变化，写入文件
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { fixed: true, reason: 'fixed' };
  }
  
  return { fixed: false, reason: 'no changes needed' };
}

// 主函数
function main() {
  const srcDir = path.join(__dirname, '..', 'src', 'app', 'api');
  
  if (!fs.existsSync(srcDir)) {
    console.error('Source directory not found:', srcDir);
    process.exit(1);
  }
  
  const files = findRouteFiles(srcDir);
  console.log(`Found ${files.length} route files to check`);
  
  let fixedCount = 0;
  let skippedCount = 0;
  
  for (const file of files) {
    const result = fixFile(file);
    if (result.fixed) {
      console.log(`✓ Fixed: ${path.relative(srcDir, file)}`);
      fixedCount++;
    } else {
      skippedCount++;
    }
  }
  
  console.log(`\nTotal: ${files.length} files`);
  console.log(`Fixed: ${fixedCount} files`);
  console.log(`Skipped: ${skippedCount} files`);
}

main();
