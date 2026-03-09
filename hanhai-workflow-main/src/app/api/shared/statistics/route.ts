import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;

// 获取共享平台统计数据
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 获取各类资源总数
    const [
      suppliersCount,
      designsCount,
      casesCount,
      knowledgeCount,
      toolsCount,
      talentsCount,
    ] = await Promise.all([
      supabase.from('shared_suppliers').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('shared_design_assets').select('id', { count: 'exact', head: true }).eq('is_public', true),
      supabase.from('shared_marketing_cases').select('id', { count: 'exact', head: true }),
      supabase.from('shared_knowledge').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('shared_tools').select('id', { count: 'exact', head: true }),
      supabase.from('shared_talents').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    // 获取热门资源
    const { data: hotResources } = await supabase
      .from('v_resource_hot')
      .select('*')
      .limit(10);

    // 获取贡献排行
    const { data: topContributors } = await supabase
      .from('v_contribution_ranking')
      .select('*')
      .limit(10);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          suppliers: suppliersCount.count || 0,
          designs: designsCount.count || 0,
          cases: casesCount.count || 0,
          knowledge: knowledgeCount.count || 0,
          tools: toolsCount.count || 0,
          talents: talentsCount.count || 0,
        },
        hotResources: hotResources || [],
        topContributors: topContributors || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
