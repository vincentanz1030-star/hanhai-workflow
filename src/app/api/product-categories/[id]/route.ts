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

    // 先获取当前品类信息
    const { data: currentCategory } = await client
      .from('product_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentCategory) {
      return NextResponse.json({ error: '品类不存在' }, { status: 404 });
    }

    // 构建更新对象
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (brand !== undefined) updateData.brand = brand;
    if (level !== undefined) updateData.level = level;
    
    // 智能处理parentId：只有当明确提供有效值时才更新
    if (parentId !== undefined && parentId !== '') {
      updateData.parent_id = parentId;
    }
    
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;

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
