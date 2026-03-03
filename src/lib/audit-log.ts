import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

interface AuditLogOptions {
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: any;
  request?: NextRequest;
}

/**
 * 记录操作日志
 * @param options 日志选项
 */
export async function logAuditAction(options: AuditLogOptions): Promise<void> {
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });

    const ipAddress = options.request?.headers.get('x-forwarded-for') || 
                      options.request?.headers.get('x-real-ip') || 
                      null;
    const userAgent = options.request?.headers.get('user-agent') || null;

    await client.from('audit_logs').insert({
      user_id: options.userId || null,
      user_name: options.userName || null,
      user_role: options.userRole || null,
      action: options.action,
      resource_type: options.resourceType,
      resource_id: options.resourceId || null,
      details: options.details || null,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    // 记录日志失败不应影响主流程，仅打印错误
    console.error('记录审计日志失败:', error);
  }
}

/**
 * 获取操作日志列表
 * @param request NextRequest对象
 * @returns 日志列表或错误响应
 */
export async function getAuditLogs(request: NextRequest): Promise<NextResponse> {
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });
    const searchParams = request.nextUrl.searchParams;
    
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = client
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (action) {
      query = query.eq('action', action);
    }
    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    const { data: logs, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      logs: logs || [], 
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('获取审计日志失败:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
