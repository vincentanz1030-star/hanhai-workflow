import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { requireAuth } from '@/lib/api-auth';
import { disableInProduction } from '@/lib/diagnostic-guard';

export async function POST(request: NextRequest) {
  // 生产环境禁用
  const disabledResponse = disableInProduction(request);
  if (disabledResponse) return disabledResponse;
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    env: {
      COZE_BUCKET_ENDPOINT_URL: process.env.COZE_BUCKET_ENDPOINT_URL || '未设置',
      COZE_BUCKET_NAME: process.env.COZE_BUCKET_NAME || '未设置',
      COZE_WORKLOAD_IDENTITY_API_KEY: process.env.COZE_WORKLOAD_IDENTITY_API_KEY ? '已设置' : '未设置',
      COZE_STORAGE_ACCESS_KEY: process.env.COZE_STORAGE_ACCESS_KEY ? '已设置' : '未设置',
      COZE_STORAGE_SECRET_KEY: process.env.COZE_STORAGE_SECRET_KEY ? '已设置' : '未设置',
    },
    testResult: null as any,
  };

  const endpointUrl = process.env.COZE_BUCKET_ENDPOINT_URL;
  const bucketName = process.env.COZE_BUCKET_NAME;

  if (!endpointUrl || !bucketName) {
    return NextResponse.json({
      ...diagnostics,
      error: '未设置必要的对象存储环境变量',
    }, { status: 500 });
  }

  console.log('[Workload Identity 测试] 开始测试...');

  // 尝试不同的配置
  const configurations = [
    {
      name: '使用 COZE_WORKLOAD_IDENTITY_API_KEY',
      apiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY,
    },
    {
      name: '使用 COZE_STORAGE_ACCESS_KEY',
      apiKey: process.env.COZE_STORAGE_ACCESS_KEY,
    },
    {
      name: '使用 COZE_STORAGE_SECRET_KEY',
      apiKey: process.env.COZE_STORAGE_SECRET_KEY,
    },
    {
      name: '空密钥',
      apiKey: '',
    },
  ];

  for (const config of configurations) {
    console.log(`[Workload Identity 测试] 尝试配置: ${config.name}`);

    if (!config.apiKey) {
      console.log(`[Workload Identity 测试] 跳过 ${config.name}（未设置）`);
      continue;
    }

    try {
      const storage = new S3Storage({
        endpointUrl: endpointUrl,
        accessKey: config.apiKey,
        secretKey: config.apiKey,
        bucketName: bucketName,
        region: 'cn-beijing',
      });

      console.log(`[Workload Identity 测试] 尝试上传文件（${config.name}）...`);
      const testBuffer = Buffer.from('test', 'utf-8');
      const testKey = `diagnostics/workload-test-${Date.now()}.txt`;

      const fileKey = await storage.uploadFile({
        fileContent: testBuffer,
        fileName: testKey,
        contentType: 'text/plain',
      });

      console.log(`[Workload Identity 测试] 上传成功（${config.name}）:`, fileKey);

      // 生成签名 URL
      console.log(`[Workload Identity 测试] 生成签名 URL（${config.name}）...`);
      const signedUrl = await storage.generatePresignedUrl({
        key: fileKey,
        expireTime: 60,
      });

      console.log(`[Workload Identity 测试] 签名 URL 生成成功（${config.name}）`);

      // 删除测试文件
      console.log(`[Workload Identity 测试] 删除测试文件（${config.name}）...`);
      await storage.deleteFile({ fileKey });
      console.log(`[Workload Identity 测试] 删除成功（${config.name}）`);

      diagnostics.testResult = {
        success: true,
        config: config.name,
        fileKey,
        signedUrl,
        message: `找到可用的配置: ${config.name}`,
      };

      return NextResponse.json(diagnostics);

    } catch (error: any) {
      console.error(`[Workload Identity 测试] ${config.name} 失败:`, error);
      diagnostics.testResult = {
        success: false,
        config: config.name,
        error: error?.message || '未知错误',
      };
    }
  }

  // 所有配置都失败
  return NextResponse.json({
    ...diagnostics,
    error: '所有配置都失败，无法找到可用的对象存储认证方式',
    recommendation: '请检查环境变量配置，或联系技术支持获取正确的 API Key',
  }, { status: 500 });
}
