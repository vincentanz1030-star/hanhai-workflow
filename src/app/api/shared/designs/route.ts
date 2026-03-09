import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';
import { S3Storage } from 'coze-coding-dev-sdk';

const supabaseUrl = process.env.COZE_SUPABASE_URL!;
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY!;

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 获取设计素材列表
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const searchParams = request.nextUrl.searchParams;
  const assetType = searchParams.get('type') || searchParams.get('assetType');
  const category = searchParams.get('category');
  const brand = searchParams.get('brand');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const downloadId = searchParams.get('downloadId');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // 下载模式：获取下载链接
  if (downloadId) {
    try {
      const { data: asset, error } = await supabase
        .from('shared_design_assets')
        .select('id, asset_name, file_key, download_count')
        .eq('id', downloadId)
        .single();

      if (error || !asset) {
        return NextResponse.json({ error: '素材不存在' }, { status: 404 });
      }

      if (!asset.file_key) {
        return NextResponse.json({ error: '该素材没有关联文件' }, { status: 400 });
      }

      // 生成下载链接
      const downloadUrl = await storage.generatePresignedUrl({
        key: asset.file_key,
        expireTime: 60 * 60, // 1小时
      });

      // 更新下载次数
      await supabase
        .from('shared_design_assets')
        .update({ download_count: (asset.download_count || 0) + 1 })
        .eq('id', downloadId);

      return NextResponse.json({
        success: true,
        data: {
          downloadUrl,
          fileName: asset.asset_name,
        },
      });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  try {
    let query = supabase
      .from('shared_design_assets')
      .select('*', { count: 'exact' })
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (assetType) query = query.eq('asset_type', assetType);
    if (category) query = query.eq('category', category);
    if (brand) query = query.eq('shared_brand', brand);
    if (search) query = query.ilike('asset_name', `%${search}%`);

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    // 为有缩略图的素材生成预览URL
    const assetsWithUrls = await Promise.all((data || []).map(async (asset: any) => {
      if (asset.thumbnail_key) {
        try {
          const thumbnailUrl = await storage.generatePresignedUrl({
            key: asset.thumbnail_key,
            expireTime: 24 * 60 * 60, // 24小时
          });
          return { ...asset, thumbnail_url: thumbnailUrl };
        } catch {
          return asset;
        }
      }
      return asset;
    }));

    return NextResponse.json({
      success: true,
      data: assetsWithUrls,
      pagination: { page, limit, total: count },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 上传设计素材
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const body = await request.json();
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, brand, name')
      .eq('id', (authResult as any).userId)
      .single();

    const { data, error } = await supabase
      .from('shared_design_assets')
      .insert({
        asset_name: body.name,
        asset_type: body.asset_type || 'other',
        description: body.description,
        tags: body.tags || [],
        file_key: body.file_key,
        file_name: body.file_name,
        file_size: body.file_size,
        thumbnail_key: body.thumbnail_key,
        is_public: body.is_public ?? true,
        shared_by: user?.id,
        shared_brand: user?.brand,
        category: body.category || 'design',
      })
      .select()
      .single();

    if (error) throw error;

    // 更新用户贡献积分
    if (user?.id) {
      await supabase.rpc('update_contribution_points', {
        p_user_id: user.id,
        p_brand: user.brand,
        p_points: 5,
        p_resource_type: 'design',
      });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '设计素材上传成功',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
