import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { logAuditAction } from '@/lib/audit-log';

const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

/**
 * 导出项目数据为CSV格式
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { dataType, startDate, endDate, brand } = body; // dataType: 'projects', 'tasks', 'reports'

    if (!dataType) {
      return NextResponse.json({ error: '请指定导出数据类型' }, { status: 400 });
    }

    const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: "public" as const } });
    
    let data: any[] = [];
    let filename = '';

    // 品牌过滤
    const isAdmin = authResult.roles && authResult.roles.some((r: any) => r.role === 'admin');
    const userBrand = authResult.brand;
    let queryBrand = brand;
    if (!isAdmin && userBrand && userBrand !== 'all') {
      queryBrand = userBrand;
    }

    switch (dataType) {
      case 'projects':
        filename = `项目数据_${new Date().toISOString().split('T')[0]}.csv`;
        
        let projectQuery = client
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false });

        if (queryBrand) {
          projectQuery = projectQuery.eq('brand', queryBrand);
        }
        
        if (startDate) {
          projectQuery = projectQuery.gte('created_at', startDate);
        }
        if (endDate) {
          projectQuery = projectQuery.lte('created_at', endDate + 'T23:59:59');
        }

        const { data: projects } = await projectQuery;
        data = projects || [];
        break;

      case 'tasks':
        filename = `任务数据_${new Date().toISOString().split('T')[0]}.csv`;
        
        let taskQuery = client
          .from('tasks')
          .select(`
            *,
            projects (
              id,
              name,
              brand,
              sales_date
            )
          `)
          .order('created_at', { ascending: false });

        const { data: tasks } = await taskQuery;
        
        // 扁平化数据
        data = (tasks || []).map((task: any) => ({
          ...task,
          project_name: task.projects?.name || '',
          project_brand: task.projects?.brand || '',
          project_sales_date: task.projects?.sales_date || '',
        }));
        
        // 移除嵌套对象
        data = data.map((item: any) => {
          const { projects, ...rest } = item;
          return rest;
        });
        break;

      case 'sales_targets':
        filename = `销售目标_${new Date().toISOString().split('T')[0]}.csv`;
        
        let targetQuery = client
          .from('annual_sales_targets')
          .select('*')
          .order('year', { ascending: false });

        if (queryBrand) {
          targetQuery = targetQuery.eq('brand', queryBrand);
        }

        const { data: targets } = await targetQuery;
        data = targets || [];
        break;

      default:
        return NextResponse.json({ error: '不支持的数据类型' }, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json({ error: '没有可导出的数据' }, { status: 404 });
    }

    // 转换为CSV格式
    const headers = Object.keys(data[0]).map(key => {
      // 转换驼峰命名为中文标题
      const headerMap: any = {
        id: 'ID',
        name: '名称',
        brand: '品牌',
        salesDate: '销售日期',
        status: '状态',
        createdAt: '创建时间',
        updatedAt: '更新时间',
        year: '年份',
        targetAmount: '目标金额',
        actualAmount: '实际金额',
        taskId: '任务ID',
        role: '岗位',
        taskName: '任务名称',
        progress: '进度',
        estimatedCompletionDate: '预计完成日期',
        actualCompletionDate: '实际完成日期',
        projectName: '项目名称',
        project_brand: '项目品牌',
        project_sales_date: '项目销售日期',
      };
      return headerMap[key] || key;
    });

    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map((header, index) => {
          const key = Object.keys(data[0])[index];
          const value = row[key];
          
          // 处理特殊字符
          if (value === null || value === undefined) {
            return '';
          }
          
          const stringValue = String(value);
          
          // 如果包含逗号、引号或换行，需要用引号包裹并转义引号
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          
          return stringValue;
        }).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');

    // 记录导出操作
    await logAuditAction({
      userId: authResult.userId,
      userName: authResult.email,
      userRole: authResult.roles?.[0]?.role || '',
      action: 'export',
      resourceType: dataType,
      details: { recordCount: data.length, filters: { startDate, endDate, brand } },
      request,
    });

    // 返回CSV文件
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error('导出数据失败:', error);
    return NextResponse.json({ error: '导出失败' }, { status: 500 });
  }
}
