import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    env: {
      COZE_BUCKET_ENDPOINT_URL: process.env.COZE_BUCKET_ENDPOINT_URL || '未设置',
      COZE_BUCKET_NAME: process.env.COZE_BUCKET_NAME || '未设置',
    },
    tests: [] as any[],
  };

  console.log('[高级存储诊断] 开始诊断...');

  // 测试 1: 检查端点 URL 格式
  console.log('[测试 1] 检查端点 URL 格式...');
  const endpointUrl = process.env.COZE_BUCKET_ENDPOINT_URL;
  const urlFormatTest = {
    name: '端点 URL 格式检查',
    passed: false,
    details: {
      url: '' as string,
      isValid: false,
      error: '' as string,
    },
  };

  if (endpointUrl) {
    urlFormatTest.details.url = endpointUrl;
    urlFormatTest.details.isValid = endpointUrl.startsWith('https://');
    urlFormatTest.passed = urlFormatTest.details.isValid;
  } else {
    urlFormatTest.details.error = '未设置';
  }

  diagnostics.tests.push(urlFormatTest);

  // 测试 2: 测试端点可访问性
  console.log('[测试 2] 测试端点可访问性...');
  const connectivityTest = {
    name: '端点可访问性测试',
    passed: false,
    details: {
      statusCode: 0,
      statusText: '' as string,
      headers: {} as Record<string, string>,
      error: '' as string,
    },
  };

  try {
    const response = await fetch(endpointUrl!, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      signal: AbortSignal.timeout(5000),
    });

    connectivityTest.details.statusCode = response.status;
    connectivityTest.details.statusText = response.statusText;
    connectivityTest.details.headers = Object.fromEntries(response.headers.entries());
    connectivityTest.passed = response.status < 500;
  } catch (error: any) {
    connectivityTest.details.error = error?.message || '未知错误';
    connectivityTest.passed = false;
  }

  diagnostics.tests.push(connectivityTest);

  // 测试 3: 尝试使用不同的配置初始化 S3Storage
  console.log('[测试 3] 尝试不同的初始化配置...');

  const configurations = [
    {
      name: '环境变量配置',
      config: {
        endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
        accessKey: process.env.COZE_STORAGE_ACCESS_KEY || '',
        secretKey: process.env.COZE_STORAGE_SECRET_KEY || '',
        bucketName: process.env.COZE_BUCKET_NAME,
        region: 'cn-beijing',
      },
    },
    {
      name: '默认配置（空密钥）',
      config: {
        endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
        accessKey: '',
        secretKey: '',
        bucketName: process.env.COZE_BUCKET_NAME,
        region: 'cn-beijing',
      },
    },
    {
      name: '不指定 region',
      config: {
        endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
        accessKey: process.env.COZE_STORAGE_ACCESS_KEY || '',
        secretKey: process.env.COZE_STORAGE_SECRET_KEY || '',
        bucketName: process.env.COZE_BUCKET_NAME,
      },
    },
    {
      name: '不指定 bucketName',
      config: {
        endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
        accessKey: process.env.COZE_STORAGE_ACCESS_KEY || '',
        secretKey: process.env.COZE_STORAGE_SECRET_KEY || '',
        region: 'cn-beijing',
      },
    },
  ];

  for (const configTest of configurations) {
    console.log(`[测试 3] 尝试配置: ${configTest.name}...`);
    const testResult = {
      name: configTest.name,
      passed: false,
      details: {
        listSuccess: false,
        fileCount: 0,
        error: '' as string,
        stack: '' as string,
        uploadSuccess: false,
        fileKey: '' as string,
        deleteSuccess: false,
        uploadError: '' as string,
      },
    };

    try {
      const storage = new S3Storage(configTest.config);

      // 尝试列出文件
      console.log(`[测试 3] ${configTest.name} - 尝试列出文件...`);
      const listResult = await storage.listFiles({ maxKeys: 1 });

      testResult.details.listSuccess = true;
      testResult.details.fileCount = listResult.keys?.length || 0;
      testResult.passed = true;

      console.log(`[测试 3] ${configTest.name} - 列表成功`);

    } catch (error: any) {
      console.error(`[测试 3] ${configTest.name} - 失败:`, error);
      testResult.details.error = error?.message || '未知错误';
      testResult.details.stack = error?.stack || '无堆栈信息';

      // 尝试上传小文件
      try {
        console.log(`[测试 3] ${configTest.name} - 尝试上传文件...`);
        const storage = new S3Storage(configTest.config);
        const testBuffer = Buffer.from('test', 'utf-8');
        const testKey = `diagnostics/test_${Date.now()}.txt`;

        const fileKey = await storage.uploadFile({
          fileContent: testBuffer,
          fileName: testKey,
          contentType: 'text/plain',
        });

        testResult.details.uploadSuccess = true;
        testResult.details.fileKey = fileKey;
        testResult.passed = true;

        // 删除测试文件
        await storage.deleteFile({ fileKey });
        testResult.details.deleteSuccess = true;

        console.log(`[测试 3] ${configTest.name} - 上传成功`);

      } catch (uploadError: any) {
        console.error(`[测试 3] ${configTest.name} - 上传失败:`, uploadError);
        testResult.details.uploadError = uploadError?.message || '未知错误';
      }
    }

    diagnostics.tests.push(testResult);
  }

  // 测试 4: 检查环境变量
  console.log('[测试 4] 检查所有相关环境变量...');
  const envTest = {
    name: '环境变量检查',
    passed: true,
    details: {
      COZE_BUCKET_ENDPOINT_URL: process.env.COZE_BUCKET_ENDPOINT_URL ? '已设置' : '未设置',
      COZE_BUCKET_NAME: process.env.COZE_BUCKET_NAME ? '已设置' : '未设置',
      COZE_SUPABASE_URL: process.env.COZE_SUPABASE_URL ? '已设置' : '未设置',
      COZE_SUPABASE_ANON_KEY: process.env.COZE_SUPABASE_ANON_KEY ? '已设置' : '未设置',
      NODE_ENV: process.env.NODE_ENV || '未设置',
      missing: [] as string[],
    },
  };

  const missingEnvVars = Object.entries(envTest.details)
    .filter(([key, value]) => value === '未设置' && !key.startsWith('NODE_ENV'))
    .map(([key]) => key);

  if (missingEnvVars.length > 0) {
    envTest.passed = false;
    envTest.details.missing = missingEnvVars;
  }

  diagnostics.tests.push(envTest);

  // 测试 5: 尝试使用不同的文件路径
  console.log('[测试 5] 测试不同的文件路径...');
  const pathTests = [
    'test.txt',
    'diagnostics/test.txt',
    'uploads/test.txt',
  ];

  for (const path of pathTests) {
    console.log(`[测试 5] 尝试路径: ${path}...`);
    const pathTest = {
      name: `路径测试: ${path}`,
      passed: false,
      details: {
        path: path,
        fileKey: '' as string,
        error: '' as string,
      },
    };

    try {
      const storage = new S3Storage({
        endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL!,
        accessKey: '',
        secretKey: '',
        bucketName: process.env.COZE_BUCKET_NAME!,
        region: 'cn-beijing',
      });

      const testBuffer = Buffer.from('test', 'utf-8');
      const fileKey = await storage.uploadFile({
        fileContent: testBuffer,
        fileName: path,
        contentType: 'text/plain',
      });

      pathTest.details.fileKey = fileKey;
      pathTest.passed = true;

      // 删除测试文件
      await storage.deleteFile({ fileKey });

    } catch (error: any) {
      pathTest.details.error = error?.message || '未知错误';
    }

    diagnostics.tests.push(pathTest);
  }

  // 总结
  console.log('[高级存储诊断] 诊断完成');
  const passedTests = diagnostics.tests.filter((t: any) => t.passed).length;
  const totalTests = diagnostics.tests.length;

  diagnostics.summary = {
    total: totalTests,
    passed: passedTests,
    failed: totalTests - passedTests,
    passRate: `${Math.round((passedTests / totalTests) * 100)}%`,
  };

  return NextResponse.json(diagnostics);
}
