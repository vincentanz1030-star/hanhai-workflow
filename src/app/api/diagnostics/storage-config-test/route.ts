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

  const results = [];
  const endpointUrl = process.env.COZE_BUCKET_ENDPOINT_URL;
  const bucketName = process.env.COZE_BUCKET_NAME;

  // 尝试不同的配置组合
  const configurations = [
    {
      name: '使用环境变量 COZE_STORAGE_ACCESS_KEY/SECRET_KEY',
      config: {
        endpointUrl: endpointUrl,
        accessKey: process.env.COZE_STORAGE_ACCESS_KEY || '',
        secretKey: process.env.COZE_STORAGE_SECRET_KEY || '',
        bucketName: bucketName,
      },
    },
    {
      name: '当前配置（空密钥）',
      config: {
        endpointUrl: endpointUrl,
        accessKey: '',
        secretKey: '',
        bucketName: bucketName,
      },
    },
    {
      name: '尝试使用 COZE_WORKLOAD_IDENTITY_CLIENT_ID/SECRET',
      config: {
        endpointUrl: endpointUrl,
        accessKey: process.env.COZE_WORKLOAD_IDENTITY_CLIENT_ID || '',
        secretKey: process.env.COZE_WORKLOAD_IDENTITY_CLIENT_SECRET || '',
        bucketName: bucketName,
      },
    },
    {
      name: '尝试使用 COZE_LOOP_API_TOKEN 作为密钥',
      config: {
        endpointUrl: endpointUrl,
        accessKey: '',
        secretKey: process.env.COZE_LOOP_API_TOKEN || '',
        bucketName: bucketName,
      },
    },
    {
      name: '尝试使用 AWS_ACCESS_KEY_ID/SECRET',
      config: {
        endpointUrl: endpointUrl,
        accessKey: process.env.AWS_ACCESS_KEY_ID || '',
        secretKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        bucketName: bucketName,
      },
    },
  ];

  for (const test of configurations) {
    console.log(`[配置测试] 尝试配置: ${test.name}`);
    const result = {
      name: test.name,
      success: false,
      error: null as string | null,
      hasAccessKey: !!test.config.accessKey,
      hasSecretKey: !!test.config.secretKey,
    };

    try {
      const storage = new S3Storage(test.config);

      // 尝试上传小文件
      const testBuffer = Buffer.from('test', 'utf-8');
      const fileName = `test/config-${Date.now()}.txt`;

      const fileKey = await storage.uploadFile({
        fileContent: testBuffer,
        fileName: fileName,
        contentType: 'text/plain',
      });

      result.success = true;

      // 删除测试文件
      await storage.deleteFile({ fileKey });

      console.log(`[配置测试] ${test.name} - 成功`);

    } catch (error: any) {
      result.error = error?.message || '未知错误';
      console.error(`[配置测试] ${test.name} - 失败:`, error);
    }

    results.push(result);
  }

  // 尝试通过 Coze Loop API 获取临时凭证
  let apiTestResult: any = null;
  try {
    console.log('[API 测试] 尝试通过 Coze Loop API 获取临时凭证...');
    const loopApiToken = process.env.COZE_LOOP_API_TOKEN;

    if (loopApiToken) {
      // 尝试调用 Coze Loop API 获取对象存储凭证
      const response = await fetch('https://integration.coze.cn/api/v1/storage/credentials', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loopApiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const credentials = await response.json();
        apiTestResult = {
          success: true,
          message: '成功获取临时凭证',
          credentials: {
            accessKeyId: credentials.accessKeyId ? '已设置' : '未设置',
            secretAccessKey: credentials.secretAccessKey ? '已设置' : '未设置',
            sessionToken: credentials.sessionToken ? '已设置' : '未设置',
            expiration: credentials.expiration || '未设置',
          },
          uploadTest: null as any,
        };

        // 如果成功获取凭证，尝试使用它们
        if (credentials.accessKeyId && credentials.secretAccessKey) {
          console.log('[API 测试] 使用临时凭证测试上传...');
          const storage = new S3Storage({
            endpointUrl: endpointUrl,
            accessKey: credentials.accessKeyId,
            secretKey: credentials.secretAccessKey,
            bucketName: bucketName,
          });

          const testBuffer = Buffer.from('test', 'utf-8');
          const fileName = `test/api-${Date.now()}.txt`;

          const fileKey = await storage.uploadFile({
            fileContent: testBuffer,
            fileName: fileName,
            contentType: 'text/plain',
          });

          await storage.deleteFile({ fileKey });

          apiTestResult.uploadTest = {
            success: true,
            message: '使用临时凭证上传成功',
          };
        }
      } else {
        apiTestResult = {
          success: false,
          message: `API 调用失败: ${response.status}`,
          error: await response.text(),
        };
      }
    } else {
      apiTestResult = {
        success: false,
        message: '未设置 COZE_LOOP_API_TOKEN',
      };
    }
  } catch (error: any) {
    console.error('[API 测试] 错误:', error);
    apiTestResult = {
      success: false,
      message: 'API 调用异常',
      error: error?.message || '未知错误',
    };
  }

  // 分析结果
  const successfulConfigs = results.filter(r => r.success);
  const failedConfigs = results.filter(r => !r.success);

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
    apiTestResult,
    summary: {
      total: results.length,
      successful: successfulConfigs.length,
      failed: failedConfigs.length,
    },
    recommendations: [
      successfulConfigs.length > 0
        ? `✅ 找到可用的配置: ${successfulConfigs.map(r => r.name).join(', ')}`
        : '❌ 未找到可用的配置',
      apiTestResult?.success
        ? '✅ Coze Loop API 方式成功'
        : '❌ Coze Loop API 方式失败或未配置',
      successfulConfigs.length === 0 && !apiTestResult?.success
        ? '⚠️ 所有配置方式都失败，需要检查对象存储服务配置或联系技术支持'
        : '✅ 至少有一种配置方式可用',
    ],
  });
}
