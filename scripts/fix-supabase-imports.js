/**
 * 修复 Supabase 客户端导入
 * 将直接使用 createClient 的文件改为使用 getSupabaseClient
 */

const fs = require('fs');
const path = require('path');

const API_DIR = '/workspace/projects/src/app/api';

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  
  // 检查是否需要修复
  if (!content.includes("import { createClient } from '@supabase/supabase-js'")) {
    return false;
  }
  
  console.log('Fixing:', filePath);
  
  // 1. 替换导入语句
  content = content.replace(
    /import { createClient } from '@supabase\/supabase-js';/,
    "import { getSupabaseClient } from '@/storage/database/supabase-client';"
  );
  
  // 2. 删除本地 Supabase 配置变量
  content = content.replace(/const supabaseUrl = process\.env\.COZE_SUPABASE_URL!?\n?/g, '');
  content = content.replace(/const supabaseAnonKey = process\.env\.COZE_SUPABASE_ANON_KEY!?\n?/g, '');
  content = content.replace(/const supabaseKey = process\.env\.COZE_SUPABASE_ANON_KEY[^;]*;\n?/g, '');
  
  // 3. 删除本地 getSupabaseClient 函数定义
  // 匹配 function getSupabaseClient() {...}
  content = content.replace(
    /function getSupabaseClient\(\)[\s\S]*?^}\n?/gm,
    ''
  );
  
  // 匹配 const getSupabaseClient = () => {...}
  content = content.replace(
    /const getSupabaseClient = \(\)[\s\S]*?^};?\n?/gm,
    ''
  );
  
  // 4. 替换 supabase 变量初始化
  content = content.replace(
    /const supabase = createClient\([^)]+\);/g,
    'const supabase = getSupabaseClient();'
  );
  
  // 5. 清理多余的空行
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // 如果内容有变化，写回文件
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  
  return false;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixedCount += walkDir(filePath);
    } else if (file.endsWith('.ts')) {
      if (fixFile(filePath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

// 执行修复
const fixedCount = walkDir(API_DIR);
console.log(`\nDone! Fixed ${fixedCount} files.`);
