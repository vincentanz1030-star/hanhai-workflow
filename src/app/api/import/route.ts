import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';
import * as XLSX from 'xlsx';

// 直接从环境变量获取 Supabase 配置
interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
}

// 解析Excel文件
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // 检查是否有管理员权限
    const { data: userRoles } = await getSupabaseClient()
      .from('user_roles')
      .select('role')
      .eq('user_id', authResult.userId);

    const hasAdminRole = userRoles?.some((ur: { role: string }) => ur.role === 'admin');
    if (!hasAdminRole) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // projects, tasks, sales_targets

    if (!file) {
      return NextResponse.json({ error: '请选择要导入的文件' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: '请指定导入类型' }, { status: 400 });
    }

    // 读取Excel文件
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (!jsonData || jsonData.length === 0) {
      return NextResponse.json({ error: '文件内容为空或格式不正确' }, { status: 400 });
    }

    const client = getSupabaseClient();

    let result: ImportResult;

    switch (type) {
      case 'projects':
        result = await importProjects(client, jsonData, authResult.userId);
        break;
      case 'tasks':
        result = await importTasks(client, jsonData, authResult.userId);
        break;
      case 'sales_targets':
        result = await importSalesTargets(client, jsonData, authResult.userId);
        break;
      default:
        return NextResponse.json({ error: '不支持的导入类型' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('导入数据失败:', error);
    return NextResponse.json({ error: '导入数据失败: ' + (error as Error).message }, { status: 500 });
  }
}

// 导入项目
async function importProjects(client: any, data: any[], userId: string): Promise<ImportResult> {
  const errors: Array<{ row: number; message: string }> = [];
  let imported = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2; // Excel行号（从1开始，表头占1行）

    try {
      // 验证必填字段
      if (!row['项目名称'] || !row['品牌'] || !row['类型'] || !row['销售日期']) {
        errors.push({ row: rowNum, message: '缺少必填字段（项目名称、品牌、类型、销售日期）' });
        continue;
      }

      // 映射品牌
      const brandMap: Record<string, string> = {
        '禾哲': 'he_zhe',
        'BAOBAO': 'baobao',
        '爱禾': 'ai_he',
        '宝登源': 'bao_deng_yuan',
      };
      const brand = brandMap[row['品牌']] || row['品牌'].toLowerCase();

      // 映射项目类型
      const categoryMap: Record<string, string> = {
        '产品开发': 'product_development',
        '运营活动': 'operations_activity',
      };
      const category = categoryMap[row['类型']] || row['类型'].toLowerCase();

      // 创建项目
      const { error } = await client.from('projects').insert({
        name: row['项目名称'],
        brand: brand,
        category: category,
        sales_date: new Date(row['销售日期']).toISOString(),
        project_confirm_date: row['确认日期'] ? new Date(row['确认日期']).toISOString() : null,
        overall_completion_date: row['预计完成日期'] ? new Date(row['预计完成日期']).toISOString() : null,
        status: 'pending',
        description: row['描述'] || null,
        created_by: userId,
      });

      if (error) {
        errors.push({ row: rowNum, message: error.message });
      } else {
        imported++;
      }
    } catch (e) {
      errors.push({ row: rowNum, message: (e as Error).message });
    }
  }

  return {
    success: true,
    imported,
    failed: errors.length,
    errors,
  };
}

