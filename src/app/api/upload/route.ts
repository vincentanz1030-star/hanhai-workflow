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

// POST - 上传文件
export async function POST(request: NextRequest) {
  try {
    // 打印环境变量用于调试
    console.log('环境变量检查:', {
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL ? '已设置' : '未设置',
      bucketName: process.env.COZE_BUCKET_NAME ? '已设置' : '未设置',
    });

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

    console.log('文件信息:', {
      name: file.name,
      type: file.type,
      size: file.size,
      bufferLength: buffer.length,
    });

    // 生成文件名（使用时间戳和随机数）
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `task-images/${timestamp}_${randomStr}.${fileExtension}`;

    console.log('开始上传文件:', fileName);

    // 上传文件到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: file.type,
    });

    console.log('上传成功，返回的key:', fileKey);

    // 生成签名 URL（获取文件的可访问链接）
    const imageUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 2592000 // 有效期 30 天（2592000 秒）
    });

    console.log('生成签名URL成功:', imageUrl);

    return NextResponse.json({
      success: true,
      fileKey,
      imageUrl,
    });
  } catch (error) {
    console.error('上传失败，详细错误:', error);
    console.error('错误堆栈:', error instanceof Error ? error.stack : '无堆栈信息');
    return NextResponse.json(
      { error: '上传失败，请重试' },
      { status: 500 }
    );
  }
}

// DELETE - 删除文件
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: '缺少文件 key 参数' }, { status: 400 });
    }

    console.log('开始删除文件:', key);

    // 从对象存储删除文件
    const deleted = await storage.deleteFile({ fileKey: key });

    if (deleted) {
      console.log('删除成功:', key);
      return NextResponse.json({
        success: true,
        message: '文件删除成功',
      });
    } else {
      console.log('文件不存在或删除失败:', key);
      return NextResponse.json(
        { error: '文件不存在或删除失败' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('删除失败，详细错误:', error);
    return NextResponse.json(
      { error: '删除失败，请重试' },
      { status: 500 }
    );
  }
}

// GET - 获取文件访问 URL
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    const expireTime = parseInt(searchParams.get('expireTime') || '2592000'); // 默认30天

    if (!key) {
      return NextResponse.json({ error: '缺少文件 key 参数' }, { status: 400 });
    }

    console.log('生成访问URL:', key);

    // 生成签名 URL
    const imageUrl = await storage.generatePresignedUrl({
      key,
      expireTime,
    });

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error('生成URL失败，详细错误:', error);
    return NextResponse.json(
      { error: '生成访问URL失败，请重试' },
      { status: 500 }
    );
  }
}
