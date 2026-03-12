import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';

// 辅助函数：将下划线命名转为驼峰命名
const toCamelCase = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  const result: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = toCamelCase(obj[key]);
  }
  return result;
};

// 获取产品品类列表
// 直接从环境变量获取 Supabase 配置

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');

    let query = client
      .from('product_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (brand && brand !== 'all') {
      query = query.eq('brand', brand);
    }

    const { data: categories, error } = await query;

    if (error) {
      console.error('获取产品品类失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 返回扁平化列表，让前端自己构建树
    return NextResponse.json({ categories: toCamelCase(categories || []) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建新产品品类
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { brand, level, parentId, name, code, description, sortOrder } = body;

    console.log('=== POST 创建品类 ===');
    console.log('body:', body);
    console.log('parentId:', parentId);
    console.log('parentId type:', typeof parentId);

    if (!brand || !level || !name) {
      return NextResponse.json(
        { error: '品牌、级别和名称为必填项' },
        { status: 400 }
      );
    }

    // 处理parentId：如果为空字符串，设置为null
    const processedParentId = (parentId === '' || parentId === undefined) ? null : parentId;
    
    console.log('processedParentId:', processedParentId);

    // 创建品类
    const { data: category, error } = await client
      .from('product_categories')
      .insert({
        brand,
        level,
        parent_id: processedParentId,
        name,
        code: code || null,
        description: description || null,
        sort_order: sortOrder || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('创建产品品类失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('创建成功:', category);

    return NextResponse.json({ category: toCamelCase(category) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
