import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  // 认证检查
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // 检查所有可能相关的环境变量
  const envVars = {
    // 已知的对象存储相关环境变量
    COZE_BUCKET_ENDPOINT_URL: process.env.COZE_BUCKET_ENDPOINT_URL || '未设置',
    COZE_BUCKET_NAME: process.env.COZE_BUCKET_NAME || '未设置',

    // 可能的其他变量
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '未设置',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '未设置',
    AWS_REGION: process.env.AWS_REGION || '未设置',
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY || '未设置',
    S3_SECRET_KEY: process.env.S3_SECRET_KEY || '未设置',
    OBJECT_STORAGE_ACCESS_KEY: process.env.OBJECT_STORAGE_ACCESS_KEY || '未设置',
    OBJECT_STORAGE_SECRET_KEY: process.env.OBJECT_STORAGE_SECRET_KEY || '未设置',
    COZE_STORAGE_ACCESS_KEY: process.env.COZE_STORAGE_ACCESS_KEY || '未设置',
    COZE_STORAGE_SECRET_KEY: process.env.COZE_STORAGE_SECRET_KEY || '未设置',

    // 其他可能相关的变量
    COZE_INTEGRATION_BASE_URL: process.env.COZE_INTEGRATION_BASE_URL || '未设置',
    COZE_LOOP_API_TOKEN: process.env.COZE_LOOP_API_TOKEN ? '已设置（长度: ' + process.env.COZE_LOOP_API_TOKEN.length + '）' : '未设置',
    COZE_WORKLOAD_IDENTITY_CLIENT_ID: process.env.COZE_WORKLOAD_IDENTITY_CLIENT_ID || '未设置',
    COZE_WORKLOAD_IDENTITY_CLIENT_SECRET: process.env.COZE_WORKLOAD_IDENTITY_CLIENT_SECRET ? '已设置（长度: ' + process.env.COZE_WORKLOAD_IDENTITY_CLIENT_SECRET.length + '）' : '未设置',
  };

  // 分析哪些变量可能用于对象存储认证
  const analysis = {
    potentialAccessKeys: [] as string[],
    potentialSecretKeys: [] as string[],
  };

  Object.entries(envVars).forEach(([key, value]) => {
    if (value !== '未设置') {
      if (key.includes('ACCESS_KEY') || key.includes('SECRET_KEY')) {
        if (key.includes('ACCESS_KEY')) {
          analysis.potentialAccessKeys.push(key);
        } else {
          analysis.potentialSecretKeys.push(key);
        }
      }
    }
  });

  // 建议配置
  const recommendations = [];

  if (analysis.potentialAccessKeys.length === 0) {
    recommendations.push('⚠️ 未找到可能用于对象存储认证的 ACCESS_KEY 环境变量');
  } else {
    recommendations.push(`✅ 找到可能用于对象存储认证的 ACCESS_KEY: ${analysis.potentialAccessKeys.join(', ')}`);
  }

  if (analysis.potentialSecretKeys.length === 0) {
    recommendations.push('⚠️ 未找到可能用于对象存储认证的 SECRET_KEY 环境变量');
  } else {
    recommendations.push(`✅ 找到可能用于对象存储认证的 SECRET_KEY: ${analysis.potentialSecretKeys.join(', ')}`);
  }

  // 检查是否可以使用 workload identity
  if (process.env.COZE_WORKLOAD_IDENTITY_CLIENT_ID && process.env.COZE_WORKLOAD_IDENTITY_CLIENT_SECRET) {
    recommendations.push('✅ 检测到 COZE Workload Identity 配置，可能需要使用此方式获取认证信息');
  }

  // 检查 Coze Loop API Token
  if (process.env.COZE_LOOP_API_TOKEN) {
    recommendations.push('✅ 检测到 COZE_LOOP_API_TOKEN，可能需要使用此方式获取认证信息');
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    envVars,
    analysis,
    recommendations,
    nextSteps: [
      '1. 检查上述环境变量中是否有遗漏的对象存储认证信息',
      '2. 尝试使用找到的 ACCESS_KEY 和 SECRET_KEY 重新配置 S3Storage',
      '3. 如果使用 workload identity，需要调用相应的 API 获取临时凭证',
      '4. 检查对象存储服务的文档，确认正确的认证方式',
    ],
  });
}
