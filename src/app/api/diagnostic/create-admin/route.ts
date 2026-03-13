/**
 * 创建管理员账号 - 仅限生产环境部署时使用
 * 安全警告：此接口已被禁用，请使用数据库直接操作或管理员后台创建账号
 */

import { NextRequest, NextResponse } from 'next/server';

// 此接口已禁用 - 安全原因
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: '此接口已禁用，请联系系统管理员创建账号',
    message: '安全策略：诊断接口仅在开发环境可用'
  }, { status: 403 });
}
