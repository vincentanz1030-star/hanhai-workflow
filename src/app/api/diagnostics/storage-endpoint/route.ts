import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    config: {
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL || '未设置',
      bucketName: process.env.COZE_BUCKET_NAME || '未设置',
      region: 'cn-beijing',
    },
    tests: [] as any[],
  };

  const endpointUrl = process.env.COZE_BUCKET_ENDPOINT_URL;
  const bucketName = process.env.COZE_BUCKET_NAME;

  if (!endpointUrl) {
    return NextResponse.json({
      ...diagnostics,
      error: '未设置 COZE_BUCKET_ENDPOINT_URL 环境变量',
    });
  }

  // 测试 1: 检查端点是否可访问
  console.log('[端点测试] 测试端点可访问性...');
  try {
    const response = await fetch(endpointUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    diagnostics.tests.push({
      name: '端点可访问性测试',
      success: response.status < 500,
      statusCode: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    console.log('[端点测试] 响应状态:', response.status);
  } catch (error: any) {
    diagnostics.tests.push({
      name: '端点可访问性测试',
      success: false,
      error: error?.message || '未知错误',
    });
    console.error('[端点测试] 错误:', error);
  }

  // 测试 2: 尝试列出文件（不使用 SDK）
  console.log('[列表测试] 尝试直接调用端点 API...');
  try {
    const listUrl = `${endpointUrl}/${bucketName}?list-type=2&max-keys=1`;
    const response = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml',
      },
      signal: AbortSignal.timeout(5000),
    });

    diagnostics.tests.push({
      name: '直接列表测试',
      success: response.status < 500,
      statusCode: response.status,
      statusText: response.statusText,
    });

    if (response.ok) {
      const text = await response.text();
      console.log('[列表测试] 响应内容:', text.substring(0, 200));
      diagnostics.tests[diagnostics.tests.length - 1].responsePreview = text.substring(0, 500);
    }
  } catch (error: any) {
    diagnostics.tests.push({
      name: '直接列表测试',
      success: false,
      error: error?.message || '未知错误',
    });
    console.error('[列表测试] 错误:', error);
  }

  // 测试 3: 尝试使用 PUT 方法上传（不使用 SDK）
  console.log('[上传测试] 尝试直接 PUT 上传...');
  try {
    const uploadUrl = `${endpointUrl}/${bucketName}/test-direct-upload-${Date.now()}.txt`;
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: 'Hello from direct upload',
      headers: {
        'Content-Type': 'text/plain',
      },
      signal: AbortSignal.timeout(5000),
    });

    diagnostics.tests.push({
      name: '直接 PUT 上传测试',
      success: response.status < 500,
      statusCode: response.status,
      statusText: response.statusText,
    });

    console.log('[上传测试] 响应状态:', response.status);
  } catch (error: any) {
    diagnostics.tests.push({
      name: '直接 PUT 上传测试',
      success: false,
      error: error?.message || '未知错误',
    });
    console.error('[上传测试] 错误:', error);
  }

  // 测试 4: 尝试使用不同的 HTTP 方法
  console.log('[方法测试] 测试不同的 HTTP 方法...');
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  for (const method of methods) {
    try {
      const response = await fetch(endpointUrl, {
        method: method,
        signal: AbortSignal.timeout(3000),
      });

      diagnostics.tests.push({
        name: `HTTP ${method} 方法测试`,
        success: true,
        statusCode: response.status,
        statusText: response.statusText,
      });
    } catch (error: any) {
      diagnostics.tests.push({
        name: `HTTP ${method} 方法测试`,
        success: false,
        error: error?.message || '未知错误',
      });
    }
  }

  return NextResponse.json(diagnostics);
}