// 导入任务
async function importTasks(client: any, data: any[], userId: string): Promise<ImportResult> {
  const errors: Array<{ row: number; message: string }> = [];
  let imported = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    try {
      // 验证必填字段
      if (!row['任务名称'] || !row['岗位'] || !row['项目ID']) {
        errors.push({ row: rowNum, message: '缺少必填字段（任务名称、岗位、项目ID）' });
        continue;
      }

      // 映射岗位
      const positionMap: Record<string, string> = {
        '插画': 'illustration',
        '产品': 'product_design',
        '详情': 'detail_design',
        '文案': 'copywriting',
        '采购': 'procurement',
        '包装': 'packaging_design',
        '财务': 'finance',
        '客服': 'customer_service',
        '仓储': 'warehouse',
        '运营': 'operations',
      };
      const role = positionMap[row['岗位']] || row['岗位'].toLowerCase();

      // 创建任务
      const { error } = await client.from('tasks').insert({
        project_id: row['项目ID'],
        role: role,
        task_name: row['任务名称'],
        task_order: row['顺序'] || 0,
        description: row['描述'] || null,
        progress: row['进度'] || 0,
        estimated_completion_date: row['预计完成日期'] ? new Date(row['预计完成日期']).toISOString() : null,
        status: row['状态'] || 'pending',
        created_by: userId,
      });

      if (error) {
        errors.push({ row: rowNum, message: error.message });
      } else {
        imported++;
      }
    } catch (e) {
      errors.push({ row: rowNum, message: (e as Error).message });
    }
  }

  return {
    success: true,
    imported,
    failed: errors.length,
    errors,
  };
}

// 导入销售目标
async function importSalesTargets(client: any, data: any[], userId: string): Promise<ImportResult> {
  const errors: Array<{ row: number; message: string }> = [];
  let imported = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2;

    try {
      // 验证必填字段
      if (!row['品牌'] || !row['年份'] || !row['月度目标']) {
        errors.push({ row: rowNum, message: '缺少必填字段（品牌、年份、月度目标）' });
        continue;
      }

      // 映射品牌
      const brandMap: Record<string, string> = {
        '禾哲': 'he_zhe',
        'BAOBAO': 'baobao',
        '爱禾': 'ai_he',
        '宝登源': 'bao_deng_yuan',
      };
      const brand = brandMap[row['品牌']] || row['品牌'].toLowerCase();

      const year = parseInt(row['年份']);
      const month = parseInt(row['月份']) || 1;

      // 创建月度销售目标
      const { error } = await client.from('monthly_sales_targets').insert({
        year: year,
        month: month,
        brand: brand,
        target_amount: parseFloat(row['月度目标']) || 0,
        actual_amount: parseFloat(row['实际完成']) || 0,
        description: row['描述'] || null,
        created_by: userId,
      });

      if (error) {
        errors.push({ row: rowNum, message: error.message });
      } else {
        imported++;
      }
    } catch (e) {
      errors.push({ row: rowNum, message: (e as Error).message });
    }
  }

  return {
    success: true,
    imported,
    failed: errors.length,
    errors,
  };
}

// 下载导入模板
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { data: userRoles } = await getSupabaseClient()
      .from('user_roles')
      .select('role')
      .eq('user_id', authResult.userId);

    const hasAdminRole = userRoles?.some((ur: { role: string }) => ur.role === 'admin');
    if (!hasAdminRole) {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as string;

    if (!type || !['projects', 'tasks', 'sales_targets'].includes(type)) {
      return NextResponse.json({ error: '无效的模板类型' }, { status: 400 });
    }

    // 创建模板数据
    let templateData: any[] = [];
    let filename = 'template.xlsx';

    switch (type) {
      case 'projects':
        templateData = [
          {
            '项目名称': '示例项目',
            '品牌': '禾哲',
            '类型': '产品开发',
            '销售日期': '2025-01-20',
            '确认日期': '2025-01-01',
            '预计完成日期': '2025-01-15',
            '描述': '项目描述',
          },
        ];
        filename = '项目导入模板.xlsx';
        break;
      case 'tasks':
        templateData = [
          {
            '项目ID': 'uuid-here',
            '任务名称': '示例任务',
            '岗位': '插画',
            '顺序': 1,
            '描述': '任务描述',
            '进度': 0,
            '预计完成日期': '2025-01-15',
            '状态': 'pending',
          },
        ];
        filename = '任务导入模板.xlsx';
        break;
      case 'sales_targets':
        templateData = [
          {
            '品牌': '禾哲',
            '年份': 2025,
            '月份': 1,
            '月度目标': 100000,
            '实际完成': 0,
            '描述': '1月销售目标',
          },
        ];
        filename = '销售目标导入模板.xlsx';
        break;
    }

    // 生成Excel文件
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    return new Response(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error('下载模板失败:', error);
    return NextResponse.json({ error: '下载模板失败' }, { status: 500 });
  }
}
