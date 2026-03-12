import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';

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

// 更新任务
// 直接从环境变量获取 Supabase 配置

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { 
      progress, 
      status, 
      actualCompletionDate, 
      imageUrl, 
      imageUrl2, 
      imageUrl3, 
      customProgressLabels,
      estimatedCompletionDate,
      rating,
      reminderCount,
      lastReminderAt,
      taskName,
      description
    } = body;

    // 验证进度值
    if (progress !== undefined && (progress < 0 || progress > 100)) {
      return NextResponse.json(
        { error: '进度值必须在 0-100 之间' },
        { status: 400 }
      );
    }

    // 验证评分值
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: '评分值必须在 1-5 之间' },
        { status: 400 }
      );
    }

    // 更新数据
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (progress !== undefined) {
      updateData.progress = progress;
    }

    if (status) {
      updateData.status = status;
    }

    if (actualCompletionDate) {
      updateData.actual_completion_date = actualCompletionDate;
    }

    if (imageUrl !== undefined) {
      updateData.image_url = imageUrl;
    }

    if (imageUrl2 !== undefined) {
      updateData.image_url_2 = imageUrl2;
    }

    if (imageUrl3 !== undefined) {
      updateData.image_url_3 = imageUrl3;
    }

    if (customProgressLabels !== undefined) {
      updateData.custom_progress_labels = customProgressLabels;
    }

    if (estimatedCompletionDate !== undefined) {
      updateData.estimated_completion_date = estimatedCompletionDate;
    }

    if (rating !== undefined) {
      updateData.rating = rating;
    }

    if (reminderCount !== undefined) {
      updateData.reminder_count = reminderCount;
    }

    if (lastReminderAt !== undefined) {
      updateData.last_reminder_at = lastReminderAt;
    }

    if (taskName !== undefined) {
      updateData.task_name = taskName;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    // 根据进度自动更新状态
    if (progress === 100 && !status) {
      updateData.status = 'completed';
      updateData.actual_completion_date = new Date().toISOString();
    } else if (progress > 0 && progress < 100 && !status) {
      updateData.status = 'in_progress';
    }

    const { data, error } = await client
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新任务失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ task: toCamelCase(data) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { error } = await client
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('删除任务失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
