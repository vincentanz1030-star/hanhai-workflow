import { createClient } from '@supabase/supabase-js';

// 从环境变量中获取 Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 类型定义
export interface User {
  id: string;
  email: string;
  full_name?: string;
  brand_access?: string[];
  created_at: string;
  updated_at: string;
}
