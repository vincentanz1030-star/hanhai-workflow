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

// DELETE - 删除商品反馈图片
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    // 从 cookie 中获取 token 进行验证
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      console.error('[反馈图片删除] 未找到认证 token');
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { key } = await params;

    console.log('[反馈图片删除] 开始删除文件:', key);

    // 从对象存储删除文件
    const deleted = await storage.deleteFile({ fileKey: key });

    if (deleted) {
      console.log('[反馈图片删除] 删除成功:', key);
      return NextResponse.json({
        success: true,
        message: '图片删除成功',
      });
    } else {
      console.log('[反馈图片删除] 文件不存在或删除失败:', key);
      return NextResponse.json(
        { error: '文件不存在或删除失败' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('[反馈图片删除] 删除失败:', error);
    return NextResponse.json(
      { error: '删除失败，请重试' },
      { status: 500 }
    );
  }
}
