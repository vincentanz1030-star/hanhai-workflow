import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth, isAuthUser } from '@/lib/api-auth';
import { S3Storage } from 'coze-coding-dev-sdk';

;
;

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

  const supabase = getSupabaseClient();

  // 下载模式：获取下载链接
  if (downloadId) {
    try {
      const { data: asset, error } = await supabase
        .from('shared_design_assets')
        .select('id, asset_name, file_key, external_link, download_count')
        .eq('id', downloadId)
        .single();

      if (error || !asset) {
        return NextResponse.json({ error: '素材不存在' }, { status: 404 });
      }

      // 更新下载次数
      await supabase
        .from('shared_design_assets')
        .update({ download_count: (asset.download_count || 0) + 1 })
        .eq('id', downloadId);

      // 如果有外部链接，直接返回
      if (asset.external_link) {
        return NextResponse.json({
          success: true,
          data: {
            downloadUrl: asset.external_link,
            fileName: asset.asset_name,
            isExternal: true,
          },
        });
      }

      // 如果没有文件key，返回错误
      if (!asset.file_key) {
        return NextResponse.json({ error: '该素材没有可下载的文件或链接' }, { status: 400 });
      }

      // 生成内部存储的下载链接
      const downloadUrl = await storage.generatePresignedUrl({
        key: asset.file_key,
        expireTime: 60 * 60, // 1小时
      });

      return NextResponse.json({
        success: true,
        data: {
          downloadUrl,
          fileName: asset.asset_name,
          isExternal: false,
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

    // 为有预览图/缩略图的素材生成预览URL
    const assetsWithUrls = await Promise.all((data || []).map(async (asset: any) => {
      // 使用 preview_key 生成预览URL
      if (asset.preview_key) {
        try {
          const previewUrl = await storage.generatePresignedUrl({
            key: asset.preview_key,
            expireTime: 24 * 60 * 60, // 24小时
          });
          return { ...asset, preview_url: previewUrl };
        } catch {
          return asset;
        }
      }
      // 如果有 preview_url（外部链接），直接使用
      if (asset.preview_url) {
        return asset;
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
  if (!isAuthUser(authResult)) return authResult;

  const body = await request.json();
  const supabase = getSupabaseClient();

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id, brand')
      .eq('id', authResult.userId)
      .single();

    const { data, error } = await supabase
      .from('shared_design_assets')
      .insert({
        asset_name: body.name,
        asset_type: body.asset_type || 'other',
        category: body.category || 'design',
        tags: body.tags || [],
        file_key: body.file_key || null,
        file_url: body.download_url || null, // 外部链接
        file_size: body.file_size || null,
        file_format: body.file_name ? body.file_name.split('.').pop() : null,
        preview_key: body.thumbnail_key || null,
        is_public: body.is_public ?? true,
        is_external_link: !!body.download_url,
        external_link: body.download_url || null,
        shared_by: user?.id,
        shared_brand: user?.brand,
      })
      .select()
      .single();

    if (error) throw error;

    // 更新用户贡献积分
    if (user?.id) {
      try {
        await supabase.rpc('update_contribution_points', {
          p_user_id: user.id,
          p_brand: user.brand,
          p_points: 5,
          p_resource_type: 'design',
        });
      } catch {
        // 忽略积分更新失败
      }
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
