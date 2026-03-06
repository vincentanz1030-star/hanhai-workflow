import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { requireAuth } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  console.log('[简化存储测试] 开始测试...');

  // 获取配置
  const endpointUrl = process.env.COZE_BUCKET_ENDPOINT_URL;
  const bucketName = process.env.COZE_BUCKET_NAME;

  console.log('[简化存储测试] 配置:', {
    endpointUrl: endpointUrl ? `${endpointUrl.substring(0, 30)}...` : '未设置',
    bucketName: bucketName || '未设置',
  });

  if (!endpointUrl) {
    return NextResponse.json({
      success: false,
      error: '未设置 COZE_BUCKET_ENDPOINT_URL 环境变量',
    }, { status: 500 });
  }

  if (!bucketName) {
    return NextResponse.json({
      success: false,
      error: '未设置 COZE_BUCKET_NAME 环境变量',
    }, { status: 500 });
  }

  // 初始化存储（最简单的配置）
  console.log('[简化存储测试] 初始化 S3Storage...');
  let storage;
  try {
    storage = new S3Storage({
      endpointUrl: endpointUrl,
      accessKey: '',
      secretKey: '',
      bucketName: bucketName,
    });
    console.log('[简化存储测试] 初始化成功');
  } catch (error: any) {
    console.error('[简化存储测试] 初始化失败:', error);
    return NextResponse.json({
      success: false,
      error: '初始化 S3Storage 失败',
      details: error?.message || '未知错误',
      stack: error?.stack || '无堆栈信息',
    }, { status: 500 });
  }

  if (!endpointUrl) {
    return NextResponse.json({
      success: false,
      error: '未设置 COZE_BUCKET_ENDPOINT_URL 环境变量',
    }, { status: 500 });
  }

  if (!bucketName) {
    return NextResponse.json({
      success: false,
      error: '未设置 COZE_BUCKET_NAME 环境变量',
    }, { status: 500 });
  }

  // 初始化存储（最简单的配置）
  console.log('[简化存储测试] 初始化 S3Storage...');
  let storage;
  try {
    storage = new S3Storage({
      endpointUrl: endpointUrl,
      accessKey: '',
      secretKey: '',
      bucketName: bucketName,
    });
    console.log('[简化存储测试] 初始化成功');
  } catch (error: any) {
    console.error('[简化存储测试] 初始化失败:', error);
    return NextResponse.json({
      success: false,
      error: '初始化 S3Storage 失败',
      details: error?.message || '未知错误',
      stack: error?.stack || '无堆栈信息',
    }, { status: 500 });
  }

  // 测试上传
  console.log('[简化存储测试] 开始上传...');
  try {
    const testBuffer = Buffer.from('Hello World', 'utf-8');
    const fileName = `test/simple-test-${Date.now()}.txt`;

    console.log('[简化存储测试] 上传参数:', {
      fileName,
      contentType: 'text/plain',
      bufferLength: testBuffer.length,
    });

    const fileKey = await storage.uploadFile({
      fileContent: testBuffer,
      fileName: fileName,
      contentType: 'text/plain',
    });

    console.log('[简化存储测试] 上传成功:', fileKey);

    // 测试生成签名 URL
    console.log('[简化存储测试] 生成签名 URL...');
    let signedUrl = null;
    try {
      signedUrl = await storage.generatePresignedUrl({
        key: fileKey,
        expireTime: 60,
      });
      console.log('[简化存储测试] 签名 URL 生成成功');
    } catch (urlError: any) {
      console.error('[简化存储测试] 签名 URL 生成失败:', urlError);
      return NextResponse.json({
        success: true,
        uploadSuccess: true,
        uploadDetails: {
          fileKey,
          fileName,
        },
        urlGenerationFailed: true,
        urlError: urlError?.message || '未知错误',
      }, { status: 200 });
    }

    // 测试删除
    console.log('[简化存储测试] 删除测试文件...');
    try {
      await storage.deleteFile({ fileKey });
      console.log('[简化存储测试] 删除成功');
    } catch (deleteError: any) {
      console.error('[简化存储测试] 删除失败:', deleteError);
      // 不影响结果，继续返回
    }

    return NextResponse.json({
      success: true,
      uploadSuccess: true,
      urlSuccess: true,
      fileKey,
      signedUrl,
      fileName,
      message: '所有测试通过',
    });

  } catch (error: any) {
    console.error('[简化存储测试] 上传失败:', error);
    console.error('[简化存储测试] 错误堆栈:', error?.stack);

    // 分析错误类型
    let errorType = 'UNKNOWN';
    let suggestion = '';

    if (error?.message?.includes('AccessDenied') || error?.message?.includes('missing token')) {
      errorType = 'ACCESS_DENIED';
      suggestion = '对象存储拒绝访问。可能原因：1) 端点 URL 不正确 2) bucket 名称不正确 3) 网络问题 4) SDK 版本问题';
    } else if (error?.message?.includes('NoSuchBucket')) {
      errorType = 'NO_SUCH_BUCKET';
      suggestion = 'Bucket 不存在，请检查 COZE_BUCKET_NAME 配置';
    } else if (error?.message?.includes('Network') || error?.message?.includes('ETIMEDOUT')) {
      errorType = 'NETWORK_ERROR';
      suggestion = '网络错误，请检查端点 URL 是否可访问';
    }

    return NextResponse.json({
      success: false,
      error: error?.message || '未知错误',
      errorType,
      suggestion,
      stack: error?.stack || '无堆栈信息',
      config: {
        endpointUrl: endpointUrl ? `${endpointUrl.substring(0, 30)}...` : '未设置',
        bucketName: bucketName || '未设置',
      },
    }, { status: 500 });
  }
}
