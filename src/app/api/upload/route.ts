import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '只支持图片文件' }, { status: 400 });
    }

    // 验证文件大小（最大10MB）
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '文件大小不能超过10MB' }, { status: 400 });
    }

    // 转换文件为Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 生成文件名（使用时间戳和随机数）
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `task-images/${timestamp}_${randomStr}.${fileExtension}`;

    // 上传文件到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: file.type,
    });

    // 生成公开访问的URL（使用 bucket 的公开地址）
    const bucketUrl = process.env.COZE_BUCKET_ENDPOINT_URL || '';
    // 移除路径部分，只保留域名
    const baseUrl = bucketUrl.split('/').slice(0, 3).join('/');
    const imageUrl = `${baseUrl}/${process.env.COZE_BUCKET_NAME}/${fileKey}`;

    console.log('上传成功:', { fileKey, imageUrl });

    return NextResponse.json({
      success: true,
      fileKey,
      imageUrl,
    });
  } catch (error) {
    console.error('上传失败:', error);
    return NextResponse.json(
      { error: '上传失败，请重试' },
      { status: 500 }
    );
  }
}
