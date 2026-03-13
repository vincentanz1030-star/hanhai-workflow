import { getSupabaseClient } from '@/storage/database/supabase-client';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

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

// 获取所有年度销售目标
// 直接从环境变量获取 Supabase 配置

export async function GET(request: NextRequest) {
  try {
    // 认证检查（不检查特定权限，只检查是否登录）
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    console.log(`GET /api/sales-targets/annual - 用户: ${authResult.email}, 用户品牌: ${authResult.brand}, 用户角色: ${JSON.stringify(authResult.roles)}`);

    const client = getSupabaseClient();

    // 品牌隔离逻辑
    const isAdmin = authResult.roles && authResult.roles.some((r: any) => r.role === 'admin');
    const userBrand = authResult.brand;

    let query = client
      .from('annual_sales_targets')
      .select('*')
      .order('year', { ascending: false })
      .order('brand', { ascending: true });

    // 应用品牌过滤
    if (!isAdmin) {
      // 品牌用户只能查看对应品牌的销售目标
      if (!userBrand || userBrand === 'all') {
        console.warn(`⚠️ 用户未设置品牌，返回空列表`);
        return NextResponse.json({ targets: [] });
      }
      query = query.eq('brand', userBrand);
      console.log(`品牌用户模式 - 只显示品牌 ${userBrand} 的销售目标`);
    } else {
      console.log(`管理员模式 - 显示所有品牌的销售目标`);
    }

    // 执行查询
    const { data: targets, error } = await query;

    if (error) {
      console.error('获取年度销售目标失败:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 获取每个年度目标的月度目标（去重）
    const targetsWithMonthly = await Promise.all(
      (targets || []).map(async (target: { id: string; [key: string]: any }) => {
        const { data: monthlyTargets } = await client
          .from('monthly_sales_targets')
          .select('*')
          .eq('annual_target_id', target.id)
          .order('month', { ascending: true });

        // 按月份去重，保留每条月的最新记录
        const uniqueMonthlyTargets = monthlyTargets?.reduce((acc: any[], current: any) => {
          const existingIndex = acc.findIndex(item => item.month === current.month);
          if (existingIndex === -1) {
            acc.push(current);
          } else {
            // 保留更新时间较晚的记录
            if (current.updated_at && (!acc[existingIndex].updated_at || current.updated_at > acc[existingIndex].updated_at)) {
              acc[existingIndex] = current;
            }
          }
          return acc;
        }, []) || [];

        return {
          ...target,
          monthlyTargets: uniqueMonthlyTargets,
        };
      })
    );

    return NextResponse.json({ targets: toCamelCase(targetsWithMonthly) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建年度销售目标
export async function POST(request: NextRequest) {
  try {
    // 认证检查（不检查特定权限，只检查是否登录）
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const client = getSupabaseClient();
    const body = await request.json();
    const { year, brand, targetAmount, description, monthlyTargets } = body;

    if (!year || !brand || !targetAmount) {
      return NextResponse.json(
        { error: '年份、品牌和目标金额为必填项' },
        { status: 400 }
      );
    }

    // 品牌隔离检查
    const isAdmin = authResult.roles && authResult.roles.some((r: any) => r.role === 'admin');
    const userBrand = authResult.brand;

    // 非管理员用户只能创建自己品牌的销售目标
    if (!isAdmin && brand !== userBrand) {
      console.warn(`⚠️ 品牌用户 ${authResult.email} 尝试为品牌 ${brand} 创建销售目标，但用户品牌是 ${userBrand}`);
      return NextResponse.json(
        { error: '您只能为自己所属的品牌创建销售目标' },
        { status: 403 }
      );
    }

    // 创建年度目标
    const { data: target, error: targetError } = await client
      .from('annual_sales_targets')
      .insert({
        year,
        brand,
        target_amount: targetAmount,
        description: description || null,
        actual_amount: 0,
      })
      .select()
      .single();

    if (targetError) {
      console.error('创建年度销售目标失败:', targetError);
      return NextResponse.json({ error: targetError.message }, { status: 500 });
    }

    // 创建月度目标（如果有提供）
    const createdMonthlyTargets = [];
    if (monthlyTargets && monthlyTargets.length > 0) {
      for (const mt of monthlyTargets) {
        const { data: monthly } = await client
          .from('monthly_sales_targets')
          .insert({
            annual_target_id: target.id,
            month: mt.month,
            brand,
            year,
            target_amount: mt.targetAmount,
            actual_amount: mt.actualAmount,
          })
          .select()
          .single();

        if (monthly) {
          createdMonthlyTargets.push(monthly);
        }
      }
    } else {
      // 自动创建12个月的月度目标（平均分配）
      for (let month = 1; month <= 12; month++) {
        const monthlyAmount = Math.round(targetAmount / 12);
        const { data: monthly } = await client
          .from('monthly_sales_targets')
          .insert({
            annual_target_id: target.id,
            month,
            brand,
            year,
            target_amount: monthlyAmount,
            actual_amount: 0,
          })
          .select()
          .single();

        if (monthly) {
          createdMonthlyTargets.push(monthly);
        }
      }
    }

    return NextResponse.json({ target: toCamelCase(target), monthlyTargets: toCamelCase(createdMonthlyTargets) });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 更新年度销售目标
export async function PUT(request: NextRequest) {
  try {
    // 认证检查（不检查特定权限，只检查是否登录）
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const client = getSupabaseClient();
    const body = await request.json();
    const { id, year, brand, targetAmount, description, monthlyTargets } = body;

    if (!id) {
      return NextResponse.json({ error: '目标ID为必填项' }, { status: 400 });
    }

    // 检查用户是否有权限修改此目标的品牌
    const isAdmin = authResult.roles && authResult.roles.some((r: any) => r.role === 'admin');
    const userBrand = authResult.brand;

    // 获取目标信息
    const { data: existingTarget } = await client
      .from('annual_sales_targets')
      .select('brand')
      .eq('id', id)
      .single();

    if (!existingTarget) {
      return NextResponse.json({ error: '销售目标不存在' }, { status: 404 });
    }

    // 品牌隔离检查
    if (!isAdmin && existingTarget.brand !== userBrand) {
      console.warn(`⚠️ 品牌用户 ${authResult.email} 尝试修改品牌 ${existingTarget.brand} 的销售目标`);
      return NextResponse.json(
        { error: '您只能修改自己品牌的销售目标' },
        { status: 403 }
      );
    }

    // 如果要修改品牌，检查权限
    if (brand && brand !== existingTarget.brand && !isAdmin) {
      return NextResponse.json(
        { error: '您无权修改销售目标的品牌' },
        { status: 403 }
      );
    }

    // 更新年度目标
    const { data: target, error: targetError } = await client
      .from('annual_sales_targets')
      .update({
        year,
        brand,
        target_amount: targetAmount,
        description: description || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (targetError) {
      console.error('更新年度销售目标失败:', targetError);
      return NextResponse.json({ error: targetError.message }, { status: 500 });
    }

    // 更新月度目标（如果有提供）
    if (monthlyTargets && monthlyTargets.length > 0) {
      for (const mt of monthlyTargets) {
        if (mt.id) {
          // 更新已存在的月度目标
          await client
            .from('monthly_sales_targets')
            .update({
              target_amount: mt.targetAmount,
              actual_amount: mt.actualAmount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', mt.id);
        } else {
          // 创建新的月度目标
          await client
            .from('monthly_sales_targets')
            .insert({
              annual_target_id: id,
              month: mt.month,
              brand,
              year,
              target_amount: mt.targetAmount,
              actual_amount: mt.actualAmount || 0,
            });
        }
      }
    }

    // 重新计算年度实际金额
    const { data: allMonthly } = await client
      .from('monthly_sales_targets')
      .select('actual_amount')
      .eq('annual_target_id', id);

    const totalActualAmount = allMonthly?.reduce((sum: number, m: { actual_amount?: number }) => sum + (m.actual_amount || 0), 0) || 0;

    // 更新年度目标的实际金额
    await client
      .from('annual_sales_targets')
      .update({
        actual_amount: totalActualAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // 获取更新后的年度目标
    const { data: updatedTarget } = await client
      .from('annual_sales_targets')
      .select('*')
      .eq('id', id)
      .single();

    // 获取更新后的所有月度目标
    const { data: updatedMonthly } = await client
      .from('monthly_sales_targets')
      .select('*')
      .eq('annual_target_id', id)
      .order('month', { ascending: true });

    return NextResponse.json({ target: toCamelCase(updatedTarget), monthlyTargets: toCamelCase(updatedMonthly) || [] });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除年度销售目标
export async function DELETE(request: NextRequest) {
  try {
    // 认证检查（不检查特定权限，只检查是否登录，与其他方法保持一致）
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '目标ID为必填项' }, { status: 400 });
    }

    // 检查用户是否有权限删除此目标
    const isAdmin = authResult.roles && authResult.roles.some((r: any) => r.role === 'admin');
    const userBrand = authResult.brand;

    // 获取目标信息
    const { data: existingTarget } = await client
      .from('annual_sales_targets')
      .select('brand')
      .eq('id', id)
      .single();

    if (!existingTarget) {
      return NextResponse.json({ error: '销售目标不存在' }, { status: 404 });
    }

    // 品牌隔离检查
    if (!isAdmin && existingTarget.brand !== userBrand) {
      console.warn(`⚠️ 品牌用户 ${authResult.email} 尝试删除品牌 ${existingTarget.brand} 的销售目标`);
      return NextResponse.json(
        { error: '您只能删除自己品牌的销售目标' },
        { status: 403 }
      );
    }

    // 先删除关联的月度目标
    const { error: monthlyError } = await client
      .from('monthly_sales_targets')
      .delete()
      .eq('annual_target_id', id);

    if (monthlyError) {
      console.error('删除月度目标失败:', monthlyError);
      return NextResponse.json({ error: monthlyError.message }, { status: 500 });
    }

    // 删除年度目标
    const { error: annualError } = await client
      .from('annual_sales_targets')
      .delete()
      .eq('id', id);

    if (annualError) {
      console.error('删除年度销售目标失败:', annualError);
      return NextResponse.json({ error: annualError.message }, { status: 500 });
    }

    return NextResponse.json({ message: '删除成功' });
  } catch (error) {
    console.error('服务器错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
