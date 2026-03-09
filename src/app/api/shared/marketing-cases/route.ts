import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;

// 获取营销案例列表
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const searchParams = request.nextUrl.searchParams;
  const caseType = searchParams.get('caseType');
  const brand = searchParams.get('brand');
  const minRoi = searchParams.get('minRoi');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    let query = supabase
      .from('shared_marketing_cases')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (caseType) query = query.eq('case_type', caseType);
    if (brand) query = query.eq('brand', brand);
    if (minRoi) query = query.gte('roi', parseFloat(minRoi));
    if (search) query = query.ilike('case_name', `%${search}%`);

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total: count },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 创建营销案例
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', (authResult as any).userId)
      .single();

    const { data, error } = await supabase
      .from('shared_marketing_cases')
      .insert({
        ...body,
        shared_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      message: '营销案例分享成功',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
