import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 将蛇形命名转换为驼峰命名
function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;

  const newObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // 移除所有下划线，并将下划线后的字母大写
      const camelKey = key.split('_').reduce((result, word, index) => {
        if (index === 0) {
          return word;
        }
        return result + word.charAt(0).toUpperCase() + word.slice(1);
      }, '');
      newObj[camelKey] = toCamelCase(obj[key]);
    }
  }
  return newObj;
}

// 获取所有产品品类（支持按品牌筛选）
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const brand = searchParams.get('brand');

    let query = client
      .from('product_categories')
      .select('*')
      .order('level', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (brand && brand !== 'all') {
      query = query.eq('brand', brand);
    }

    const { data: categories, error } = await query;

    if (error) {
      console.error('获取产品品类失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 构建树形结构
    const buildTree = (items: any[], parentId: string | null = null): any[] => {
      return items
        .filter(item => item.parentId === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id),
        }));
    };

    const tree = buildTree(toCamelCase(categories || []));

    return NextResponse.json({ categories: tree });
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

    console.log('=== POST 接收到的数据 ===');
    console.log('body:', body);
    console.log('parentId:', parentId);
    console.log('parentId type:', typeof parentId);

    if (!brand || !level || !name) {
      return NextResponse.json(
        { error: '品牌、级别和名称为必填项' },
        { status: 400 }
      );
    }

    // 修复：如果parentId是空字符串，转换为null
    const processedParentId = parentId === '' ? null : parentId;
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

    return NextResponse.json({ category: toCamelCase(category) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
