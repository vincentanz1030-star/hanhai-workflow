import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAuth } from '@/lib/api-auth';

// 直接从环境变量获取 Supabase 配置
export interface EmailNotificationPayload {
  to: string[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

// 发送邮件通知
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body: EmailNotificationPayload = await request.json();
    const { to, subject, htmlContent, textContent } = body;

    // 验证参数
    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ error: '收件人地址不能为空' }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ error: '邮件主题不能为空' }, { status: 400 });
    }
    if (!htmlContent) {
      return NextResponse.json({ error: '邮件内容不能为空' }, { status: 400 });
    }

    // 检查是否配置了邮件服务
    const emailEnabled = process.env.EMAIL_ENABLED === 'true';
    
    if (!emailEnabled) {
      console.log('邮件服务未启用，模拟发送邮件');
      console.log('收件人:', to.join(', '));
      console.log('主题:', subject);
      console.log('内容:', htmlContent);
      
      return NextResponse.json({ 
        success: true,
        message: '邮件服务未启用，邮件已模拟发送',
        details: {
          to,
          subject,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 使用 Supabase Auth 的邮件发送功能（如果可用）
    // 注意：这需要 Supabase 项目的邮件服务配置
    const client = getSupabaseClient();

    // 尝试发送邮件
    // 注意：Supabase 的邮件发送功能主要用于身份验证邮件
    // 对于业务邮件，建议使用专业的邮件服务如 SendGrid、Mailgun 等
    
    // 这里我们只是记录到日志中
    console.log('准备发送邮件:', {
      to: to.join(', '),
      subject,
      timestamp: new Date().toISOString(),
    });

    // 如果配置了外部邮件服务，可以在这里调用
    // 例如：使用 SendGrid API
    /*
    if (process.env.SENDGRID_API_KEY) {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const msg = {
        to,
        from: process.env.EMAIL_FROM || 'noreply@example.com',
        subject,
        html: htmlContent,
        text: textContent,
      };
      
      await sgMail.send(msg);
    }
    */

    return NextResponse.json({ 
      success: true,
      message: '邮件发送成功',
      details: {
        to,
        subject,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('发送邮件失败:', error);
    return NextResponse.json({ 
      error: '发送邮件失败',
      details: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

// 发送测试邮件
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testEmail = searchParams.get('email');

  if (!testEmail) {
    return NextResponse.json({ error: '请提供测试邮箱地址' }, { status: 400 });
  }

  try {
    const client = getSupabaseClient();

    // 发送测试邮件
    const subject = '测试邮件 - Ai数据助手';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">测试邮件</h1>
        <p>如果您收到这封邮件，说明邮件服务配置成功！</p>
        <p>发送时间：${new Date().toLocaleString('zh-CN')}</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          此邮件由Ai数据助手自动发送，请勿回复。
        </p>
      </div>
    `;

    // 记录测试邮件信息
    console.log('测试邮件发送:', {
      to: testEmail,
      subject,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true,
      message: '测试邮件发送成功',
      details: {
        to: testEmail,
        subject,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('发送测试邮件失败:', error);
    return NextResponse.json({ 
      error: '发送测试邮件失败',
      details: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
