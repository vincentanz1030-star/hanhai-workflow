import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { requireAuth } from '@/lib/api-auth';

// 初始化对象存储
const getStorage = () => {
  return new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: '',
    secretKey: '',
    bucketName: process.env.COZE_BUCKET_NAME,
    region: 'cn-beijing',
  });
};

// 支持的压缩包格式
const ALLOWED_COMPRESSED_TYPES = [
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/gzip',
  'application/x-gzip',
];

// 支持的图片和视频格式（扩展MIME类型支持）
const ALLOWED_MEDIA_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
];

// 通过文件扩展名判断类型
const isImageByExtension = (filename: string): boolean => {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(filename);
};

const isVideoByExtension = (filename: string): boolean => {
  return /\.(mp4|webm|mov|avi|mkv)$/i.test(filename);
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// 文件上传接口
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'designs'; // designs, thumbnails

    if (!file) {
      return NextResponse.json({ error: '未找到上传文件' }, { status: 400 });
    }

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: '文件大小超过限制（最大100MB）' }, { status: 400 });
    }

    // 验证文件类型（通过MIME类型或扩展名）
    const isCompressed = ALLOWED_COMPRESSED_TYPES.includes(file.type);
    const isImage = ALLOWED_MEDIA_TYPES.includes(file.type) && file.type.startsWith('image/') || isImageByExtension(file.name);
    const isVideo = ALLOWED_MEDIA_TYPES.includes(file.type) && file.type.startsWith('video/') || isVideoByExtension(file.name);
    const isMedia = isImage || isVideo;

    if (!isCompressed && !isMedia) {
      return NextResponse.json({ 
        error: '不支持的文件格式。支持：ZIP、RAR、7Z、GZ压缩包，以及常见图片(jpg/png/gif/webp/svg)/视频(mp4/webm/mov)格式' 
      }, { status: 400 });
    }

    // 生成文件名
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `shared-resources/${category}/${timestamp}_${safeName}`;

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer);

    // 上传到对象存储
    const storage = getStorage();
    const fileKey = await storage.uploadFile({
      fileContent,
      fileName,
      contentType: file.type || 'application/octet-stream',
    });

    // 生成访问URL（有效期7天）
    const fileUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 7 * 24 * 60 * 60, // 7天
    });

    // 判断文件类型标签
    let fileType = 'other';
    if (isCompressed) {
      fileType = 'compressed';
    } else if (isImage) {
      fileType = 'image';
    } else if (isVideo) {
      fileType = 'video';
    }

    return NextResponse.json({
      success: true,
      data: {
        fileKey,
        fileName: file.name,
        fileSize: file.size,
        fileType,
        mimeType: file.type,
        url: fileUrl,
      },
    });
  } catch (error: any) {
    console.error('文件上传失败:', error);
    return NextResponse.json({ 
      error: error.message || '文件上传失败' 
    }, { status: 500 });
  }
}

// 获取文件下载链接
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const fileKey = searchParams.get('fileKey');

  if (!fileKey) {
    return NextResponse.json({ error: '缺少文件key' }, { status: 400 });
  }

  try {
    const storage = getStorage();
    // 生成下载URL（有效期1小时）
    const downloadUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 60 * 60, // 1小时
    });

    return NextResponse.json({
      success: true,
      data: { downloadUrl },
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || '获取下载链接失败' 
    }, { status: 500 });
  }
}

// 删除文件
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const fileKey = searchParams.get('fileKey');

  if (!fileKey) {
    return NextResponse.json({ error: '缺少文件key' }, { status: 400 });
  }

  try {
    const storage = getStorage();
    const deleted = await storage.deleteFile({ fileKey });

    return NextResponse.json({
      success: deleted,
      message: deleted ? '文件删除成功' : '文件不存在',
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || '删除文件失败' 
    }, { status: 500 });
  }
}
