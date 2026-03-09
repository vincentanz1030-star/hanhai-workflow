import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    env: {
      COZE_BUCKET_ENDPOINT_URL: process.env.COZE_BUCKET_ENDPOINT_URL ? '已设置' : '未设置',
      COZE_BUCKET_NAME: process.env.COZE_BUCKET_NAME || '未设置',
    },
    storageConfig: null as any,
    uploadTest: null as any,
  };

  try {
    // 尝试初始化存储
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: process.env.COZE_STORAGE_ACCESS_KEY || '',
      secretKey: process.env.COZE_STORAGE_SECRET_KEY || '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });

    diagnostics.storageConfig = {
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
      accessKey: '空字符串',
      secretKey: '空字符串',
    };

    // 测试上传一个小文件
    console.log('[存储诊断] 开始测试上传...');
    const testBuffer = Buffer.from('test', 'utf-8');
    const testKey = `diagnostics/test_${Date.now()}.txt`;

    try {
      const fileKey = await storage.uploadFile({
        fileContent: testBuffer,
        fileName: testKey,
        contentType: 'text/plain',
      });

      diagnostics.uploadTest = {
        success: true,
        fileKey,
        message: '上传成功',
      };

      console.log('[存储诊断] 上传成功:', fileKey);

      // 尝试生成签名 URL
      try {
        const signedUrl = await storage.generatePresignedUrl({
          key: fileKey,
          expireTime: 60,
        });

        diagnostics.uploadTest.signedUrl = signedUrl;
        console.log('[存储诊断] 生成签名URL成功');
      } catch (urlError: any) {
        console.error('[存储诊断] 生成签名URL失败:', urlError);
        diagnostics.uploadTest.signedUrlError = urlError?.message || '未知错误';
      }

      // 尝试删除测试文件
      try {
        await storage.deleteFile({ fileKey });
        diagnostics.uploadTest.deleted = true;
        console.log('[存储诊断] 删除测试文件成功');
      } catch (deleteError: any) {
        console.error('[存储诊断] 删除测试文件失败:', deleteError);
        diagnostics.uploadTest.deleteError = deleteError?.message || '未知错误';
      }

    } catch (uploadError: any) {
      console.error('[存储诊断] 上传失败:', uploadError);
      diagnostics.uploadTest = {
        success: false,
        error: uploadError?.message || '未知错误',
        stack: uploadError?.stack || '无堆栈信息',
      };

      // 检查是否是 AccessDenied 错误
      if (uploadError?.message?.includes('AccessDenied') || uploadError?.message?.includes('missing token')) {
        diagnostics.uploadTest.errorType = 'ACCESS_DENIED';
        diagnostics.uploadTest.suggestion = '对象存储需要认证，请检查环境变量配置';
      }
    }

  } catch (initError: any) {
    console.error('[存储诊断] 初始化失败:', initError);
    diagnostics.storageConfig = {
      error: initError?.message || '初始化失败',
    };
  }

  return NextResponse.json(diagnostics);
}
