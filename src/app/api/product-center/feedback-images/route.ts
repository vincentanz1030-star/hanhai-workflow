import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { getTokenFromRequest as getTokenFromRequestHelper } from '@/lib/token-helper';
import { verifyToken } from '@/lib/auth';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// POST - 上传商品反馈图片
export async function POST(request: NextRequest) {
  try {
    console.log('[反馈图片上传] 开始上传');
    console.log('[反馈图片上传] Cookie Header:', request.headers.get('cookie'));
    console.log('[反馈图片上传] Authorization Header:', request.headers.get('authorization'));

    // 从请求中获取 token（支持 Cookie 和 Authorization header）
    const token = await getTokenFromRequestHelper(request);

    if (!token) {
      console.error('[反馈图片上传] 未找到认证 token');
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    console.log('[反馈图片上传] 找到 token，长度:', token.length);

    // 验证 token
    const decoded = verifyToken(token);
    if (!decoded) {
      console.error('[反馈图片上传] Token 验证失败');
      return NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 });
    }

    console.log('[反馈图片上传] Token 验证成功，用户:', decoded.email);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const feedbackId = formData.get('feedbackId') as string;

    console.log('[反馈图片上传] 接收到的参数:', {
      hasFile: !!file,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
      feedbackId: feedbackId || 'null',
    });

    if (!file) {
      console.error('[反馈图片上传] 未找到文件');
      return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      console.error('[反馈图片上传] 文件类型错误:', file.type);
      return NextResponse.json({ error: '只支持图片文件' }, { status: 400 });
    }

    // 验证文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      console.error('[反馈图片上传] 文件大小超限:', file.size);
      return NextResponse.json({ error: '文件大小不能超过5MB' }, { status: 400 });
    }

    // 转换文件为Buffer
    console.log('[反馈图片上传] 开始转换文件为Buffer');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log('[反馈图片上传] Buffer转换完成，大小:', buffer.length);

    // 生成文件名（使用反馈ID和时间戳）
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || 'jpg';

    // 文件路径：feedback-images/反馈ID/时间戳_随机数.扩展名
    const folder = feedbackId ? `feedback-images/${feedbackId}` : 'feedback-images/temp';
    const fileName = `${timestamp}_${randomStr}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    console.log('[反馈图片上传] 文件信息:', {
      name: file.name,
      type: file.type,
      size: file.size,
      feedbackId,
      filePath,
    });

    // 上传文件到对象存储
    console.log('[反馈图片上传] 开始上传到对象存储');
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: filePath,
      contentType: file.type,
    });

    console.log('[反馈图片上传] 上传成功，fileKey:', fileKey);

    // 生成签名 URL（有效期 30 天）
    console.log('[反馈图片上传] 开始生成签名URL');
    const imageUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 2592000,
    });

    console.log('[反馈图片上传] 生成签名URL成功:', imageUrl);

    return NextResponse.json({
      success: true,
      fileKey,
      imageUrl,
      fileName: file.name,
    });
  } catch (error: any) {
    console.error('[反馈图片上传] 上传失败:', error);
    console.error('[反馈图片上传] 错误堆栈:', error?.stack);

    // 返回更详细的错误信息
    return NextResponse.json(
      {
        error: '上传失败，请重试',
        details: error?.message || '未知错误',
      },
      { status: 500 }
    );
  }
}

// GET - 获取图片访问URL
export async function GET(request: NextRequest) {
  try {
    console.log('[反馈图片] 开始获取图片URL');
    console.log('[反馈图片] Cookie Header:', request.headers.get('cookie'));
    console.log('[反馈图片] Authorization Header:', request.headers.get('authorization'));

    // 从请求中获取 token（支持 Cookie 和 Authorization header）
    const token = await getTokenFromRequestHelper(request);

    if (!token) {
      console.error('[反馈图片] 未找到认证 token');
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    console.log('[反馈图片] 找到 token，长度:', token.length);

    // 验证 token
    const decoded = verifyToken(token);
    if (!decoded) {
      console.error('[反馈图片] Token 验证失败');
      return NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 });
    }

    console.log('[反馈图片] Token 验证成功，用户:', decoded.email);

    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    const expireTime = parseInt(searchParams.get('expireTime') || '2592000');

    if (!key) {
      return NextResponse.json({ error: '缺少文件 key 参数' }, { status: 400 });
    }

    console.log('[反馈图片] 生成访问URL:', key);

    // 生成签名 URL
    const imageUrl = await storage.generatePresignedUrl({
      key,
      expireTime,
    });

    return NextResponse.json({
      success: true,
      imageUrl,
    });
    } catch (error: any) {
    console.error('[反馈图片上传] 上传失败:', error);
    console.error('[反馈图片上传] 错误堆栈:', error?.stack);

    return NextResponse.json(
      {
        error: '上传失败，请重试',
        details: error?.message || '未知错误',
      },
      { status: 500 }
    );
  }
}
