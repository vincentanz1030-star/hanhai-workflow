/**
 * 修复 Supabase 客户端导入 - 增强版
 * 清理残留代码
 */

const fs = require('fs');
const path = require('path');

const API_DIR = '/workspace/projects/src/app/api';

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  
  // 检查是否需要修复
  if (!content.includes("import { getSupabaseClient } from '@/storage/database/supabase-client'")) {
    return false;
  }
  
  console.log('Checking:', filePath);
  
  // 删除残留的空变量声明
  // 模式: " || '';" 或 " || ''\n"
  content = content.replace(/^\s*\|\| '';\s*\n/gm, '');
  content = content.replace(/^\s*\|\| "";?\s*\n/gm, '');
  
  // 删除残留的条件检查
  // 模式: "if (!supabaseUrl || !supabaseKey) {...}"
  content = content.replace(/if \(!supabaseUrl \|\| !supabaseKey\)[\s\S]*?^}\n?/gm, '');
  content = content.replace(/if \(!supabaseUrl \|\| !supabaseAnonKey\)[\s\S]*?^}\n?/gm, '');
  
  // 删除 "throw new Error('Supabase credentials are not set');" 残留
  content = content.replace(/\s*throw new Error\(['"]Supabase credentials are not set['"]\);?\n?/g, '');
  
  // 清理多余的空行
  content = content.replace(/\n{3,}/g, '\n\n');
  
  // 如果内容有变化，写回文件
  if (content !== originalContent) {
    console.log('Fixed:', filePath);
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
