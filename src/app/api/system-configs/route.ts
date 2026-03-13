import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';
import { isAdmin } from '@/lib/permissions';

// 直接从环境变量获取 Supabase 配置
interface SystemConfig {
  key: string;
  value: string;
  category: 'general' | 'brand' | 'position' | 'notification' | 'workflow';
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  updated_at: string;
  updated_by: string;
}

// 获取系统配置
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

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as string | null;

    const client = getSupabaseClient();

    let query = client.from('system_configs').select('*');

    if (category) {
      query = query.eq('category', category);
    }

    const { data: configs, error } = await query.order('category', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, configs });
  } catch (error) {
    console.error('获取系统配置失败:', error);
    return NextResponse.json({ error: '获取系统配置失败' }, { status: 500 });
  }
}

// 更新系统配置
export async function PUT(request: NextRequest) {
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
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const client = getSupabaseClient();

    const { data: config, error } = await client
      .from('system_configs')
      .update({
        value: String(value),
        updated_at: new Date().toISOString(),
        updated_by: authResult.userId,
      })
      .eq('key', key)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('更新系统配置失败:', error);
    return NextResponse.json({ error: '更新系统配置失败' }, { status: 500 });
  }
}

// 批量更新系统配置
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
    const { configs } = body;

    if (!Array.isArray(configs) || configs.length === 0) {
      return NextResponse.json({ error: '无效的配置数据' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 批量更新配置
    const updates = configs.map((config: { key: string; value: string }) =>
      client
        .from('system_configs')
        .update({
          value: String(config.value),
          updated_at: new Date().toISOString(),
          updated_by: authResult.userId,
        })
        .eq('key', config.key)
    );

    const results = await Promise.all(updates);

    return NextResponse.json({ success: true, updated: configs.length });
  } catch (error) {
    console.error('批量更新系统配置失败:', error);
    return NextResponse.json({ error: '批量更新系统配置失败' }, { status: 500 });
  }
}

// 初始化默认配置（如果不存在）
export async function PATCH(request: NextRequest) {
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

    // 默认配置
    const defaultConfigs = [
      // 通用配置
      { key: 'system_name', value: 'Ai数据助手', category: 'general', description: '系统名称', type: 'string' },
      { key: 'company_name', value: 'Ai数据助手集团', category: 'general', description: '公司名称', type: 'string' },
      { key: 'system_version', value: '2.0.0', category: 'general', description: '系统版本', type: 'string' },
      { key: 'enable_registration', value: 'true', category: 'general', description: '是否允许注册', type: 'boolean' },
      { key: 'default_timezone', value: 'Asia/Shanghai', category: 'general', description: '默认时区', type: 'string' },

      // 通知配置
      { key: 'email_enabled', value: 'true', category: 'notification', description: '启用邮件通知', type: 'boolean' },
      { key: 'email_host', value: 'smtp.example.com', category: 'notification', description: '邮件服务器', type: 'string' },
      { key: 'email_port', value: '587', category: 'notification', description: '邮件端口', type: 'number' },
      { key: 'email_user', value: '', category: 'notification', description: '邮件用户名', type: 'string' },
      { key: 'sms_enabled', value: 'false', category: 'notification', description: '启用短信通知', type: 'boolean' },

      // 工作流配置
      { key: 'default_task_days', value: '3', category: 'workflow', description: '默认任务天数', type: 'number' },
      { key: 'reminder_before_days', value: '1', category: 'workflow', description: '提前提醒天数', type: 'number' },
      { key: 'auto_reminder_enabled', value: 'true', category: 'workflow', description: '自动提醒', type: 'boolean' },
      { key: 'max_reminder_count', value: '5', category: 'workflow', description: '最大提醒次数', type: 'number' },
    ];

    // 检查并创建不存在的配置
    for (const config of defaultConfigs) {
      const { data: existing } = await client
        .from('system_configs')
        .select('key')
        .eq('key', config.key)
        .single();

      if (!existing) {
        await client.from('system_configs').insert({
          ...config,
          updated_at: new Date().toISOString(),
          updated_by: authResult.userId,
        });
      }
    }

    return NextResponse.json({ success: true, message: '默认配置已初始化' });
  } catch (error) {
    console.error('初始化系统配置失败:', error);
    return NextResponse.json({ error: '初始化系统配置失败' }, { status: 500 });
  }
}
