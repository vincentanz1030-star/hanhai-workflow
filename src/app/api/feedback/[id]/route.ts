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

// 更新反馈
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { status, priority } = body;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }
    }

    if (priority) {
      updateData.priority = priority;
    }

    const { data, error } = await client
      .from('feedback')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新反馈失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feedback: toCamelCase(data) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除反馈
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { error } = await client
      .from('feedback')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除反馈失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
