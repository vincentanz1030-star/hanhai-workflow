const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../src/app/api');

function findRouteFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findRouteFiles(fullPath));
    } else if (item.name === 'route.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  
  // 检查是否需要修复
  if (!content.includes('getSupabaseClient')) {
    return false;
  }
  
  console.log(`处理文件: ${path.relative(API_DIR, filePath)}`);
  
  // 1. 添加 createClient import（如果还没有）
  if (!content.includes('import { createClient } from')) {
    // 在第一行 import 前添加
    content = `import { createClient } from '@supabase/supabase-js';\n${content}`;
    modified = true;
  }
  
  // 2. 移除 getSupabaseClient import
  content = content.replace(
    /import\s+\{\s*getSupabaseClient\s*\}\s+from\s+['"]@\/storage\/database\/supabase-client['"];?\n?/g,
    ''
  );
  modified = true;
  
  // 3. 添加环境变量配置（在第一个 export 之前）
  const exportMatch = content.match(/^(export\s+async\s+function\s+\w+)/m);
  if (exportMatch) {
    const envConfig = `
// 直接从环境变量获取 Supabase 配置
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 环境变量未设置');
}

`;
    
    const parts = content.split(exportMatch[1]);
    content = parts[0] + envConfig.trim() + '\n\n' + exportMatch[1] + parts.slice(1).join(exportMatch[1]);
    modified = true;
  }
  
  // 4. 替换 getSupabaseClient() 调用
  // 替换各种形式的调用
  const replacements = [
    [/getSupabaseClient\(\)/g, 'createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } })'],
    [/const (\w+) = getSupabaseClient\(\)/g, 'const $1 = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } })'],
    [/const client = getSupabaseClient\(\)/g, 'const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } })'],
    [/const supabase = getSupabaseClient\(\)/g, 'const supabase = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } })'],
  ];
  
  for (const [pattern, replacement] of replacements) {
    if (content.match(pattern)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('  ✓ 修复完成');
    return true;
  }
  
  return false;
}

// 主函数
function main() {
  console.log('开始批量修复 API Route 文件...\n');
  
  const files = findRouteFiles(API_DIR);
  console.log(`找到 ${files.length} 个 route.ts 文件\n`);
  
  let fixed = 0;
  let skipped = 0;
  
  for (const file of files) {
    if (fixFile(file)) {
      fixed++;
    } else {
      skipped++;
    }
  }
  
  console.log(`\n修复完成！`);
  console.log(`✓ 修复: ${fixed} 个文件`);
  console.log(`⊘ 跳过: ${skipped} 个文件`);
}

main();
