import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

;
;

// 获取供应商列表
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const brand = searchParams.get('brand');
  const minScore = searchParams.get('minScore');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('shared_suppliers')
      .select('*', { count: 'exact' })
      .eq('status', 'active')
      .order('overall_score', { ascending: false });

    // 筛选条件
    if (type) {
      query = query.eq('supplier_type', type);
    }
    if (brand) {
      query = query.contains('cooperation_brands', [brand]);
    }
    if (minScore) {
      query = query.gte('overall_score', parseFloat(minScore));
    }
    if (search) {
      query = query.or(`supplier_name.ilike.%${search}%,main_products.cs.{${search}}`);
    }

    // 分页
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('获取供应商列表失败:', error);
    return NextResponse.json(
      { error: error.message || '获取失败' },
      { status: 500 }
    );
  }
}

// 创建供应商
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const supabase = getSupabaseClient();

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, brand')
      .eq('id', (authResult as any).userId)
      .single();

    const supplierData = {
      ...body,
      shared_by: user?.id,
      shared_at: new Date().toISOString(),
      status: 'active',
      verified: false,
    };

    const { data, error } = await supabase
      .from('shared_suppliers')
      .insert(supplierData)
      .select()
      .single();

    if (error) throw error;

    // 更新贡献统计
    await updateContributionStats(supabase, user?.id, user?.brand, 'suppliers_shared');

    return NextResponse.json({
      success: true,
      data,
      message: '供应商分享成功',
    });
  } catch (error: any) {
    console.error('创建供应商失败:', error);
    return NextResponse.json(
      { error: error.message || '创建失败' },
      { status: 500 }
    );
  }
}

// 更新贡献统计
async function updateContributionStats(
  supabase: any,
  userId: string,
  brand: string,
  field: string
) {
  const period = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  await supabase
    .from('shared_statistics')
    .upsert({
      user_id: userId,
      user_brand: brand,
      period_type: 'monthly',
      period_value: period,
      [field]: 1,
      contribution_points: 10, // 每次贡献加10分
    }, {
      onConflict: 'user_id,period_type,period_value',
    });
}
