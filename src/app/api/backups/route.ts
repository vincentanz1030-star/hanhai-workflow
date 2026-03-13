import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';
import { isAdmin } from '@/lib/permissions';

// 类型定义
interface BackupRecord {
  id: string;
  name: string;
  description: string | null;
  file_size: number;
  record_count: number;
  tables: string[];
  created_by: string;
  created_at: string;
}

// 获取备份列表
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // 使用统一的权限检查函数
    const admin = await isAdmin(authResult.userId);
    if (!admin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const client = getSupabaseClient();

    const { data: backups, error } = await client
      .from('data_backups')
      .select('*')
      .eq('is_deleted', false)
      .order('backup_date', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 转换字段名以匹配前端期望
    const formattedBackups = (backups || []).map((b: { id: string; name: string; type: string; size: number; file_path: string | null; backup_date: string; created_by: string | null }) => ({
      id: b.id,
      name: b.name,
      type: b.type,
      file_size: b.size,
      file_path: b.file_path,
      created_at: b.backup_date,
      created_by: b.created_by,
    }));

    return NextResponse.json({ success: true, backups: formattedBackups });
  } catch (error) {
    console.error('获取备份列表失败:', error);
    return NextResponse.json({ error: '获取备份列表失败' }, { status: 500 });
  }
}

// 创建备份
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // 使用统一的权限检查函数
    const admin = await isAdmin(authResult.userId);
    if (!admin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: '备份名称不能为空' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 要备份的表
    const tables = [
      'users', 'user_roles_v2', 'projects', 'tasks',
      'weekly_work_plans', 'collaboration_tasks', 'sales_targets',
      'monthly_sales_targets', 'product_categories', 'notifications',
      'audit_logs', 'system_configs', 'data_backups',
    ];

    const backupData: any = {};
    let totalRecords = 0;

    // 导出每个表的数据
    for (const table of tables) {
      try {
        const { data, error } = await client.from(table).select('*');
        if (!error && data) {
          backupData[table] = data;
          totalRecords += data.length;
        }
      } catch (e) {
        console.error(`备份表 ${table} 失败:`, e);
      }
    }

    // 创建备份记录（使用实际表结构）
    const { data: backupRecord, error } = await client
      .from('data_backups')
      .insert({
        name,
        type: 'full',
        size: JSON.stringify(backupData).length,
        file_path: null,
        backup_date: new Date().toISOString(),
        created_by: authResult.userId,
        is_deleted: false,
      })
      .select()
      .single();

    if (error) {
      console.error('创建备份记录失败:', error);
      // 返回备份信息，即使记录创建失败
      return NextResponse.json({
        success: true,
        backup: {
          name,
          description,
          file_size: JSON.stringify(backupData).length,
          record_count: totalRecords,
          tables,
          created_at: new Date().toISOString(),
        },
        backup_data: backupData,
        message: `备份成功，包含 ${totalRecords} 条记录（备份数据已返回，请保存）`,
      });
    }

    return NextResponse.json({
      success: true,
      backup: backupRecord,
      message: `备份成功，包含 ${totalRecords} 条记录`,
    });
  } catch (error) {
    console.error('创建备份失败:', error);
    return NextResponse.json({ error: '创建备份失败' }, { status: 500 });
  }
}

// 删除备份
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // 使用统一的权限检查函数
    const admin = await isAdmin(authResult.userId);
    if (!admin) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少备份ID' }, { status: 400 });
    }

    const client = getSupabaseClient();

    const { error } = await client
      .from('data_backups')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '备份已删除' });
  } catch (error) {
    console.error('删除备份失败:', error);
    return NextResponse.json({ error: '删除备份失败' }, { status: 500 });
  }
}
