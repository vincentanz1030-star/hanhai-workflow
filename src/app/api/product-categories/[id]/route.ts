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

// 获取单个产品品类
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { data: category, error } = await client
      .from('product_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取产品品类失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!category) {
      return NextResponse.json({ error: '品类不存在' }, { status: 404 });
    }

    return NextResponse.json({ category: toCamelCase(category) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 更新产品品类
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { brand, level, parentId, name, code, description, sortOrder } = body;

    console.log('=== PUT 接收到的数据 ===');
    console.log('body:', body);
    console.log('parentId:', parentId);
    console.log('parentId type:', typeof parentId);
    console.log('parentId === undefined:', parentId === undefined);
    console.log('parentId === null:', parentId === null);
    console.log("parentId === '':", parentId === '');

    // 先获取当前品类信息
    const { data: currentCategory } = await client
      .from('product_categories')
      .select('*')
      .eq('id', id)
      .single();

    console.log('当前品类:', currentCategory);
    console.log('当前品类.parent_id:', currentCategory?.parent_id);

    if (!currentCategory) {
      return NextResponse.json({ error: '品类不存在' }, { status: 404 });
    }

    // 构建更新对象
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (brand !== undefined) {
      updateData.brand = brand;
      console.log('更新 brand:', brand);
    }
    if (level !== undefined) {
      updateData.level = level;
      console.log('更新 level:', level);
    }
    
    // 修复：正确处理parentId更新
    // 规则：
    // 1. 如果parentId === undefined，不更新parent_id（用户未修改）
    // 2. 如果parentId === ''，更新parent_id为null（用户明确选择了"无"）
    // 3. 如果parentId是有效字符串，更新parent_id为该值
    if (parentId !== undefined) {
      updateData.parent_id = parentId === '' ? null : parentId;
      console.log('更新 parent_id:', updateData.parent_id);
    } else {
      console.log('parent_id 未修改，保持原值:', currentCategory.parent_id);
    }
    
    if (name !== undefined) {
      updateData.name = name;
      console.log('更新 name:', name);
    }
    if (code !== undefined) {
      updateData.code = code;
      console.log('更新 code:', code);
    }
    if (description !== undefined) {
      updateData.description = description;
      console.log('更新 description:', description);
    }
    if (sortOrder !== undefined) {
      updateData.sort_order = sortOrder;
      console.log('更新 sort_order:', sortOrder);
    }

    console.log('=== 最终 updateData ===');
    console.log('updateData:', updateData);

    const { data: category, error } = await client
      .from('product_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新产品品类失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!category) {
      return NextResponse.json({ error: '品类不存在' }, { status: 404 });
    }

    return NextResponse.json({ category: toCamelCase(category) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除产品品类
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { error } = await client
      .from('product_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除产品品类失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
