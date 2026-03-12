import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

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

// 获取单个产品品类
// 直接从环境变量获取 Supabase 配置

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

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
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { brand, level, parentId, name, code, description, sortOrder } = body;

    console.log('=== PUT 更新品类 ===');
    console.log('id:', id);
    console.log('body:', body);
    console.log('parentId:', parentId);
    console.log('parentId type:', typeof parentId);

    // 先获取当前品类信息
    const { data: currentCategory } = await client
      .from('product_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentCategory) {
      return NextResponse.json({ error: '品类不存在' }, { status: 404 });
    }

    console.log('当前品类.parent_id:', currentCategory.parent_id);

    // 构建更新数据
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // 只更新提供的字段
    if (brand !== undefined) updateData.brand = brand;
    if (level !== undefined) updateData.level = level;
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;
    
    // 处理parentId：如果提供了，就更新；否则保持原值
    if (parentId !== undefined) {
      updateData.parent_id = parentId === '' ? null : parentId;
    }

    console.log('updateData:', updateData);
    console.log('updateData.parent_id:', updateData.parent_id);

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

    console.log('更新成功:', category);

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
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const client = getSupabaseClient();
    const { id } = await params;

    // 先检查是否有子品类
    const { data: children } = await client
      .from('product_categories')
      .select('id')
      .eq('parent_id', id);

    if (children && children.length > 0) {
      return NextResponse.json(
        { error: '该品类下存在子品类，无法删除' },
        { status: 400 }
      );
    }

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
